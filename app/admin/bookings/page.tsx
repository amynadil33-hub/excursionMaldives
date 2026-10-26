import Link from 'next/link'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { ActionSelect } from '@/components/admin/controls'
import { adminSetBookingStatus } from '@/app/actions/admin'
import { adminDb, BOOKING_OPTIONS, one } from '@/lib/admin'
import { formatDate, formatPrice, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const VIEWS = ['upcoming', 'past', 'all'] as const

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = 'upcoming' } = await searchParams
  const supabase = await adminDb()
  const today = new Date().toISOString().slice(0, 10)
  let q = supabase
    .from('bookings')
    .select('id, booking_date, start_time, adults, children, line_total, status, experience:experiences(title), vendor:vendors(business_name), order:orders(id, order_number, contact_name, status)')
  if (view === 'upcoming') q = q.gte('booking_date', today).order('booking_date').order('start_time')
  else if (view === 'past') q = q.lt('booking_date', today).order('booking_date', { ascending: false })
  else q = q.order('booking_date', { ascending: false })
  const { data: bookings } = await q.limit(300)

  return (
    <>
      <PortalHeader title="Bookings" description="Trips across every vendor, by date." />
      <nav aria-label="Filter bookings" className="flex gap-2">
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={`/admin/bookings?view=${v}`}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-semibold capitalize',
              view === v ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40',
            )}
          >
            {v}
          </Link>
        ))}
      </nav>
      <Panel>
        {bookings?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {bookings.map((b) => {
              const order = one(b.order)
              return (
                <li key={b.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
                  <div className="w-28 shrink-0 text-sm">
                    <p className="font-semibold">{formatDate(b.booking_date, { day: 'numeric', month: 'short' })}</p>
                    <p className="text-muted-foreground">{formatTime(b.start_time)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{one(b.experience)?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {one(b.vendor)?.business_name} · {order?.contact_name} · {b.adults + b.children} guest{b.adults + b.children === 1 ? '' : 's'}
                    </p>
                  </div>
                  {order && (
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm text-primary hover:underline">
                      {order.order_number}
                    </Link>
                  )}
                  <span className="w-20 text-right text-sm font-semibold">{formatPrice(b.line_total)}</span>
                  {b.status === 'cancelled' || order?.status !== 'paid' ? (
                    <StatusBadge status={order?.status === 'paid' ? b.status : (order?.status ?? b.status)} />
                  ) : (
                    <ActionSelect label="Booking status" value={b.status} options={BOOKING_OPTIONS} action={adminSetBookingStatus.bind(null, b.id)} />
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No bookings in this view.</p>
        )}
      </Panel>
    </>
  )
}
