import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategories, getDestination, getDestinations } from '@/lib/queries'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { ExperienceListing, parseFilters, type ListingParams } from '@/components/experience/listing'
import { PageHero } from '@/components/site/section-heading'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ListingParams> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const d = await getDestination(slug)
  return { title: d ? `Things to do in ${d.name}` : 'Destination', description: d?.description ?? undefined }
}

export default async function DestinationPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const [destination, categories, destinations] = await Promise.all([getDestination(slug), getCategories(), getDestinations()])
  if (!destination && isSupabaseConfigured()) notFound()
  return (
    <>
      <PageHero
        title={destination ? `Things to do in ${destination.name}` : 'Destination'}
        subtitle={destination?.description ?? destination?.atoll ?? undefined}
        image={destination?.image_url}
      />
      <ExperienceListing
        filters={{ ...parseFilters(sp), destination: slug }}
        categories={categories}
        destinations={destinations}
        action={`/destinations/${slug}`}
        lockDestination
      />
    </>
  )
}
