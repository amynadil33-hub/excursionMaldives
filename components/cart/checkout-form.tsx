'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CreditCard, Info } from 'lucide-react'
import { cart, lineTotal, useCart } from '@/lib/cart-store'
import { placeOrder } from '@/app/actions/checkout'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/site/empty-state'
import { CartLine } from '@/components/cart/cart-view'

export function CheckoutForm({ defaults, paymentsEnabled }: { defaults: { name: string; email: string; phone: string }; paymentsEnabled: boolean }) {
  const items = useCart()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [])

  if (items.length === 0) return <EmptyState title="Nothing to check out" action={{ href: '/experiences', label: 'Explore trips' }} />
  const subtotal = items.reduce((s, i) => s + lineTotal(i), 0)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await placeOrder({
        items: items.map((i) => ({ slotId: i.slotId, adults: i.adults, children: i.children, pickupLocation: i.pickupLocation })),
        contactName: String(fd.get('name')),
        contactEmail: String(fd.get('email')),
        contactPhone: String(fd.get('phone') ?? ''),
        notes: String(fd.get('notes') ?? ''),
        promoCode: String(fd.get('promo') ?? ''),
        idempotencyKey,
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      cart.clear()
      if (result.paymentUrl) window.location.assign(result.paymentUrl)
      else router.push(`/checkout/confirmation/${result.orderId}`)
    })
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-5 rounded-3xl border p-6">
          <h2 className="text-xl font-extrabold">Lead traveller</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" defaultValue={defaults.name} required maxLength={120} autoComplete="name" className="h-11" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={defaults.email} required autoComplete="email" className="h-11" />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="phone">Mobile / WhatsApp</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={defaults.phone} maxLength={40} autoComplete="tel" className="h-11" placeholder="+960 …" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes for your hosts</Label>
            <Textarea id="notes" name="notes" maxLength={1000} rows={3} placeholder="Resort name, dietary needs, non-swimmers…" />
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border p-6">
          <h2 className="flex items-center gap-2 text-xl font-extrabold">
            <CreditCard className="size-5 text-primary" aria-hidden /> Payment
          </h2>
          {paymentsEnabled ? (
            <p className="leading-relaxed text-muted-foreground">
              {"You'll be redirected to Bank of Maldives' secure payment page to pay by card. Your trips are confirmed as soon as the bank confirms payment."}
            </p>
          ) : (
            <p className="flex gap-2 rounded-2xl bg-secondary p-4 text-sm leading-relaxed">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              Online card payment is being set up. Your order will be reserved as “awaiting payment” and our team will contact you to complete it. No payment is taken now.
            </p>
          )}
        </section>
      </div>

      <aside className="flex flex-col gap-4 self-start rounded-3xl bg-secondary p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-extrabold">Your trips</h2>
        <ul className="flex flex-col divide-y">
          {items.map((i) => (
            <CartLine key={i.key} item={i} editable={false} />
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <Label htmlFor="promo">Promo code</Label>
          <Input id="promo" name="promo" maxLength={40} className="h-11 bg-background uppercase" placeholder="SUNSET10" />
        </div>
        <div className="flex justify-between border-t pt-3 text-base">
          <span className="font-bold">Total</span>
          <span className="font-extrabold">{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-muted-foreground">Prices, availability and any discount are recalculated securely when you confirm.</p>
        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending} className="h-12 rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Lock className="size-4" aria-hidden />
          {pending ? 'Reserving your trips…' : paymentsEnabled ? 'Confirm & pay' : 'Reserve trips'}
        </Button>
      </aside>
    </form>
  )
}
