import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { EXPERIENCE_SELECT } from '@/lib/queries'
import type { ExperienceWithRelations } from '@/lib/types'
import { ExperienceGrid } from '@/components/experience/experience-card'
import { EmptyState } from '@/components/site/empty-state'

export const metadata: Metadata = { title: 'Wishlist' }

export default async function WishlistPage() {
  const { user } = await requireUser('/wishlist')
  const supabase = await createClient()
  const { data } = await supabase
    .from('wishlists')
    .select(`experience:experiences(${EXPERIENCE_SELECT})`)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
  const experiences = (data ?? []).map((r) => r.experience as unknown as ExperienceWithRelations).filter(Boolean)

  return (
    <div className="container-page flex flex-col gap-6 py-12">
      <h1 className="text-3xl font-extrabold">Your wishlist</h1>
      {experiences.length > 0 ? (
        <ExperienceGrid experiences={experiences} wishedIds={experiences.map((e) => e.id)} />
      ) : (
        <EmptyState title="Nothing saved yet" body="Tap the heart on any trip to keep it here for later." action={{ href: '/experiences', label: 'Explore trips' }} />
      )}
    </div>
  )
}
