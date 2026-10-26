import 'server-only'
import { createHash } from 'node:crypto'

// Bank of Maldives "BML Connect" merchant API.
// Orders are only marked paid after the server re-fetches the transaction from
// BML and sees state CONFIRMED with a matching amount — never on redirect alone.

export interface BmlTransaction {
  id: string
  url?: string
  shortUrl?: string
  state: 'QR_CODE_GENERATED' | 'CONFIRMED' | 'CANCELLED' | 'FAILED' | 'EXPIRED' | string
  amount: number
  currency: string
  localId?: string
}

export function isBmlConfigured() {
  return Boolean(process.env.BML_API_KEY && process.env.BML_APP_ID && process.env.BML_API_BASE_URL)
}

function config() {
  if (!isBmlConfigured()) throw new Error('BML payment gateway is not configured')
  return {
    apiKey: process.env.BML_API_KEY as string,
    appId: process.env.BML_APP_ID as string,
    base: (process.env.BML_API_BASE_URL as string).replace(/\/$/, ''),
  }
}

export function toMinorUnits(amount: number) {
  return Math.round(amount * 100)
}

export async function createBmlTransaction(input: { amount: number; currency: string; localId: string; customerReference: string; redirectUrl: string }) {
  const { apiKey, appId, base } = config()
  const amount = toMinorUnits(input.amount)
  const signature = createHash('sha1').update(`amount=${amount}&currency=${input.currency}&apiKey=${apiKey}`).digest('hex')

  const res = await fetch(`${base}/public/v2/transactions`, {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      amount,
      currency: input.currency,
      localId: input.localId,
      customerReference: input.customerReference,
      redirectUrl: input.redirectUrl,
      appVersion: 'excursion-maldives-web-1.0',
      apiVersion: '2.0',
      deviceId: appId,
      signMethod: 'sha1',
      signature,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`BML transaction failed (${res.status})`)
  return (await res.json()) as BmlTransaction
}

export async function getBmlTransaction(id: string) {
  const { apiKey, base } = config()
  if (!/^[A-Za-z0-9-]{6,64}$/.test(id)) throw new Error('Invalid transaction id')
  const res = await fetch(`${base}/public/transactions/${id}`, {
    headers: { Authorization: apiKey, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`BML lookup failed (${res.status})`)
  return (await res.json()) as BmlTransaction
}
