import { db, uid, nowIso, DataError } from '../lib/db'
import type {
  CartLine,
  Customer,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  OrderWithItems,
  Payment,
  PaymentStatus,
} from '../types'
import { notificationService } from './notifications'
import { inventoryService } from './inventory'
import { loyaltyService } from './loyalty'
import { deliveryService } from './delivery'
import { auditService } from './audit'

export interface CheckoutInput {
  customer_name: string
  customer_email: string
  customer_phone: string
  order_type: OrderType
  delivery_address?: string
  delivery_city?: string
  delivery_postal_code?: string
  table_number?: string
  notes?: string
  lines: CartLine[]
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  customer_id?: string | null
  branch_id?: string | null
  channel?: 'pos' | 'website' | 'delivery_platform'
  promo_code?: string | null
}

function generateOrderNumber(): string {
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const seq = String(Math.floor(1000 + Math.random() * 8999))
  return `TH-${stamp}-${seq}`
}

export const orderService = {
  /**
   * Validates the cart against live menu state, then writes the order in `pending`
   * status. Payment is recorded separately so a failed payment never leaves a paid order.
   */
  async createOrder(input: CheckoutInput): Promise<OrderWithItems> {
    if (!input.lines.length) throw new DataError('Your cart is empty.')

    const menu = await db.select<MenuItem>('menu_items')
    const byId = new Map(menu.map((m) => [m.id, m]))
    for (const line of input.lines) {
      const item = byId.get(line.menu_item_id)
      if (!item) throw new DataError(`${line.name} is no longer on the menu.`)
      if (!item.available) throw new DataError(`${item.name} is currently unavailable.`)
      if (line.quantity < 1) throw new DataError(`Invalid quantity for ${item.name}.`)
    }

    // Recompute money server-side-style rather than trusting the numbers the cart sent.
    const subtotal = input.lines.reduce((sum, l) => {
      const item = byId.get(l.menu_item_id)!
      return sum + (item.discount_price ?? item.price) * l.quantity
    }, 0)
    const delivery_fee = input.order_type === 'delivery' ? input.delivery_fee : 0
    const discount = Math.max(0, Math.min(input.discount, subtotal))
    const total = subtotal + delivery_fee - discount

    const customerId = input.customer_id ?? (await resolveCustomer(input))

    const order = await db.insert<Order>('orders', {
      id: uid('ord'),
      order_number: generateOrderNumber(),
      customer_id: customerId,
      order_type: input.order_type,
      subtotal,
      delivery_fee,
      discount,
      total,
      payment_status: 'pending',
      order_status: 'pending',
      customer_name: input.customer_name,
      customer_email: input.customer_email.trim().toLowerCase(),
      customer_phone: input.customer_phone,
      delivery_address: input.order_type === 'delivery' ? input.delivery_address ?? null : null,
      delivery_city: input.order_type === 'delivery' ? input.delivery_city ?? null : null,
      delivery_postal_code: input.order_type === 'delivery' ? input.delivery_postal_code ?? null : null,
      table_number: input.order_type === 'dine_in' ? input.table_number ?? null : null,
      notes: input.notes ?? null,
      branch_id: input.branch_id ?? null,
      channel: input.channel ?? 'website',
      promo_code: input.promo_code ?? null,
    })

    const items = await db.insertMany<OrderItem>(
      'order_items',
      input.lines.map((l) => {
        const item = byId.get(l.menu_item_id)!
        const unit = item.discount_price ?? item.price
        return {
          id: uid('oit'),
          order_id: order.id,
          menu_item_id: item.id,
          item_name: item.name,
          quantity: l.quantity,
          unit_price: unit,
          subtotal: unit * l.quantity,
        }
      }),
    )

    return { ...order, items }
  },

  async markPaid(orderId: string, paymentStatus: PaymentStatus): Promise<Order> {
    const order = await db.selectOne<Order>('orders', orderId)
    if (!order) throw new DataError('Order not found.')

    const patch: Partial<Order> =
      paymentStatus === 'paid'
        ? { payment_status: 'paid', order_status: 'confirmed' }
        : paymentStatus === 'cancelled'
          ? { payment_status: 'cancelled', order_status: 'cancelled' }
          : { payment_status: paymentStatus }

    const updated = await db.update<Order>('orders', orderId, patch)

    if (paymentStatus === 'paid') {
      await notificationService.create({
        type: 'order',
        title: 'New order received',
        message: `${order.order_number} — ${order.customer_name} · ₱${order.total.toLocaleString('en-PH')}`,
        link: '/admin/orders',
      })
    }
    await auditService.log({
      actor_name: order.customer_name,
      action: 'payment_' + paymentStatus,
      entity: 'order',
      entity_id: orderId,
      detail: `${order.order_number} payment ${paymentStatus}.`,
    })
    return updated
  },

  listOrders: (opts?: { status?: OrderStatus; customerId?: string; limit?: number }) =>
    db.select<Order>('orders', {
      filters: [
        ...(opts?.status ? [{ column: 'order_status', op: 'eq' as const, value: opts.status }] : []),
        ...(opts?.customerId ? [{ column: 'customer_id', op: 'eq' as const, value: opts.customerId }] : []),
      ],
      order: { column: 'created_at', ascending: false },
      limit: opts?.limit,
    }),

  async listOrdersByEmail(email: string): Promise<Order[]> {
    return db.select<Order>('orders', {
      filters: [{ column: 'customer_email', op: 'eq', value: email.trim().toLowerCase() }],
      order: { column: 'created_at', ascending: false },
    })
  },

  async getWithItems(orderId: string): Promise<OrderWithItems | null> {
    const order = await db.selectOne<Order>('orders', orderId)
    if (!order) return null
    return attach(order)
  },

  async getByOrderNumber(orderNumber: string): Promise<OrderWithItems | null> {
    const rows = await db.select<Order>('orders', {
      filters: [{ column: 'order_number', op: 'eq', value: orderNumber.trim().toUpperCase() }],
      limit: 1,
    })
    if (!rows[0]) return null
    return attach(rows[0])
  },

  async listItemsForOrders(orderIds: string[]): Promise<OrderItem[]> {
    if (!orderIds.length) return []
    return db.select<OrderItem>('order_items', {
      filters: [{ column: 'order_id', op: 'in', value: orderIds }],
    })
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await db.selectOne<Order>('orders', orderId)
    if (!order) throw new DataError('Order not found.')

    const patch: Partial<Order> = { order_status: status }
    if (status === 'completed' && order.payment_status === 'pending') patch.payment_status = 'paid'
    const updated = await db.update<Order>('orders', orderId, patch)

    if (status === 'preparing' && order.order_type === 'delivery') await deliveryService.ensureForOrder(updated)

    if (status === 'completed') {
      await inventoryService.consumeForOrder(orderId)
      await loyaltyService.accrueForOrder(updated)
    }

    await notificationService.create({
      type: 'order',
      title: `Order ${status.replace(/_/g, ' ')}`,
      message: `${order.order_number} is now ${status.replace(/_/g, ' ')}.`,
      link: '/admin/orders',
    })
    await auditService.log({
      actor_name: 'Staff',
      action: 'status_changed',
      entity: 'order',
      entity_id: orderId,
      detail: `${order.order_number} moved to ${status.replace(/_/g, ' ')}.`,
    })
    return updated
  },

  async cancelOrder(orderId: string): Promise<Order> {
    const order = await db.selectOne<Order>('orders', orderId)
    if (!order) throw new DataError('Order not found.')
    if (order.order_status === 'completed') throw new DataError('Completed orders cannot be cancelled.')
    return db.update<Order>('orders', orderId, {
      order_status: 'cancelled',
      payment_status: order.payment_status === 'paid' ? 'refunded' : 'cancelled',
    })
  },

  deleteOrder: (orderId: string) => db.remove('orders', orderId),
}

async function attach(order: Order): Promise<OrderWithItems> {
  const [items, payments] = await Promise.all([
    db.select<OrderItem>('order_items', { filters: [{ column: 'order_id', op: 'eq', value: order.id }] }),
    db.select<Payment>('payments', { filters: [{ column: 'order_id', op: 'eq', value: order.id }] }),
  ])
  return { ...order, items, payment: payments[0] ?? null }
}

async function resolveCustomer(input: CheckoutInput): Promise<string> {
  const email = input.customer_email.trim().toLowerCase()
  const existing = await db.select<Customer>('customers', {
    filters: [{ column: 'email', op: 'eq', value: email }],
    limit: 1,
  })
  if (existing[0]) return existing[0].id
  const created = await db.insert<Customer>('customers', {
    id: uid('cus'),
    profile_id: null,
    full_name: input.customer_name,
    email,
    phone: input.customer_phone,
    address: input.delivery_address ?? null,
    active: true,
    created_at: nowIso(),
  })
  return created.id
}

export const ORDER_FLOW: Record<'delivery' | 'pickup', OrderStatus[]> = {
  delivery: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'completed'],
  pickup: ['pending', 'confirmed', 'preparing', 'ready', 'completed'],
}

export function statusSteps(type: OrderType): OrderStatus[] {
  return type === 'delivery' ? ORDER_FLOW.delivery : ORDER_FLOW.pickup
}

export function nextStatus(order: Order): OrderStatus | null {
  const steps = statusSteps(order.order_type)
  const idx = steps.indexOf(order.order_status)
  if (idx === -1 || idx === steps.length - 1) return null
  return steps[idx + 1]
}
