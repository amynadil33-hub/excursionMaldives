import type { Metadata } from 'next'
import { PortalShell } from '@/components/portal/portal-shell'
import type { PortalNavItem } from '@/components/portal/portal-nav'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false },
}

const NAV: PortalNavItem[] = [
  { href: '/admin', label: 'Overview', icon: 'dashboard', exact: true },
  { href: '/admin/orders', label: 'Orders', icon: 'orders' },
  { href: '/admin/bookings', label: 'Bookings', icon: 'bookings' },
  { href: '/admin/vendors', label: 'Vendors', icon: 'vendors' },
  { href: '/admin/listings', label: 'Listings', icon: 'listings' },
  { href: '/admin/payouts', label: 'Payouts', icon: 'payouts' },
  { href: '/admin/customers', label: 'Users', icon: 'users' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
  { href: '/admin/promotions', label: 'Promotions', icon: 'promotions' },
  { href: '/admin/categories', label: 'Categories', icon: 'categories' },
  { href: '/admin/destinations', label: 'Destinations', icon: 'destinations' },
  { href: '/admin/banners', label: 'Banners', icon: 'banners' },
  { href: '/admin/blog', label: 'Blog', icon: 'content' },
  { href: '/admin/content', label: 'Pages & CMS', icon: 'content' },
  { href: '/admin/messages', label: 'Inbox', icon: 'inbox' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireAdmin()
  return (
    <PortalShell label="Admin" nav={NAV} userName={profile?.full_name ?? user.email ?? 'Admin'}>
      {children}
    </PortalShell>
  )
}
