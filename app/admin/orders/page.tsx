import Link from 'next/link'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { adminDb } from '@/lib/admin'
import { formatDate, formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

const FILTERS = ['all', 'paid', 'pending_payment', 'cancelled', 'refunded', 'failed']

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = 'all', q = '' } = await searchParams
  const supabase = await adminDb()
  let query = supabase
    .from('orders')
    .select('id, order_number, contact_name, contact_email, total, discount, status, created_at')
    .order('created_at', { ascending: false })
  if (status !== 'all' && FILTERS.includes(status)) query = query.eq('status', status)
  const term = q.trim().replace(/[%,()]/g, '').slice(0, 60)
  if (term) query = query.or(`order_number.ilike.%${term}%,contact_email.ilike.%${term}%,contact_name.ilike.%${term}%`)
  const { data: orders } = await query.limit(300)

  return (
    <>
      <PortalHeader title="Orders" description="Every checkout across the marketplace." />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter orders" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={`/admin/orders?status=${f}`}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-semibold capitalize',
                status === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40',
              )}
            >
              {f.replace('_', ' ')}
            </Link>
          ))}
        </nav>
        <form className="flex gap-2">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="order-search" className="sr-only">
            Search orders
          </label>
          <input
            id="order-search"
            name="q"
            defaultValue={q}
            placeholder="Order #, name or email"
            className="h-10 w-64 rounded-full border border-input bg-card px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
      </div>
      <Panel>
        {orders?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                <Link href={`/admin/orders/${o.id}`} className="w-32 font-mono text-sm font-semibold text-primary hover:underline">
                  {o.order_number}
                </Link>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{o.contact_name}</span>
                  <span className="block truncate text-muted-foreground">{o.contact_email}</span>
                </span>
                <span className="text-sm text-muted-foreground">{formatDate(o.created_at)}</span>
                <span className="w-24 text-right font-semibold">{formatPrice(o.total)}</span>
                <StatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No orders found.</p>
        )}
      </Panel>
    </>
  )
}
