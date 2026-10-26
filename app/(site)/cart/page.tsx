import type { Metadata } from 'next'
import { CartView } from '@/components/cart/cart-view'

export const metadata: Metadata = { title: 'Your cart' }

export default function CartPage() {
  return (
    <div className="container-page flex flex-col gap-6 py-10">
      <h1 className="text-3xl font-extrabold md:text-4xl">Your cart</h1>
      <CartView />
    </div>
  )
}
