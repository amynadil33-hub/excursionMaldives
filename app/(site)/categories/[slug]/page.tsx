import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategories, getCategory, getDestinations } from '@/lib/queries'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { ExperienceListing, parseFilters, type ListingParams } from '@/components/experience/listing'
import { PageHero } from '@/components/site/section-heading'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ListingParams> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)
  return { title: category?.name ?? 'Category', description: category?.description ?? undefined }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const [category, categories, destinations] = await Promise.all([getCategory(slug), getCategories(), getDestinations()])
  if (!category && isSupabaseConfigured()) notFound()
  return (
    <>
      <PageHero title={category?.name ?? 'Category'} subtitle={category?.description ?? undefined} image={category?.image_url} />
      <ExperienceListing
        filters={{ ...parseFilters(sp), category: slug }}
        categories={categories}
        destinations={destinations}
        action={`/categories/${slug}`}
        lockCategory
      />
    </>
  )
}
