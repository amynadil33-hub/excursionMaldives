'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function toggleWishlist(experienceId: string): Promise<{ error?: string; wished?: boolean }> {
  const id = z.string().uuid().safeParse(experienceId)
  if (!id.success) return { error: 'Invalid experience' }
  const { user } = await getSession()
  if (!user) return { error: 'auth' }
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('wishlists')
    .select('experience_id')
    .eq('customer_id', user.id)
    .eq('experience_id', id.data)
    .maybeSingle()
  if (existing) {
    await supabase.from('wishlists').delete().eq('customer_id', user.id).eq('experience_id', id.data)
  } else {
    const { error } = await supabase.from('wishlists').insert({ customer_id: user.id, experience_id: id.data })
    if (error) return { error: 'Could not save to wishlist' }
  }
  revalidatePath('/wishlist')
  return { wished: !existing }
}

export async function getWishedIds(): Promise<string[]> {
  const { user } = await getSession()
  if (!user) return []
  const supabase = await createClient()
  const { data } = await supabase.from('wishlists').select('experience_id').eq('customer_id', user.id)
  return (data ?? []).map((w) => w.experience_id)
}
