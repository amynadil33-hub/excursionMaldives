'use client'

import { useActionState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { submitContact, type FormState } from '@/app/actions/public'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function ContactForm({ kind }: { kind: 'contact' | 'private_trip' }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitContact, {})
  if (state.ok)
    return (
      <div className="flex flex-col items-start gap-3 rounded-3xl bg-secondary p-8">
        <CheckCircle2 className="size-10 text-primary" aria-hidden />
        <p className="text-xl font-bold">{state.message}</p>
      </div>
    )

  return (
    <form action={action} className="flex flex-col gap-5 rounded-3xl border bg-card p-6 md:p-8">
      <input type="hidden" name="kind" value={kind} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-name">Full name</Label>
          <Input id="c-name" name="name" required maxLength={120} autoComplete="name" className="h-11" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-email">Email</Label>
          <Input id="c-email" name="email" type="email" required autoComplete="email" className="h-11" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-subject">{kind === 'private_trip' ? 'Dates & group size' : 'Subject'}</Label>
        <Input id="c-subject" name="subject" maxLength={200} placeholder={kind === 'private_trip' ? '12–15 March, 6 adults' : 'Booking question'} className="h-11" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-message">{kind === 'private_trip' ? 'What would you love to do?' : 'Message'}</Label>
        <Textarea id="c-message" name="message" required minLength={10} maxLength={5000} rows={6} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="h-12 self-start rounded-full px-8">
        {pending ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  )
}
