import type { Metadata } from 'next'
import Link from 'next/link'
import { getCmsSection } from '@/lib/queries'
import { PageHero } from '@/components/site/section-heading'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'About us', description: 'Excursion Maldives connects travellers with trusted local excursion operators.' }

const DEFAULT_ABOUT = {
  title: 'Made in Malé, for the whole archipelago',
  intro:
    'Excursion Maldives is a marketplace built by islanders. We bring together licensed boat operators, dive centres and guesthouse hosts so travellers can book real local experiences with confidence.',
  body: 'Every operator is reviewed by our team before their first listing goes live. Payments are processed securely in USD through Bank of Maldives, and operators are paid out directly to their local accounts.\n\nWhether you are staying at a guesthouse on Maafushi or a resort in Baa Atoll, we want your day on the water to be the highlight of your trip.',
  image_url: '/images/islandhop.png',
}

export default async function AboutPage() {
  const about = await getCmsSection('about', DEFAULT_ABOUT)
  return (
    <>
      <PageHero title="About us" subtitle={about.title} image="/images/thulusdhoo.png" />
      <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <h2 className="text-balance text-3xl font-extrabold">{about.title}</h2>
          <p className="text-lg leading-relaxed">{about.intro}</p>
          {about.body.split(/\n{2,}/).map((p, i) => (
            <p key={i} className="leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/experiences" className={cn(buttonVariants({ size: 'lg' }), 'h-12 rounded-full px-6')}>
              Explore trips
            </Link>
            <Link href="/become-a-vendor" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'h-12 rounded-full px-6')}>
              List your business
            </Link>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={about.image_url} alt="Boat arriving at a local island harbour" className="aspect-[4/5] w-full rounded-[2rem] object-cover" />
      </div>
    </>
  )
}
