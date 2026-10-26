import type { Metadata } from 'next'
import { getCategories, getDestinations } from '@/lib/queries'
import { ExperienceListing, parseFilters, type ListingParams } from '@/components/experience/listing'
import { PageHero } from '@/components/site/section-heading'

export const metadata: Metadata = {
  title: 'Explore experiences',
  description: 'Browse snorkeling trips, sandbank picnics, dolphin cruises, fishing and more across the Maldives.',
}

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<ListingParams> }) {
  const [sp, categories, destinations] = await Promise.all([searchParams, getCategories(), getDestinations()])
  return (
    <>
      <PageHero title="Explore the Maldives" subtitle="Every excursion, island and atoll in one place. Filter by date to see live availability." image="/images/snorkeling.png" />
      <ExperienceListing filters={parseFilters(sp)} categories={categories} destinations={destinations} action="/experiences" />
    </>
  )
}
