'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/app/actions/auth'
import type { FormState } from '@/app/actions/public'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProfileForm({ profile }: { profile: { full_name: string; phone: string; country: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {})
  return (
    <form action={action} className="flex flex-col gap-4 rounded-3xl border p-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="p-name">Full name</Label>
        <Input id="p-name" name="full_name" defaultValue={profile.full_name} maxLength={120} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="p-phone">Phone</Label>
        <Input id="p-phone" name="phone" type="tel" defaultValue={profile.phone} maxLength={40} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="p-country">Country</Label>
        <Input id="p-country" name="country" defaultValue={profile.country} maxLength={80} />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && <p className="text-sm text-palm">{state.message}</p>}
      <Button type="submit" disabled={pending} className="self-start rounded-full">
        {pending ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  )
}
