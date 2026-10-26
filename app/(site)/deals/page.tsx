import type { Metadata } from 'next'
import { getBanners, getExperiences } from '@/lib/queries'
import { getWishedIds } from '@/app/actions/wishlist'
import { ExperienceGrid } from '@/components/experience/experience-card'
import { EmptyState } from '@/components/site/empty-state'
import { PageHero } from '@/components/site/section-heading'
import { PromoBanner } from '@/components/home/sections'

export const metadata: Metadata = { title: 'Deals & offers', description: 'Discounted Maldives excursions and seasonal offers.' }

export default async function DealsPage() {
  const [experiences, banners, wished] = await Promise.all([getExperiences({ deals: true }), getBanners('deals'), getWishedIds()])
  return (
    <>
      <PageHero title="Deals & offers" subtitle="Same lagoons, smaller price. Limited seats at these rates." image="/images/sunset.png" />
      {banners.map((b) => (
        <PromoBanner key={b.id} banner={b} />
      ))}
      <div className="container-page py-12">
        {experiences.length > 0 ? (
          <ExperienceGrid experiences={experiences} wishedIds={wished} />
        ) : (
          <EmptyState title="No deals running right now" body="Check back soon — operators add offers every week." action={{ href: '/experiences', label: 'Browse all trips' }} />
        )}
      </div>
    </>
  )
}
