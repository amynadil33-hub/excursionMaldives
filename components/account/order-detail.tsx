import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatPrice, formatTime } from '@/lib/format'
import type { Booking, Order } from '@/lib/types'
import { StatusBadge } from '@/components/site/status-badge'
import { OrderActions } from '@/components/account/order-actions'

type BookingRow = Booking & { experience: { title: string; slug: string; cover_image: string | null; meeting_point: string | null } | null; vendor: { business_name: string; phone: string | null } | null }

export async function getOrderWithBookings(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const supabase = await createClient()
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).maybeSingle<Order>()
  if (!order) return null
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, experience:experiences(title, slug, cover_image, meeting_point), vendor:vendors(business_name, phone)')
    .eq('order_id', id)
    .order('booking_date')
  return { order, bookings: (bookings ?? []) as BookingRow[] }
}

export async function OrderDetail({ id, paymentsEnabled }: { id: string; paymentsEnabled: boolean }) {
  const data = await getOrderWithBookings(id)
  if (!data) notFound()
  const { order, bookings } = data

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <ul className="flex flex-col gap-4">
        {bookings.map((b) => (
          <li key={b.id} className="flex gap-4 rounded-3xl border p-4">
            <span className="size-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
              {b.experience?.cover_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.experience.cover_image} alt="" className="size-full object-cover" />
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/experiences/${b.experience?.slug ?? ''}`} className="font-bold hover:text-primary">
                  {b.experience?.title}
                </Link>
                <StatusBadge status={b.status} />
              </div>
              <span className="text-sm text-muted-foreground">
                {b.vendor?.business_name}
                {b.vendor?.phone && order.status === 'paid' ? ` · ${b.vendor.phone}` : ''}
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-4 text-primary" aria-hidden /> {formatDate(b.booking_date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-4 text-primary" aria-hidden /> {formatTime(b.start_time)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-4 text-primary" aria-hidden /> {b.adults} adults{b.children ? `, ${b.children} children` : ''}
                </span>
              </div>
              {(b.pickup_location || b.experience?.meeting_point) && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4" aria-hidden /> {b.pickup_location ?? b.experience?.meeting_point}
                </span>
              )}
              <span className="text-sm font-bold">{formatPrice(b.line_total, order.currency)}</span>
            </div>
          </li>
        ))}
      </ul>
      <aside className="flex flex-col gap-4 self-start rounded-3xl bg-secondary p-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-bold">{order.order_number}</span>
          <StatusBadge status={order.status} />
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPrice(order.subtotal, order.currency)}</dd>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-primary">
              <dt>Discount</dt>
              <dd>-{formatPrice(order.discount, order.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-extrabold">{formatPrice(order.total, order.currency)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Booked {formatDate(order.created_at)} by {order.contact_name} ({order.contact_email})
        </p>
        {order.status === 'pending_payment' && <OrderActions orderId={order.id} paymentsEnabled={paymentsEnabled} />}
      </aside>
    </div>
  )
}
