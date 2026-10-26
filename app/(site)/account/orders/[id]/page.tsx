import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { isBmlConfigured } from '@/lib/bml'
import { OrderDetail } from '@/components/account/order-detail'

export const metadata: Metadata = { title: 'Order details' }

export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireUser(`/account/orders/${id}`)
  return (
    <div className="container-page flex flex-col gap-6 py-10">
      <Link href="/account" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> My account
      </Link>
      <h1 className="text-3xl font-extrabold">Order details</h1>
      <OrderDetail id={id} paymentsEnabled={isBmlConfigured()} />
    </div>
  )
}
