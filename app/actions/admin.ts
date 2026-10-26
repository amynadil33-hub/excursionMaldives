'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { slugify } from '@/lib/format'
import { parseListing, text, num } from '@/lib/listing-form'
import type { FormState } from './public'

async function admin() {
  const { user, profile } = await getSession()
  if (!user || profile?.role !== 'admin') return null
  return createClient()
}

const NOT_ALLOWED: FormState = { error: 'Admin access required.' }
const UUID = /^[0-9a-f-]{36}$/i

function done(paths: string[], message = 'Saved.'): FormState {
  paths.forEach((p) => revalidatePath(p))
  return { ok: true, message }
}

function boolField(fd: FormData, key: string) {
  return fd.get(key) === 'on'
}

function dateOrNull(fd: FormData, key: string) {
  const v = String(fd.get(key) ?? '').trim()
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

// ---------- Generic row operations (whitelisted tables only) ----------
const DELETABLE = ['promotions', 'categories', 'destinations', 'banners', 'blog_posts', 'reviews', 'contact_messages'] as const
const TOGGLEABLE = ['promotions', 'categories', 'destinations', 'banners'] as const

export async function deleteRow(table: (typeof DELETABLE)[number], id: string): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  if (!DELETABLE.includes(table) || !UUID.test(id)) return { error: 'Invalid request.' }
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) return { error: error.code === '23503' ? 'This item is in use and cannot be deleted. Deactivate it instead.' : 'Could not delete.' }
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Deleted.' }
}

export async function toggleActive(table: (typeof TOGGLEABLE)[number], id: string, value: boolean): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  if (!TOGGLEABLE.includes(table) || !UUID.test(id)) return { error: 'Invalid request.' }
  const { error } = await supabase.from(table).update({ is_active: value }).eq('id', id)
  if (error) return { error: 'Could not update.' }
  revalidatePath('/', 'layout')
  return { ok: true }
}

// ---------- Vendors ----------
const VENDOR_STATUSES = ['pending', 'approved', 'suspended', 'rejected']

export async function setVendorStatus(id: string, status: string): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  if (!VENDOR_STATUSES.includes(status)) return { error: 'Invalid status.' }
  const { error } = await supabase.from('vendors').update({ status }).eq('id', id)
  if (error) return { error: 'Could not update vendor.' }
  if (status !== 'approved') {
    await supabase.from('experiences').update({ status: 'draft' }).eq('vendor_id', id).eq('status', 'published')
  }
  return done(['/admin/vendors', `/admin/vendors/${id}`, '/experiences'], 'Vendor updated.')
}

export async function setVendorCommission(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const rate = num(fd, 'commission_rate')
  if (rate === null || Number.isNaN(rate) || rate < 0 || rate > 100) return { error: 'Commission must be between 0 and 100.' }
  const { error } = await supabase.from('vendors').update({ commission_rate: Math.round(rate * 100) / 100 }).eq('id', id)
  if (error) return { error: 'Could not update commission.' }
  return done([`/admin/vendors/${id}`, '/admin/vendors'], 'Commission updated. New bookings will use this rate.')
}

export async function addLedgerAdjustment(vendorId: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const amount = num(fd, 'amount')
  const description = text(fd, 'description', 200)
  if (amount === null || Number.isNaN(amount) || amount === 0 || Math.abs(amount) > 100000) return { error: 'Enter a non-zero amount.' }
  if (!description) return { error: 'Add a short description.' }
  const { error } = await supabase
    .from('vendor_ledger')
    .insert({ vendor_id: vendorId, type: 'adjustment', amount: Math.round(amount * 100) / 100, description })
  if (error) return { error: 'Could not add adjustment.' }
  return done([`/admin/vendors/${vendorId}`], 'Adjustment recorded.')
}

// ---------- Listings ----------
const LISTING_STATUSES = ['draft', 'pending', 'published', 'archived']

export async function setListingStatus(id: string, status: string): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  if (!LISTING_STATUSES.includes(status)) return { error: 'Invalid status.' }
  const { error } = await supabase.from('experiences').update({ status }).eq('id', id)
  if (error) return { error: 'Could not update listing.' }
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Listing updated.' }
}

export async function setListingFeatured(id: string, featured: boolean): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const { error } = await supabase.from('experiences').update({ is_featured: featured }).eq('id', id)
  if (error) return { error: 'Could not update listing.' }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function adminSaveListing(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const parsed = parseListing(fd)
  if ('error' in parsed) return { error: parsed.error }
  const { error } = await supabase
    .from('experiences')
    .update({ ...parsed.data, status: 'published', is_featured: boolField(fd, 'is_featured') })
    .eq('id', id)
  if (error) return { error: 'Could not save listing.' }
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Listing saved and published.' }
}

// ---------- Bookings & orders ----------
const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'no_show']

export async function adminSetBookingStatus(id: string, status: string): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  if (!BOOKING_STATUSES.includes(status)) return { error: 'Invalid status.' }
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id).neq('status', 'cancelled')
  if (error) return { error: 'Could not update booking.' }
  return done(['/admin/bookings'], 'Booking updated.')
}

export async function adminCancelOrder(id: string): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const { error } = await supabase.rpc('cancel_order', { p_order_id: id })
  if (error) return { error: error.message.includes('Only unpaid') ? 'Only unpaid orders can be cancelled. Use refund for paid orders.' : 'Could not cancel.' }
  return done(['/admin/orders', `/admin/orders/${id}`, '/admin/bookings'], 'Order cancelled and seats released.')
}

/**
 * Records a refund that was issued manually in the BML merchant portal.
 * Reverses vendor earnings and releases seats; it does not move money itself.
 */
export async function adminRecordRefund(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const reference = text(fd, 'reference', 120)
  if (!reference) return { error: 'Enter the BML refund reference.' }

  const { data: order } = await supabase.from('orders').select('id, status, order_number').eq('id', id).maybeSingle()
  if (!order) return { error: 'Order not found.' }
  if (order.status !== 'paid') return { error: 'Only paid orders can be refunded.' }

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, vendor_id, slot_id, adults, children, vendor_earnings, status')
    .eq('order_id', id)

  for (const b of bookings ?? []) {
    if (b.status === 'cancelled') continue
    await supabase.from('vendor_ledger').insert({
      vendor_id: b.vendor_id,
      booking_id: b.id,
      type: 'refund',
      amount: -Number(b.vendor_earnings),
      description: `Refund ${order.order_number}`,
    })
    if (b.slot_id) {
      const { data: slot } = await supabase.from('availability_slots').select('booked').eq('id', b.slot_id).maybeSingle()
      if (slot) {
        await supabase
          .from('availability_slots')
          .update({ booked: Math.max(slot.booked - (b.adults + b.children), 0) })
          .eq('id', b.slot_id)
      }
    }
  }
  await supabase.from('bookings').update({ status: 'cancelled' }).eq('order_id', id)
  const { error } = await supabase.from('orders').update({ status: 'refunded', notes: `Refunded · BML ref ${reference}` }).eq('id', id)
  if (error) return { error: 'Could not record refund.' }
  await supabase.from('payments').update({ status: 'refunded' }).eq('order_id', id).eq('status', 'confirmed')
  return done(['/admin/orders', `/admin/orders/${id}`, '/admin/bookings', '/admin/payouts'], 'Refund recorded and vendor earnings reversed.')
}

// ---------- Users ----------
export async function setUserRole(id: string, role: string): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  if (!['customer', 'vendor', 'admin'].includes(role)) return { error: 'Invalid role.' }
  const { user } = await getSession()
  if (user?.id === id && role !== 'admin') return { error: 'You cannot remove your own admin access.' }
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) return { error: 'Could not update role.' }
  return done(['/admin/customers'], 'Role updated.')
}

// ---------- Payouts ----------
export async function adminMarkPayoutPaid(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const reference = text(fd, 'reference', 120)
  if (!reference) return { error: 'Enter the bank transfer reference.' }
  const { error } = await supabase.rpc('mark_payout_paid', { p_payout_id: id, p_reference: reference })
  if (error) return { error: 'Could not mark payout as paid.' }
  return done(['/admin/payouts'], 'Payout marked as paid.')
}

export async function adminSetPayoutStatus(id: string, status: 'processing' | 'rejected'): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  if (!['processing', 'rejected'].includes(status)) return { error: 'Invalid status.' }
  const { error } = await supabase.from('payouts').update({ status }).eq('id', id).in('status', ['requested', 'processing'])
  if (error) return { error: 'Could not update payout.' }
  return done(['/admin/payouts'], 'Payout updated.')
}

// ---------- Promotions ----------
export async function savePromotion(id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const code = text(fd, 'code', 40)?.toUpperCase().replace(/[^A-Z0-9_-]/g, '')
  if (!code || code.length < 3) return { error: 'Code must be at least 3 letters or numbers.' }
  const discount_type = fd.get('discount_type') === 'fixed' ? 'fixed' : 'percent'
  const value = num(fd, 'value')
  if (value === null || Number.isNaN(value) || value <= 0 || (discount_type === 'percent' && value > 100))
    return { error: 'Enter a valid discount value.' }
  const min = num(fd, 'min_subtotal') ?? 0
  const maxUses = num(fd, 'max_uses')
  if (Number.isNaN(min) || min < 0) return { error: 'Minimum spend is invalid.' }
  if (maxUses !== null && (Number.isNaN(maxUses) || !Number.isInteger(maxUses) || maxUses < 1)) return { error: 'Max uses must be a whole number.' }

  const row = {
    code,
    description: text(fd, 'description', 200),
    discount_type,
    value,
    min_subtotal: min,
    max_uses: maxUses,
    starts_at: dateOrNull(fd, 'starts_at'),
    ends_at: dateOrNull(fd, 'ends_at'),
    is_active: boolField(fd, 'is_active'),
  }
  const { error } = id ? await supabase.from('promotions').update(row).eq('id', id) : await supabase.from('promotions').insert(row)
  if (error) return { error: error.code === '23505' ? 'That code already exists.' : 'Could not save promotion.' }
  return done(['/admin/promotions', '/deals'], id ? 'Promotion updated.' : 'Promotion created.')
}

// ---------- Categories & destinations ----------
export async function saveCategory(id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const name = text(fd, 'name', 80)
  if (!name) return { error: 'Name is required.' }
  const row = {
    name,
    slug: slugify(text(fd, 'slug', 80) ?? name),
    description: text(fd, 'description', 400),
    image_url: text(fd, 'image_url', 1000),
    sort_order: Math.trunc(num(fd, 'sort_order') ?? 0) || 0,
    is_active: boolField(fd, 'is_active'),
  }
  const { error } = id ? await supabase.from('categories').update(row).eq('id', id) : await supabase.from('categories').insert(row)
  if (error) return { error: error.code === '23505' ? 'That slug is already used.' : 'Could not save category.' }
  revalidatePath('/', 'layout')
  return { ok: true, message: id ? 'Category updated.' : 'Category created.' }
}

export async function saveDestination(id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const name = text(fd, 'name', 80)
  if (!name) return { error: 'Name is required.' }
  const row = {
    name,
    slug: slugify(text(fd, 'slug', 80) ?? name),
    atoll: text(fd, 'atoll', 80),
    description: text(fd, 'description', 400),
    image_url: text(fd, 'image_url', 1000),
    sort_order: Math.trunc(num(fd, 'sort_order') ?? 0) || 0,
    is_active: boolField(fd, 'is_active'),
  }
  const { error } = id ? await supabase.from('destinations').update(row).eq('id', id) : await supabase.from('destinations').insert(row)
  if (error) return { error: error.code === '23505' ? 'That slug is already used.' : 'Could not save destination.' }
  revalidatePath('/', 'layout')
  return { ok: true, message: id ? 'Destination updated.' : 'Destination created.' }
}

// ---------- Reviews ----------
export async function setReviewStatus(id: string, status: 'published' | 'hidden'): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  if (!['published', 'hidden'].includes(status)) return { error: 'Invalid status.' }
  const { error } = await supabase.from('reviews').update({ status }).eq('id', id)
  if (error) return { error: 'Could not update review.' }
  revalidatePath('/', 'layout')
  return { ok: true }
}

// ---------- Content: banners, blog, CMS, settings ----------
export async function saveBanner(id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const title = text(fd, 'title', 120)
  if (!title) return { error: 'Title is required.' }
  const placement = String(fd.get('placement'))
  const href = text(fd, 'cta_href', 300)
  if (href && !href.startsWith('/') && !/^https:\/\//.test(href)) return { error: 'Link must start with / or https://' }
  const row = {
    title,
    subtitle: text(fd, 'subtitle', 300),
    image_url: text(fd, 'image_url', 1000),
    cta_label: text(fd, 'cta_label', 40),
    cta_href: href,
    placement: ['home', 'deals', 'explore'].includes(placement) ? placement : 'home',
    sort_order: Math.trunc(num(fd, 'sort_order') ?? 0) || 0,
    is_active: boolField(fd, 'is_active'),
  }
  const { error } = id ? await supabase.from('banners').update(row).eq('id', id) : await supabase.from('banners').insert(row)
  if (error) return { error: 'Could not save banner.' }
  revalidatePath('/', 'layout')
  return { ok: true, message: id ? 'Banner updated.' : 'Banner created.' }
}

export async function saveBlogPost(id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const title = text(fd, 'title', 160)
  if (!title) return { error: 'Title is required.' }
  const status = fd.get('status') === 'published' ? 'published' : 'draft'
  const row: Record<string, unknown> = {
    title,
    slug: slugify(text(fd, 'slug', 160) ?? title),
    excerpt: text(fd, 'excerpt', 400),
    content: text(fd, 'content', 50000),
    cover_image: text(fd, 'cover_image', 1000),
    author: text(fd, 'author', 80) ?? 'Excursion Maldives',
    status,
  }
  if (status === 'published') {
    const { data: existing } = id ? await supabase.from('blog_posts').select('published_at').eq('id', id).maybeSingle() : { data: null }
    row.published_at = existing?.published_at ?? new Date().toISOString()
  }
  const result = id
    ? await supabase.from('blog_posts').update(row).eq('id', id).select('id').single()
    : await supabase.from('blog_posts').insert(row).select('id').single()
  if (result.error) return { error: result.error.code === '23505' ? 'That slug is already used.' : 'Could not save post.' }
  revalidatePath('/blog', 'layout')
  revalidatePath('/admin/blog')
  if (!id) redirect(`/admin/blog/${result.data.id}`)
  return { ok: true, message: 'Post saved.' }
}

function lines(fd: FormData, key: string, max: number) {
  return String(fd.get(key) ?? '').slice(0, max).trim()
}

export async function saveHomeContent(_: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const trust_points = [0, 1, 2]
    .map((i) => ({ title: lines(fd, `trust_${i}_title`, 60), body: lines(fd, `trust_${i}_body`, 200) }))
    .filter((t) => t.title)
  const data = {
    hero: {
      eyebrow: lines(fd, 'hero_eyebrow', 80),
      title: lines(fd, 'hero_title', 120),
      subtitle: lines(fd, 'hero_subtitle', 300),
      image_url: lines(fd, 'hero_image', 1000),
    },
    featured_title: lines(fd, 'featured_title', 100),
    featured_subtitle: lines(fd, 'featured_subtitle', 200),
    categories_title: lines(fd, 'categories_title', 100),
    destinations_title: lines(fd, 'destinations_title', 100),
    private_title: lines(fd, 'private_title', 100),
    private_subtitle: lines(fd, 'private_subtitle', 300),
    private_image: lines(fd, 'private_image', 1000),
    trust_points,
  }
  if (!data.hero.title) return { error: 'Hero title is required.' }
  const { error } = await supabase.from('cms_sections').upsert({ key: 'home', data, updated_at: new Date().toISOString() })
  if (error) return { error: 'Could not save homepage.' }
  revalidatePath('/')
  return { ok: true, message: 'Homepage updated.' }
}

export async function saveAboutContent(_: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const data = {
    title: lines(fd, 'title', 120),
    intro: lines(fd, 'intro', 600),
    body: lines(fd, 'body', 4000),
    image_url: lines(fd, 'image_url', 1000),
  }
  if (!data.title) return { error: 'Title is required.' }
  const { error } = await supabase.from('cms_sections').upsert({ key: 'about', data, updated_at: new Date().toISOString() })
  if (error) return { error: 'Could not save About page.' }
  revalidatePath('/about')
  return { ok: true, message: 'About page updated.' }
}

export async function saveContactContent(_: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const data = {
    email: lines(fd, 'email', 120),
    phone: lines(fd, 'phone', 40),
    whatsapp: lines(fd, 'whatsapp', 40),
    address: lines(fd, 'address', 200),
    hours: lines(fd, 'hours', 120),
  }
  const { error } = await supabase.from('cms_sections').upsert({ key: 'contact', data, updated_at: new Date().toISOString() })
  if (error) return { error: 'Could not save contact details.' }
  revalidatePath('/contact')
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Contact details updated.' }
}

export async function saveMarketplaceSettings(_: FormState, fd: FormData): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const commission = num(fd, 'default_commission')
  if (commission === null || Number.isNaN(commission) || commission < 0 || commission > 100)
    return { error: 'Default commission must be between 0 and 100.' }
  const value = {
    site_name: lines(fd, 'site_name', 80) || 'Excursion Maldives',
    default_commission: commission,
    currency: 'USD',
    support_email: lines(fd, 'support_email', 120),
    support_phone: lines(fd, 'support_phone', 40),
    whatsapp: lines(fd, 'whatsapp', 40),
    address: lines(fd, 'address', 200),
  }
  const { error } = await supabase.from('settings').upsert({ key: 'marketplace', value, updated_at: new Date().toISOString() })
  if (error) return { error: 'Could not save settings.' }
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Settings saved.' }
}

// ---------- Inbox ----------
export async function setMessageRead(id: string, read: boolean): Promise<FormState> {
  const supabase = await admin()
  if (!supabase) return NOT_ALLOWED
  const { error } = await supabase.from('contact_messages').update({ is_read: read }).eq('id', id)
  if (error) return { error: 'Could not update message.' }
  return done(['/admin/messages'])
}
