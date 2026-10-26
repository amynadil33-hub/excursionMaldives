import Link from 'next/link'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { BookingStatusSelect } from '@/components/vendor/vendor-controls'
import { requireApprovedVendor } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatPrice, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const FILTERS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
] as const

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function VendorBookingsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = 'upcoming' } = await searchParams
  const { vendor } = await requireApprovedVendor()
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  let query = supabase
    .from('bookings')
    .select(
      'id, booking_date, start_time, adults, children, line_total, vendor_earnings, status, pickup_location, guest_notes, experience:experiences(title), order:orders(order_number, contact_name, contact_email, contact_phone, status)',
    )
    .eq('vendor_id', vendor.id)
  if (view === 'upcoming') query = query.gte('booking_date', today).order('booking_date').order('start_time')
  else if (view === 'past') query = query.lt('booking_date', today).order('booking_date', { ascending: false })
  else query = query.order('booking_date', { ascending: false })

  const { data: bookings } = await query.limit(200)

  return (
    <>
      <PortalHeader title="Bookings" description="Confirm trips and mark them complete after your guests return." />
      <nav aria-label="Filter bookings" className="flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/vendor/bookings?view=${f.key}`}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-semibold',
              view === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40',
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      <Panel>
        {bookings && bookings.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {bookings.map((b) => {
              const exp = one(b.experience)
              const order = one(b.order)
              return (
                <li key={b.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{exp?.title ?? 'Experience'}</span>
                      {order?.order_number && <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(b.booking_date)} · {formatTime(b.start_time)} · {b.adults} adults
                      {b.children > 0 && `, ${b.children} children`}
                    </p>
                    {order && (
                      <p className="text-sm">
                        {order.contact_name} · {order.contact_email}
                        {order.contact_phone && ` · ${order.contact_phone}`}
                      </p>
                    )}
                    {b.pickup_location && <p className="text-sm text-muted-foreground">Pickup: {b.pickup_location}</p>}
                    {b.guest_notes && <p className="text-sm italic text-muted-foreground">{`"${b.guest_notes}"`}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-end">
                    <span className="text-sm">
                      <span className="font-bold">{formatPrice(Number(b.vendor_earnings))}</span>
                      <span className="text-muted-foreground"> of {formatPrice(Number(b.line_total))}</span>
                    </span>
                    {order && order.status !== 'paid' ? (
                      <StatusBadge status={order.status} />
                    ) : b.status === 'cancelled' ? (
                      <StatusBadge status="cancelled" />
                    ) : (
                      <BookingStatusSelect bookingId={b.id} status={b.status} />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No bookings in this view.</p>
        )}
      </Panel>
    </>
  )
}
