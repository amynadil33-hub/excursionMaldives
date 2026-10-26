import Link from 'next/link'
import { Logo } from '@/components/site/logo'
import { signOut } from '@/app/actions/auth'
import { PortalNav, type PortalNavItem } from './portal-nav'

export function PortalShell({
  label,
  nav,
  userName,
  children,
}: {
  label: string
  nav: PortalNavItem[]
  userName: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-secondary/40 lg:flex-row">
      <aside className="flex flex-col gap-4 border-b border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-5">
        <div className="flex items-center justify-between gap-3">
          <Logo size={40} />
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary lg:hidden">{label}</span>
        </div>
        <p className="hidden text-xs font-bold uppercase tracking-widest text-muted-foreground lg:block">{label}</p>
        <PortalNav items={nav} />
        <div className="mt-auto hidden flex-col gap-3 border-t border-sidebar-border pt-4 lg:flex">
          <p className="truncate text-sm font-semibold">{userName}</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              View site
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-muted-foreground hover:text-foreground">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-8">{children}</main>
    </div>
  )
}

export function PortalHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-balance text-2xl font-extrabold md:text-3xl">{title}</h1>
        {description && <p className="text-pretty leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Panel({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 md:p-6 ${className}`}>
      {title && <h2 className="text-lg font-bold">{title}</h2>}
      {children}
    </section>
  )
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl font-extrabold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
