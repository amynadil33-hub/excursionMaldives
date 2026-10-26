'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CartButton() {
  const items = useCart()
  return (
    <Link href="/cart" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative rounded-full')} aria-label={`Cart, ${items.length} items`}>
      <ShoppingBag className="size-5" />
      {items.length > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent text-[0.65rem] font-bold text-accent-foreground">
          {items.length}
        </span>
      )}
    </Link>
  )
}
