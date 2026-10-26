import Link from 'next/link'
import { Clock, MapPin, Star, Users } from 'lucide-react'
import { formatDuration, formatPrice } from '@/lib/format'
import type { ExperienceWithRelations } from '@/lib/types'
import { WishlistButton } from './wishlist-button'

export function ExperienceCard({ experience, wished = false }: { experience: ExperienceWithRelations; wished?: boolean }) {
  const e = experience
  const onSale = e.compare_at_price && Number(e.compare_at_price) > Number(e.price)
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-card shadow-[0_1px_0_0_var(--border)] ring-1 ring-border transition-shadow hover:shadow-xl hover:shadow-primary/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {e.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.cover_image} alt={e.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {e.category && <span className="rounded-full bg-background/95 px-2.5 py-1 text-xs font-semibold text-foreground">{e.category.name}</span>}
          {onSale && <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">Deal</span>}
          {e.is_private && <span className="rounded-full bg-palm px-2.5 py-1 text-xs font-semibold text-primary-foreground">Private</span>}
        </div>
        <div className="absolute right-3 top-3">
          <WishlistButton experienceId={e.id} initial={wished} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <MapPin className="size-3.5 text-primary" aria-hidden />
          {e.destination?.name ?? 'Maldives'}
          {e.vendor && <span className="truncate">· {e.vendor.business_name}</span>}
        </div>
        <h3 className="text-lg font-bold leading-snug text-balance">
          <Link href={`/experiences/${e.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {e.title}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-4" aria-hidden /> {formatDuration(e.duration_minutes)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-4" aria-hidden /> Up to {e.max_guests}
          </span>
          {e.review_count > 0 && (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Star className="size-4 fill-accent text-accent" aria-hidden /> {Number(e.rating_avg).toFixed(1)}
              <span className="font-normal text-muted-foreground">({e.review_count})</span>
            </span>
          )}
        </div>
        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{e.is_private ? 'per trip' : 'from, per adult'}</span>
            <span className="flex items-baseline gap-2">
              <span className="font-heading text-xl font-extrabold text-primary">{formatPrice(e.price, e.currency)}</span>
              {onSale && <span className="text-sm text-muted-foreground line-through">{formatPrice(e.compare_at_price, e.currency)}</span>}
            </span>
          </div>
          <span className="text-sm font-semibold text-primary">Book now</span>
        </div>
      </div>
    </article>
  )
}

export function ExperienceGrid({ experiences, wishedIds = [] }: { experiences: ExperienceWithRelations[]; wishedIds?: string[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {experiences.map((e) => (
        <ExperienceCard key={e.id} experience={e} wished={wishedIds.includes(e.id)} />
      ))}
    </div>
  )
}
