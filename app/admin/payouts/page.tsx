import Link from 'next/link'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { ActionButton, InlineForm } from '@/components/admin/controls'
import { adminMarkPayoutPaid, adminSetPayoutStatus } from '@/app/actions/admin'
import { adminDb, one } from '@/lib/admin'
import { formatDate, formatPrice } from '@/lib/format'

export default async function AdminPayouts() {
  const supabase = await adminDb()
  const { data: payouts } = await supabase
    .from('payouts')
    .select('id, amount, status, reference, notes, requested_at, processed_at, vendor:vendors(id, business_name, payout_details)')
    .order('requested_at', { ascending: false })
    .limit(200)

  const open = (payouts ?? []).filter((p) => p.status === 'requested' || p.status === 'processing')
  const closed = (payouts ?? []).filter((p) => p.status === 'paid' || p.status === 'rejected')

  return (
    <>
      <PortalHeader title="Payouts" description="Transfer funds to vendors via BML, then record the transfer reference here." />
      <Panel title={`Open requests (${open.length})`}>
        {open.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {open.map((p) => {
              const vendor = one(p.vendor)
              const bank = (vendor?.payout_details ?? {}) as Record<string, string>
              return (
                <li key={p.id} className="flex flex-col gap-4 py-5 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/vendors/${vendor?.id}`} className="font-semibold hover:text-primary">
                        {vendor?.business_name}
                      </Link>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-2xl font-extrabold">{formatPrice(p.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      Requested {formatDate(p.requested_at)} · {[bank.bank_name, bank.account_name, bank.account_number].filter(Boolean).join(' · ') || 'No bank details on file'}
                    </p>
                    {p.notes && <p className="mt-1 text-sm">{p.notes}</p>}
                  </div>
                  <div className="flex flex-col gap-3 lg:w-96">
                    <InlineForm action={adminMarkPayoutPaid.bind(null, p.id)} name="reference" label="Transfer reference" placeholder="BML transfer reference" submitLabel="Mark paid" />
                    <div className="flex gap-2">
                      {p.status === 'requested' && (
                        <ActionButton action={adminSetPayoutStatus.bind(null, p.id, 'processing')}>Mark processing</ActionButton>
                      )}
                      <ActionButton action={adminSetPayoutStatus.bind(null, p.id, 'rejected')} confirmText="Reject this payout request?" variant="ghost">
                        Reject
                      </ActionButton>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No open payout requests.</p>
        )}
      </Panel>
      <Panel title="History">
        {closed.length ? (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {closed.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="flex-1 font-medium">{one(p.vendor)?.business_name}</span>
                <span className="font-mono text-muted-foreground">{p.reference ?? '—'}</span>
                <span className="text-muted-foreground">{formatDate(p.processed_at ?? p.requested_at)}</span>
                <span className="w-24 text-right font-semibold">{formatPrice(p.amount)}</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No completed payouts yet.</p>
        )}
      </Panel>
    </>
  )
}
