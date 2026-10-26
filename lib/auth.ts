import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Profile, Vendor } from '@/lib/types'

export const getSession = cache(async () => {
  if (!isSupabaseConfigured()) return { user: null, profile: null as Profile | null }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null as Profile | null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, country, role, created_at')
    .eq('id', user.id)
    .maybeSingle<Profile>()
  return { user, profile }
})

export async function requireUser(next = '/account') {
  const session = await getSession()
  if (!session.user) redirect(`/auth/login?next=${encodeURIComponent(next)}`)
  return session as { user: NonNullable<typeof session.user>; profile: Profile | null }
}

export async function requireAdmin() {
  const session = await requireUser('/admin')
  if (session.profile?.role !== 'admin') redirect('/account?error=admin_only')
  return session
}

export const getMyVendor = cache(async () => {
  const { user } = await getSession()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase.from('vendors').select('*').eq('owner_id', user.id).maybeSingle<Vendor>()
  return data
})

export async function requireVendor() {
  const session = await requireUser('/vendor')
  const vendor = await getMyVendor()
  return { ...session, vendor }
}

export async function requireApprovedVendor() {
  const session = await requireUser('/vendor')
  const vendor = await getMyVendor()
  if (!vendor || vendor.status !== 'approved') redirect('/vendor/onboarding')
  return { ...session, vendor }
}
