'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { saveVendorProfile } from '@/app/actions/vendor'
import { Field, FormMessage, SubmitButton } from '@/components/portal/form-bits'
import { ImageUploadField } from '@/components/portal/image-upload'
import type { Vendor } from '@/lib/types'

export function VendorProfileForm({ vendor, onboarding = false }: { vendor?: Vendor | null; onboarding?: boolean }) {
  const [state, action] = useActionState(saveVendorProfile, {})
  const payout = vendor?.payout_details ?? {}
  const details = vendor?.details ?? {}

  return (
    <form action={action} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-5 rounded-2xl border border-border p-5">
        <legend className="px-2 text-base font-bold">1. Business information</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Business name" htmlFor="business_name">
            <Input id="business_name" name="business_name" required defaultValue={vendor?.business_name} className="h-11" />
          </Field>
          <Field label="Home island" htmlFor="island" hint="Where most trips depart from, e.g. Maafushi">
            <Input id="island" name="island" required defaultValue={vendor?.island ?? ''} className="h-11" />
          </Field>
          <Field label="Business email" htmlFor="email">
            <Input id="email" name="email" type="email" required defaultValue={vendor?.email ?? ''} className="h-11" />
          </Field>
          <Field label="Phone / WhatsApp" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" required defaultValue={vendor?.phone ?? ''} className="h-11" />
          </Field>
          <Field label="Business registration no." htmlFor="registration_number" hint="Ministry of Tourism or MIRA registration">
            <Input id="registration_number" name="registration_number" defaultValue={vendor?.registration_number ?? ''} className="h-11" />
          </Field>
          <Field label="Tagline" htmlFor="tagline">
            <Input id="tagline" name="tagline" maxLength={160} defaultValue={vendor?.tagline ?? ''} className="h-11" />
          </Field>
        </div>
        <Field label="About your business" htmlFor="description">
          <Textarea id="description" name="description" rows={5} required defaultValue={vendor?.description ?? ''} />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-5 rounded-2xl border border-border p-5">
        <legend className="px-2 text-base font-bold">2. Vessel &amp; engine</legend>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Vessel name" htmlFor="vessel_name">
            <Input id="vessel_name" name="vessel_name" defaultValue={details.vessel_name ?? ''} className="h-11" />
          </Field>
          <Field label="Model" htmlFor="vessel_model" hint="For example: Gulf Craft Touring 36">
            <Input id="vessel_model" name="vessel_model" defaultValue={details.vessel_model ?? ''} className="h-11" />
          </Field>
          <Field label="Length (ft)" htmlFor="vessel_length_ft">
            <Input id="vessel_length_ft" name="vessel_length_ft" type="number" min={1} max={500} step="0.1" defaultValue={details.vessel_length_ft ?? ''} className="h-11" />
          </Field>
          <Field label="Model year" htmlFor="vessel_year">
            <Input id="vessel_year" name="vessel_year" type="number" min={1900} max={new Date().getFullYear() + 1} defaultValue={details.vessel_year ?? ''} className="h-11" />
          </Field>
          <Field label="Engine manufacturer" htmlFor="engine_manufacturer" hint="For example: Yamaha">
            <Input id="engine_manufacturer" name="engine_manufacturer" defaultValue={details.engine_manufacturer ?? ''} className="h-11" />
          </Field>
          <Field label="Number of engines" htmlFor="engine_count">
            <Input id="engine_count" name="engine_count" type="number" min={0} max={20} defaultValue={details.engine_count ?? ''} className="h-11" />
          </Field>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="vessel_restored" defaultChecked={details.vessel_restored} className="size-4 accent-primary" />
          This vessel has been restored or substantially refitted
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-5 rounded-2xl border border-border p-5">
        <legend className="px-2 text-base font-bold">3. Activities, departures &amp; safety</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Activities offered" htmlFor="activities" hint="One per line, e.g. snorkelling, fishing, sandbank trips">
            <Textarea id="activities" name="activities" rows={5} defaultValue={details.activities?.join('\n') ?? ''} />
          </Field>
          <Field label="Main departure points" htmlFor="departure_points" hint="One island, harbour or jetty per line">
            <Textarea id="departure_points" name="departure_points" rows={5} defaultValue={details.departure_points?.join('\n') ?? ''} />
          </Field>
          <Field label="Licences & certifications" htmlFor="licenses">
            <Textarea id="licenses" name="licenses" rows={4} defaultValue={details.licenses ?? ''} />
          </Field>
          <Field label="Safety equipment" htmlFor="safety_equipment" hint="Life jackets, first-aid kit, radio, GPS and other equipment">
            <Textarea id="safety_equipment" name="safety_equipment" rows={4} defaultValue={details.safety_equipment ?? ''} />
          </Field>
        </div>
        <Field label="Promotional video URL" htmlFor="promo_video_url" hint="Optional YouTube or Vimeo link">
          <Input id="promo_video_url" name="promo_video_url" type="url" defaultValue={details.promo_video_url ?? ''} className="h-11" />
        </Field>
      </fieldset>

      {vendor && (
        <fieldset className="flex flex-col gap-5 rounded-2xl border border-border p-5">
          <legend className="px-2 text-base font-bold">4. Photos</legend>
          <div className="grid gap-5 md:grid-cols-[200px_1fr]">
            <ImageUploadField name="logo_url" label="Logo" bucket="vendors" folder={vendor.id} defaultValue={vendor.logo_url} aspect="aspect-square" />
            <ImageUploadField name="cover_url" label="Vessel or business cover photo" bucket="vendors" folder={vendor.id} defaultValue={vendor.cover_url} />
          </div>
        </fieldset>
      )}

      {!vendor && <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">After submitting, you can immediately return here to add your logo and vessel cover photo while the application is reviewed.</p>}

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-border p-4">
        <legend className="px-2 text-sm font-bold">Payout bank account</legend>
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Bank" htmlFor="bank_name">
            <Input id="bank_name" name="bank_name" placeholder="Bank of Maldives" defaultValue={payout.bank_name ?? ''} className="h-11" />
          </Field>
          <Field label="Account name" htmlFor="account_name">
            <Input id="account_name" name="account_name" defaultValue={payout.account_name ?? ''} className="h-11" />
          </Field>
          <Field label="Account number" htmlFor="account_number">
            <Input id="account_number" name="account_number" inputMode="numeric" defaultValue={payout.account_number ?? ''} className="h-11" />
          </Field>
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-2xl border border-border p-4 text-sm leading-relaxed">
        <input
          type="checkbox"
          name="terms_accepted"
          required={!details.terms_accepted}
          defaultChecked={details.terms_accepted}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        I confirm that the information is accurate and agree to follow Excursion Maldives vendor, safety, cancellation and guest-service policies.
      </label>

      <FormMessage state={state} />
      <div>
        <SubmitButton pendingLabel={onboarding ? 'Submitting…' : 'Saving…'}>{onboarding ? 'Submit application' : 'Save profile'}</SubmitButton>
      </div>
    </form>
  )
}
