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

export const PREMIUM_PRICE_USD = 9.99
