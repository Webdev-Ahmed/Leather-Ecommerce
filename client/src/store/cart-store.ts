import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CART_ITEMS = 20
const FREE_DELIVERY_THRESHOLD = 1990

// ─── Types ────────────────────────────────────────────────────────────────────

export type CartItem = {
  product: Product
  quantity: number
}

type CartState = {
  items: CartItem[]
  isOpen: boolean
}

type CartActions = {
  addItem: (product: Product, quantity?: number) => void
  updateItem: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

type CartDerived = {
  itemCount: number
  subtotal: number
  deliveryFee: number
  total: number
  amountToFreeDelivery: number
}

export type CartStore = CartState & CartActions & CartDerived

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // ─── Derived values ───────────────────────────────────────────────────

      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      get subtotal() {
        return get().items.reduce((sum, item) => {
          const price = item.product.discountPrice ?? item.product.price
          return sum + price * item.quantity
        }, 0)
      },

      get deliveryFee() {
        const subtotal = get().items.reduce((sum, item) => {
          const price = item.product.discountPrice ?? item.product.price
          return sum + price * item.quantity
        }, 0)
        return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 200
      },

      get total() {
        return get().subtotal + get().deliveryFee
      },

      get amountToFreeDelivery() {
        return Math.max(0, FREE_DELIVERY_THRESHOLD - get().subtotal)
      },

      // ─── Actions ──────────────────────────────────────────────────────────

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.product.id === product.id
          )

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? {
                      ...item,
                      quantity: Math.min(
                        item.quantity + quantity,
                        product.stock,
                        MAX_CART_ITEMS
                      ),
                    }
                  : item
              ),
            }
          }

          return {
            items: [
              ...state.items,
              {
                product,
                quantity: Math.min(quantity, product.stock, MAX_CART_ITEMS),
              },
            ],
          }
        })
      },

      updateItem: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity: Math.min(quantity, item.product.stock, MAX_CART_ITEMS),
                }
              : item
          ),
        }))
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }))
      },

      clear: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'leather-cart',
      // Only persist cart items — isOpen should always start closed
      partialize: (state) => ({ items: state.items }),
    }
  )
)
