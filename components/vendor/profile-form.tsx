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

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Business name" htmlFor="business_name">
          <Input id="business_name" name="business_name" required defaultValue={vendor?.business_name} className="h-11" />
        </Field>
        <Field label="Home island" htmlFor="island" hint="Where most trips depart from, e.g. Maafushi">
          <Input id="island" name="island" defaultValue={vendor?.island ?? ''} className="h-11" />
        </Field>
        <Field label="Business email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={vendor?.email ?? ''} className="h-11" />
        </Field>
        <Field label="Phone / WhatsApp" htmlFor="phone">
          <Input id="phone" name="phone" type="tel" defaultValue={vendor?.phone ?? ''} className="h-11" />
        </Field>
        <Field label="Business registration no." htmlFor="registration_number" hint="Ministry of Tourism or MIRA registration">
          <Input id="registration_number" name="registration_number" defaultValue={vendor?.registration_number ?? ''} className="h-11" />
        </Field>
        <Field label="Tagline" htmlFor="tagline">
          <Input id="tagline" name="tagline" maxLength={160} defaultValue={vendor?.tagline ?? ''} className="h-11" />
        </Field>
      </div>
      <Field label="About your business" htmlFor="description">
        <Textarea id="description" name="description" rows={5} defaultValue={vendor?.description ?? ''} />
      </Field>

      {vendor && (
        <div className="grid gap-5 md:grid-cols-[200px_1fr]">
          <ImageUploadField name="logo_url" label="Logo" bucket="vendors" folder={vendor.id} defaultValue={vendor.logo_url} aspect="aspect-square" />
          <ImageUploadField name="cover_url" label="Cover photo" bucket="vendors" folder={vendor.id} defaultValue={vendor.cover_url} />
        </div>
      )}

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

      <FormMessage state={state} />
      <div>
        <SubmitButton pendingLabel={onboarding ? 'Submitting…' : 'Saving…'}>{onboarding ? 'Submit application' : 'Save profile'}</SubmitButton>
      </div>
    </form>
  )
}
