'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FormMessage, SubmitButton, selectClass } from '@/components/portal/form-bits'
import { ImageUploadField } from '@/components/portal/image-upload'
import type { FormState } from '@/app/actions/public'
import type { Category, Destination, Experience } from '@/lib/types'

export function ListingForm({
  listing,
  categories,
  destinations,
  uploadFolder,
  action,
  isAdmin = false,
}: {
  listing?: Experience | null
  categories: Pick<Category, 'id' | 'name'>[]
  destinations: Pick<Destination, 'id' | 'name'>[]
  uploadFolder: string
  action: (state: FormState, fd: FormData) => Promise<FormState>
  isAdmin?: boolean
}) {
  const [state, formAction] = useActionState(action, {})
  const itinerary = (listing?.itinerary ?? []).map((s) => [s.time ?? '', s.title, s.description ?? ''].join(' | ')).join('\n')
  const live = listing?.status === 'published'

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-bold">Basics</h2>
        <Field label="Title" htmlFor="title">
          <Input id="title" name="title" required minLength={4} maxLength={140} defaultValue={listing?.title} className="h-11" />
        </Field>
        <Field label="Short summary" htmlFor="summary" hint="One or two sentences shown on listing cards.">
          <Textarea id="summary" name="summary" rows={2} maxLength={300} defaultValue={listing?.summary ?? ''} />
        </Field>
        <Field label="Full description" htmlFor="description">
          <Textarea id="description" name="description" rows={7} defaultValue={listing?.description ?? ''} />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Category" htmlFor="category_id">
            <select id="category_id" name="category_id" defaultValue={listing?.category_id ?? ''} className={selectClass}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Destination" htmlFor="destination_id">
            <select id="destination_id" name="destination_id" defaultValue={listing?.destination_id ?? ''} className={selectClass}>
              <option value="">Select a destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="max-w-xl">
          <ImageUploadField name="cover_image" label="Cover photo" bucket="experiences" folder={uploadFolder} defaultValue={listing?.cover_image} />
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-bold">Pricing &amp; group size (USD)</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Adult price" htmlFor="price">
            <Input id="price" name="price" type="number" min={0} step="0.01" required defaultValue={listing?.price} className="h-11" />
          </Field>
          <Field label="Child price" htmlFor="child_price" hint="Leave empty to use the adult price.">
            <Input id="child_price" name="child_price" type="number" min={0} step="0.01" defaultValue={listing?.child_price ?? ''} className="h-11" />
          </Field>
          <Field label={'"Was" price'} htmlFor="compare_at_price" hint="Optional. Shows a deal badge.">
            <Input id="compare_at_price" name="compare_at_price" type="number" min={0} step="0.01" defaultValue={listing?.compare_at_price ?? ''} className="h-11" />
          </Field>
          <Field label="Duration (minutes)" htmlFor="duration_minutes">
            <Input id="duration_minutes" name="duration_minutes" type="number" min={15} step={15} required defaultValue={listing?.duration_minutes ?? 180} className="h-11" />
          </Field>
          <Field label="Min guests" htmlFor="min_guests">
            <Input id="min_guests" name="min_guests" type="number" min={1} defaultValue={listing?.min_guests ?? 1} className="h-11" />
          </Field>
          <Field label="Max guests" htmlFor="max_guests">
            <Input id="max_guests" name="max_guests" type="number" min={1} defaultValue={listing?.max_guests ?? 12} className="h-11" />
          </Field>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="is_private" defaultChecked={listing?.is_private} className="size-4 accent-primary" />
          This is a private trip (price is per group, shown under Private Trips)
        </label>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-bold">Trip details</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Highlights" htmlFor="highlights" hint="One per line.">
            <Textarea id="highlights" name="highlights" rows={5} defaultValue={listing?.highlights?.join('\n')} />
          </Field>
          <Field label="Pickup locations" htmlFor="pickup_locations" hint="One per line. Guests choose one at checkout.">
            <Textarea id="pickup_locations" name="pickup_locations" rows={5} defaultValue={listing?.pickup_locations?.join('\n')} />
          </Field>
          <Field label="What's included" htmlFor="inclusions" hint="One per line.">
            <Textarea id="inclusions" name="inclusions" rows={5} defaultValue={listing?.inclusions?.join('\n')} />
          </Field>
          <Field label="Not included" htmlFor="exclusions" hint="One per line.">
            <Textarea id="exclusions" name="exclusions" rows={5} defaultValue={listing?.exclusions?.join('\n')} />
          </Field>
        </div>
        <Field label="Itinerary" htmlFor="itinerary" hint="One step per line: time | title | description — e.g. 08:30 | Hotel pickup | Speedboat from Maafushi jetty">
          <Textarea id="itinerary" name="itinerary" rows={5} defaultValue={itinerary} className="font-mono text-sm" />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Meeting point" htmlFor="meeting_point">
            <Input id="meeting_point" name="meeting_point" defaultValue={listing?.meeting_point ?? ''} className="h-11" />
          </Field>
          <Field label="Languages" htmlFor="languages" hint="Comma separated.">
            <Input id="languages" name="languages" defaultValue={listing?.languages?.join(', ') ?? 'English, Dhivehi'} className="h-11" />
          </Field>
        </div>
        <Field label="Cancellation policy" htmlFor="cancellation_policy">
          <Textarea
            id="cancellation_policy"
            name="cancellation_policy"
            rows={3}
            defaultValue={listing?.cancellation_policy ?? 'Free cancellation up to 24 hours before departure. Trips cancelled due to weather are fully refunded.'}
          />
        </Field>
      </section>

      <FormMessage state={state} />
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <SubmitButton name="intent" value="publish" pendingLabel="Saving…">
          {isAdmin ? 'Save & publish' : live ? 'Save changes' : 'Submit for review'}
        </SubmitButton>
        <SubmitButton name="intent" value="draft" variant="outline" pendingLabel="Saving…">
          {live ? 'Unpublish to draft' : 'Save as draft'}
        </SubmitButton>
      </div>
    </form>
  )
}
