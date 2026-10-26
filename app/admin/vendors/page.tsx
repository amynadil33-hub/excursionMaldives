import Link from 'next/link'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { ActionSelect } from '@/components/admin/controls'
import { setVendorStatus } from '@/app/actions/admin'
import { adminDb, VENDOR_OPTIONS } from '@/lib/admin'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const FILTERS = ['all', 'pending', 'approved', 'suspended', 'rejected']

export default async function AdminVendors({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = 'all' } = await searchParams
  const supabase = await adminDb()
  let q = supabase.from('vendors').select('id, business_name, slug, island, email, status, commission_rate, created_at').order('created_at', { ascending: false })
  if (status !== 'all' && FILTERS.includes(status)) q = q.eq('status', status)
  const { data: vendors } = await q.limit(300)

  return (
    <>
      <PortalHeader title="Vendors" description="Approve operators, set commission and manage access." />
      <nav aria-label="Filter vendors" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/vendors?status=${f}`}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-semibold capitalize',
              status === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40',
            )}
          >
            {f}
          </Link>
        ))}
      </nav>
      <Panel>
        {vendors?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {vendors.map((v) => (
              <li key={v.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/vendors/${v.id}`} className="font-semibold hover:text-primary">
                    {v.business_name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {[v.island, v.email, `joined ${formatDate(v.created_at)}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">{Number(v.commission_rate)}% commission</span>
                <ActionSelect label={`Status for ${v.business_name}`} value={v.status} options={VENDOR_OPTIONS} action={setVendorStatus.bind(null, v.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No vendors found.</p>
        )}
      </Panel>
    </>
  )
}
