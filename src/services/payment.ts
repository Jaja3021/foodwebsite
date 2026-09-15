import { db, uid, DataError } from '../lib/db'
import type { Order, Payment, PaymentMethod, PaymentStatus } from '../types'
import { orderService } from './orders'
import { notificationService } from './notifications'

export type DemoScenario = 'success' | 'failure' | 'cancel'

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

/**
 * Stripe is only considered live when a publishable key AND a server endpoint that can
 * mint PaymentIntents are both present. The secret key never touches this bundle.
 */
export const paymentMode: 'stripe' | 'demo' =
  STRIPE_PUBLISHABLE_KEY && import.meta.env.VITE_PAYMENT_API_URL ? 'stripe' : 'demo'

export const isDemoMode = paymentMode === 'demo'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function reference(method: PaymentMethod): string {
  const prefix = paymentMode === 'stripe' ? 'pi' : 'DEMO'
  return `${prefix}_${method.toUpperCase()}_${Date.now().toString(36).toUpperCase()}_${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`
}

export interface ProcessInput {
  order: Order
  method: PaymentMethod
  scenario: DemoScenario
}

export interface ProcessResult {
  status: PaymentStatus
  payment: Payment
  message: string
}

const inFlight = new Set<string>()

export const paymentService = {
  /**
   * Records a payment attempt and reconciles the order. Guarded against double
   * submission so one order can never produce two paid payments.
   */
  async process({ order, method, scenario }: ProcessInput): Promise<ProcessResult> {
    if (inFlight.has(order.id)) throw new DataError('This payment is already being processed.')

    const existing = await db.select<Payment>('payments', {
      filters: [
        { column: 'order_id', op: 'eq', value: order.id },
        { column: 'payment_status', op: 'eq', value: 'paid' },
      ],
      limit: 1,
    })
    if (existing[0]) throw new DataError('This order has already been paid.')

    inFlight.add(order.id)
    try {
      const pending = await db.insert<Payment>('payments', {
        id: uid('pay'),
        order_id: order.id,
        customer_id: order.customer_id,
        amount: order.total,
        currency: 'PHP',
        payment_method: method,
        payment_status: 'processing',
        transaction_reference: reference(method),
        provider: method === 'cash' ? 'cash' : paymentMode === 'stripe' ? 'stripe' : 'demo',
      })

      await db.update<Order>('orders', order.id, { payment_status: 'processing' })
      await wait(1600 + Math.random() * 900)

      // Cash on delivery/pickup is authorised at hand-over, not online.
      const resolved: PaymentStatus =
        method === 'cash' && scenario === 'success'
          ? 'pending'
          : scenario === 'success'
            ? 'paid'
            : scenario === 'failure'
              ? 'failed'
              : 'cancelled'

      const payment = await db.update<Payment>('payments', pending.id, { payment_status: resolved })

      if (resolved === 'paid') {
        await orderService.markPaid(order.id, 'paid')
      } else if (resolved === 'pending') {
        // Cash order: confirm it for the kitchen, collect on hand-over.
        await db.update<Order>('orders', order.id, { payment_status: 'pending', order_status: 'confirmed' })
        await notificationService.create({
          type: 'order',
          title: 'New order received (cash)',
          message: `${order.order_number} — ${order.customer_name} · collect ₱${order.total.toLocaleString('en-PH')} on hand-over`,
          link: '/admin/orders',
        })
      } else {
        await orderService.markPaid(order.id, resolved)
      }

      return {
        status: resolved,
        payment,
        message:
          resolved === 'paid'
            ? 'Payment successful.'
            : resolved === 'pending'
              ? 'Order confirmed. Pay with cash on hand-over.'
              : resolved === 'failed'
                ? 'Your payment could not be completed. Please try again.'
                : 'Payment was cancelled.',
      }
    } finally {
      inFlight.delete(order.id)
    }
  },

  listForOrder: (orderId: string) =>
    db.select<Payment>('payments', { filters: [{ column: 'order_id', op: 'eq', value: orderId }] }),

  listAll: () => db.select<Payment>('payments', { order: { column: 'created_at', ascending: false } }),

  async refund(paymentId: string): Promise<Payment> {
    const payment = await db.selectOne<Payment>('payments', paymentId)
    if (!payment) throw new DataError('Payment not found.')
    if (payment.payment_status !== 'paid') throw new DataError('Only paid payments can be refunded.')
    const refunded = await db.update<Payment>('payments', paymentId, { payment_status: 'refunded' })
    await db.update<Order>('orders', payment.order_id, { payment_status: 'refunded' })
    return refunded
  },
}

/**
 * Where the Stripe path plugs in. The client asks a server endpoint for a
 * PaymentIntent client secret; STRIPE_SECRET_KEY stays on that server.
 */
export async function createPaymentIntent(amount: number, orderNumber: string): Promise<{ clientSecret: string }> {
  const endpoint = import.meta.env.VITE_PAYMENT_API_URL as string | undefined
  if (!endpoint) throw new DataError('Stripe is not configured. Running in demo payment mode.')
  const res = await fetch(`${endpoint}/create-payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'php', order_number: orderNumber }),
  })
  if (!res.ok) throw new DataError('We could not reach the payment service. Please try again.')
  return res.json()
}
