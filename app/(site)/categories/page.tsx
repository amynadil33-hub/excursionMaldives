import type { Metadata } from 'next'
import Link from 'next/link'
import { getCategories } from '@/lib/queries'
import { PageHero } from '@/components/site/section-heading'
import { EmptyState } from '@/components/site/empty-state'

export const metadata: Metadata = { title: 'Experience categories', description: 'Snorkeling, sandbanks, dolphins, fishing, water sports and more.' }

export default async function CategoriesPage() {
  const categories = await getCategories()
  return (
    <>
      <PageHero title="What will you do today?" subtitle="Pick an activity and we will show you every operator offering it." image="/images/manta.png" />
      <div className="container-page py-12">
        {categories.length === 0 ? (
          <EmptyState title="No categories yet" />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/categories/${c.slug}`} className="group relative flex aspect-[4/3] overflow-hidden rounded-3xl">
                  {c.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" aria-hidden />
                  <span className="relative mt-auto flex flex-col gap-1 p-6 text-primary-foreground">
                    <span className="font-heading text-2xl font-extrabold">{c.name}</span>
                    {c.description && <span className="text-sm leading-relaxed text-primary-foreground/85 line-clamp-2">{c.description}</span>}
                    <span className="text-xs font-bold uppercase tracking-wider text-accent">{c.count} experiences</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
