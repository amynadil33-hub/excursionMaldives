'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { FormMessage, SubmitButton } from '@/components/portal/form-bits'
import { addLedgerAdjustment } from '@/app/actions/admin'

export function AdjustmentForm({ vendorId }: { vendorId: string }) {
  const [state, action] = useActionState(addLedgerAdjustment.bind(null, vendorId), {})
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input aria-label="Amount in USD" name="amount" type="number" step="0.01" placeholder="e.g. -25.00" required className="h-10 sm:w-36" />
        <Input aria-label="Description" name="description" placeholder="Reason" required className="h-10 flex-1" />
        <SubmitButton className="h-10">Record</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  )
}
