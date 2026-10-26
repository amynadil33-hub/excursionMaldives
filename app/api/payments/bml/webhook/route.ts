import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { settleBmlTransaction } from '@/lib/payments'

function validSecret(request: NextRequest) {
  const expected = process.env.BML_WEBHOOK_SECRET
  if (!expected) return false
  const given = request.headers.get('x-webhook-secret') ?? request.nextUrl.searchParams.get('secret') ?? ''
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// The webhook body is treated only as a hint: the transaction is always
// re-fetched from BML and verified before an order is marked paid.
export async function POST(request: NextRequest) {
  if (!validSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json().catch(() => null)) as { transactionId?: string; id?: string } | null
  const transactionId = body?.transactionId ?? body?.id
  if (!transactionId) return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 })
  try {
    const result = await settleBmlTransaction(transactionId)
    return NextResponse.json({ ok: true, ...result })
  } catch {
    return NextResponse.json({ error: 'Settlement failed' }, { status: 500 })
  }
}
