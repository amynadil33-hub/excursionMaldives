import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { ListingForm } from '@/components/vendor/listing-form'
import { saveListing } from '@/app/actions/vendor'
import { requireApprovedVendor } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function NewListingPage() {
  const { vendor } = await requireApprovedVendor()
  const supabase = await createClient()
  const [{ data: categories }, { data: destinations }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('destinations').select('id, name').eq('is_active', true).order('sort_order'),
  ])

  return (
    <>
      <PortalHeader title="New listing" description="Describe your excursion. You can add photos and dates after saving." />
      <Panel>
        <ListingForm
          categories={categories ?? []}
          destinations={destinations ?? []}
          uploadFolder={vendor.id}
          action={saveListing.bind(null, null)}
        />
      </Panel>
    </>
  )
}
