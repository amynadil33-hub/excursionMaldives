'use client'

import { useActionState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { addSlots, deleteSlot, updateSlot } from '@/app/actions/vendor'
import { Field, FormMessage, SubmitButton } from '@/components/portal/form-bits'
import { formatDate, formatPrice, formatTime } from '@/lib/format'
import type { AvailabilitySlot } from '@/lib/types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function AvailabilityManager({
  listingId,
  slots,
  defaultCapacity,
}: {
  listingId: string
  slots: AvailabilitySlot[]
  defaultCapacity: number
}) {
  const [state, action] = useActionState(addSlots.bind(null, listingId), {})
  const [pending, startTransition] = useTransition()
  const today = new Date().toISOString().slice(0, 10)

  function run(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast.error(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4 rounded-2xl bg-secondary/60 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="From" htmlFor="from">
            <Input id="from" name="from" type="date" min={today} defaultValue={today} required className="h-11 bg-background" />
          </Field>
          <Field label="To" htmlFor="to">
            <Input id="to" name="to" type="date" min={today} required className="h-11 bg-background" />
          </Field>
          <Field label="Start times" htmlFor="times" hint="24h, comma separated">
            <Input id="times" name="times" defaultValue="08:30" required className="h-11 bg-background" />
          </Field>
          <Field label="Seats per departure" htmlFor="capacity">
            <Input id="capacity" name="capacity" type="number" min={1} max={500} defaultValue={defaultCapacity} required className="h-11 bg-background" />
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Runs on</legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d, i) => (
              <label key={d} className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                <input type="checkbox" name="weekdays" value={i} defaultChecked className="sr-only" />
                {d}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Price override (optional)" htmlFor="price_override" className="sm:w-56">
            <Input id="price_override" name="price_override" type="number" min={0} step="0.01" className="h-11 bg-background" />
          </Field>
          <SubmitButton pendingLabel="Adding…">Add departures</SubmitButton>
        </div>
        <FormMessage state={state} />
      </form>

      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming departures yet. Add some above so guests can book.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Seats</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">On sale</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{formatDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="px-4 py-3">{formatTime(s.start_time)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums">{s.booked} /</span>
                      <Input
                        type="number"
                        aria-label="Capacity"
                        min={Math.max(1, s.booked)}
                        defaultValue={s.capacity}
                        disabled={pending}
                        className="h-8 w-20"
                        onBlur={(e) => {
                          const v = Number(e.target.value)
                          if (v !== s.capacity) run(() => updateSlot(listingId, s.id, { capacity: v }))
                        }}
                      />
                    </span>
                  </td>
                  <td className="px-4 py-3">{s.price_override != null ? formatPrice(s.price_override) : 'Standard'}</td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={s.is_active}
                      disabled={pending}
                      aria-label="Departure on sale"
                      onCheckedChange={(v) => run(() => updateSlot(listingId, s.id, { is_active: v }))}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={pending || s.booked > 0}
                      onClick={() => run(() => deleteSlot(listingId, s.id))}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                      aria-label="Delete departure"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
