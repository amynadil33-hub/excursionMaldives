import { linesToArray } from '@/lib/format'
import type { ItineraryStep } from '@/lib/types'

export function text(fd: FormData, key: string, max = 500) {
  const v = String(fd.get(key) ?? '').trim()
  return v ? v.slice(0, max) : null
}

export function num(fd: FormData, key: string) {
  const raw = String(fd.get(key) ?? '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : NaN
}

export function uuidOrNull(fd: FormData, key: string) {
  const v = String(fd.get(key) ?? '')
  return /^[0-9a-f-]{36}$/i.test(v) ? v : null
}

function parseItinerary(value: FormDataEntryValue | null): ItineraryStep[] {
  return linesToArray(value)
    .slice(0, 20)
    .map((line) => {
      const [a, b, c] = line.split('|').map((s) => s.trim())
      if (b === undefined) return { title: a }
      return { time: a || undefined, title: b, description: c || undefined }
    })
    .filter((s) => s.title)
}

export function parseListing(fd: FormData): { error: string } | { data: Record<string, unknown> } {
  const title = text(fd, 'title', 140)
  if (!title || title.length < 4) return { error: 'Please give the experience a title (at least 4 characters).' }

  const price = num(fd, 'price')
  const childPrice = num(fd, 'child_price')
  const compareAt = num(fd, 'compare_at_price')
  const duration = num(fd, 'duration_minutes')
  const minGuests = num(fd, 'min_guests') ?? 1
  const maxGuests = num(fd, 'max_guests') ?? 12

  if (price === null || Number.isNaN(price) || price < 0 || price > 100000) return { error: 'Enter a valid adult price.' }
  if (childPrice !== null && (Number.isNaN(childPrice) || childPrice < 0)) return { error: 'Enter a valid child price.' }
  if (compareAt !== null && (Number.isNaN(compareAt) || compareAt < price)) return { error: 'The "was" price must be higher than the price.' }
  if (duration === null || !Number.isInteger(duration) || duration < 15 || duration > 1440 * 7)
    return { error: 'Duration must be in whole minutes (at least 15).' }
  if (!Number.isInteger(minGuests) || !Number.isInteger(maxGuests) || minGuests < 1 || maxGuests < minGuests || maxGuests > 500)
    return { error: 'Guest limits are invalid.' }

  return {
    data: {
      title,
      summary: text(fd, 'summary', 300),
      description: text(fd, 'description', 8000),
      category_id: uuidOrNull(fd, 'category_id'),
      destination_id: uuidOrNull(fd, 'destination_id'),
      duration_minutes: duration,
      price: Math.round(price * 100) / 100,
      child_price: childPrice === null ? null : Math.round(childPrice * 100) / 100,
      compare_at_price: compareAt,
      min_guests: minGuests,
      max_guests: maxGuests,
      is_private: fd.get('is_private') === 'on',
      cover_image: text(fd, 'cover_image', 1000),
      highlights: linesToArray(fd.get('highlights')).slice(0, 15),
      inclusions: linesToArray(fd.get('inclusions')).slice(0, 20),
      exclusions: linesToArray(fd.get('exclusions')).slice(0, 20),
      pickup_locations: linesToArray(fd.get('pickup_locations')).slice(0, 20),
      languages: String(fd.get('languages') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10),
      itinerary: parseItinerary(fd.get('itinerary')),
      meeting_point: text(fd, 'meeting_point', 300),
      cancellation_policy: text(fd, 'cancellation_policy', 1000),
    },
  }
}
