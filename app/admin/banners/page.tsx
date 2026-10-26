import Image from 'next/image'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { BannerForm } from '@/components/admin/forms'
import { ActionButton, ActionSwitch } from '@/components/admin/controls'
import { deleteRow, saveBanner, toggleActive } from '@/app/actions/admin'
import { adminDb } from '@/lib/admin'
import type { Banner } from '@/lib/types'

export default async function AdminBanners() {
  const supabase = await adminDb()
  const { data: banners } = await supabase.from('banners').select('*').order('placement').order('sort_order').returns<Banner[]>()

  return (
    <>
      <PortalHeader title="Banners" description="Promotional strips on the homepage, deals and explore pages." />
      <Panel title="Add banner">
        <BannerForm action={saveBanner.bind(null, null)} />
      </Panel>
      <Panel>
        {banners?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {banners.map((b) => (
              <li key={b.id} className="py-4">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-4">
                    <span className="relative h-14 w-28 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {b.image_url && <Image src={b.image_url} alt="" fill sizes="112px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{b.title}</span>
                      <span className="block text-sm capitalize text-muted-foreground">{b.placement} page</span>
                    </span>
                    <span className="text-sm font-semibold text-primary group-open:hidden">Edit</span>
                  </summary>
                  <div className="mt-4 rounded-2xl border border-border p-4">
                    <BannerForm banner={b} action={saveBanner.bind(null, b.id)} />
                  </div>
                </details>
                <div className="mt-3 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <ActionSwitch label={`Show ${b.title}`} checked={b.is_active} action={toggleActive.bind(null, 'banners', b.id)} />
                    Visible
                  </label>
                  <ActionButton action={deleteRow.bind(null, 'banners', b.id)} confirmText="Delete this banner?" variant="ghost">
                    Delete
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No banners yet.</p>
        )}
      </Panel>
    </>
  )
}
