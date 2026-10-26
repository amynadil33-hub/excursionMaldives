import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Clock4 } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { isBmlConfigured } from '@/lib/bml'
import { getOrderWithBookings, OrderDetail } from '@/components/account/order-detail'

export const metadata: Metadata = { title: 'Booking confirmation' }

export default async function ConfirmationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ payment?: string }> }) {
  const [{ id }, { payment }] = await Promise.all([params, searchParams])
  await requireUser(`/checkout/confirmation/${id}`)
  const data = await getOrderWithBookings(id)
  const paid = data?.order.status === 'paid'

  return (
    <div className="container-page flex flex-col gap-8 py-10">
      <header className="flex flex-col items-start gap-3">
        {paid ? <CheckCircle2 className="size-12 text-palm" aria-hidden /> : <Clock4 className="size-12 text-accent" aria-hidden />}
        <h1 className="text-balance text-3xl font-extrabold md:text-4xl">{paid ? 'You’re going to the islands!' : 'Your trips are reserved'}</h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          {paid
            ? 'Payment confirmed by Bank of Maldives. Your hosts have been notified and will be ready for you.'
            : payment === 'incomplete'
              ? 'We did not receive a confirmed payment. Your spots are held for now — you can try paying again below.'
              : 'Your order is awaiting payment. Spots are held while payment is completed.'}
        </p>
        <Link href="/account" className="text-sm font-semibold text-primary hover:underline">
          View all bookings
        </Link>
      </header>
      <OrderDetail id={id} paymentsEnabled={isBmlConfigured()} />
    </div>
  )
}
