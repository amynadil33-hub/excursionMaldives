'use client'

import { useActionState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { FormMessage, SubmitButton, selectClass } from '@/components/portal/form-bits'
import type { FormState } from '@/app/actions/public'
import { cn } from '@/lib/utils'

type ValueAction<T> = (value: T) => Promise<FormState>

function report(res: FormState, success?: string) {
  if (res.error) toast.error(res.error)
  else if (res.message || success) toast.success(res.message ?? success)
}

export function ActionSelect({
  value,
  options,
  action,
  label,
  className,
}: {
  value: string
  options: { value: string; label: string }[]
  action: ValueAction<string>
  label: string
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  return (
    <select
      aria-label={label}
      defaultValue={value}
      disabled={pending}
      className={cn(selectClass, 'h-9 w-40', className)}
      onChange={(e) => {
        const next = e.target.value
        startTransition(async () => report(await action(next), 'Updated'))
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function ActionSwitch({ checked, action, label }: { checked: boolean; action: ValueAction<boolean>; label: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Switch
      aria-label={label}
      defaultChecked={checked}
      disabled={pending}
      onCheckedChange={(v) => startTransition(async () => report(await action(v)))}
    />
  )
}

export function ActionButton({
  action,
  children,
  confirmText,
  variant = 'outline',
  size = 'sm',
}: {
  action: () => Promise<FormState>
  children: React.ReactNode
  confirmText?: string
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'secondary'
  size?: 'sm' | 'default'
}) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      className="rounded-full"
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return
        startTransition(async () => report(await action(), 'Done'))
      }}
    >
      {pending ? 'Working…' : children}
    </Button>
  )
}

/** A small inline form with one text/number input that posts to a bound server action. */
export function InlineForm({
  action,
  name,
  placeholder,
  label,
  submitLabel,
  type = 'text',
  defaultValue,
  step,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>
  name: string
  placeholder?: string
  label: string
  submitLabel: string
  type?: 'text' | 'number'
  defaultValue?: string | number
  step?: string
}) {
  const [state, formAction] = useActionState(action, {})
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={label}
          name={name}
          type={type}
          step={step}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required
          className="h-10 w-full flex-1 sm:w-48"
        />
        <SubmitButton className="h-10" pendingLabel="Saving…">
          {submitLabel}
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  )
}
