import type {
  AvailabilitySlot,
  Banner,
  BlogPost,
  Category,
  Destination,
  ExperienceImage,
  ExperienceWithRelations,
  ItineraryStep,
  Review,
  Vendor,
} from '@/lib/types'

// Read-only showcase catalog used when no database is connected.
// Mirrors supabase/seed.sql so the storefront looks identical before and after connecting.

const CREATED = '2026-01-01T00:00:00.000Z'

export const demoCategories: Category[] = [
  ['Snorkeling', 'snorkeling', 'House reefs, turtle points and coral gardens in crystal-clear water.', 'snorkeling'],
  ['Diving', 'diving', 'Manta cleaning stations, channel dives and wrecks with PADI centres.', 'manta'],
  ['Sandbank Trips', 'sandbank-trips', 'Your own strip of white sand in the middle of the lagoon.', 'sandbank'],
  ['Dolphin Cruises', 'dolphin-cruises', 'Spinner dolphins at golden hour aboard a traditional dhoni.', 'dolphins'],
  ['Fishing', 'fishing', 'Maldivian handline night fishing and big-game trolling.', 'fishing'],
  ['Water Sports', 'water-sports', 'Jet ski, parasailing, kayak and paddleboard.', 'watersports'],
  ['Island Hopping', 'island-hopping', 'Local islands, resort visits and village life.', 'islandhop'],
  ['Sunset Cruises', 'sunset-cruises', 'Catamaran and yacht cruises as the sky turns orange.', 'sunset'],
].map(([name, slug, description, img], i) => ({
  id: `cat-${slug}`,
  name,
  slug,
  description,
  image_url: `/images/${img}.png`,
  sort_order: i + 1,
  is_active: true,
}))

export const demoDestinations: Destination[] = [
  ['Malé', 'male', 'Kaafu (North Malé) Atoll', 'The lively capital and gateway to every excursion.', 'male'],
  ['Maafushi', 'maafushi', 'Kaafu (South Malé) Atoll', 'The original local-island guesthouse hub with a bikini beach.', 'maafushi'],
  ['South Ari Atoll', 'south-ari', 'Alif Dhaal Atoll', 'Year-round whale shark sightings along the outer reef.', 'whaleshark'],
  ['Baa Atoll', 'baa-atoll', 'Baa Atoll', 'UNESCO Biosphere Reserve and home of Hanifaru Bay mantas.', 'baa'],
  ['Thulusdhoo', 'thulusdhoo', 'Kaafu (North Malé) Atoll', 'Surf breaks, Coca-Cola factory and laid-back cafés.', 'thulusdhoo'],
].map(([name, slug, atoll, description, img], i) => ({
  id: `dest-${slug}`,
  name,
  slug,
  atoll,
  description,
  image_url: `/images/${img}.png`,
  sort_order: i + 1,
  is_active: true,
}))

export const demoVendors: Vendor[] = [
  ['Blue Lagoon Adventures', 'blue-lagoon-adventures', 'Snorkel & sandbank specialists', 'Family-run operator from Maafushi running small-group reef trips since 2014.', 'Maafushi', 'hello@bluelagoon.mv', '+960 790 1111', 15, 'sandbank'],
  ['Manta Point Divers', 'manta-point-divers', 'PADI 5-star dive centre', 'Certified instructors and fast dive boats covering North & South Malé atolls.', 'Malé', 'dive@mantapoint.mv', '+960 790 2222', 12, 'manta'],
  ['Dhoni Sunset Co.', 'dhoni-sunset-co', 'Traditional boats, modern comfort', 'Restored wooden dhonis for dolphin, fishing and sunset cruises.', 'Hulhumalé', 'sail@dhonisunset.mv', '+960 790 3333', 15, 'dolphins'],
].map(([business_name, slug, tagline, description, island, email, phone, commission, cover]) => ({
  id: `vendor-${slug}`,
  owner_id: null,
  business_name: business_name as string,
  slug: slug as string,
  tagline: tagline as string,
  description: description as string,
  logo_url: null,
  cover_url: `/images/${cover}.png`,
  email: email as string,
  phone: phone as string,
  island: island as string,
  registration_number: null,
  status: 'approved',
  commission_rate: commission as number,
  payout_details: {},
  created_at: CREATED,
}))

interface Seed {
  vendor: string
  cat: string
  dest: string
  title: string
  slug: string
  summary: string
  description: string
  duration: number
  price: number
  child: number | null
  compare: number | null
  min: number
  max: number
  isPrivate: boolean
  featured: boolean
  img: string
  highlights: string[]
  inclusions: string[]
  exclusions: string[]
  itinerary: ItineraryStep[]
  pickups: string[]
  meeting: string
  rating: number
  reviews: number
}

const seeds: Seed[] = [
  {
    vendor: 'blue-lagoon-adventures', cat: 'snorkeling', dest: 'maafushi',
    title: 'Turtle Reef & Coral Garden Snorkel', slug: 'turtle-reef-coral-garden-snorkel',
    summary: 'Two reef stops with green turtles, reef sharks and a rainbow of coral.',
    description: "Join a small group on a speedboat to two of South Malé's best snorkel spots. Our guides brief you on reef etiquette and swim with you the whole way.",
    duration: 180, price: 45, child: 30, compare: 60, min: 1, max: 12, isPrivate: false, featured: true, img: 'snorkeling',
    highlights: ['Swim with green turtles', 'Two reef sites', 'Small groups of 12 max'],
    inclusions: ['Mask, snorkel & fins', 'Life jackets', 'Drinking water & towels', 'Guide'],
    exclusions: ['Underwater photos', 'Hotel transfers outside Maafushi'],
    itinerary: [
      { time: '09:00', title: 'Jetty pickup', description: 'Meet at Maafushi harbour' },
      { time: '09:30', title: 'Turtle Point', description: 'First snorkel stop' },
      { time: '10:45', title: 'Coral Garden', description: 'Second snorkel stop' },
      { time: '12:00', title: 'Return' },
    ],
    pickups: ['Maafushi harbour', 'Guraidhoo jetty'], meeting: 'Maafushi harbour, blue kiosk', rating: 4.9, reviews: 214,
  },
  {
    vendor: 'blue-lagoon-adventures', cat: 'sandbank-trips', dest: 'maafushi',
    title: 'Private Sandbank Picnic', slug: 'private-sandbank-picnic',
    summary: 'Your own sandbank with parasol, picnic lunch and snorkel gear.',
    description: 'We take you to a quiet sandbank, set up shade and a picnic, then leave you to enjoy the lagoon. Price is for the whole boat (up to 6 guests).',
    duration: 240, price: 220, child: null, compare: null, min: 1, max: 6, isPrivate: true, featured: true, img: 'sandbank',
    highlights: ['Exclusive sandbank', 'Picnic lunch', 'Snorkel gear included'],
    inclusions: ['Speedboat transfer', 'Parasol & mats', 'Picnic lunch & drinks', 'Snorkel gear'],
    exclusions: ['Alcoholic drinks'],
    itinerary: [
      { time: '10:00', title: 'Depart Maafushi' },
      { time: '10:20', title: 'Arrive sandbank', description: 'Set-up and free time' },
      { time: '12:30', title: 'Picnic lunch' },
      { time: '14:00', title: 'Return' },
    ],
    pickups: ['Maafushi harbour'], meeting: 'Maafushi harbour', rating: 5, reviews: 98,
  },
  {
    vendor: 'manta-point-divers', cat: 'diving', dest: 'male',
    title: 'Manta Cleaning Station Dive', slug: 'manta-cleaning-station-dive',
    summary: 'Watch reef mantas glide over a cleaning station at 15m.',
    description: 'A morning two-tank dive for certified divers. First tank at a manta cleaning station, second at a vibrant thila.',
    duration: 300, price: 155, child: null, compare: null, min: 1, max: 8, isPrivate: false, featured: true, img: 'manta',
    highlights: ['Two-tank dive', 'Manta rays', 'PADI instructors'],
    inclusions: ['Tanks & weights', 'Dive guide', 'Refreshments'],
    exclusions: ['Equipment rental ($25)', 'Certification'],
    itinerary: [
      { time: '07:30', title: 'Briefing at dive centre' },
      { time: '08:30', title: 'Dive 1: Manta Point' },
      { time: '10:30', title: 'Dive 2: Thila' },
      { time: '12:30', title: 'Return to Malé' },
    ],
    pickups: ['Malé dive centre', 'Hulhumalé jetty'], meeting: 'Manta Point Divers, Boduthakurufaanu Magu', rating: 4.8, reviews: 156,
  },
  {
    vendor: 'manta-point-divers', cat: 'snorkeling', dest: 'south-ari',
    title: 'Whale Shark Safari — South Ari', slug: 'whale-shark-safari-south-ari',
    summary: 'Full-day search for the gentle giants of South Ari Atoll.',
    description: "Speedboat transfer to South Ari's marine protected area where whale sharks feed year-round. Includes lunch on a local island.",
    duration: 480, price: 190, child: 140, compare: 230, min: 2, max: 14, isPrivate: false, featured: true, img: 'whaleshark',
    highlights: ['Whale sharks year-round', 'Lunch on Dhigurah', 'Marine biologist guide'],
    inclusions: ['Speedboat', 'Snorkel gear', 'Lunch', 'Guide'],
    exclusions: ['Marine park fee ($10)'],
    itinerary: [
      { time: '07:00', title: 'Depart Malé' },
      { time: '09:00', title: 'Whale shark search' },
      { time: '12:30', title: 'Lunch on Dhigurah' },
      { time: '15:00', title: 'Return' },
    ],
    pickups: ['Malé jetty', 'Maafushi harbour'], meeting: 'Malé Jetty 3', rating: 4.9, reviews: 302,
  },
  {
    vendor: 'dhoni-sunset-co', cat: 'dolphin-cruises', dest: 'male',
    title: 'Sunset Dolphin Dhoni Cruise', slug: 'sunset-dolphin-dhoni-cruise',
    summary: 'Spinner dolphins and golden-hour views from a traditional dhoni.',
    description: 'Board our restored wooden dhoni for a relaxed evening cruise to the dolphin channel, with tea and short eats on deck.',
    duration: 120, price: 40, child: 25, compare: null, min: 1, max: 20, isPrivate: false, featured: false, img: 'dolphins',
    highlights: ['Spinner dolphins', 'Traditional dhoni', 'Sunset views'],
    inclusions: ['Tea & short eats', 'Life jackets'],
    exclusions: ['Hotel transfers'],
    itinerary: [
      { time: '16:30', title: 'Board at Hulhumalé' },
      { time: '17:00', title: 'Dolphin channel' },
      { time: '18:00', title: 'Sunset on deck' },
      { time: '18:30', title: 'Return' },
    ],
    pickups: ['Hulhumalé ferry terminal', 'Malé jetty'], meeting: 'Hulhumalé ferry terminal', rating: 4.7, reviews: 187,
  },
  {
    vendor: 'dhoni-sunset-co', cat: 'fishing', dest: 'male',
    title: 'Traditional Night Fishing', slug: 'traditional-night-fishing',
    summary: 'Learn Maldivian handline fishing under the stars and grill your catch.',
    description: 'Fish the old way with handlines from our dhoni. Your catch is grilled on board.',
    duration: 180, price: 50, child: 35, compare: 65, min: 2, max: 16, isPrivate: false, featured: false, img: 'fishing',
    highlights: ['Handline fishing', 'BBQ your catch', 'Under the stars'],
    inclusions: ['Fishing gear & bait', 'BBQ', 'Soft drinks'],
    exclusions: ['Hotel transfers'],
    itinerary: [
      { time: '18:00', title: 'Board' },
      { time: '18:45', title: 'Fishing' },
      { time: '20:15', title: 'Grill & dinner' },
      { time: '21:00', title: 'Return' },
    ],
    pickups: ['Hulhumalé ferry terminal'], meeting: 'Hulhumalé ferry terminal', rating: 4.6, reviews: 74,
  },
  {
    vendor: 'dhoni-sunset-co', cat: 'sunset-cruises', dest: 'baa-atoll',
    title: 'Catamaran Sunset Sail', slug: 'catamaran-sunset-sail',
    summary: "Sail Baa Atoll's lagoons with mocktails as the sun sets.",
    description: 'A two-hour catamaran sail through the UNESCO biosphere reserve at golden hour.',
    duration: 150, price: 85, child: 55, compare: null, min: 1, max: 18, isPrivate: false, featured: false, img: 'sunset',
    highlights: ['Catamaran sail', 'UNESCO reserve', 'Mocktails & canapés'],
    inclusions: ['Mocktails', 'Canapés', 'Crew'],
    exclusions: ['Transfers'],
    itinerary: [
      { time: '17:00', title: 'Board' },
      { time: '17:30', title: 'Sail' },
      { time: '18:30', title: 'Sunset' },
      { time: '19:30', title: 'Return' },
    ],
    pickups: ['Resort jetty pickup on request'], meeting: 'Dharavandhoo harbour', rating: 4.8, reviews: 63,
  },
  {
    vendor: 'blue-lagoon-adventures', cat: 'island-hopping', dest: 'maafushi',
    title: 'Local Island Hopping Day', slug: 'local-island-hopping-day',
    summary: 'Three islands, one day: village life, a resort lunch and a sandbank swim.',
    description: 'Visit a fishing village, enjoy lunch at a resort and finish with a swim on a sandbank.',
    duration: 420, price: 95, child: 65, compare: null, min: 2, max: 14, isPrivate: false, featured: false, img: 'islandhop',
    highlights: ['3 islands', 'Resort lunch', 'Sandbank stop'],
    inclusions: ['Speedboat', 'Lunch', 'Guide'],
    exclusions: ['Resort day-pass extras'],
    itinerary: [
      { time: '09:00', title: 'Depart' },
      { time: '09:45', title: 'Village visit' },
      { time: '12:00', title: 'Resort lunch' },
      { time: '14:30', title: 'Sandbank' },
      { time: '16:00', title: 'Return' },
    ],
    pickups: ['Maafushi harbour'], meeting: 'Maafushi harbour', rating: 4.7, reviews: 121,
  },
  {
    vendor: 'blue-lagoon-adventures', cat: 'water-sports', dest: 'maafushi',
    title: 'Jet Ski Lagoon Tour', slug: 'jet-ski-lagoon-tour',
    summary: 'A guided 45-minute jet ski run across turquoise lagoons.',
    description: 'Ride a Yamaha jet ski behind our guide to nearby sandbanks and resort reefs. One or two riders per ski.',
    duration: 45, price: 120, child: null, compare: 140, min: 1, max: 2, isPrivate: false, featured: false, img: 'watersports',
    highlights: ['Guided ride', 'Sandbank stops'],
    inclusions: ['Jet ski & fuel', 'Life jacket', 'Briefing'],
    exclusions: ['Photos'],
    itinerary: [],
    pickups: ['Maafushi water sports hut'], meeting: 'Maafushi bikini beach', rating: 4.5, reviews: 48,
  },
  {
    vendor: 'dhoni-sunset-co', cat: 'sunset-cruises', dest: 'male',
    title: 'Private Yacht Charter (Half Day)', slug: 'private-yacht-charter-half-day',
    summary: 'Charter a luxury yacht with crew for up to 10 guests.',
    description: 'Tailor the route with our captain: snorkel stops, sandbanks or a quiet anchorage. Price is per charter.',
    duration: 240, price: 1450, child: null, compare: null, min: 1, max: 10, isPrivate: true, featured: true, img: 'yacht',
    highlights: ['Private yacht & crew', 'Custom route', 'Snorkel stop'],
    inclusions: ['Captain & crew', 'Soft drinks & fruit', 'Snorkel gear'],
    exclusions: ['Catering upgrades'],
    itinerary: [],
    pickups: ['Malé marina', 'Hulhumalé marina', 'Resort jetty'], meeting: 'Malé marina', rating: 5, reviews: 37,
  },
]

const bySlug = <T extends { slug: string }>(list: T[], slug: string) => list.find((x) => x.slug === slug)!

export const demoExperiences: ExperienceWithRelations[] = seeds.map((s, i) => {
  const vendor = bySlug(demoVendors, s.vendor)
  const category = bySlug(demoCategories, s.cat)
  const destination = bySlug(demoDestinations, s.dest)
  return {
    id: `exp-${s.slug}`,
    vendor_id: vendor.id,
    category_id: category.id,
    destination_id: destination.id,
    title: s.title,
    slug: s.slug,
    summary: s.summary,
    description: s.description,
    duration_minutes: s.duration,
    price: s.price,
    child_price: s.child,
    compare_at_price: s.compare,
    currency: 'USD',
    min_guests: s.min,
    max_guests: s.max,
    is_private: s.isPrivate,
    is_featured: s.featured,
    status: 'published',
    cover_image: `/images/${s.img}.png`,
    highlights: s.highlights,
    inclusions: s.inclusions,
    exclusions: s.exclusions,
    itinerary: s.itinerary,
    pickup_locations: s.pickups,
    meeting_point: s.meeting,
    languages: ['English'],
    cancellation_policy: 'Free cancellation up to 24 hours before the start time.',
    rating_avg: s.rating,
    review_count: s.reviews,
    created_at: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
    vendor: { id: vendor.id, business_name: vendor.business_name, slug: vendor.slug, logo_url: vendor.logo_url, island: vendor.island },
    category: { id: category.id, name: category.name, slug: category.slug },
    destination: { id: destination.id, name: destination.name, slug: destination.slug, atoll: destination.atoll },
  }
})

export function demoImages(exp: ExperienceWithRelations): ExperienceImage[] {
  const extra = exp.destination?.slug === 'maafushi' ? '/images/maafushi.png' : '/images/islandhop.png'
  return [exp.cover_image ?? '/images/hero.png', '/images/hero.png', '/images/sandbank.png', extra].map((url, i) => ({
    id: `${exp.id}-img-${i}`,
    experience_id: exp.id,
    url,
    alt: exp.title,
    sort_order: i,
  }))
}

export function demoSlots(exp: ExperienceWithRelations, days = 60): AvailabilitySlot[] {
  const start = exp.itinerary[0]?.time ?? '09:00'
  const today = new Date()
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i + 1))
    const date = d.toISOString().slice(0, 10)
    return {
      id: `${exp.id}-${date}`,
      experience_id: exp.id,
      date,
      start_time: `${start}:00`,
      capacity: exp.is_private ? 1 : exp.max_guests,
      booked: 0,
      price_override: null,
      is_active: true,
    }
  })
}

const reviewSeeds = [
  ['Sophie L.', 5, 'Unforgettable', 'Crew were warm and safety-first. We saw so much marine life!'],
  ['Ahmed R.', 5, 'Worth every dollar', 'Well organised, on time, and the guide knew every reef.'],
  ['Marco B.', 4, 'Great day out', 'Beautiful spots. Bring reef-safe sunscreen.'],
] as const

export function demoReviews(exp: ExperienceWithRelations): Review[] {
  return reviewSeeds.map(([author_name, rating, title, body], i) => ({
    id: `${exp.id}-rev-${i}`,
    experience_id: exp.id,
    customer_id: null,
    author_name,
    rating,
    title,
    body,
    status: 'published',
    created_at: new Date(Date.UTC(2026, 8, 20 - i * 6)).toISOString(),
  }))
}

export const demoBanners: Banner[] = [
  {
    id: 'banner-home', title: 'Monsoon deals on whale shark safaris', subtitle: 'Save up to 20% on South Ari trips this season.',
    image_url: '/images/whaleshark.png', cta_label: 'See deals', cta_href: '/deals', placement: 'home', sort_order: 1, is_active: true,
  },
  {
    id: 'banner-deals', title: '10% off your first booking', subtitle: 'Use code LAGOON10 at checkout.',
    image_url: '/images/sunset.png', cta_label: 'Explore experiences', cta_href: '/experiences', placement: 'deals', sort_order: 1, is_active: true,
  },
]

export const demoBlogPosts: BlogPost[] = [
  {
    id: 'post-local-islands', title: "A first-timer's guide to local islands", slug: 'first-timers-guide-local-islands',
    excerpt: 'Guesthouses, bikini beaches and etiquette for visiting local islands.',
    content: 'Local islands like Maafushi and Thulusdhoo offer an authentic, affordable Maldives...\n\nDress modestly in the village, swim at designated bikini beaches, and try mas huni for breakfast.',
    cover_image: '/images/maafushi.png', author: 'Excursion Maldives', status: 'published',
    published_at: '2026-10-22T08:00:00.000Z', created_at: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'post-whale-sharks', title: 'When to see whale sharks in the Maldives', slug: 'when-to-see-whale-sharks',
    excerpt: 'South Ari is the year-round hotspot. Here is how to plan your trip.',
    content: 'Whale sharks can be seen year-round in South Ari Atoll, with the best visibility between November and April...\n\nBook with a licensed operator, keep 3 metres distance, and never touch the animal.',
    cover_image: '/images/whaleshark.png', author: 'Excursion Maldives', status: 'published',
    published_at: '2026-10-15T08:00:00.000Z', created_at: '2026-10-15T08:00:00.000Z',
  },
]

export const demoCms: Record<string, object> = {
  about: {
    title: 'Made in the Maldives',
    body: 'Excursion Maldives connects travellers with licensed local operators across the atolls. We started on Maafushi with a single speedboat and now partner with dozens of island businesses — every booking keeps money in local communities.',
    image_url: '/images/culture.png',
  },
}
