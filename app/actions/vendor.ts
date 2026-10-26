'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyVendor, getSession } from '@/lib/auth'
import { slugify } from '@/lib/format'
import { parseListing, text, num } from '@/lib/listing-form'
import type { FormState } from './public'

const SAFE_DB_ERRORS = [
  'Amount exceeds available balance',
  'Approved vendor account required',
  'Invalid amount',
  'Capacity cannot be lower',
  'has bookings and cannot be deleted',
  'Vendors cannot set booking status',
  'Cancelled bookings cannot be reopened',
]

function dbMessage(message: string | undefined, fallback: string) {
  if (message && SAFE_DB_ERRORS.some((m) => message.includes(m))) return message
  return fallback
}

async function approvedVendor() {
  const vendor = await getMyVendor()
  if (!vendor || vendor.status !== 'approved') return null
  return vendor
}

export async function saveVendorProfile(_: FormState, fd: FormData): Promise<FormState> {
  const { user } = await getSession()
  if (!user) return { error: 'Please sign in first.' }

  const business_name = text(fd, 'business_name', 120)
  if (!business_name || business_name.length < 2) return { error: 'Business name is required.' }
  const email = text(fd, 'email', 200)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid business email.' }

  const payload = {
    business_name,
    tagline: text(fd, 'tagline', 160),
    description: text(fd, 'description', 4000),
    email,
    phone: text(fd, 'phone', 40),
    island: text(fd, 'island', 80),
    registration_number: text(fd, 'registration_number', 80),
    logo_url: text(fd, 'logo_url', 1000),
    cover_url: text(fd, 'cover_url', 1000),
    payout_details: {
      bank_name: text(fd, 'bank_name', 80) ?? '',
      account_name: text(fd, 'account_name', 120) ?? '',
      account_number: text(fd, 'account_number', 40) ?? '',
    },
  }

  const supabase = await createClient()
  const existing = await getMyVendor()
  if (existing) {
    const { error } = await supabase.from('vendors').update(payload).eq('id', existing.id)
    if (error) return { error: 'Could not save your profile. Please try again.' }
    revalidatePath('/vendor', 'layout')
    revalidatePath(`/vendors/${existing.slug}`)
    return { ok: true, message: 'Business profile saved.' }
  }

  const slug = `${slugify(business_name)}-${crypto.randomUUID().slice(0, 4)}`
  const { error } = await supabase.from('vendors').insert({ ...payload, slug, owner_id: user.id })
  if (error) return { error: 'Could not submit your application. Please try again.' }
  revalidatePath('/vendor', 'layout')
  return { ok: true, message: 'Application received. Our team will review it within 1–2 business days.' }
}

export async function saveListing(listingId: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const vendor = await approvedVendor()
  if (!vendor) return { error: 'Your vendor account is not approved yet.' }

  const parsed = parseListing(fd)
  if ('error' in parsed) return { error: parsed.error }
  const intent = fd.get('intent') === 'draft' ? 'draft' : 'published'
  const supabase = await createClient()

  if (listingId) {
    const { error } = await supabase
      .from('experiences')
      .update({ ...parsed.data, status: intent })
      .eq('id', listingId)
      .eq('vendor_id', vendor.id)
    if (error) return { error: 'Could not save this listing.' }
    revalidatePath('/vendor/listings')
    revalidatePath('/experiences')
    return { ok: true, message: intent === 'draft' ? 'Saved as draft.' : 'Saved. New listings are reviewed before going live.' }
  }

  const slug = `${slugify(String(parsed.data.title))}-${crypto.randomUUID().slice(0, 4)}`
  const { data, error } = await supabase
    .from('experiences')
    .insert({ ...parsed.data, slug, vendor_id: vendor.id, status: intent })
    .select('id')
    .single()
  if (error || !data) return { error: 'Could not create this listing.' }
  revalidatePath('/vendor/listings')
  redirect(`/vendor/listings/${data.id}?created=1`)
}

export async function archiveListing(listingId: string) {
  const vendor = await approvedVendor()
  if (!vendor) return { error: 'Not allowed.' }
  const supabase = await createClient()
  const { error } = await supabase.from('experiences').update({ status: 'archived' }).eq('id', listingId).eq('vendor_id', vendor.id)
  revalidatePath('/vendor/listings')
  revalidatePath('/experiences')
  return error ? { error: 'Could not archive listing.' } : {}
}

export async function addListingImage(listingId: string, url: string) {
  const vendor = await approvedVendor()
  if (!vendor) return { error: 'Not allowed.' }
  if (!/^https:\/\//.test(url)) return { error: 'Invalid image.' }
  const supabase = await createClient()
  const { count } = await supabase.from('experience_images').select('id', { count: 'exact', head: true }).eq('experience_id', listingId)
  if ((count ?? 0) >= 12) return { error: 'You can add up to 12 gallery photos.' }
  const { error } = await supabase.from('experience_images').insert({ experience_id: listingId, url, sort_order: count ?? 0 })
  revalidatePath(`/vendor/listings/${listingId}`)
  return error ? { error: 'Could not add photo.' } : {}
}

export async function removeListingImage(listingId: string, imageId: string) {
  const vendor = await approvedVendor()
  if (!vendor) return { error: 'Not allowed.' }
  const supabase = await createClient()
  const { error } = await supabase.from('experience_images').delete().eq('id', imageId).eq('experience_id', listingId)
  revalidatePath(`/vendor/listings/${listingId}`)
  return error ? { error: 'Could not remove photo.' } : {}
}

const MAX_RANGE_DAYS = 180
const MAX_SLOTS = 600

export async function addSlots(listingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const vendor = await approvedVendor()
  if (!vendor) return { error: 'Your vendor account is not approved yet.' }

  const from = String(fd.get('from') ?? '')
  const to = String(fd.get('to') ?? from)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (!datePattern.test(from) || !datePattern.test(to)) return { error: 'Choose a start and end date.' }
  const start = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
  if (start < today) return { error: 'Start date cannot be in the past.' }
  if (end < start) return { error: 'End date must be after the start date.' }
  if ((end.getTime() - start.getTime()) / 86400000 > MAX_RANGE_DAYS) return { error: `Add up to ${MAX_RANGE_DAYS} days at a time.` }

  const weekdays = new Set(fd.getAll('weekdays').map(Number))
  if (weekdays.size === 0) return { error: 'Pick at least one weekday.' }

  const times = String(fd.get('times') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  if (times.length === 0 || times.some((t) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) return { error: 'Enter start times like 08:00, 14:30.' }

  const capacity = num(fd, 'capacity')
  if (capacity === null || !Number.isInteger(capacity) || capacity < 1 || capacity > 500) return { error: 'Capacity must be between 1 and 500.' }
  const priceOverride = num(fd, 'price_override')
  if (priceOverride !== null && (Number.isNaN(priceOverride) || priceOverride < 0)) return { error: 'Enter a valid price override.' }

  const rows: Record<string, unknown>[] = []
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (!weekdays.has(d.getUTCDay())) continue
    for (const time of times) {
      rows.push({ experience_id: listingId, date: d.toISOString().slice(0, 10), start_time: time, capacity, price_override: priceOverride })
    }
  }
  if (rows.length === 0) return { error: 'No dates match the selected weekdays.' }
  if (rows.length > MAX_SLOTS) return { error: `That would create ${rows.length} slots. Please add fewer than ${MAX_SLOTS} at once.` }

  const supabase = await createClient()
  const { error } = await supabase
    .from('availability_slots')
    .upsert(rows, { onConflict: 'experience_id,date,start_time', ignoreDuplicates: true })
  if (error) return { error: 'Could not save availability.' }
  revalidatePath(`/vendor/listings/${listingId}`)
  return { ok: true, message: `Added up to ${rows.length} departures. Existing ones were kept.` }
}

export async function updateSlot(listingId: string, slotId: string, patch: { is_active?: boolean; capacity?: number }) {
  const vendor = await approvedVendor()
  if (!vendor) return { error: 'Not allowed.' }
  const update: Record<string, unknown> = {}
  if (typeof patch.is_active === 'boolean') update.is_active = patch.is_active
  if (typeof patch.capacity === 'number') {
    if (!Number.isInteger(patch.capacity) || patch.capacity < 1 || patch.capacity > 500) return { error: 'Invalid capacity.' }
    update.capacity = patch.capacity
  }
  const supabase = await createClient()
  const { error } = await supabase.from('availability_slots').update(update).eq('id', slotId).eq('experience_id', listingId)
  revalidatePath(`/vendor/listings/${listingId}`)
  return error ? { error: dbMessage(error.message, 'Could not update slot.') } : {}
}

export async function deleteSlot(listingId: string, slotId: string) {
  const vendor = await approvedVendor()
  if (!vendor) return { error: 'Not allowed.' }
  const supabase = await createClient()
  const { error } = await supabase.from('availability_slots').delete().eq('id', slotId).eq('experience_id', listingId)
  revalidatePath(`/vendor/listings/${listingId}`)
  return error ? { error: dbMessage(error.message, 'Could not delete slot.') } : {}
}

const VENDOR_BOOKING_STATUSES = ['confirmed', 'completed', 'no_show'] as const

export async function setBookingStatus(bookingId: string, status: string) {
  const vendor = await approvedVendor()
  if (!vendor) return { error: 'Not allowed.' }
  if (!VENDOR_BOOKING_STATUSES.includes(status as (typeof VENDOR_BOOKING_STATUSES)[number])) return { error: 'Invalid status.' }
  const supabase = await createClient()
  const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId).eq('vendor_id', vendor.id)
  revalidatePath('/vendor/bookings')
  revalidatePath('/vendor')
  return error ? { error: dbMessage(error.message, 'Could not update booking.') } : {}
}

export async function requestPayout(_: FormState, fd: FormData): Promise<FormState> {
  const vendor = await approvedVendor()
  if (!vendor) return { error: 'Your vendor account is not approved yet.' }
  const amount = num(fd, 'amount')
  if (amount === null || Number.isNaN(amount) || amount <= 0) return { error: 'Enter an amount to withdraw.' }
  if (!vendor.payout_details?.account_number) return { error: 'Add your bank details in Business profile first.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('request_payout', { p_amount: Math.round(amount * 100) / 100, p_notes: text(fd, 'notes', 300) })
  if (error) return { error: dbMessage(error.message, 'Could not request payout.') }
  revalidatePath('/vendor/payouts')
  return { ok: true, message: 'Payout requested. You will be notified when it is processed.' }
}
