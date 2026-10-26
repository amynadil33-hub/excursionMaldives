'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Clock, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import type { AvailabilitySlot, ExperienceWithRelations } from '@/lib/types'
import { cart } from '@/lib/cart-store'
import { formatPrice, formatTime } from '@/lib/format'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fromKey(k: string) {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function Stepper({ label, hint, value, min, max, onChange }: { label: string; hint?: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex flex-col">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" className="size-9 rounded-full" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer ${label.toLowerCase()}`}>
          <Minus className="size-4" />
        </Button>
        <span className="w-5 text-center font-bold tabular-nums" aria-live="polite">
          {value}
        </span>
        <Button type="button" variant="outline" size="icon" className="size-9 rounded-full" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`More ${label.toLowerCase()}`}>
          <Plus className="size-4" />
        </Button>
      </span>
    </div>
  )
}

export function BookingWidget({ experience, slots }: { experience: ExperienceWithRelations; slots: AvailabilitySlot[] }) {
  const router = useRouter()
  const byDate = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>()
    for (const s of slots) {
      if (s.capacity - s.booked <= 0) continue
      map.set(s.date, [...(map.get(s.date) ?? []), s])
    }
    return map
  }, [slots])
  const firstDate = byDate.keys().next().value as string | undefined

  const [date, setDate] = useState<string | undefined>(firstDate)
  const [slotId, setSlotId] = useState<string | undefined>(firstDate ? byDate.get(firstDate)?.[0]?.id : undefined)
  const [adults, setAdults] = useState(Math.max(1, experience.min_guests))
  const [children, setChildren] = useState(0)
  const [pickup, setPickup] = useState(experience.pickup_locations[0] ?? '')

  const daySlots = date ? (byDate.get(date) ?? []) : []
  const slot = daySlots.find((s) => s.id === slotId)
  const remaining = slot ? slot.capacity - slot.booked : 0
  const maxGuests = Math.min(experience.max_guests, remaining || experience.max_guests)
  const guests = adults + children
  const unit = slot?.price_override ?? experience.price
  const childUnit = experience.child_price ?? unit
  const total = experience.is_private ? unit : unit * adults + childUnit * children
  const valid = Boolean(slot) && guests >= experience.min_guests && guests <= maxGuests

  function add(goToCart: boolean) {
    if (!slot || !valid) return
    cart.add({
      slotId: slot.id,
      experienceId: experience.id,
      slug: experience.slug,
      title: experience.title,
      image: experience.cover_image,
      vendorName: experience.vendor?.business_name ?? '',
      date: slot.date,
      startTime: slot.start_time,
      adults,
      children,
      unitPrice: unit,
      childPrice: childUnit,
      isPrivate: experience.is_private,
      pickupLocation: pickup || undefined,
    })
    if (goToCart) router.push('/cart')
    else toast.success('Added to your cart', { action: { label: 'View cart', onClick: () => router.push('/cart') } })
  }

  if (byDate.size === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-3xl border bg-card p-6">
        <p className="text-2xl font-extrabold">{formatPrice(experience.price, experience.currency)}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">No upcoming dates are open right now. Save it to your wishlist or contact us to request a date.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 rounded-3xl border bg-card p-5 shadow-xl shadow-primary/5">
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-muted-foreground">From</span>
        {experience.compare_at_price && <span className="text-sm text-muted-foreground line-through">{formatPrice(experience.compare_at_price, experience.currency)}</span>}
        <span className="text-3xl font-extrabold text-primary">{formatPrice(experience.price, experience.currency)}</span>
        <span className="text-sm text-muted-foreground">{experience.is_private ? '/ group' : '/ adult'}</span>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Choose a date</Label>
        <Calendar
          mode="single"
          selected={date ? fromKey(date) : undefined}
          defaultMonth={date ? fromKey(date) : undefined}
          onSelect={(d) => {
            if (!d) return
            const k = toKey(d)
            setDate(k)
            setSlotId(byDate.get(k)?.[0]?.id)
          }}
          disabled={(d) => !byDate.has(toKey(d))}
          className="w-full rounded-2xl border p-2 [--cell-size:--spacing(9)]"
        />
      </div>

      {daySlots.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Start time</legend>
          <div className="flex flex-wrap gap-2">
            {daySlots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlotId(s.id)}
                aria-pressed={s.id === slotId}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition',
                  s.id === slotId ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary',
                )}
              >
                <Clock className="size-3.5" aria-hidden />
                {formatTime(s.start_time)}
                <span className={cn('text-xs font-normal', s.id === slotId ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{s.capacity - s.booked} left</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-4 rounded-2xl bg-secondary/70 p-4">
        <Stepper label="Adults" hint="Age 12+" value={adults} min={1} max={maxGuests - children} onChange={setAdults} />
        <Stepper
          label="Children"
          hint={experience.child_price != null && !experience.is_private ? `Age 2–11 · ${formatPrice(childUnit)}` : 'Age 2–11'}
          value={children}
          min={0}
          max={maxGuests - adults}
          onChange={setChildren}
        />
        {experience.min_guests > 1 && <p className="text-xs text-muted-foreground">Minimum {experience.min_guests} guests.</p>}
      </div>

      {experience.pickup_locations.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="pickup">Pickup point</Label>
          <select id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            {experience.pickup_locations.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-2xl font-extrabold">{formatPrice(total, experience.currency)}</span>
      </div>
      <div className="flex flex-col gap-2">
        <Button size="lg" className="h-12 rounded-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90" disabled={!valid} onClick={() => add(true)}>
          Book now
        </Button>
        <Button size="lg" variant="outline" className="h-12 rounded-full" disabled={!valid} onClick={() => add(false)}>
          <ShoppingBag className="size-4" aria-hidden /> Add to cart
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">Final price is confirmed at checkout.</p>
    </div>
  )
}
