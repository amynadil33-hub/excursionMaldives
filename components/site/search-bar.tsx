'use client'

import { useRouter } from 'next/navigation'
import { CalendarDays, MapPin, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SearchBar({
  destinations,
  defaults = {},
  className,
}: {
  destinations: { slug: string; name: string }[]
  defaults?: { q?: string; destination?: string; date?: string; guests?: string }
  className?: string
}) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    for (const [k, v] of fd.entries()) if (String(v).trim()) params.set(k, String(v).trim())
    router.push(`/experiences?${params.toString()}`)
  }

  const field = 'flex items-center gap-3 rounded-2xl px-4 py-2.5 transition-colors focus-within:bg-secondary hover:bg-secondary/70'
  const label = 'text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground'
  const input = 'w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70'

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={cn('grid gap-1 rounded-3xl bg-background p-2 shadow-2xl shadow-foreground/15 md:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto]', className)}
    >
      <label className={field}>
        <Search className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="flex w-full flex-col">
          <span className={label}>Activity</span>
          <input name="q" defaultValue={defaults.q} placeholder="Snorkeling, dolphins…" className={input} />
        </span>
      </label>
      <label className={field}>
        <MapPin className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="flex w-full flex-col">
          <span className={label}>Where</span>
          <select name="destination" defaultValue={defaults.destination ?? ''} className={cn(input, 'cursor-pointer')}>
            <option value="">Anywhere</option>
            {destinations.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </span>
      </label>
      <label className={field}>
        <CalendarDays className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="flex w-full flex-col">
          <span className={label}>When</span>
          <input type="date" name="date" min={today} defaultValue={defaults.date} className={input} />
        </span>
      </label>
      <label className={field}>
        <Users className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="flex w-full flex-col">
          <span className={label}>Guests</span>
          <input type="number" name="guests" min={1} max={50} defaultValue={defaults.guests ?? ''} placeholder="2" className={input} />
        </span>
      </label>
      <Button type="submit" className="h-14 rounded-2xl px-7 text-base font-semibold">
        <Search className="size-5" aria-hidden />
        Search
      </Button>
    </form>
  )
}
