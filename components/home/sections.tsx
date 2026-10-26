import Link from 'next/link'
import { ArrowRight, BadgeCheck, CalendarCheck, ShieldCheck } from 'lucide-react'
import type { Banner, BlogPost, Category, Destination, HomeContent } from '@/lib/types'
import { formatDate } from '@/lib/format'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SectionHeading } from '@/components/site/section-heading'

export function CategoryRail({ title, categories }: { title: string; categories: (Category & { count: number })[] }) {
  if (categories.length === 0) return null
  return (
    <section className="container-page pt-20">
      <SectionHeading title={title} href="/categories" linkLabel="All categories" />
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-8">
        {categories.map((c) => (
          <li key={c.id} className="w-32 shrink-0 snap-start md:w-auto">
            <Link href={`/categories/${c.slug}`} className="group flex flex-col items-center gap-3 text-center">
              <span className="relative aspect-square w-full overflow-hidden rounded-full ring-4 ring-secondary transition group-hover:ring-primary">
                {c.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                )}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-bold">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.count} trips</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function DestinationMosaic({ title, destinations }: { title: string; destinations: (Destination & { count: number })[] }) {
  if (destinations.length === 0) return null
  return (
    <section className="container-page pt-20">
      <SectionHeading title={title} href="/destinations" linkLabel="All destinations" />
      <div className="grid auto-rows-[220px] gap-4 md:grid-cols-4">
        {destinations.slice(0, 5).map((d, i) => (
          <Link
            key={d.id}
            href={`/destinations/${d.slug}`}
            className={cn('group relative overflow-hidden rounded-3xl', i === 0 && 'md:col-span-2 md:row-span-2')}
          >
            {d.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.image_url} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent" aria-hidden />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-5 text-primary-foreground">
              <span className="flex flex-col">
                <span className={cn('font-heading font-extrabold', i === 0 ? 'text-3xl' : 'text-xl')}>{d.name}</span>
                <span className="text-sm text-primary-foreground/85">{d.atoll}</span>
              </span>
              <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-foreground">{d.count} trips</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function PromoBanner({ banner }: { banner?: Banner }) {
  if (!banner) return null
  return (
    <section className="container-page pt-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-accent text-accent-foreground">
        <div className="grid items-center md:grid-cols-2">
          <div className="flex flex-col items-start gap-4 p-8 md:p-12">
            <span className="rounded-full bg-background/70 px-3 py-1 text-xs font-bold uppercase tracking-wider">Limited offer</span>
            <h2 className="text-3xl font-extrabold text-balance md:text-4xl">{banner.title}</h2>
            {banner.subtitle && <p className="text-lg leading-relaxed text-pretty">{banner.subtitle}</p>}
            {banner.cta_href && (
              <Link href={banner.cta_href} className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'h-12 rounded-full px-6')}>
                {banner.cta_label ?? 'Learn more'} <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
          {banner.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner.image_url} alt="" className="h-64 w-full object-cover md:h-full md:[clip-path:polygon(12%_0,100%_0,100%_100%,0_100%)]" loading="lazy" />
          )}
        </div>
      </div>
    </section>
  )
}

export function PrivateTripCta({ content }: { content: HomeContent }) {
  return (
    <section className="container-page pt-20">
      <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-primary text-primary-foreground md:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content.private_image} alt="Private yacht anchored in a Maldives lagoon" className="h-72 w-full object-cover md:h-full" loading="lazy" />
        <div className="flex flex-col items-start justify-center gap-5 p-8 md:p-12">
          <h2 className="text-3xl font-extrabold text-balance md:text-4xl">{content.private_title}</h2>
          <p className="text-lg leading-relaxed text-primary-foreground/90 text-pretty">{content.private_subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/private-trips" className={cn(buttonVariants({ size: 'lg' }), 'h-12 rounded-full bg-accent px-6 text-accent-foreground hover:bg-accent/90')}>
              Browse private trips
            </Link>
            <Link
              href="/contact?type=private_trip"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 rounded-full border-primary-foreground/60 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground')}
            >
              Request a custom trip
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

const TRUST_ICONS = [BadgeCheck, ShieldCheck, CalendarCheck]

export function TrustStrip({ points }: { points: HomeContent['trust_points'] }) {
  return (
    <section className="container-page pt-20">
      <ul className="grid gap-6 md:grid-cols-3">
        {points.map((p, i) => {
          const Icon = TRUST_ICONS[i % TRUST_ICONS.length]
          return (
            <li key={p.title} className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon className="size-6" aria-hidden />
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-heading text-lg font-bold">{p.title}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{p.body}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function BlogTeaser({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null
  return (
    <section className="container-page pt-20">
      <SectionHeading title="From the travel guide" subtitle="Local tips to plan a better trip." href="/blog" linkLabel="Read the guide" />
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col gap-3">
            <span className="aspect-[16/10] overflow-hidden rounded-3xl bg-muted">
              {p.cover_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover_image} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              )}
            </span>
            {p.published_at && <span className="text-xs font-semibold uppercase tracking-wider text-primary">{formatDate(p.published_at)}</span>}
            <span className="text-lg font-bold leading-snug text-balance group-hover:text-primary">{p.title}</span>
            {p.excerpt && <span className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{p.excerpt}</span>}
          </Link>
        ))}
      </div>
    </section>
  )
}
