import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { getDestinations } from '@/lib/queries'
import { PageHero } from '@/components/site/section-heading'
import { EmptyState } from '@/components/site/empty-state'

export const metadata: Metadata = { title: 'Destinations', description: 'Explore excursions by island and atoll across the Maldives.' }

export default async function DestinationsPage() {
  const destinations = await getDestinations()
  return (
    <>
      <PageHero title="Islands & atolls" subtitle="From the capital Malé to the UNESCO biosphere of Baa Atoll, find trips close to where you stay." image="/images/maafushi.png" />
      <div className="container-page py-12">
        {destinations.length === 0 ? (
          <EmptyState title="No destinations yet" />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d) => (
              <li key={d.id}>
                <Link href={`/destinations/${d.slug}`} className="group flex flex-col gap-3">
                  <span className="aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
                    {d.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.image_url} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    )}
                  </span>
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex flex-col">
                      <span className="text-xl font-extrabold group-hover:text-primary">{d.name}</span>
                      {d.atoll && (
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-3.5" aria-hidden /> {d.atoll}
                        </span>
                      )}
                    </span>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">{d.count} trips</span>
                  </span>
                  {d.description && <span className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{d.description}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
