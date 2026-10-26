import type { Metadata } from 'next'
import Link from 'next/link'
import { getBlogPosts } from '@/lib/queries'
import { formatDate } from '@/lib/format'
import { PageHero } from '@/components/site/section-heading'
import { EmptyState } from '@/components/site/empty-state'

export const metadata: Metadata = { title: 'Travel guide', description: 'Tips, guides and stories for exploring the Maldives.' }

export default async function BlogPage() {
  const posts = await getBlogPosts()
  return (
    <>
      <PageHero title="Maldives travel guide" subtitle="Local know-how on weather, marine life, islands and etiquette." image="/images/culture.png" />
      <div className="container-page py-12">
        {posts.length === 0 ? (
          <EmptyState title="No articles yet" />
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/blog/${p.slug}`} className="group flex flex-col gap-3">
                  <span className="aspect-[16/10] overflow-hidden rounded-3xl bg-muted">
                    {p.cover_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover_image} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    )}
                  </span>
                  {p.published_at && <span className="text-xs font-bold uppercase tracking-wider text-primary">{formatDate(p.published_at)}</span>}
                  <span className="text-balance text-xl font-extrabold group-hover:text-primary">{p.title}</span>
                  {p.excerpt && <span className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{p.excerpt}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
