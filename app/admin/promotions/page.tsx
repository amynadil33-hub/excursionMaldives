import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { PromotionForm } from '@/components/admin/forms'
import { ActionButton, ActionSwitch } from '@/components/admin/controls'
import { deleteRow, savePromotion, toggleActive } from '@/app/actions/admin'
import { adminDb } from '@/lib/admin'
import { formatDate, formatPrice } from '@/lib/format'
import type { Promotion } from '@/lib/types'

export default async function AdminPromotions() {
  const supabase = await adminDb()
  const { data: promos } = await supabase.from('promotions').select('*').order('created_at', { ascending: false }).returns<Promotion[]>()

  return (
    <>
      <PortalHeader title="Promotions" description="Discount codes customers can apply at checkout." />
      <Panel title="New promotion">
        <PromotionForm action={savePromotion.bind(null, null)} />
      </Panel>
      <Panel title="All codes">
        {promos?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {promos.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 py-4">
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
                    <span className="rounded-lg bg-secondary px-3 py-1 font-mono font-bold">{p.code}</span>
                    <span className="flex-1 text-sm">
                      {p.discount_type === 'percent' ? `${Number(p.value)}% off` : `${formatPrice(p.value)} off`}
                      {Number(p.min_subtotal) > 0 && ` over ${formatPrice(p.min_subtotal)}`}
                      <span className="text-muted-foreground">
                        {' '}
                        · used {p.used_count}
                        {p.max_uses ? `/${p.max_uses}` : ''}
                        {p.ends_at && ` · ends ${formatDate(p.ends_at)}`}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-primary group-open:hidden">Edit</span>
                  </summary>
                  <div className="mt-4 rounded-2xl border border-border p-4">
                    <PromotionForm promo={p} action={savePromotion.bind(null, p.id)} />
                  </div>
                </details>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <ActionSwitch label={`Activate ${p.code}`} checked={p.is_active} action={toggleActive.bind(null, 'promotions', p.id)} />
                    Active
                  </label>
                  <ActionButton action={deleteRow.bind(null, 'promotions', p.id)} confirmText={`Delete code ${p.code}?`} variant="ghost">
                    Delete
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No promotions yet.</p>
        )}
      </Panel>
    </>
  )
}
