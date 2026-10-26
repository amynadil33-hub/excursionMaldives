import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Panel, PortalHeader, StatCard } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { ActionSelect, InlineForm } from '@/components/admin/controls'
import { AdjustmentForm } from '@/components/admin/adjustment-form'
import { setVendorCommission, setVendorStatus } from '@/app/actions/admin'
import { adminDb, VENDOR_OPTIONS } from '@/lib/admin'
import { formatDate, formatPrice } from '@/lib/format'
import type { Vendor } from '@/lib/types'

export default async function AdminVendorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await adminDb()
  const { data: vendor } = await supabase.from('vendors').select('*').eq('id', id).maybeSingle<Vendor>()
  if (!vendor) notFound()

  const [{ data: listings }, { data: ledger }, { data: owner }] = await Promise.all([
    supabase.from('experiences').select('id, title, status, price').eq('vendor_id', id).order('created_at', { ascending: false }),
    supabase.from('vendor_ledger').select('id, type, amount, description, created_at').eq('vendor_id', id).order('created_at', { ascending: false }).limit(50),
    vendor.owner_id ? supabase.from('profiles').select('full_name, email, phone').eq('id', vendor.owner_id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const balance = (ledger ?? []).reduce((s, l) => s + Number(l.amount), 0)
  const payout = vendor.payout_details ?? {}

  return (
    <>
      <PortalHeader
        title={vendor.business_name}
        description={[vendor.island, vendor.registration_number && `Reg. ${vendor.registration_number}`].filter(Boolean).join(' · ') || undefined}
        actions={<ActionSelect label="Vendor status" value={vendor.status} options={VENDOR_OPTIONS} action={setVendorStatus.bind(null, vendor.id)} />}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ledger balance" value={formatPrice(balance)} />
        <StatCard label="Listings" value={String(listings?.length ?? 0)} />
        <StatCard label="Commission" value={`${Number(vendor.commission_rate)}%`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Business details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Owner</dt>
            <dd>{owner?.full_name ?? '—'} {owner?.email && `(${owner.email})`}</dd>
            <dt className="text-muted-foreground">Business email</dt>
            <dd>{vendor.email ?? '—'}</dd>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{vendor.phone ?? owner?.phone ?? '—'}</dd>
            <dt className="text-muted-foreground">Public page</dt>
            <dd>
              <Link href={`/vendors/${vendor.slug}`} className="text-primary hover:underline">
                /vendors/{vendor.slug}
              </Link>
            </dd>
            <dt className="text-muted-foreground">Bank</dt>
            <dd>{[payout.bank_name, payout.account_name, payout.account_number].filter(Boolean).join(' · ') || 'Not provided'}</dd>
          </dl>
          {vendor.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{vendor.description}</p>}
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel title="Commission rate">
            <InlineForm
              action={setVendorCommission.bind(null, vendor.id)}
              name="commission_rate"
              type="number"
              step="0.01"
              label="Commission percent"
              defaultValue={Number(vendor.commission_rate)}
              submitLabel="Update"
            />
          </Panel>
          <Panel title="Manual ledger adjustment">
            <p className="mb-3 text-sm text-muted-foreground">Use a negative amount to deduct. Format: amount, then description.</p>
            <AdjustmentForm vendorId={vendor.id} />
          </Panel>
        </div>
      </div>
      <Panel title="Listings">
        {listings?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {listings.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/admin/listings/${l.id}`} className="font-semibold hover:text-primary">
                  {l.title}
                </Link>
                <span className="flex items-center gap-3 text-sm">
                  {formatPrice(l.price)}
                  <StatusBadge status={l.status} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No listings yet.</p>
        )}
      </Panel>
      <Panel title="Ledger">
        {ledger?.length ? (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {ledger.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="w-24 capitalize text-muted-foreground">{l.type}</span>
                <span className="flex-1">{l.description}</span>
                <span className="text-muted-foreground">{formatDate(l.created_at)}</span>
                <span className={`w-24 text-right font-semibold ${Number(l.amount) < 0 ? 'text-destructive' : ''}`}>{formatPrice(l.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No ledger entries.</p>
        )}
      </Panel>
    </>
  )
}
