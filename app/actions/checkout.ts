'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createBmlTransaction, isBmlConfigured } from '@/lib/bml'

export interface CheckoutInput {
  items: { slotId: string; adults: number; children: number; pickupLocation?: string }[]
  contactName: string
  contactEmail: string
  contactPhone?: string
  notes?: string
  promoCode?: string
  idempotencyKey: string
}

export type CheckoutResult = { error: string } | { orderId: string; paymentUrl: string | null }

const UUID = /^[0-9a-f-]{36}$/i

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const h = await headers()
  return `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`
}

async function startPayment(order: { id: string; order_number: string; total: number; currency: string }) {
  if (!isBmlConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const origin = await siteOrigin()
  const tx = await createBmlTransaction({
    amount: Number(order.total),
    currency: order.currency,
    localId: order.id,
    customerReference: order.order_number,
    redirectUrl: `${origin}/api/payments/bml/return`,
  })
  await createServiceClient().from('payments').insert({ order_id: order.id, provider: 'bml', provider_reference: tx.id, amount: order.total, currency: order.currency, status: 'initiated' })
  return tx.url ?? tx.shortUrl ?? null
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  if (!isSupabaseConfigured()) return { error: 'The marketplace database is not connected yet.' }
  const items = (input.items ?? []).slice(0, 20).map((i) => ({
    slot_id: String(i.slotId),
    adults: Math.trunc(Number(i.adults)),
    children: Math.trunc(Number(i.children)),
    pickup_location: i.pickupLocation ? String(i.pickupLocation).slice(0, 200) : null,
  }))
  if (items.length === 0) return { error: 'Your cart is empty.' }
  if (items.some((i) => !UUID.test(i.slot_id) || !Number.isFinite(i.adults) || !Number.isFinite(i.children))) return { error: 'Your cart contains an invalid item.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to complete your booking.' }

  const { data: orderId, error } = await supabase.rpc('create_order', {
    p_items: items,
    p_contact_name: String(input.contactName ?? '').slice(0, 120),
    p_contact_email: String(input.contactEmail ?? '').slice(0, 200),
    p_contact_phone: input.contactPhone ? String(input.contactPhone).slice(0, 40) : null,
    p_notes: input.notes ? String(input.notes).slice(0, 1000) : null,
    p_promo_code: input.promoCode ? String(input.promoCode).slice(0, 40) : null,
    p_idempotency_key: String(input.idempotencyKey ?? '').slice(0, 80) || null,
  })
  if (error || !orderId) return { error: error?.message ?? 'We could not create your order.' }

  const { data: order } = await supabase.from('orders').select('id, order_number, total, currency, status').eq('id', orderId).single()
  if (!order) return { error: 'Order created but could not be loaded.' }
  revalidatePath('/account')

  try {
    const paymentUrl = order.status === 'pending_payment' ? await startPayment(order) : null
    return { orderId: order.id, paymentUrl }
  } catch {
    return { orderId: order.id, paymentUrl: null }
  }
}

export async function retryPayment(orderId: string): Promise<CheckoutResult> {
  if (!UUID.test(orderId)) return { error: 'Invalid order.' }
  const supabase = await createClient()
  const { data: order } = await supabase.from('orders').select('id, order_number, total, currency, status').eq('id', orderId).maybeSingle()
  if (!order || order.status !== 'pending_payment') return { error: 'This order is not awaiting payment.' }
  if (!isBmlConfigured()) return { error: 'Online card payment is not available yet. Our team will contact you to arrange payment.' }
  try {
    return { orderId: order.id, paymentUrl: await startPayment(order) }
  } catch {
    return { error: 'The payment gateway is unavailable. Please try again shortly.' }
  }
}

export async function cancelOrder(orderId: string): Promise<{ error?: string }> {
  if (!UUID.test(orderId)) return { error: 'Invalid order.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId })
  if (error) return { error: error.message }
  revalidatePath('/account')
  revalidatePath(`/account/orders/${orderId}`)
  return {}
}
