import { redirect } from 'next/navigation'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { VendorProfileForm } from '@/components/vendor/profile-form'
import { requireVendor } from '@/lib/auth'

const STATUS_COPY: Record<string, string> = {
  pending: 'Thanks for applying. Our team reviews new operators within 1–2 business days. You can keep editing your details below.',
  rejected: 'Your application was not approved. Update your details and contact us if you have questions.',
  suspended: 'Your vendor account is suspended. Please contact the Excursion Maldives team.',
}

export default async function VendorOnboardingPage() {
  const { vendor } = await requireVendor()
  if (vendor?.status === 'approved') redirect('/vendor')

  return (
    <>
      <PortalHeader
        title={vendor ? 'Your application' : 'Become an Excursion Maldives partner'}
        description={
          vendor
            ? undefined
            : 'Tell us about your business. Once approved you can list excursions, manage availability and get paid.'
        }
      />
      {vendor && (
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={vendor.status} />
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{STATUS_COPY[vendor.status]}</p>
          </div>
        </Panel>
      )}
      <Panel title="Business details">
        <VendorProfileForm vendor={vendor} onboarding />
      </Panel>
    </>
  )
}
