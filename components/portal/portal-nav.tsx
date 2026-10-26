'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Ship,
  CalendarCheck,
  Wallet,
  Store,
  Users,
  Tags,
  MapPin,
  Star,
  FileText,
  Megaphone,
  Settings,
  Inbox,
  ReceiptText,
  Percent,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = {
  dashboard: LayoutDashboard,
  listings: Ship,
  bookings: CalendarCheck,
  payouts: Wallet,
  vendors: Store,
  users: Users,
  categories: Tags,
  destinations: MapPin,
  reviews: Star,
  content: FileText,
  banners: Megaphone,
  settings: Settings,
  inbox: Inbox,
  orders: ReceiptText,
  promotions: Percent,
} satisfies Record<string, LucideIcon>

export interface PortalNavItem {
  href: string
  label: string
  icon: keyof typeof ICONS
  exact?: boolean
}

export function PortalNav({ items }: { items: PortalNavItem[] }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Portal" className="-mx-1 overflow-x-auto lg:mx-0 lg:overflow-visible">
      <ul className="flex gap-1 px-1 lg:flex-col lg:px-0">
        {items.map((item) => {
          const Icon = ICONS[item.icon]
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
