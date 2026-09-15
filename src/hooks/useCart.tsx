import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartLine, MenuItem } from '../types'
import { effectivePrice } from '../services/menu'

const CART_KEY = 'tapahey.cart.v1'
export const DELIVERY_FEE = 50

interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotal: number
  isOpen: boolean
  lastAdded: string | null
  openCart: () => void
  closeCart: () => void
  add: (item: MenuItem, quantity?: number) => void
  setQuantity: (menuItemId: string, quantity: number) => void
  increment: (menuItemId: string) => void
  decrement: (menuItemId: string) => void
  remove: (menuItemId: string) => void
  clear: () => void
  quantityOf: (menuItemId: string) => number
  totals: (orderType: 'dine_in' | 'takeout' | 'delivery', discount?: number) => {
    subtotal: number
    delivery_fee: number
    discount: number
    total: number
  }
}

const CartContext = createContext<CartContextValue | null>(null)

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartLine[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load)
  const [isOpen, setIsOpen] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines))
    } catch {
      /* storage full — the cart still works for this session */
    }
  }, [lines])

  const add = useCallback((item: MenuItem, quantity = 1) => {
    const price = effectivePrice(item)
    setLines((prev) => {
      const existing = prev.find((l) => l.menu_item_id === item.id)
      if (existing) {
        return prev.map((l) =>
          l.menu_item_id === item.id ? { ...l, quantity: l.quantity + quantity, price } : l,
        )
      }
      return [
        ...prev,
        { menu_item_id: item.id, name: item.name, price, image_url: item.image_url, quantity },
      ]
    })
    setLastAdded(item.id)
    setTimeout(() => setLastAdded((c) => (c === item.id ? null : c)), 1200)
  }, [])

  const setQuantity = useCallback((id: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.menu_item_id !== id)
        : prev.map((l) => (l.menu_item_id === id ? { ...l, quantity } : l)),
    )
  }, [])

  const value = useMemo<CartContextValue>(() => {
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0)
    return {
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal,
      isOpen,
      lastAdded,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      add,
      setQuantity,
      increment: (id) => setLines((p) => p.map((l) => (l.menu_item_id === id ? { ...l, quantity: l.quantity + 1 } : l))),
      decrement: (id) =>
        setLines((p) =>
          p.flatMap((l) =>
            l.menu_item_id === id ? (l.quantity <= 1 ? [] : [{ ...l, quantity: l.quantity - 1 }]) : [l],
          ),
        ),
      remove: (id) => setLines((p) => p.filter((l) => l.menu_item_id !== id)),
      clear: () => setLines([]),
      quantityOf: (id) => lines.find((l) => l.menu_item_id === id)?.quantity ?? 0,
      totals: (orderType, discount = 0) => {
        const delivery_fee = orderType === 'delivery' ? DELIVERY_FEE : 0
        const capped = Math.min(discount, subtotal)
        return { subtotal, delivery_fee, discount: capped, total: subtotal + delivery_fee - capped }
      },
    }
  }, [lines, isOpen, lastAdded, add, setQuantity])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
