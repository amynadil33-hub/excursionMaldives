import Link from 'next/link'
import { Panel, PortalHeader, StatCard } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { requireApprovedVendor } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatPrice, formatTime } from '@/lib/format'

export default async function VendorDashboard() {
  const { vendor } = await requireApprovedVendor()
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: balance }, { data: bookings }, { count: listingCount }, { data: upcoming }] = await Promise.all([
    supabase.rpc('vendor_balance', { p_vendor: vendor.id }),
    supabase.from('bookings').select('vendor_earnings, status, adults, children').eq('vendor_id', vendor.id).neq('status', 'cancelled'),
    supabase.from('experiences').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id).eq('status', 'published'),
    supabase
      .from('bookings')
      .select('id, booking_date, start_time, adults, children, status, experience:experiences(title)')
      .eq('vendor_id', vendor.id)
      .gte('booking_date', today)
      .neq('status', 'cancelled')
      .order('booking_date')
      .order('start_time')
      .limit(8),
  ])

  const rows = bookings ?? []
  const earnings = rows.reduce((sum, b) => sum + Number(b.vendor_earnings), 0)
  const guests = rows.reduce((sum, b) => sum + b.adults + b.children, 0)

  return (
    <>
      <PortalHeader
        title={`Welcome back, ${vendor.business_name}`}
        description="Here is how your experiences are performing."
        actions={
          <Link href="/vendor/listings/new" className={buttonVariants({ className: 'rounded-full' })}>
            New listing
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Available balance" value={formatPrice(Number(balance ?? 0))} hint="Ready to withdraw" />
        <StatCard label="Lifetime earnings" value={formatPrice(earnings)} hint={`After ${vendor.commission_rate}% commission`} />
        <StatCard label="Bookings" value={String(rows.length)} hint={`${guests} guests`} />
        <StatCard label="Live listings" value={String(listingCount ?? 0)} />
      </div>
      <Panel title="Upcoming trips">
        {upcoming && upcoming.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {upcoming.map((b) => {
              const exp = Array.isArray(b.experience) ? b.experience[0] : b.experience
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">{exp?.title ?? 'Experience'}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(b.booking_date)} · {formatTime(b.start_time)} · {b.adults + b.children} guests
                    </span>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming trips yet. Add availability to your listings to start taking bookings.</p>
        )}
      </Panel>
    </>
  )
}
