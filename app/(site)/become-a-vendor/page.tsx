import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarCheck, Wallet, Globe2, LayoutDashboard } from 'lucide-react'
import { PageHero } from '@/components/site/section-heading'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Become a vendor', description: 'List your excursions on Excursion Maldives and reach travellers worldwide.' }

const BENEFITS = [
  { icon: Globe2, title: 'Reach more travellers', body: 'Your trips appear to guests searching by island, date and activity.' },
  { icon: CalendarCheck, title: 'Live availability', body: 'Set dates, times and seats. We stop overbooking automatically.' },
  { icon: Wallet, title: 'Get paid in USD', body: 'Guests pay through Bank of Maldives. Request payouts any time from your balance.' },
  { icon: LayoutDashboard, title: 'Your own dashboard', body: 'Manage listings, bookings, guests and earnings in one place.' },
]

const STEPS = ['Create an account and tell us about your business', 'Our team reviews your licence and details', 'Publish listings and start receiving bookings']

export default function BecomeVendorPage() {
  return (
    <>
      <PageHero title="Grow your excursion business" subtitle="Join the marketplace built for Maldivian operators." image="/images/fishing.png" />
      <div className="container-page flex flex-col gap-16 py-14">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex flex-col gap-3 rounded-3xl bg-secondary p-6">
              <Icon className="size-7 text-primary" aria-hidden />
              <span className="text-lg font-bold">{title}</span>
              <span className="text-sm leading-relaxed text-muted-foreground">{body}</span>
            </li>
          ))}
        </ul>
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-extrabold">How it works</h2>
            <ol className="flex flex-col gap-4">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
                  <span className="text-lg">{s}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground">Simple commission on each confirmed booking. No monthly fees.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/vendor/onboarding" className={cn(buttonVariants({ size: 'lg' }), 'h-12 rounded-full bg-accent px-8 text-accent-foreground hover:bg-accent/90')}>
                Apply now
              </Link>
              <Link href="/contact" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'h-12 rounded-full px-6')}>
                Ask a question
              </Link>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/dolphins.png" alt="Excursion boat with dolphins alongside" className="aspect-[4/3] w-full rounded-[2rem] object-cover" />
        </section>
      </div>
    </>
  )
}
