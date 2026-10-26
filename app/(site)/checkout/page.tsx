import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import { isBmlConfigured } from '@/lib/bml'
import { CheckoutForm } from '@/components/cart/checkout-form'

export const metadata: Metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  const { user, profile } = await requireUser('/checkout')
  return (
    <div className="container-page flex flex-col gap-6 py-10">
      <h1 className="text-3xl font-extrabold md:text-4xl">Checkout</h1>
      <CheckoutForm
        defaults={{ name: profile?.full_name ?? '', email: profile?.email ?? user.email ?? '', phone: profile?.phone ?? '' }}
        paymentsEnabled={isBmlConfigured()}
      />
    </div>
  )
}
