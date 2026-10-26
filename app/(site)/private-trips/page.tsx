import type { Metadata } from 'next'
import Link from 'next/link'
import { Anchor, Users, Sparkles } from 'lucide-react'
import { getExperiences } from '@/lib/queries'
import { getWishedIds } from '@/app/actions/wishlist'
import { ExperienceGrid } from '@/components/experience/experience-card'
import { EmptyState } from '@/components/site/empty-state'
import { PageHero, SectionHeading } from '@/components/site/section-heading'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Private trips & charters', description: 'Charter a speedboat, yacht or dhoni for your group in the Maldives.' }

const PERKS = [
  { icon: Anchor, title: 'Your boat, your schedule', body: 'Leave when you like and stay as long as the tide allows.' },
  { icon: Users, title: 'One price for the group', body: 'Private trips are priced per boat, not per person.' },
  { icon: Sparkles, title: 'Tailored by locals', body: 'Hosts adjust the route around weather, marine life and your wishes.' },
]

export default async function PrivateTripsPage() {
  const [experiences, wished] = await Promise.all([getExperiences({ privateOnly: true }), getWishedIds()])
  return (
    <>
      <PageHero title="Private trips & charters" subtitle="Just you, your people and the Indian Ocean." image="/images/yacht.png" />
      <div className="container-page flex flex-col gap-16 py-12">
        <ul className="grid gap-6 md:grid-cols-3">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex flex-col gap-3 rounded-3xl bg-secondary p-6">
              <Icon className="size-7 text-primary" aria-hidden />
              <span className="text-lg font-bold">{title}</span>
              <span className="text-sm leading-relaxed text-muted-foreground">{body}</span>
            </li>
          ))}
        </ul>
        <section>
          <SectionHeading title="Bookable private trips" subtitle="Instant booking with live availability." />
          {experiences.length > 0 ? <ExperienceGrid experiences={experiences} wishedIds={wished} /> : <EmptyState title="No private trips listed yet" />}
        </section>
        <section className="flex flex-col items-start gap-4 rounded-[2rem] bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:justify-between md:p-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-extrabold md:text-3xl">{"Don't see what you want?"}</h2>
            <p className="max-w-lg leading-relaxed text-primary-foreground/90">Tell us your dates, group size and ideas. We will match you with the right local host.</p>
          </div>
          <Link href="/contact?type=private_trip" className={cn(buttonVariants({ size: 'lg' }), 'h-12 rounded-full bg-accent px-6 text-accent-foreground hover:bg-accent/90')}>
            Request a custom trip
          </Link>
        </section>
      </div>
    </>
  )
}
