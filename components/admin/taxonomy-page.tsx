import Image from 'next/image'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { TaxonomyForm } from '@/components/admin/forms'
import { ActionButton, ActionSwitch } from '@/components/admin/controls'
import { deleteRow, saveCategory, saveDestination, toggleActive } from '@/app/actions/admin'
import { adminDb } from '@/lib/admin'
import type { Category, Destination } from '@/lib/types'

export async function TaxonomyPage({ kind }: { kind: 'category' | 'destination' }) {
  const table = kind === 'category' ? 'categories' : 'destinations'
  const save = kind === 'category' ? saveCategory : saveDestination
  const supabase = await adminDb()
  const { data: items } = await supabase.from(table).select('*').order('sort_order').returns<(Category | Destination)[]>()

  return (
    <>
      <PortalHeader
        title={kind === 'category' ? 'Categories' : 'Destinations'}
        description={kind === 'category' ? 'Activity types shown in navigation and filters.' : 'Islands and atolls travellers can browse.'}
      />
      <Panel title={`Add ${kind}`}>
        <TaxonomyForm kind={kind} action={save.bind(null, null)} />
      </Panel>
      <Panel>
        {items?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="py-4">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-4">
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {item.image_url && <Image src={item.image_url} alt="" fill sizes="56px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{item.name}</span>
                      <span className="block text-sm text-muted-foreground">
                        /{item.slug}
                        {'atoll' in item && item.atoll ? ` · ${item.atoll}` : ''}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-primary group-open:hidden">Edit</span>
                  </summary>
                  <div className="mt-4 rounded-2xl border border-border p-4">
                    <TaxonomyForm kind={kind} item={item} action={save.bind(null, item.id)} />
                  </div>
                </details>
                <div className="mt-3 flex items-center gap-4 pl-[4.5rem]">
                  <label className="flex items-center gap-2 text-sm">
                    <ActionSwitch label={`Show ${item.name}`} checked={item.is_active} action={toggleActive.bind(null, table, item.id)} />
                    Visible
                  </label>
                  <ActionButton action={deleteRow.bind(null, table, item.id)} confirmText={`Delete ${item.name}?`} variant="ghost">
                    Delete
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        )}
      </Panel>
    </>
  )
}
