import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { ListingForm } from '@/components/vendor/listing-form'
import { GalleryManager } from '@/components/vendor/gallery-manager'
import { AvailabilityManager } from '@/components/vendor/availability-manager'
import { buttonVariants } from '@/components/ui/button'
import { saveListing } from '@/app/actions/vendor'
import { requireApprovedVendor } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { AvailabilitySlot, Experience, ExperienceImage } from '@/lib/types'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { vendor } = await requireApprovedVendor()
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: listing } = await supabase
    .from('experiences')
    .select('*')
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .maybeSingle<Experience>()
  if (!listing) notFound()

  const [{ data: categories }, { data: destinations }, { data: images }, { data: slots }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('destinations').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('experience_images').select('*').eq('experience_id', id).order('sort_order').returns<ExperienceImage[]>(),
    supabase
      .from('availability_slots')
      .select('*')
      .eq('experience_id', id)
      .gte('date', today)
      .order('date')
      .order('start_time')
      .limit(200)
      .returns<AvailabilitySlot[]>(),
  ])

  return (
    <>
      <PortalHeader
        title={listing.title}
        description="Edit details, photos and dates for this excursion."
        actions={
          <>
            <StatusBadge status={listing.status} />
            {listing.status === 'published' && (
              <Link href={`/experiences/${listing.slug}`} className={buttonVariants({ variant: 'outline', className: 'rounded-full' })}>
                View live page
              </Link>
            )}
          </>
        }
      />
      <Panel title="Availability">
        <AvailabilityManager listingId={listing.id} slots={slots ?? []} defaultCapacity={listing.max_guests} />
      </Panel>
      <Panel title="Photo gallery">
        <GalleryManager listingId={listing.id} folder={`${vendor.id}/${listing.id}`} images={images ?? []} />
      </Panel>
      <Panel title="Details">
        <ListingForm
          listing={listing}
          categories={categories ?? []}
          destinations={destinations ?? []}
          uploadFolder={vendor.id}
          action={saveListing.bind(null, listing.id)}
        />
      </Panel>
    </>
  )
}
