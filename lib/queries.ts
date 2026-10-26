import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type {
  AvailabilitySlot,
  Banner,
  BlogPost,
  Category,
  Destination,
  ExperienceImage,
  ExperienceWithRelations,
  HomeContent,
  Review,
  Vendor,
} from '@/lib/types'
import {
  demoBanners,
  demoBlogPosts,
  demoCategories,
  demoCms,
  demoDestinations,
  demoExperiences,
  demoImages,
  demoReviews,
  demoSlots,
  demoVendors,
} from '@/lib/demo-data'

export const EXPERIENCE_SELECT =
  '*, vendor:vendors(id, business_name, slug, logo_url, island), category:categories(id, name, slug), destination:destinations(id, name, slug, atoll)'

export const DEFAULT_HOME: HomeContent = {
  hero: {
    eyebrow: 'The Maldives, island by island',
    title: 'Find your day out on the lagoon',
    subtitle: 'Snorkel with mantas, picnic on a sandbank, or chase dolphins at sunset — booked directly with trusted local operators.',
    image_url: '/images/hero.png',
  },
  featured_title: 'Excursions travellers love',
  featured_subtitle: 'Hand-picked trips with great reviews and instant confirmation.',
  categories_title: 'What do you feel like doing?',
  destinations_title: 'Popular islands & atolls',
  private_title: 'Plan a private trip',
  private_subtitle: 'Charter a speedboat, yacht or dhoni for your group. Tell us what you want and local hosts will tailor the day around you.',
  private_image: '/images/yacht.png',
  trust_points: [
    { title: 'Local operators', body: 'Every vendor is reviewed and approved by our team in Malé.' },
    { title: 'Secure payments', body: 'Pay safely in USD through Bank of Maldives.' },
    { title: 'Flexible plans', body: 'Free cancellation on most trips up to 24 hours before.' },
  ],
}

async function db() {
  if (!isSupabaseConfigured()) return null
  return createClient()
}

export interface ExperienceFilters {
  q?: string
  category?: string
  destination?: string
  date?: string
  guests?: number
  sort?: 'popular' | 'price_asc' | 'price_desc' | 'rating' | 'newest'
  privateOnly?: boolean
  deals?: boolean
  featured?: boolean
  limit?: number
}

function filterDemoExperiences(filters: ExperienceFilters) {
  let list = [...demoExperiences]
  if (filters.category) list = list.filter((e) => e.category?.slug === filters.category)
  if (filters.destination) list = list.filter((e) => e.destination?.slug === filters.destination)
  if (filters.privateOnly) list = list.filter((e) => e.is_private)
  if (filters.featured) list = list.filter((e) => e.is_featured)
  if (filters.deals) list = list.filter((e) => e.compare_at_price != null)
  if (filters.guests) list = list.filter((e) => e.max_guests >= filters.guests!)
  if (filters.q) {
    const term = filters.q.toLowerCase().trim()
    list = list.filter((e) => e.title.toLowerCase().includes(term) || (e.summary ?? '').toLowerCase().includes(term))
  }
  const sorters: Record<string, (a: ExperienceWithRelations, b: ExperienceWithRelations) => number> = {
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    rating: (a, b) => b.rating_avg - a.rating_avg,
    newest: (a, b) => b.created_at.localeCompare(a.created_at),
    popular: (a, b) => Number(b.is_featured) - Number(a.is_featured) || b.review_count - a.review_count,
  }
  list.sort(sorters[filters.sort ?? 'popular'] ?? sorters.popular)
  return filters.limit ? list.slice(0, filters.limit) : list
}

const withCount = <T extends { id: string }>(items: T[], key: 'category_id' | 'destination_id') =>
  items.map((item) => ({ ...item, count: demoExperiences.filter((e) => e[key] === item.id).length }))

export async function getExperiences(filters: ExperienceFilters = {}): Promise<ExperienceWithRelations[]> {
  const supabase = await db()
  if (!supabase) return filterDemoExperiences(filters)

  let categoryId: string | undefined
  let destinationId: string | undefined
  if (filters.category) {
    const { data } = await supabase.from('categories').select('id').eq('slug', filters.category).maybeSingle()
    if (!data) return []
    categoryId = data.id
  }
  if (filters.destination) {
    const { data } = await supabase.from('destinations').select('id').eq('slug', filters.destination).maybeSingle()
    if (!data) return []
    destinationId = data.id
  }

  let query = supabase.from('experiences').select(EXPERIENCE_SELECT).eq('status', 'published')
  if (categoryId) query = query.eq('category_id', categoryId)
  if (destinationId) query = query.eq('destination_id', destinationId)
  if (filters.privateOnly) query = query.eq('is_private', true)
  if (filters.featured) query = query.eq('is_featured', true)
  if (filters.deals) query = query.not('compare_at_price', 'is', null)
  if (filters.guests) query = query.gte('max_guests', filters.guests)
  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, ' ').trim()
    if (term) query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%`)
  }

  if (filters.date) {
    const { data: slots } = await supabase
      .from('availability_slots')
      .select('experience_id, capacity, booked')
      .eq('date', filters.date)
      .eq('is_active', true)
    const ids = [...new Set((slots ?? []).filter((s) => s.capacity - s.booked >= (filters.guests ?? 1)).map((s) => s.experience_id))]
    if (ids.length === 0) return []
    query = query.in('id', ids)
  }

  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'rating':
      query = query.order('rating_avg', { ascending: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    default:
      query = query.order('is_featured', { ascending: false }).order('review_count', { ascending: false })
  }
  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) {
    console.error('[queries] getExperiences', error.message)
    return []
  }
  return (data ?? []) as unknown as ExperienceWithRelations[]
}

export async function getExperienceBySlug(slug: string) {
  const supabase = await db()
  if (!supabase) {
    const experience = demoExperiences.find((e) => e.slug === slug)
    if (!experience) return null
    return { experience, images: demoImages(experience), slots: demoSlots(experience), reviews: demoReviews(experience) }
  }
  const { data } = await supabase.from('experiences').select(EXPERIENCE_SELECT).eq('slug', slug).maybeSingle()
  if (!data) return null
  const experience = data as unknown as ExperienceWithRelations
  const today = new Date().toISOString().slice(0, 10)
  const [images, slots, reviews] = await Promise.all([
    supabase.from('experience_images').select('*').eq('experience_id', experience.id).order('sort_order'),
    supabase
      .from('availability_slots')
      .select('*')
      .eq('experience_id', experience.id)
      .eq('is_active', true)
      .gte('date', today)
      .order('date')
      .order('start_time')
      .limit(400),
    supabase
      .from('reviews')
      .select('*')
      .eq('experience_id', experience.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(20),
  ])
  return {
    experience,
    images: (images.data ?? []) as ExperienceImage[],
    slots: (slots.data ?? []) as AvailabilitySlot[],
    reviews: (reviews.data ?? []) as Review[],
  }
}

export async function getCategories(): Promise<(Category & { count: number })[]> {
  const supabase = await db()
  if (!supabase) return withCount(demoCategories, 'category_id')
  const { data } = await supabase.from('categories').select('*, experiences(count)').eq('is_active', true).order('sort_order')
  return (data ?? []).map((c) => ({ ...c, count: (c.experiences as { count: number }[] | null)?.[0]?.count ?? 0 }))
}

export async function getDestinations(): Promise<(Destination & { count: number })[]> {
  const supabase = await db()
  if (!supabase) return withCount(demoDestinations, 'destination_id')
  const { data } = await supabase.from('destinations').select('*, experiences(count)').eq('is_active', true).order('sort_order')
  return (data ?? []).map((d) => ({ ...d, count: (d.experiences as { count: number }[] | null)?.[0]?.count ?? 0 }))
}

export async function getCategory(slug: string) {
  const supabase = await db()
  if (!supabase) return demoCategories.find((c) => c.slug === slug) ?? null
  const { data } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle<Category>()
  return data
}

export async function getDestination(slug: string) {
  const supabase = await db()
  if (!supabase) return demoDestinations.find((d) => d.slug === slug) ?? null
  const { data } = await supabase.from('destinations').select('*').eq('slug', slug).maybeSingle<Destination>()
  return data
}

export async function getHomeContent(): Promise<HomeContent> {
  const supabase = await db()
  if (!supabase) return DEFAULT_HOME
  const { data } = await supabase.from('cms_sections').select('data').eq('key', 'home').maybeSingle()
  return { ...DEFAULT_HOME, ...((data?.data as Partial<HomeContent>) ?? {}) }
}

export async function getCmsSection<T extends object>(key: string, fallback: T): Promise<T> {
  const supabase = await db()
  if (!supabase) return { ...fallback, ...((demoCms[key] as Partial<T>) ?? {}) }
  const { data } = await supabase.from('cms_sections').select('data').eq('key', key).maybeSingle()
  return { ...fallback, ...((data?.data as Partial<T>) ?? {}) }
}

export async function getBanners(placement: Banner['placement']) {
  const supabase = await db()
  if (!supabase) return demoBanners.filter((b) => b.placement === placement)
  const { data } = await supabase.from('banners').select('*').eq('placement', placement).eq('is_active', true).order('sort_order')
  return (data ?? []) as Banner[]
}

export async function getBlogPosts(limit?: number) {
  const supabase = await db()
  if (!supabase) return limit ? demoBlogPosts.slice(0, limit) : demoBlogPosts
  let q = supabase.from('blog_posts').select('*').eq('status', 'published').order('published_at', { ascending: false })
  if (limit) q = q.limit(limit)
  const { data } = await q
  return (data ?? []) as BlogPost[]
}

export async function getBlogPost(slug: string) {
  const supabase = await db()
  if (!supabase) return demoBlogPosts.find((p) => p.slug === slug) ?? null
  const { data } = await supabase.from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle<BlogPost>()
  return data
}

export async function getVendorBySlug(slug: string) {
  const supabase = await db()
  if (!supabase) return demoVendors.find((v) => v.slug === slug) ?? null
  const { data } = await supabase.from('vendors').select('*').eq('slug', slug).eq('status', 'approved').maybeSingle<Vendor>()
  return data
}

export async function getVendorExperiences(vendorId: string) {
  const supabase = await db()
  if (!supabase) return demoExperiences.filter((e) => e.vendor_id === vendorId)
  const { data } = await supabase.from('experiences').select(EXPERIENCE_SELECT).eq('vendor_id', vendorId).eq('status', 'published')
  return (data ?? []) as unknown as ExperienceWithRelations[]
}
