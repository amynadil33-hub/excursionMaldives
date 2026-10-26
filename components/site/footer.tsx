import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from './logo'

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/experiences', label: 'All experiences' },
      { href: '/categories', label: 'Categories' },
      { href: '/destinations', label: 'Destinations' },
      { href: '/private-trips', label: 'Private trips' },
      { href: '/deals', label: 'Deals & offers' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/blog', label: 'Travel guide' },
      { href: '/contact', label: 'Contact' },
      { href: '/become-a-vendor', label: 'List your business' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/account', label: 'My bookings' },
      { href: '/wishlist', label: 'Wishlist' },
      { href: '/vendor', label: 'Vendor portal' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-foreground text-background">
      <div className="wave-divider -translate-y-1/2 opacity-90" aria-hidden />
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="w-fit rounded-xl bg-background p-2">
            <Logo />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-background/70">
            The Maldives experiences marketplace. Book reef trips, sandbanks and sunset cruises with licensed local operators.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-background/80">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-accent" aria-hidden /> Malé, Republic of Maldives
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-accent" aria-hidden /> +960 777 0000
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-accent" aria-hidden /> hello@excursionmaldives.com
            </li>
          </ul>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent">{col.title}</h2>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-background/80 transition-colors hover:text-background">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-background/15">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-background/60 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Excursion Maldives. All rights reserved.</p>
          <p>Prices in USD · Secure payments by Bank of Maldives</p>
        </div>
      </div>
    </footer>
  )
}
