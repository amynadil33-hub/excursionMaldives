import type { Metadata } from 'next'
import { PortalShell } from '@/components/portal/portal-shell'
import type { PortalNavItem } from '@/components/portal/portal-nav'
import { requireVendor } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Vendor portal',
  robots: { index: false },
}

const APPROVED_NAV: PortalNavItem[] = [
  { href: '/vendor', label: 'Dashboard', icon: 'dashboard', exact: true },
  { href: '/vendor/listings', label: 'Listings', icon: 'listings' },
  { href: '/vendor/bookings', label: 'Bookings', icon: 'bookings' },
  { href: '/vendor/payouts', label: 'Payouts', icon: 'payouts' },
  { href: '/vendor/profile', label: 'Business profile', icon: 'settings' },
]

const ONBOARDING_NAV: PortalNavItem[] = [{ href: '/vendor/onboarding', label: 'Application', icon: 'vendors' }]

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, vendor } = await requireVendor()
  const approved = vendor?.status === 'approved'
  return (
    <PortalShell
      label={vendor?.business_name ?? 'Vendor portal'}
      nav={approved ? APPROVED_NAV : ONBOARDING_NAV}
      userName={profile?.full_name ?? user.email ?? 'Vendor'}
    >
      {children}
    </PortalShell>
  )
}
