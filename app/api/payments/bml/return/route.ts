import { NextResponse, type NextRequest } from 'next/server'
import { settleBmlTransaction } from '@/lib/payments'

export async function GET(request: NextRequest) {
  const transactionId = request.nextUrl.searchParams.get('transactionId')
  const fallback = new URL('/account', request.url)
  if (!transactionId) return NextResponse.redirect(fallback)
  try {
    const { orderId, paid } = await settleBmlTransaction(transactionId)
    if (!orderId) return NextResponse.redirect(fallback)
    return NextResponse.redirect(new URL(`/checkout/confirmation/${orderId}${paid ? '' : '?payment=incomplete'}`, request.url))
  } catch {
    return NextResponse.redirect(new URL('/account?payment=error', request.url))
  }
}
