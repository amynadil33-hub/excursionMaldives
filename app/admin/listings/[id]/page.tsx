import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { ListingForm } from '@/components/vendor/listing-form'
import { ActionSelect } from '@/components/admin/controls'
import { buttonVariants } from '@/components/ui/button'
import { adminSaveListing, setListingStatus } from '@/app/actions/admin'
import { adminDb, LISTING_OPTIONS, one } from '@/lib/admin'
import type { Experience } from '@/lib/types'

export default async function AdminListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await adminDb()
  const { data: listing } = await supabase
    .from('experiences')
    .select('*, vendor:vendors(id, business_name)')
    .eq('id', id)
    .maybeSingle<Experience & { vendor: { id: string; business_name: string } | null }>()
  if (!listing) notFound()

  const [{ data: categories }, { data: destinations }] = await Promise.all([
    supabase.from('categories').select('id, name').order('sort_order'),
    supabase.from('destinations').select('id, name').order('sort_order'),
  ])
  const vendor = one(listing.vendor)

  return (
    <>
      <PortalHeader
        title={listing.title}
        description={vendor ? `Submitted by ${vendor.business_name}` : undefined}
        actions={
          <>
            <ActionSelect label="Listing status" value={listing.status} options={LISTING_OPTIONS} action={setListingStatus.bind(null, listing.id)} />
            {listing.status === 'published' && (
              <Link href={`/experiences/${listing.slug}`} className={buttonVariants({ variant: 'outline', className: 'rounded-full' })}>
                View live
              </Link>
            )}
          </>
        }
      />
      <Panel>
        <p className="mb-6 rounded-xl bg-secondary p-4 text-sm leading-relaxed">
          Saving here publishes the listing immediately. Photos and dates are managed by the vendor from their portal.
        </p>
        <ListingForm
          listing={listing}
          categories={categories ?? []}
          destinations={destinations ?? []}
          uploadFolder={vendor?.id ?? 'admin'}
          action={adminSaveListing.bind(null, listing.id)}
          isAdmin
        />
      </Panel>
    </>
  )
}
