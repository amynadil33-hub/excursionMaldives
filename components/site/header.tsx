import Link from 'next/link'
import { Heart, UserRound } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { CartButton } from './cart-button'
import { MobileNav } from './mobile-nav'

export const NAV_LINKS = [
  { href: '/experiences', label: 'Experiences' },
  { href: '/categories', label: 'Categories' },
  { href: '/destinations', label: 'Destinations' },
  { href: '/private-trips', label: 'Private trips' },
  { href: '/deals', label: 'Deals' },
  { href: '/blog', label: 'Travel guide' },
]

export async function SiteHeader() {
  const { user, profile } = await getSession()
  const portal =
    profile?.role === 'admin' ? { href: '/admin', label: 'Admin' } : profile?.role === 'vendor' ? { href: '/vendor', label: 'Vendor portal' } : null

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          {portal && (
            <Link href={portal.href} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hidden rounded-full md:inline-flex')}>
              {portal.label}
            </Link>
          )}
          <Link href="/wishlist" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'rounded-full')} aria-label="Wishlist">
            <Heart className="size-5" />
          </Link>
          <CartButton />
          {user ? (
            <Link href="/account" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'rounded-full')} aria-label="My account">
              <UserRound className="size-5" />
            </Link>
          ) : (
            <Link href="/auth/login" className={cn(buttonVariants({ size: 'sm' }), 'hidden rounded-full px-4 sm:inline-flex')}>
              Sign in
            </Link>
          )}
          <MobileNav links={NAV_LINKS} signedIn={Boolean(user)} portal={portal} />
        </div>
      </div>
    </header>
  )
}
