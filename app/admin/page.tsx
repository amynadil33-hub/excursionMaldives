import Link from 'next/link'
import { Panel, PortalHeader, StatCard } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { adminDb } from '@/lib/admin'
import { formatDate, formatPrice } from '@/lib/format'

export default async function AdminDashboard() {
  const supabase = await adminDb()
  const since = new Date(Date.now() - 30 * 86400000).toISOString()

  const [paid, pendingVendors, pendingListings, payoutsReq, unread, recent] = await Promise.all([
    supabase.from('orders').select('total').eq('status', 'paid').gte('paid_at', since),
    supabase.from('vendors').select('id, business_name, island, created_at').eq('status', 'pending').order('created_at').limit(6),
    supabase.from('experiences').select('id, title, vendor:vendors(business_name)').eq('status', 'pending').order('updated_at').limit(6),
    supabase.from('payouts').select('amount').in('status', ['requested', 'processing']),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('orders').select('id, order_number, contact_name, total, status, created_at').order('created_at', { ascending: false }).limit(8),
  ])

  const gmv = (paid.data ?? []).reduce((s, o) => s + Number(o.total), 0)
  const owed = (payoutsReq.data ?? []).reduce((s, p) => s + Number(p.amount), 0)

  return (
    <>
      <PortalHeader title="Marketplace overview" description="Last 30 days across all vendors." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross bookings" value={formatPrice(gmv)} hint={`${paid.data?.length ?? 0} paid orders`} />
        <StatCard label="Vendors awaiting review" value={String(pendingVendors.data?.length ?? 0)} />
        <StatCard label="Payouts requested" value={formatPrice(owed)} hint={`${payoutsReq.data?.length ?? 0} requests`} />
        <StatCard label="Unread messages" value={String(unread.count ?? 0)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Vendor applications">
          {pendingVendors.data?.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {pendingVendors.data.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{v.business_name}</p>
                    <p className="text-sm text-muted-foreground">{v.island ?? 'Island not set'} · applied {formatDate(v.created_at)}</p>
                  </div>
                  <Link href={`/admin/vendors/${v.id}`} className="text-sm font-semibold text-primary hover:underline">
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No pending applications.</p>
          )}
        </Panel>
        <Panel title="Listings awaiting approval">
          {pendingListings.data?.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {pendingListings.data.map((l) => {
                const vendor = Array.isArray(l.vendor) ? l.vendor[0] : l.vendor
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{l.title}</p>
                      <p className="text-sm text-muted-foreground">{vendor?.business_name}</p>
                    </div>
                    <Link href={`/admin/listings/${l.id}`} className="shrink-0 text-sm font-semibold text-primary hover:underline">
                      Review
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing waiting for approval.</p>
          )}
        </Panel>
      </div>
      <Panel title="Latest orders">
        {recent.data?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {recent.data.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link href={`/admin/orders/${o.id}`} className="font-mono text-sm font-semibold text-primary hover:underline">
                  {o.order_number}
                </Link>
                <span className="flex-1 text-sm">{o.contact_name}</span>
                <span className="text-sm text-muted-foreground">{formatDate(o.created_at)}</span>
                <span className="w-24 text-right font-semibold">{formatPrice(o.total)}</span>
                <StatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        )}
      </Panel>
    </>
  )
}
