'use client'

import { useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { toggleWishlist } from '@/app/actions/wishlist'
import { cn } from '@/lib/utils'

export function WishlistButton({ experienceId, initial }: { experienceId: string; initial: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(initial)
  const [, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? 'Remove from wishlist' : 'Save to wishlist'}
      className="relative z-10 flex size-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm transition hover:scale-105"
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic)
          const res = await toggleWishlist(experienceId)
          if (res.error === 'auth') {
            toast('Sign in to save experiences')
            router.push('/auth/login?next=/wishlist')
          } else if (res.error) {
            toast.error(res.error)
          }
        })
      }
    >
      <Heart className={cn('size-4.5', optimistic && 'fill-destructive text-destructive')} />
    </button>
  )
}
