import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Heart, LayoutDashboard, Store } from 'lucide-react'
import { requireUser, getMyVendor } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatPrice } from '@/lib/format'
import type { Order } from '@/lib/types'
import { StatusBadge } from '@/components/site/status-badge'
import { EmptyState } from '@/components/site/empty-state'
import { ProfileForm } from '@/components/account/profile-form'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'My account' }

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; payment?: string }> }) {
  const [{ user, profile }, { error, payment }] = await Promise.all([requireUser('/account'), searchParams])
  const supabase = await createClient()
  const [{ data: orders }, vendor] = await Promise.all([
    supabase.from('orders').select('*, bookings(count)').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(50),
    getMyVendor(),
  ])
  const rows = (orders ?? []) as (Order & { bookings: { count: number }[] })[]

  return (
    <div className="container-page flex flex-col gap-8 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl font-extrabold">{profile?.full_name || user.email}</h1>
        </div>
        <form action={signOut}>
          <Button variant="outline" className="rounded-full">
            Sign out
          </Button>
        </form>
      </header>

      {error === 'admin_only' && <p className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">That area is for administrators only.</p>}
      {payment === 'error' && <p className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">We could not verify your payment. If you were charged, contact us with your order number.</p>}

      <nav className="grid gap-3 sm:grid-cols-3" aria-label="Account shortcuts">
        {[
          { href: '/wishlist', label: 'Wishlist', icon: Heart },
          ...(profile?.role === 'admin' ? [{ href: '/admin', label: 'Admin portal', icon: LayoutDashboard }] : []),
          vendor ? { href: '/vendor', label: vendor.status === 'approved' ? 'Vendor portal' : 'Vendor application', icon: Store } : { href: '/become-a-vendor', label: 'List your business', icon: Store },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl border p-4 font-semibold transition-colors hover:border-primary hover:text-primary">
            <Icon className="size-5 text-primary" aria-hidden /> {label}
            <ChevronRight className="ml-auto size-4" aria-hidden />
          </Link>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">My bookings</h2>
          {rows.length === 0 ? (
            <EmptyState title="No bookings yet" body="Your upcoming island adventures will appear here." action={{ href: '/experiences', label: 'Find a trip' }} />
          ) : (
            <ul className="flex flex-col divide-y rounded-3xl border">
              {rows.map((o) => (
                <li key={o.id}>
                  <Link href={`/account/orders/${o.id}`} className="flex items-center gap-4 p-4 hover:bg-secondary/60">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-mono text-sm font-bold">{o.order_number}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(o.created_at)} · {o.bookings?.[0]?.count ?? 0} trip(s)
                      </span>
                    </div>
                    <StatusBadge status={o.status} />
                    <span className="w-24 text-right font-bold">{formatPrice(o.total, o.currency)}</span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">Profile</h2>
          <ProfileForm profile={{ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '', country: profile?.country ?? '' }} />
        </section>
      </div>
    </div>
  )
}
