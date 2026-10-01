/**
 * One-off WCAG 2.1 AA audit with Playwright + axe-core.
 * Run: node scripts/a11y-audit.mjs
 */
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { writeFileSync } from 'fs'

const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const EMAIL = `a11y-audit-${Date.now()}@example.com`
const PASSWORD = 'A11yAuditPass123!'

function summarize(violations) {
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    help: v.help,
    helpUrl: v.helpUrl,
    tags: v.tags.filter((t) => /wcag/i.test(t)),
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 8).map((n) => n.target.join(' ')),
    failureSummary: v.nodes[0]?.failureSummary || null,
  }))
}

async function dismissOverlays(page) {
  for (const name of [/ahora no/i, /not now/i, /cerrar/i, /close/i, /luego/i]) {
    const btn = page.getByRole('button', { name })
    if (await btn.first().isVisible().catch(() => false)) {
      await btn.first().click().catch(() => {})
      await page.waitForTimeout(200)
    }
  }
}

async function scan(page, label) {
  await dismissOverlays(page)
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  return {
    label,
    url: page.url(),
    violations: summarize(results.violations),
    passes: results.passes.length,
    incomplete: results.incomplete.length,
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  const report = []

  // 1) Login — sign in
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  report.push(await scan(page, 'login-signin'))

  // 2) Login — empty submit (validation / error affordance)
  await page.locator('form button[type=submit]').click()
  await page.waitForTimeout(300)
  report.push(await scan(page, 'login-signin-native-validation'))

  // 3) Login — register UI
  await page.getByRole('button', { name: /registrarse|register/i }).first().click()
  await page.waitForTimeout(300)
  report.push(await scan(page, 'login-register'))

  // 4) Pricing
  await page.goto(`${BASE}/pricing`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  report.push(await scan(page, 'pricing'))

  // 5) Authenticate via register
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /registrarse|register/i }).first().click()
  await page.waitForTimeout(200)
  await page.locator('#name').fill('A11y Auditor')
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.locator('form button[type=submit]').click()
  await page.waitForFunction(() => !window.location.pathname.includes('login'), null, { timeout: 20000 })
  await page.waitForSelector('text=/glucosa|glucose|medición|reading|chat|recordatorio|reminder/i', { timeout: 20000 })
  await page.waitForTimeout(1000)
  await dismissOverlays(page)

  if (page.url().includes('login')) {
    throw new Error('Still on login after registration')
  }

  report.push(await scan(page, 'home-authenticated'))

  // 6) History
  await page.goto(`${BASE}/history`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  report.push(await scan(page, 'history'))

  await browser.close()

  const outPath = 'scripts/a11y-audit-report.json'
  writeFileSync(outPath, JSON.stringify({ base: BASE, email: EMAIL, scannedAt: new Date().toISOString(), report }, null, 2))

  let total = 0
  for (const entry of report) {
    const count = entry.violations?.length || 0
    total += count
    console.log(`\n=== ${entry.label} (${entry.url}) ===`)
    if (!count) {
      console.log('0 automated violations (WCAG 2.1 A/AA tags)')
      continue
    }
    for (const v of entry.violations) {
      console.log(`[${v.impact}] ${v.id} — ${v.help} (${v.nodes} nodes)`)
      console.log(`  tags: ${v.tags.join(', ')}`)
      console.log(`  eg: ${v.targets.slice(0, 3).join(' | ')}`)
    }
  }
  console.log(`\nTOTAL RULE GROUPS WITH VIOLATIONS (sum across states): ${total}`)
  console.log(`Full report: ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
