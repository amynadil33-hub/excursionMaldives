'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FormState } from '@/app/actions/public'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in again.' }
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: String(formData.get('full_name') ?? '').trim().slice(0, 120) || null,
      phone: String(formData.get('phone') ?? '').trim().slice(0, 40) || null,
      country: String(formData.get('country') ?? '').trim().slice(0, 80) || null,
    })
    .eq('id', user.id)
  if (error) return { error: 'Could not save your profile.' }
  revalidatePath('/account')
  return { ok: true, message: 'Profile saved.' }
}
