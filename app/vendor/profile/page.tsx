import Link from 'next/link'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { VendorProfileForm } from '@/components/vendor/profile-form'
import { buttonVariants } from '@/components/ui/button'
import { requireApprovedVendor } from '@/lib/auth'

export default async function VendorProfilePage() {
  const { vendor } = await requireApprovedVendor()
  return (
    <>
      <PortalHeader
        title="Business profile"
        description="This information appears on your public operator page."
        actions={
          <Link href={`/vendors/${vendor.slug}`} className={buttonVariants({ variant: 'outline', className: 'rounded-full' })}>
            View public page
          </Link>
        }
      />
      <Panel>
        <VendorProfileForm vendor={vendor} />
      </Panel>
    </>
  )
}
