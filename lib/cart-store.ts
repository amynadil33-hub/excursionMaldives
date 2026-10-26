'use client'

import { useSyncExternalStore } from 'react'
import type { CartItem } from '@/lib/types'

// The cart is a pre-checkout scratchpad kept in the browser. Prices are
// display-only: the create_order RPC recomputes every total server-side.
const KEY = 'em-cart-v1'
const listeners = new Set<() => void>()
let cache: CartItem[] | null = null
const EMPTY: CartItem[] = []

function read(): CartItem[] {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartItem[]
  } catch {
    cache = []
  }
  return cache
}

function write(items: CartItem[]) {
  cache = items
  localStorage.setItem(KEY, JSON.stringify(items))
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY)
  return items
}

export const cart = {
  add(item: Omit<CartItem, 'key'>) {
    const items = read()
    const existing = items.find((i) => i.slotId === item.slotId)
    if (existing) {
      write(items.map((i) => (i.slotId === item.slotId ? { ...i, adults: item.adults, children: item.children, pickupLocation: item.pickupLocation } : i)))
    } else {
      write([...items, { ...item, key: `${item.slotId}-${Date.now()}` }].slice(0, 20))
    }
  },
  update(key: string, patch: Partial<CartItem>) {
    write(read().map((i) => (i.key === key ? { ...i, ...patch } : i)))
  },
  remove(key: string) {
    write(read().filter((i) => i.key !== key))
  },
  clear() {
    write([])
  },
}

export function lineTotal(i: CartItem) {
  return i.isPrivate ? i.unitPrice : i.unitPrice * i.adults + i.childPrice * i.children
}
