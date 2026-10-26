'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export type FormState = { ok?: boolean; error?: string; message?: string }

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? '').trim().slice(0, max)

export async function submitReview(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: 'The marketplace database is not connected yet.' }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to leave a review.' }

  const experienceId = clean(formData.get('experience_id'), 64)
  const slug = clean(formData.get('slug'), 200)
  const rating = Number(formData.get('rating'))
  const title = clean(formData.get('title'), 120)
  const body = clean(formData.get('body'), 2000)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Choose a rating from 1 to 5.' }
  if (body.length < 10) return { error: 'Tell other travellers a little more (at least 10 characters).' }

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
  const { error } = await supabase.from('reviews').insert({
    experience_id: experienceId,
    customer_id: user.id,
    author_name: profile?.full_name || 'Traveller',
    rating,
    title: title || null,
    body,
  })
  if (error) return { error: 'Only travellers with a paid booking for this trip can review it.' }
  revalidatePath(`/experiences/${slug}`)
  return { ok: true, message: 'Thanks! Your review is live.' }
}

export async function submitContact(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: 'The marketplace database is not connected yet.' }
  const name = clean(formData.get('name'), 120)
  const email = clean(formData.get('email'), 200)
  const subject = clean(formData.get('subject'), 200)
  const message = clean(formData.get('message'), 5000)
  const kind = formData.get('kind') === 'private_trip' ? 'private_trip' : 'contact'
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter your name and a valid email.' }
  if (message.length < 10) return { error: 'Please write a short message (at least 10 characters).' }

  const supabase = await createClient()
  const { error } = await supabase.from('contact_messages').insert({ name, email, subject: subject || null, message, kind })
  if (error) return { error: 'We could not send your message. Please try again.' }
  return { ok: true, message: 'Message received. Our team in Malé will reply within one business day.' }
}
