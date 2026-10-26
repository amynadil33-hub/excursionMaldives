'use client'

import Link from 'next/link'
import { CalendarDays, Clock, Minus, Plus, Trash2, Users } from 'lucide-react'
import { cart, lineTotal, useCart } from '@/lib/cart-store'
import { formatDate, formatPrice, formatTime } from '@/lib/format'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/site/empty-state'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/lib/types'

function Qty({ value, min, onChange, label }: { value: number; min: number; onChange: (v: number) => void; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="size-7 rounded-full" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${label}`}>
        <Minus className="size-3" />
      </Button>
      <span className="w-5 text-center text-sm font-bold tabular-nums">{value}</span>
      <Button variant="outline" size="icon" className="size-7 rounded-full" onClick={() => onChange(Math.min(50, value + 1))} aria-label={`More ${label}`}>
        <Plus className="size-3" />
      </Button>
    </span>
  )
}

export function CartLine({ item, editable = true }: { item: CartItem; editable?: boolean }) {
  return (
    <li className="flex gap-4 py-5">
      <Link href={`/experiences/${item.slug}`} className="size-24 shrink-0 overflow-hidden rounded-2xl bg-muted md:size-28">
        {item.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" className="size-full object-cover" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs text-muted-foreground">{item.vendorName}</span>
            <Link href={`/experiences/${item.slug}`} className="line-clamp-2 font-bold hover:text-primary">
              {item.title}
            </Link>
          </div>
          <span className="shrink-0 font-extrabold">{formatPrice(lineTotal(item))}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-4" aria-hidden /> {formatDate(item.date, { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-4" aria-hidden /> {formatTime(item.startTime)}
          </span>
          {!editable && (
            <span className="flex items-center gap-1">
              <Users className="size-4" aria-hidden /> {item.adults} adults{item.children ? `, ${item.children} children` : ''}
            </span>
          )}
        </div>
        {item.pickupLocation && <span className="text-xs text-muted-foreground">Pickup: {item.pickupLocation}</span>}
        {editable && (
          <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="flex items-center gap-2 text-sm">
              Adults <Qty value={item.adults} min={item.children > 0 ? 0 : 1} label="adults" onChange={(v) => cart.update(item.key, { adults: v })} />
            </span>
            <span className="flex items-center gap-2 text-sm">
              Children <Qty value={item.children} min={0} label="children" onChange={(v) => cart.update(item.key, { children: v })} />
            </span>
            <button onClick={() => cart.remove(item.key)} className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" aria-hidden /> Remove
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

export function CartView() {
  const items = useCart()
  if (items.length === 0)
    return <EmptyState title="Your cart is empty" body="Add a trip or two and book them together in one checkout." action={{ href: '/experiences', label: 'Explore trips' }} />

  const subtotal = items.reduce((s, i) => s + lineTotal(i), 0)
  const vendors = new Set(items.map((i) => i.vendorName)).size

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="flex flex-col divide-y rounded-3xl border px-5">
        {items.map((i) => (
          <CartLine key={i.key} item={i} />
        ))}
      </ul>
      <aside className="flex flex-col gap-4 self-start rounded-3xl bg-secondary p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-extrabold">Summary</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt>
              {items.length} trip{items.length > 1 ? 's' : ''} · {vendors} operator{vendors > 1 ? 's' : ''}
            </dt>
            <dd className="font-semibold">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 text-base">
            <dt className="font-bold">Estimated total</dt>
            <dd className="font-extrabold">{formatPrice(subtotal)}</dd>
          </div>
        </dl>
        <p className="text-xs leading-relaxed text-muted-foreground">Final prices and availability are confirmed at checkout. Promo codes can be applied on the next step.</p>
        <Link href="/checkout" className={cn(buttonVariants({ size: 'lg' }), 'h-12 rounded-full bg-accent text-accent-foreground hover:bg-accent/90')}>
          Continue to checkout
        </Link>
      </aside>
    </div>
  )
}
