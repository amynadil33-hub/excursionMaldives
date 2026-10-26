import Link from 'next/link'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { ActionSelect, ActionSwitch } from '@/components/admin/controls'
import { setListingFeatured, setListingStatus } from '@/app/actions/admin'
import { adminDb, LISTING_OPTIONS, one } from '@/lib/admin'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

const FILTERS = ['pending', 'published', 'draft', 'archived', 'all']

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = 'pending' } = await searchParams
  const supabase = await adminDb()
  let q = supabase
    .from('experiences')
    .select('id, title, slug, price, status, is_featured, rating_avg, review_count, vendor:vendors(business_name), category:categories(name)')
    .order('updated_at', { ascending: false })
  if (status !== 'all' && FILTERS.includes(status)) q = q.eq('status', status)
  const { data: listings } = await q.limit(300)

  return (
    <>
      <PortalHeader title="Listings" description="Moderate excursions submitted by vendors and choose what is featured." />
      <nav aria-label="Filter listings" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/listings?status=${f}`}
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
        {listings?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {listings.map((l) => (
              <li key={l.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/listings/${l.id}`} className="font-semibold hover:text-primary">
                    {l.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {one(l.vendor)?.business_name} · {one(l.category)?.name ?? 'Uncategorised'} · {formatPrice(l.price)}
                    {l.review_count > 0 && ` · ${Number(l.rating_avg).toFixed(1)}★ (${l.review_count})`}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <ActionSwitch label={`Feature ${l.title}`} checked={l.is_featured} action={setListingFeatured.bind(null, l.id)} />
                  Featured
                </label>
                <ActionSelect label={`Status for ${l.title}`} value={l.status} options={LISTING_OPTIONS} action={setListingStatus.bind(null, l.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No listings in this view.</p>
        )}
      </Panel>
    </>
  )
}
