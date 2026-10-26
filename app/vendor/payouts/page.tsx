import Link from 'next/link'
import { Panel, PortalHeader, StatCard } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { PayoutRequestForm } from '@/components/vendor/vendor-controls'
import { requireApprovedVendor } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatPrice } from '@/lib/format'
import type { Payout } from '@/lib/types'

export default async function VendorPayoutsPage() {
  const { vendor } = await requireApprovedVendor()
  const supabase = await createClient()
  const [{ data: balance }, { data: payouts }, { data: ledger }] = await Promise.all([
    supabase.rpc('vendor_balance', { p_vendor: vendor.id }),
    supabase.from('payouts').select('*').eq('vendor_id', vendor.id).order('requested_at', { ascending: false }).returns<Payout[]>(),
    supabase
      .from('vendor_ledger')
      .select('id, type, amount, description, created_at')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const available = Number(balance ?? 0)
  const paidOut = (payouts ?? []).filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const hasBank = Boolean(vendor.payout_details?.account_number)

  return (
    <>
      <PortalHeader title="Payouts" description="Earnings are credited when a guest's payment is confirmed." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Available balance" value={formatPrice(available)} />
        <StatCard label="Paid out" value={formatPrice(paidOut)} />
        <StatCard label="Commission rate" value={`${vendor.commission_rate}%`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Request a payout" className="lg:col-span-2">
          {hasBank ? (
            <PayoutRequestForm available={available} />
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Add your bank details in{' '}
              <Link href="/vendor/profile" className="font-semibold text-primary underline-offset-4 hover:underline">
                Business profile
              </Link>{' '}
              before requesting a payout.
            </p>
          )}
        </Panel>
        <Panel title="Payout history" className="lg:col-span-3">
          {payouts && payouts.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {payouts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">{formatPrice(Number(p.amount))}</span>
                    <span className="text-xs text-muted-foreground">
                      Requested {formatDate(p.requested_at)}
                      {p.reference && ` · Ref ${p.reference}`}
                    </span>
                  </div>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No payouts yet.</p>
          )}
        </Panel>
      </div>
      <Panel title="Ledger">
        {ledger && ledger.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Date</th>
                  <th className="py-2 pr-4 font-semibold">Type</th>
                  <th className="py-2 pr-4 font-semibold">Description</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap py-2 pr-4">{formatDate(l.created_at)}</td>
                    <td className="py-2 pr-4 capitalize">{l.type}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{l.description}</td>
                    <td className={`whitespace-nowrap py-2 text-right font-semibold ${Number(l.amount) < 0 ? 'text-destructive' : ''}`}>
                      {formatPrice(Number(l.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No ledger entries yet.</p>
        )}
      </Panel>
    </>
  )
}
