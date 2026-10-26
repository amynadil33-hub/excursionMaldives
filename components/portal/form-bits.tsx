'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { FormState } from '@/app/actions/public'

export function SubmitButton({
  children,
  pendingLabel = 'Saving…',
  name,
  value,
  variant,
  className,
}: {
  children: React.ReactNode
  pendingLabel?: string
  name?: string
  value?: string
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost'
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" name={name} value={value} variant={variant} disabled={pending} className={cn('h-11 rounded-full px-6', className)}>
      {pending ? pendingLabel : children}
    </Button>
  )
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
        {state.error}
      </p>
    )
  if (state.message)
    return (
      <p role="status" className="rounded-xl bg-palm/10 p-3 text-sm text-palm">
        {state.message}
      </p>
    )
  return null
}

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  )
}

export const selectClass =
  'h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
