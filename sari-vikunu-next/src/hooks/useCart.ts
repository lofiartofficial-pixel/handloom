'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useEffect, useState } from 'react'
import type { CartItem } from '@/types/order'

// ============================================
// CART STORE — Zustand + localStorage persist
// ============================================
interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getCount: () => number
}

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.product_id === newItem.product_id
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === newItem.product_id
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, newItem] }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
      },

      getCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'sari-vikunu-cart', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ============================================
// HYDRATION FIX
// Prevents "Flash of wrong content" on SSR
// Use this hook instead of useCartStore directly!
// ============================================
export function useCart() {
  const [isHydrated, setIsHydrated] = useState(false)
  const store = useCartStore()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Return empty cart until hydration is complete
  if (!isHydrated) {
    return {
      items: [],
      addItem: store.addItem,
      removeItem: store.removeItem,
      updateQuantity: store.updateQuantity,
      clearCart: store.clearCart,
      getTotal: () => 0,
      getCount: () => 0,
      isHydrated: false,
    }
  }

  return { ...store, isHydrated: true }
}
