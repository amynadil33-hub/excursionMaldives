'use client'

import { useActionState, useTransition } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { setBookingStatus, requestPayout, archiveListing } from '@/app/actions/vendor'
import { Field, FormMessage, SubmitButton, selectClass } from '@/components/portal/form-bits'

export function BookingStatusSelect({ bookingId, status }: { bookingId: string; status: string }) {
  const [pending, startTransition] = useTransition()
  if (status === 'cancelled' || status === 'pending') return null
  return (
    <select
      aria-label="Booking status"
      defaultValue={status}
      disabled={pending}
      className={`${selectClass} h-9 w-36`}
      onChange={(e) => {
        const next = e.target.value
        startTransition(async () => {
          const res = await setBookingStatus(bookingId, next)
          if (res.error) toast.error(res.error)
          else toast.success('Booking updated')
        })
      }}
    >
      <option value="confirmed">Confirmed</option>
      <option value="completed">Completed</option>
      <option value="no_show">No-show</option>
    </select>
  )
}

export function PayoutRequestForm({ available }: { available: number }) {
  const [state, action] = useActionState(requestPayout, {})
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Amount (USD)" htmlFor="amount" hint={`Up to ${available.toFixed(2)} available`}>
        <Input id="amount" name="amount" type="number" min={1} max={available} step="0.01" required className="h-11" />
      </Field>
      <Field label="Note (optional)" htmlFor="notes">
        <Input id="notes" name="notes" maxLength={300} className="h-11" />
      </Field>
      <FormMessage state={state} />
      <div>
        <SubmitButton pendingLabel="Requesting…">Request payout</SubmitButton>
      </div>
    </form>
  )
}

export function ArchiveListingButton({ listingId }: { listingId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Archive this listing? It will be hidden from the marketplace.')) return
        startTransition(async () => {
          const res = await archiveListing(listingId)
          if (res.error) toast.error(res.error)
          else toast.success('Listing archived')
        })
      }}
      className="text-sm font-medium text-muted-foreground hover:text-destructive"
    >
      Archive
    </button>
  )
}
