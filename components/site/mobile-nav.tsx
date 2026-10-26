'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function MobileNav({
  links,
  signedIn,
  portal,
}: {
  links: { href: string; label: string }[]
  signedIn: boolean
  portal: { href: string; label: string } | null
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'rounded-full lg:hidden')} aria-label="Open menu">
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="font-heading">Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className="rounded-lg px-3 py-3 font-medium hover:bg-secondary">
              {l.label}
            </Link>
          ))}
          <div className="my-2 h-px bg-border" />
          <Link href="/become-a-vendor" onClick={close} className="rounded-lg px-3 py-3 font-medium hover:bg-secondary">
            List your business
          </Link>
          {portal && (
            <Link href={portal.href} onClick={close} className="rounded-lg px-3 py-3 font-medium hover:bg-secondary">
              {portal.label}
            </Link>
          )}
          <Link
            href={signedIn ? '/account' : '/auth/login'}
            onClick={close}
            className={cn(buttonVariants({ size: 'lg' }), 'mt-3 h-11 rounded-full')}
          >
            {signedIn ? 'My account' : 'Sign in'}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
