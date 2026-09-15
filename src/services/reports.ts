import { db } from '../lib/db'
import type { Branch, Customer, InventoryItem, MenuItem, Order, OrderItem, Payment, Reservation } from '../types'

export type RangeKey = 'today' | 'week' | 'month' | 'year'

export const RANGE_LABEL: Record<RangeKey, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
}

export function rangeStart(range: RangeKey): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (range === 'week') d.setDate(d.getDate() - 6)
  if (range === 'month') d.setDate(d.getDate() - 29)
  if (range === 'year') d.setMonth(d.getMonth() - 11, 1)
  return d
}

export interface DashboardStats {
  salesToday: number
  salesYesterday: number
  ordersToday: number
  ordersYesterday: number
  reservationsToday: number
  reservationsYesterday: number
  customersTotal: number
  customersLastMonth: number
}

const isPaid = (o: Order) => o.payment_status === 'paid' && o.order_status !== 'cancelled'

export const reportService = {
  async dashboard(): Promise<DashboardStats> {
    const [orders, reservations, customers] = await Promise.all([
      db.select<Order>('orders'),
      db.select<Reservation>('reservations'),
      db.select<Customer>('customers'),
    ])

    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const onDay = (o: Order, day: string) => o.created_at.slice(0, 10) === day

    return {
      salesToday: orders.filter((o) => isPaid(o) && onDay(o, today)).reduce((s, o) => s + o.total, 0),
      salesYesterday: orders.filter((o) => isPaid(o) && onDay(o, yesterday)).reduce((s, o) => s + o.total, 0),
      ordersToday: orders.filter((o) => onDay(o, today)).length,
      ordersYesterday: orders.filter((o) => onDay(o, yesterday)).length,
      reservationsToday: reservations.filter((r) => r.reserved_date === today).length,
      reservationsYesterday: reservations.filter((r) => r.reserved_date === yesterday).length,
      customersTotal: customers.length,
      customersLastMonth: customers.filter((c) => c.created_at < monthAgo).length,
    }
  },

  async salesSeries(range: RangeKey): Promise<Array<{ label: string; sales: number; orders: number }>> {
    const orders = (await db.select<Order>('orders')).filter(isPaid)

    if (range === 'today') {
      const today = new Date().toISOString().slice(0, 10)
      const buckets = ['06', '08', '10', '12', '14', '16', '18', '20']
      return buckets.map((h, i) => {
        const nextH = buckets[i + 1] ?? '23'
        const inBucket = orders.filter((o) => {
          if (o.created_at.slice(0, 10) !== today) return false
          const hour = new Date(o.created_at).getHours()
          return hour >= Number(h) && hour < Number(nextH)
        })
        return {
          label: `${Number(h) % 12 === 0 ? 12 : Number(h) % 12}${Number(h) >= 12 ? 'PM' : 'AM'}`,
          sales: inBucket.reduce((s, o) => s + o.total, 0),
          orders: inBucket.length,
        }
      })
    }

    if (range === 'year') {
      const months: Array<{ label: string; sales: number; orders: number }> = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i, 1)
        const key = d.toISOString().slice(0, 7)
        const inMonth = orders.filter((o) => o.created_at.slice(0, 7) === key)
        months.push({
          label: d.toLocaleDateString('en-PH', { month: 'short' }),
          sales: inMonth.reduce((s, o) => s + o.total, 0),
          orders: inMonth.length,
        })
      }
      return months
    }

    const days = range === 'week' ? 7 : 30
    const out: Array<{ label: string; sales: number; orders: number }> = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const inDay = orders.filter((o) => o.created_at.slice(0, 10) === key)
      out.push({
        label: d.toLocaleDateString('en-PH', days === 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' }),
        sales: inDay.reduce((s, o) => s + o.total, 0),
        orders: inDay.length,
      })
    }
    return out
  },

  async bestSellers(limit = 8) {
    const [items, orders] = await Promise.all([
      db.select<OrderItem>('order_items'),
      db.select<Order>('orders'),
    ])
    const valid = new Set(orders.filter((o) => o.order_status !== 'cancelled').map((o) => o.id))
    const agg = new Map<string, { name: string; quantity: number; revenue: number }>()
    items
      .filter((i) => valid.has(i.order_id))
      .forEach((i) => {
        const current = agg.get(i.menu_item_id) ?? { name: i.item_name, quantity: 0, revenue: 0 }
        current.quantity += i.quantity
        current.revenue += i.subtotal
        agg.set(i.menu_item_id, current)
      })
    return [...agg.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit)
  },

  async salesByCategory() {
    const [orderItems, orders, menu, categories] = await Promise.all([
      db.select<OrderItem>('order_items'),
      db.select<Order>('orders'),
      db.select<MenuItem>('menu_items'),
      db.select<{ id: string; name: string }>('menu_categories'),
    ])
    const valid = new Set(orders.filter((o) => o.order_status !== 'cancelled').map((o) => o.id))
    const itemCategory = new Map(menu.map((m) => [m.id, m.category_id]))
    const categoryName = new Map(categories.map((c) => [c.id, c.name]))
    const agg = new Map<string, number>()
    orderItems
      .filter((i) => valid.has(i.order_id))
      .forEach((i) => {
        const cat = categoryName.get(itemCategory.get(i.menu_item_id) ?? '') ?? 'Other'
        agg.set(cat, (agg.get(cat) ?? 0) + i.subtotal)
      })
    return [...agg.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  },

  async paymentBreakdown() {
    const payments = await db.select<Payment>('payments')
    const agg = new Map<string, { count: number; amount: number }>()
    payments
      .filter((p) => p.payment_status === 'paid')
      .forEach((p) => {
        const key = p.provider === 'demo' && p.payment_method === 'card' ? 'Demo Payment' : p.payment_method
        const current = agg.get(key) ?? { count: 0, amount: 0 }
        current.count += 1
        current.amount += p.amount
        agg.set(key, current)
      })
    const labels: Record<string, string> = {
      cash: 'Cash',
      gcash: 'GCash',
      maya: 'Maya',
      card: 'Card',
      'Demo Payment': 'Demo Payment',
    }
    return [...agg.entries()].map(([key, v]) => ({ name: labels[key] ?? key, ...v }))
  },

  /** Owner Cockpit — section 26/48: revenue, margin and food cost, all-time. */
  async businessOverview() {
    const [orders, orderItems, menu, inventory] = await Promise.all([
      db.select<Order>('orders'),
      db.select<OrderItem>('order_items'),
      db.select<MenuItem>('menu_items'),
      db.select<InventoryItem>('inventory'),
    ])
    const paid = orders.filter(isPaid)
    const costByMenuItem = new Map(menu.map((m) => [m.id, m.cost ?? 0]))
    const validOrderIds = new Set(paid.map((o) => o.id))
    const soldItems = orderItems.filter((i) => validOrderIds.has(i.order_id))
    const totalRevenue = paid.reduce((s, o) => s + o.total, 0)
    const totalCost = soldItems.reduce((s, i) => s + i.quantity * (costByMenuItem.get(i.menu_item_id) ?? 0), 0)
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
    const foodCostPct = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0
    const lowStock = inventory.filter((i) => i.stock < i.minimum_stock).length
    const cashExceptions = 0 // filled from cashier_shifts by the caller (finance domain)
    return { totalRevenue, totalOrders: orders.length, grossMargin, foodCostPct, lowStock, cashExceptions }
  },

  async salesByBranch() {
    const [orders, branches] = await Promise.all([db.select<Order>('orders'), db.select<Branch>('branches')])
    const paid = orders.filter(isPaid)
    const nameOf = new Map(branches.map((b) => [b.id, b.name]))
    const agg = new Map<string, number>()
    paid.forEach((o) => {
      const label = nameOf.get(o.branch_id ?? '') ?? 'Main Branch'
      agg.set(label, (agg.get(label) ?? 0) + o.total)
    })
    return [...agg.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  },

  async salesByChannel() {
    const orders = (await db.select<Order>('orders')).filter(isPaid)
    const agg = new Map<string, number>()
    const label: Record<string, string> = { pos: 'POS / Dine-in', website: 'Online / Website', delivery_platform: 'Delivery Platform' }
    orders.forEach((o) => {
      const key = label[o.channel ?? 'pos'] ?? 'POS / Dine-in'
      agg.set(key, (agg.get(key) ?? 0) + o.total)
    })
    return [...agg.entries()].map(([name, value]) => ({ name, value }))
  },

  async revenueSummary(range: RangeKey) {
    const start = rangeStart(range).toISOString()
    const orders = (await db.select<Order>('orders')).filter((o) => o.created_at >= start)
    const paid = orders.filter(isPaid)
    return {
      revenue: paid.reduce((s, o) => s + o.total, 0),
      orders: orders.length,
      paidOrders: paid.length,
      cancelled: orders.filter((o) => o.order_status === 'cancelled').length,
      averageTicket: paid.length ? paid.reduce((s, o) => s + o.total, 0) / paid.length : 0,
      deliveryFees: paid.reduce((s, o) => s + o.delivery_fee, 0),
    }
  },
}

export function percentChange(current: number, previous: number): number | null {
  if (!previous) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}
