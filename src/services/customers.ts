import { db, uid, DataError } from '../lib/db'
import type { Customer, Favorite, MenuItem, Order, Reservation, Review } from '../types'
import { isValidEmail } from '../utils/format'

export interface CustomerWithStats extends Customer {
  order_count: number
  total_spent: number
  last_order_at: string | null
}

export const customerService = {
  list: () => db.select<Customer>('customers', { order: { column: 'created_at', ascending: false } }),

  get: (id: string) => db.selectOne<Customer>('customers', id),

  async listWithStats(): Promise<CustomerWithStats[]> {
    const [customers, orders] = await Promise.all([
      customerService.list(),
      db.select<Order>('orders'),
    ])
    return customers.map((c) => {
      const own = orders.filter((o) => o.customer_id === c.id && o.order_status !== 'cancelled')
      const paid = own.filter((o) => o.payment_status === 'paid')
      const last = own.sort((a, b) => (a.created_at > b.created_at ? -1 : 1))[0]
      return {
        ...c,
        order_count: own.length,
        total_spent: paid.reduce((s, o) => s + o.total, 0),
        last_order_at: last?.created_at ?? null,
      }
    })
  },

  async create(input: { full_name: string; email: string; phone?: string; address?: string }): Promise<Customer> {
    if (!input.full_name.trim()) throw new DataError('Please enter a name.')
    if (!isValidEmail(input.email)) throw new DataError('Please enter a valid email address.')
    const existing = await db.select<Customer>('customers', {
      filters: [{ column: 'email', op: 'eq', value: input.email.trim().toLowerCase() }],
      limit: 1,
    })
    if (existing[0]) throw new DataError('A customer with that email already exists.')
    return db.insert<Customer>('customers', {
      id: uid('cus'),
      profile_id: null,
      full_name: input.full_name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone ?? null,
      address: input.address ?? null,
      active: true,
    })
  },

  update: (id: string, patch: Partial<Customer>) => db.update<Customer>('customers', id, patch),

  remove: (id: string) => db.remove('customers', id),

  async detail(id: string) {
    const customer = await customerService.get(id)
    if (!customer) return null
    const [orders, reservations, reviews, favorites, menu] = await Promise.all([
      db.select<Order>('orders', {
        filters: [{ column: 'customer_id', op: 'eq', value: id }],
        order: { column: 'created_at', ascending: false },
      }),
      db.select<Reservation>('reservations', { filters: [{ column: 'customer_id', op: 'eq', value: id }] }),
      db.select<Review>('reviews', { filters: [{ column: 'customer_id', op: 'eq', value: id }] }),
      db.select<Favorite>('favorites', { filters: [{ column: 'customer_id', op: 'eq', value: id }] }),
      db.select<MenuItem>('menu_items'),
    ])
    const byId = new Map(menu.map((m) => [m.id, m]))
    return {
      customer,
      orders,
      reservations,
      reviews,
      favorites: favorites.map((f) => byId.get(f.menu_item_id)).filter(Boolean) as MenuItem[],
      total_spent: orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0),
    }
  },
}

export const favoriteService = {
  async list(customerId: string): Promise<MenuItem[]> {
    const [favs, menu] = await Promise.all([
      db.select<Favorite>('favorites', { filters: [{ column: 'customer_id', op: 'eq', value: customerId }] }),
      db.select<MenuItem>('menu_items'),
    ])
    const byId = new Map(menu.map((m) => [m.id, m]))
    return favs.map((f) => byId.get(f.menu_item_id)).filter(Boolean) as MenuItem[]
  },

  async toggle(customerId: string, menuItemId: string): Promise<boolean> {
    const existing = await db.select<Favorite>('favorites', {
      filters: [
        { column: 'customer_id', op: 'eq', value: customerId },
        { column: 'menu_item_id', op: 'eq', value: menuItemId },
      ],
      limit: 1,
    })
    if (existing[0]) {
      await db.remove('favorites', existing[0].id)
      return false
    }
    await db.insert<Favorite>('favorites', {
      id: uid('fav'),
      customer_id: customerId,
      menu_item_id: menuItemId,
    })
    return true
  },
}
