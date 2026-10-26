import { getBanners, getBlogPosts, getCategories, getDestinations, getExperiences, getHomeContent } from '@/lib/queries'
import { getWishedIds } from '@/app/actions/wishlist'
import { Hero } from '@/components/home/hero'
import { BlogTeaser, CategoryRail, DestinationMosaic, PrivateTripCta, PromoBanner, TrustStrip } from '@/components/home/sections'
import { ExperienceGrid } from '@/components/experience/experience-card'
import { SectionHeading } from '@/components/site/section-heading'
import { EmptyState } from '@/components/site/empty-state'

export default async function HomePage() {
  const [content, categories, destinations, featured, banners, posts, wished] = await Promise.all([
    getHomeContent(),
    getCategories(),
    getDestinations(),
    getExperiences({ featured: true, limit: 6 }),
    getBanners('home'),
    getBlogPosts(3),
    getWishedIds(),
  ])

  return (
    <>
      <Hero hero={content.hero} destinations={destinations} />
      <TrustStrip points={content.trust_points} />
      <CategoryRail title={content.categories_title} categories={categories} />
      <section className="container-page pt-20">
        <SectionHeading title={content.featured_title} subtitle={content.featured_subtitle} href="/experiences" />
        {featured.length > 0 ? (
          <ExperienceGrid experiences={featured} wishedIds={wished} />
        ) : (
          <EmptyState title="New trips are on their way" body="Our operators are adding experiences. Check back soon." />
        )}
      </section>
      <DestinationMosaic title={content.destinations_title} destinations={destinations} />
      <PromoBanner banner={banners[0]} />
      <PrivateTripCta content={content} />
      <BlogTeaser posts={posts} />
    </>
  )
}
