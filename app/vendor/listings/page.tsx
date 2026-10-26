import Image from 'next/image'
import Link from 'next/link'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { ArchiveListingButton } from '@/components/vendor/vendor-controls'
import { buttonVariants } from '@/components/ui/button'
import { requireApprovedVendor } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDuration, formatPrice } from '@/lib/format'

export default async function VendorListingsPage() {
  const { vendor } = await requireApprovedVendor()
  const supabase = await createClient()
  const { data: listings } = await supabase
    .from('experiences')
    .select('id, title, slug, status, price, currency, duration_minutes, cover_image, rating_avg, review_count')
    .eq('vendor_id', vendor.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  return (
    <>
      <PortalHeader
        title="Listings"
        description="New and edited listings are reviewed by our team before going live."
        actions={
          <Link href="/vendor/listings/new" className={buttonVariants({ className: 'rounded-full' })}>
            New listing
          </Link>
        }
      />
      <Panel>
        {listings && listings.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {listings.map((l) => (
              <li key={l.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-secondary sm:w-28">
                  {l.cover_image && <Image src={l.cover_image} alt="" fill sizes="112px" className="object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/vendor/listings/${l.id}`} className="font-semibold hover:text-primary">
                      {l.title}
                    </Link>
                    <StatusBadge status={l.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(Number(l.price), l.currency)} · {formatDuration(l.duration_minutes)}
                    {l.review_count > 0 && ` · ${Number(l.rating_avg).toFixed(1)} (${l.review_count})`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/vendor/listings/${l.id}`} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-full' })}>
                    Manage
                  </Link>
                  {l.status === 'published' && (
                    <Link href={`/experiences/${l.slug}`} className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'rounded-full' })}>
                      View
                    </Link>
                  )}
                  <ArchiveListingButton listingId={l.id} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">You have no listings yet. Create your first excursion to get started.</p>
        )}
      </Panel>
    </>
  )
}
