import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, Clock, Globe, MapPin, ShieldCheck, Star, Users, X } from 'lucide-react'
import { getExperienceBySlug, getExperiences } from '@/lib/queries'
import { getWishedIds } from '@/app/actions/wishlist'
import { getSession } from '@/lib/auth'
import { formatDate, formatDuration } from '@/lib/format'
import { Gallery } from '@/components/experience/gallery'
import { BookingWidget } from '@/components/experience/booking-widget'
import { WishlistButton } from '@/components/experience/wishlist-button'
import { ExperienceGrid } from '@/components/experience/experience-card'
import { ReviewForm } from '@/components/experience/review-form'
import { SectionHeading } from '@/components/site/section-heading'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getExperienceBySlug(slug)
  if (!data) return { title: 'Experience' }
  const e = data.experience
  return {
    title: e.title,
    description: e.summary ?? undefined,
    openGraph: { images: e.cover_image ? [e.cover_image] : undefined },
  }
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={n <= Math.round(value) ? 'size-4 fill-accent text-accent' : 'size-4 text-border'} aria-hidden />
      ))}
    </span>
  )
}

export default async function ExperiencePage({ params }: Props) {
  const { slug } = await params
  const data = await getExperienceBySlug(slug)
  if (!data || data.experience.status !== 'published') notFound()
  const { experience: e, images, slots, reviews } = data
  const [wished, { user }, related] = await Promise.all([
    getWishedIds(),
    getSession(),
    e.category ? getExperiences({ category: e.category.slug, limit: 4 }) : Promise.resolve([]),
  ])
  const gallery = [...(e.cover_image ? [{ url: e.cover_image, alt: e.title }] : []), ...images.map((i) => ({ url: i.url, alt: i.alt }))]
  const facts = [
    { icon: Clock, label: formatDuration(e.duration_minutes) },
    { icon: Users, label: e.is_private ? `Private · up to ${e.max_guests}` : `Up to ${e.max_guests} guests` },
    { icon: Globe, label: e.languages.join(', ') },
    { icon: ShieldCheck, label: 'Instant confirmation' },
  ]

  return (
    <article className="container-page flex flex-col gap-8 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/experiences" className="hover:text-primary">
              Explore
            </Link>
          </li>
          {e.destination && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/destinations/${e.destination.slug}`} className="hover:text-primary">
                  {e.destination.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li className="text-foreground" aria-current="page">
            {e.title}
          </li>
        </ol>
      </nav>

      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          {e.category && (
            <Link href={`/categories/${e.category.slug}`} className="text-sm font-bold uppercase tracking-wider text-primary">
              {e.category.name}
            </Link>
          )}
          <h1 className="text-balance text-3xl font-extrabold md:text-5xl">{e.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {e.review_count > 0 && (
              <span className="flex items-center gap-1.5">
                <Stars value={e.rating_avg} />
                <span className="font-bold text-foreground">{Number(e.rating_avg).toFixed(1)}</span>({e.review_count} reviews)
              </span>
            )}
            {e.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden />
                {e.destination.name}
                {e.destination.atoll ? `, ${e.destination.atoll}` : ''}
              </span>
            )}
          </div>
        </div>
        <WishlistButton experienceId={e.id} initial={wished.includes(e.id)} />
      </header>

      <Gallery images={gallery} title={e.title} />

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-10">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold">
                <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                {label}
              </li>
            ))}
          </ul>

          <section className="flex flex-col gap-3">
            <h2 className="text-2xl font-extrabold">About this trip</h2>
            {e.summary && <p className="text-lg leading-relaxed">{e.summary}</p>}
            {e.description && <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{e.description}</p>}
          </section>

          {e.highlights.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-2xl font-extrabold">Highlights</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {e.highlights.map((h) => (
                  <li key={h} className="flex gap-2 leading-relaxed">
                    <Star className="mt-1 size-4 shrink-0 fill-accent text-accent" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {e.itinerary.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold">Itinerary</h2>
              <ol className="relative flex flex-col gap-6 border-l-2 border-dashed border-primary/30 pl-6">
                {e.itinerary.map((step, i) => (
                  <li key={i} className="relative flex flex-col gap-1">
                    <span className="absolute -left-[33px] top-1 size-4 rounded-full border-4 border-background bg-primary" aria-hidden />
                    {step.time && <span className="text-xs font-bold uppercase tracking-wider text-primary">{step.time}</span>}
                    <span className="font-bold">{step.title}</span>
                    {step.description && <span className="text-sm leading-relaxed text-muted-foreground">{step.description}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(e.inclusions.length > 0 || e.exclusions.length > 0) && (
            <section className="grid gap-6 rounded-3xl border p-6 sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-extrabold">{"What's included"}</h2>
                <ul className="flex flex-col gap-2">
                  {e.inclusions.map((x) => (
                    <li key={x} className="flex gap-2 text-sm leading-relaxed">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-extrabold">Not included</h2>
                <ul className="flex flex-col gap-2">
                  {e.exclusions.map((x) => (
                    <li key={x} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                      <X className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            {e.meeting_point && (
              <div className="flex flex-col gap-1 rounded-2xl bg-secondary p-5">
                <h2 className="font-bold">Meeting point</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{e.meeting_point}</p>
              </div>
            )}
            {e.cancellation_policy && (
              <div className="flex flex-col gap-1 rounded-2xl bg-secondary p-5">
                <h2 className="font-bold">Cancellation</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{e.cancellation_policy}</p>
              </div>
            )}
          </section>

          {e.vendor && (
            <section className="flex items-center gap-4 rounded-3xl border p-5">
              <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-lg font-extrabold text-primary">
                {e.vendor.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.vendor.logo_url} alt="" className="size-full object-cover" />
                ) : (
                  e.vendor.business_name.charAt(0)
                )}
              </span>
              <div className="flex flex-1 flex-col">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Hosted by</span>
                <span className="font-bold">{e.vendor.business_name}</span>
                {e.vendor.island && <span className="text-sm text-muted-foreground">{e.vendor.island}</span>}
              </div>
              <Link href={`/vendors/${e.vendor.slug}`} className="text-sm font-semibold text-primary hover:underline">
                View operator
              </Link>
            </section>
          )}

          <section className="flex flex-col gap-5" id="reviews">
            <h2 className="text-2xl font-extrabold">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet. Be the first after your trip.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {reviews.map((r) => (
                  <li key={r.id} className="flex flex-col gap-1.5 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{r.author_name}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                    </div>
                    <Stars value={r.rating} />
                    {r.title && <p className="font-semibold">{r.title}</p>}
                    {r.body && <p className="leading-relaxed text-muted-foreground">{r.body}</p>}
                  </li>
                ))}
              </ul>
            )}
            {user && <ReviewForm experienceId={e.id} slug={e.slug} />}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Book this experience">
          <BookingWidget experience={e} slots={slots} />
        </aside>
      </div>

      {related.filter((r) => r.id !== e.id).length > 0 && (
        <section className="pt-8">
          <SectionHeading title="You might also like" />
          <ExperienceGrid experiences={related.filter((r) => r.id !== e.id).slice(0, 3)} wishedIds={wished} />
        </section>
      )}
    </article>
  )
}
