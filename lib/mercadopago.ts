import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago'

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.warn('MERCADOPAGO_ACCESS_TOKEN is not set - MercadoPago features will be disabled')
}

export const mercadopagoClient = process.env.MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN })
  : null

export const preApproval = mercadopagoClient ? new PreApproval(mercadopagoClient) : null
export const preApprovalPlan = mercadopagoClient ? new PreApprovalPlan(mercadopagoClient) : null

export const LATAM_COUNTRIES = ['UY', 'AR', 'BR', 'MX', 'CL', 'CO', 'PE'] as const
export type LatamCountry = (typeof LATAM_COUNTRIES)[number]

export function isLatamCountry(countryCode: string): countryCode is LatamCountry {
  return LATAM_COUNTRIES.includes(countryCode.toUpperCase() as LatamCountry)
}

export const MERCADOPAGO_CURRENCY_BY_COUNTRY: Record<LatamCountry, string> = {
  UY: 'UYU',
  AR: 'ARS',
  BR: 'BRL',
  MX: 'MXN',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
}

const TEST_USER_DOMAIN = '@testuser.com'

export function isMercadoPagoTestEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(TEST_USER_DOMAIN)
}

export class MercadoPagoPayerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MercadoPagoPayerError'
  }
}

let collectorIsTestUser: Promise<boolean> | null = null

function mercadopagoCollectorIsTestUser(): Promise<boolean> {
  if (!collectorIsTestUser) {
    collectorIsTestUser = (async () => {
      const token = process.env.MERCADOPAGO_ACCESS_TOKEN
      if (!token) return false

      const res = await fetch('https://api.mercadopago.com/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return false

      const me = (await res.json()) as { email?: string }
      return isMercadoPagoTestEmail(me.email ?? '')
    })()
  }

  return collectorIsTestUser
}

/**
 * MercadoPago rejects a preapproval when one side is a test user and the other is not.
 * Test seller credentials must be paired with a buyer test account from the same country.
 */
export async function resolveMercadoPagoPayerEmail(appEmail: string): Promise<string> {
  const testCollector = await mercadopagoCollectorIsTestUser()
  const override = process.env.MERCADOPAGO_TEST_PAYER_EMAIL?.trim()

  if (testCollector) {
    if (isMercadoPagoTestEmail(appEmail)) return appEmail.trim()
    if (override && isMercadoPagoTestEmail(override)) return override
    throw new MercadoPagoPayerError(
      'La cuenta de MercadoPago es de prueba. Creá un comprador de prueba en Uruguay y definí MERCADOPAGO_TEST_PAYER_EMAIL con su email @testuser.com.'
    )
  }

  if (isMercadoPagoTestEmail(appEmail)) {
    throw new MercadoPagoPayerError(
      'Las credenciales de MercadoPago son de producción y no aceptan un comprador de prueba.'
    )
  }

  return appEmail
}

export const PREMIUM_PRICE_USD = 9.99

/** Uruguay accounts reject USD charges under $15. Bill the same plan in pesos. */
export const MERCADOPAGO_CURRENCY = 'UYU'
const MERCADOPAGO_MIN_UYU = 15
const FALLBACK_USD_TO_UYU = 40.19

export async function premiumPriceInUyu(): Promise<number> {
  let rate = FALLBACK_USD_TO_UYU

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (res.ok) {
      const data = (await res.json()) as { rates?: { UYU?: number } }
      if (typeof data.rates?.UYU === 'number' && data.rates.UYU > 0) {
        rate = data.rates.UYU
      }
    }
  } catch {
    // Keep the fallback rate so checkout still clears the $15 minimum.
  }

  const amount = Math.round(PREMIUM_PRICE_USD * rate * 100) / 100
  return Math.max(amount, MERCADOPAGO_MIN_UYU)
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

function parsePublicHttps(value: string | undefined): URL | null {
  if (!value) return null

  let parsed: URL
  try {
    parsed = new URL(value.trim())
  } catch {
    return null
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, '')
  if (parsed.protocol !== 'https:' || LOCAL_HOSTS.has(host) || host.endsWith('.local')) {
    return null
  }

  return parsed
}

/**
 * MercadoPago rejects localhost and plain HTTP in back_url.
 * Prefer MERCADOPAGO_BACK_URL, then a public https app URL.
 * Local development falls back to a public placeholder so checkout can be created.
 */
export function resolveMercadoPagoBackUrl(requestOrigin?: string): string {
  const explicit = parsePublicHttps(process.env.MERCADOPAGO_BACK_URL)
  if (explicit) return explicit.href

  const origin =
    parsePublicHttps(process.env.NEXTAUTH_URL) || parsePublicHttps(requestOrigin)
  if (origin) return `${origin.origin}/pricing?mercadopago=true`

  console.warn(
    'MercadoPago back_url is using a public placeholder because localhost is not a valid return URL. Set MERCADOPAGO_BACK_URL to an https tunnel or deployment URL to send buyers back to this app.'
  )
  return 'https://example.com'
}
