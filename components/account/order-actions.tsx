'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { cancelOrder, retryPayment } from '@/app/actions/checkout'
import { Button } from '@/components/ui/button'

export function OrderActions({ orderId, paymentsEnabled }: { orderId: string; paymentsEnabled: boolean }) {
  const [pending, start] = useTransition()
  return (
    <div className="flex flex-col gap-2">
      {paymentsEnabled ? (
        <Button
          disabled={pending}
          className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() =>
            start(async () => {
              const r = await retryPayment(orderId)
              if ('error' in r) toast.error(r.error)
              else if (r.paymentUrl) window.location.assign(r.paymentUrl)
            })
          }
        >
          Pay now
        </Button>
      ) : (
        <p className="text-sm leading-relaxed">Your trips are reserved. Our team will contact you to complete payment.</p>
      )}
      <Button
        variant="outline"
        disabled={pending}
        className="rounded-full bg-background"
        onClick={() =>
          start(async () => {
            if (!confirm('Cancel this order and release your spots?')) return
            const r = await cancelOrder(orderId)
            if (r.error) toast.error(r.error)
            else toast.success('Order cancelled')
          })
        }
      >
        Cancel order
      </Button>
    </div>
  )
}
