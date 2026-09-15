import { db, uid } from '../lib/db'
import type { Delivery, DeliveryStatus, Order } from '../types'
import { notificationService } from './notifications'

const COURIERS = ['Mang Rudy (Motor)', 'Aling Baby (Motor)', 'Jhun-Jhun (Bike)', 'Lakbay Express (3rd-party)']

export const DELIVERY_FLOW: DeliveryStatus[] = ['preparing', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered']

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
}

export const deliveryService = {
  list: () => db.select<Delivery>('deliveries', { order: { column: 'created_at', ascending: false } }),

  async ensureForOrder(order: Order): Promise<Delivery | null> {
    if (order.order_type !== 'delivery') return null
    const existing = await db.select<Delivery>('deliveries', { filters: [{ column: 'order_id', op: 'eq', value: order.id }] })
    if (existing[0]) return existing[0]
    return db.insert<Delivery>('deliveries', {
      id: uid('dlv'),
      order_id: order.id,
      order_number: order.order_number,
      courier_name: COURIERS[Math.floor(Math.random() * COURIERS.length)],
      address: order.delivery_address ?? '',
      status: 'preparing',
    })
  },

  async advance(id: string): Promise<Delivery> {
    const delivery = await db.selectOne<Delivery>('deliveries', id)
    if (!delivery) throw new Error('Delivery not found.')
    const idx = DELIVERY_FLOW.indexOf(delivery.status)
    const next = DELIVERY_FLOW[Math.min(idx + 1, DELIVERY_FLOW.length - 1)]
    const updated = await db.update<Delivery>('deliveries', id, { status: next })
    await notificationService.create({
      type: 'delivery',
      title: `Delivery ${DELIVERY_STATUS_LABEL[next]}`,
      message: `${delivery.order_number} is now ${DELIVERY_STATUS_LABEL[next].toLowerCase()}.`,
      link: '/admin/delivery',
    })
    if (next === 'delivered') {
      const order = await db.selectOne<Order>('orders', delivery.order_id)
      if (order && order.order_status !== 'completed') {
        const { orderService } = await import('./orders')
        await orderService.updateStatus(delivery.order_id, 'completed')
      }
    }
    return updated
  },

  setStatus: (id: string, status: DeliveryStatus) => db.update<Delivery>('deliveries', id, { status }),
}
