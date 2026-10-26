import Link from 'next/link'
import type { Category, Destination } from '@/lib/types'
import { getExperiences, type ExperienceFilters } from '@/lib/queries'
import { getWishedIds } from '@/app/actions/wishlist'
import { ExperienceGrid } from '@/components/experience/experience-card'
import { EmptyState } from '@/components/site/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SORTS: { value: NonNullable<ExperienceFilters['sort']>; label: string }[] = [
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
]

const selectClass =
  'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export type ListingParams = Record<string, string | string[] | undefined>

export function parseFilters(sp: ListingParams): ExperienceFilters {
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined)
  const guests = Number(one('guests'))
  const sort = one('sort') as ExperienceFilters['sort']
  const date = one('date')
  return {
    q: one('q')?.slice(0, 80),
    category: one('category'),
    destination: one('destination'),
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    guests: Number.isInteger(guests) && guests > 0 && guests <= 50 ? guests : undefined,
    sort: SORTS.some((s) => s.value === sort) ? sort : undefined,
  }
}

export async function ExperienceListing({
  filters,
  categories,
  destinations,
  action,
  lockCategory,
  lockDestination,
}: {
  filters: ExperienceFilters
  categories: Category[]
  destinations: Destination[]
  action: string
  lockCategory?: boolean
  lockDestination?: boolean
}) {
  const [experiences, wished] = await Promise.all([getExperiences(filters), getWishedIds()])
  const hasFilters = Boolean(filters.q || (!lockCategory && filters.category) || (!lockDestination && filters.destination) || filters.date || filters.guests)

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
      <aside aria-label="Filters">
        <form action={action} className="flex flex-col gap-5 rounded-3xl border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Filter trips</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="f-q">Keyword</Label>
            <Input id="f-q" name="q" defaultValue={filters.q} placeholder="Snorkel, sunset, manta…" className="h-11 rounded-xl" />
          </div>
          {!lockCategory && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="f-cat">Activity</Label>
              <select id="f-cat" name="category" defaultValue={filters.category ?? ''} className={selectClass}>
                <option value="">All activities</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!lockDestination && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="f-dest">Island or atoll</Label>
              <select id="f-dest" name="destination" defaultValue={filters.destination ?? ''} className={selectClass}>
                <option value="">Anywhere</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="f-date">Date</Label>
              <Input id="f-date" type="date" name="date" defaultValue={filters.date} className="h-11 rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="f-guests">Guests</Label>
              <Input id="f-guests" type="number" min={1} max={50} name="guests" defaultValue={filters.guests} placeholder="2" className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="f-sort">Sort by</Label>
            <select id="f-sort" name="sort" defaultValue={filters.sort ?? 'popular'} className={selectClass}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="h-11 flex-1 rounded-full">
              Apply
            </Button>
            {hasFilters && (
              <Link href={action} className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-primary hover:bg-secondary">
                Reset
              </Link>
            )}
          </div>
        </form>
      </aside>
      <section aria-live="polite" className="flex flex-col gap-5">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{experiences.length}</span> {experiences.length === 1 ? 'experience' : 'experiences'} found
        </p>
        {experiences.length > 0 ? (
          <ExperienceGrid experiences={experiences} wishedIds={wished} />
        ) : (
          <EmptyState title="No trips match those filters" body="Try another date, fewer guests or a different island." action={{ href: action, label: 'Clear filters' }} />
        )}
      </section>
    </div>
  )
}
