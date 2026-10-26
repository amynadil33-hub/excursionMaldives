import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { getBmlTransaction, toMinorUnits } from '@/lib/bml'

/**
 * Verifies a BML transaction against our order and settles it.
 * Returns the order id when the transaction maps to one of our orders.
 */
export async function settleBmlTransaction(transactionId: string) {
  const tx = await getBmlTransaction(transactionId)
  const orderId = tx.localId
  if (!orderId) return { orderId: null, paid: false }

  const admin = createServiceClient()
  const { data: order } = await admin.from('orders').select('id, total, currency, status').eq('id', orderId).maybeSingle()
  if (!order) return { orderId: null, paid: false }

  if (tx.state === 'CONFIRMED') {
    if (tx.currency !== order.currency || tx.amount !== toMinorUnits(Number(order.total))) {
      await admin.from('payments').insert({ order_id: order.id, provider: 'bml', provider_reference: tx.id, amount: tx.amount / 100, currency: tx.currency, status: 'failed', raw: tx })
      return { orderId: order.id, paid: false }
    }
    const { error } = await admin.rpc('mark_order_paid', { p_order_id: order.id, p_reference: tx.id, p_amount: Number(order.total), p_raw: tx })
    if (error) throw new Error(error.message)
    return { orderId: order.id, paid: true }
  }

  if (['CANCELLED', 'FAILED', 'EXPIRED'].includes(tx.state)) {
    await admin.from('payments').update({ status: tx.state === 'CANCELLED' ? 'cancelled' : 'failed', raw: tx }).eq('order_id', order.id).eq('provider_reference', tx.id)
  }
  return { orderId: order.id, paid: order.status === 'paid' }
}
