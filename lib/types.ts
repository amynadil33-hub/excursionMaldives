export type Role = 'customer' | 'vendor' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  country: string | null
  role: Role
  created_at: string
}

export interface Vendor {
  id: string
  owner_id: string | null
  business_name: string
  slug: string
  tagline: string | null
  description: string | null
  logo_url: string | null
  cover_url: string | null
  email: string | null
  phone: string | null
  island: string | null
  registration_number: string | null
  status: 'pending' | 'approved' | 'suspended' | 'rejected'
  commission_rate: number
  payout_details: Record<string, string>
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

export interface Destination {
  id: string
  name: string
  slug: string
  atoll: string | null
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

export interface ItineraryStep {
  time?: string
  title: string
  description?: string
}

export interface Experience {
  id: string
  vendor_id: string
  category_id: string | null
  destination_id: string | null
  title: string
  slug: string
  summary: string | null
  description: string | null
  duration_minutes: number
  price: number
  child_price: number | null
  compare_at_price: number | null
  currency: string
  min_guests: number
  max_guests: number
  is_private: boolean
  is_featured: boolean
  status: 'draft' | 'pending' | 'published' | 'archived'
  cover_image: string | null
  highlights: string[]
  inclusions: string[]
  exclusions: string[]
  itinerary: ItineraryStep[]
  pickup_locations: string[]
  meeting_point: string | null
  languages: string[]
  cancellation_policy: string | null
  rating_avg: number
  review_count: number
  created_at: string
}

export interface ExperienceWithRelations extends Experience {
  vendor: Pick<Vendor, 'id' | 'business_name' | 'slug' | 'logo_url' | 'island'> | null
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
  destination: Pick<Destination, 'id' | 'name' | 'slug' | 'atoll'> | null
}

export interface ExperienceImage {
  id: string
  experience_id: string
  url: string
  alt: string | null
  sort_order: number
}

export interface AvailabilitySlot {
  id: string
  experience_id: string
  date: string
  start_time: string
  capacity: number
  booked: number
  price_override: number | null
  is_active: boolean
}

export interface Review {
  id: string
  experience_id: string
  customer_id: string | null
  author_name: string
  rating: number
  title: string | null
  body: string | null
  status: 'published' | 'hidden'
  created_at: string
}

export type OrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'refunded' | 'failed'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface Order {
  id: string
  order_number: string
  customer_id: string
  status: OrderStatus
  subtotal: number
  discount: number
  total: number
  currency: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  notes: string | null
  payment_reference: string | null
  paid_at: string | null
  created_at: string
}

export interface Booking {
  id: string
  order_id: string
  experience_id: string
  vendor_id: string
  slot_id: string
  booking_date: string
  start_time: string
  adults: number
  children: number
  unit_price: number
  child_unit_price: number
  line_total: number
  commission_rate: number
  commission_amount: number
  vendor_earnings: number
  status: BookingStatus
  pickup_location: string | null
  guest_notes: string | null
  created_at: string
}

export interface Payout {
  id: string
  vendor_id: string
  amount: number
  status: 'requested' | 'processing' | 'paid' | 'rejected'
  method: string | null
  reference: string | null
  notes: string | null
  requested_at: string
  processed_at: string | null
}

export interface Promotion {
  id: string
  code: string
  description: string | null
  discount_type: 'percent' | 'fixed'
  value: number
  min_subtotal: number
  max_uses: number | null
  used_count: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
}

export interface Banner {
  id: string
  title: string
  subtitle: string | null
  image_url: string | null
  cta_label: string | null
  cta_href: string | null
  placement: 'home' | 'deals' | 'explore'
  sort_order: number
  is_active: boolean
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_image: string | null
  author: string | null
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
}

export interface HomeHero {
  eyebrow: string
  title: string
  subtitle: string
  image_url: string
}

export interface HomeContent {
  hero: HomeHero
  featured_title: string
  featured_subtitle: string
  categories_title: string
  destinations_title: string
  private_title: string
  private_subtitle: string
  private_image: string
  trust_points: { title: string; body: string }[]
}

export interface CartItem {
  key: string
  slotId: string
  experienceId: string
  slug: string
  title: string
  image: string | null
  vendorName: string
  date: string
  startTime: string
  adults: number
  children: number
  unitPrice: number
  childPrice: number
  isPrivate: boolean
  pickupLocation?: string
}
