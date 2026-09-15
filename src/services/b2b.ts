import { db, uid, DataError } from '../lib/db'
import type { B2BOrder, B2BOrderItem, Invoice, MenuItem, Reseller } from '../types'
import { notificationService } from './notifications'
import { auditService } from './audit'

function b2bNumber() {
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `B2B-${stamp}-${Math.floor(100 + Math.random() * 899)}`
}
function invoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`
}

export const resellerService = {
  list: () => db.select<Reseller>('resellers', { order: { column: 'business_name', ascending: true } }),
  create: (values: Partial<Reseller>) => db.insert<Reseller>('resellers', { id: uid('rsl'), status: 'active', ...values }),
  update: (id: string, patch: Partial<Reseller>) => db.update<Reseller>('resellers', id, patch),
}

export interface B2BLine {
  menu_item_id: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number
}

export const b2bService = {
  listOrders: () => db.select<B2BOrder>('b2b_orders', { order: { column: 'created_at', ascending: false } }),

  listItems: (orderId: string) =>
    db.select<B2BOrderItem>('b2b_order_items', { filters: [{ column: 'b2b_order_id', op: 'eq', value: orderId }] }),

  listInvoices: () => db.select<Invoice>('invoices', { order: { column: 'created_at', ascending: false } }),

  /** Bulk order → invoice, in one step (section 23/40 flow). */
  async createOrder(input: { reseller_id: string; lines: B2BLine[]; terms_days: number }): Promise<B2BOrder> {
    if (!input.lines.length) throw new DataError('Add at least one product to this bulk order.')
    const subtotal = input.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)

    const order = await db.insert<B2BOrder>('b2b_orders', {
      id: uid('b2b'),
      order_number: b2bNumber(),
      reseller_id: input.reseller_id,
      status: 'confirmed',
      subtotal,
      total: subtotal,
    })
    await db.insertMany<B2BOrderItem>(
      'b2b_order_items',
      input.lines.map((l) => ({
        id: uid('b2bi'),
        b2b_order_id: order.id,
        menu_item_id: l.menu_item_id,
        product_name: l.product_name,
        sku: l.sku,
        quantity: l.quantity,
        unit_price: l.unit_price,
        subtotal: l.quantity * l.unit_price,
      })),
    )
    const due = new Date()
    due.setDate(due.getDate() + input.terms_days)
    await db.insert<Invoice>('invoices', {
      id: uid('inv'),
      invoice_number: invoiceNumber(),
      b2b_order_id: order.id,
      reseller_id: input.reseller_id,
      amount: subtotal,
      status: 'unpaid',
      due_date: due.toISOString().slice(0, 10),
      paid_at: null,
    })
    await notificationService.create({
      type: 'b2b',
      title: 'New B2B bulk order',
      message: `${order.order_number} — ₱${subtotal.toLocaleString('en-PH')}`,
      link: '/admin/b2b',
    })
    await auditService.log({ actor_name: 'Reseller Portal', action: 'created', entity: 'b2b_order', entity_id: order.id, detail: `${order.order_number} placed, ₱${subtotal.toLocaleString('en-PH')}.` })
    return order
  },

  async fulfill(orderId: string): Promise<B2BOrder> {
    return db.update<B2BOrder>('b2b_orders', orderId, { status: 'fulfilled' })
  },

  async markInvoicePaid(invoiceId: string): Promise<Invoice> {
    const inv = await db.update<Invoice>('invoices', invoiceId, { status: 'paid', paid_at: new Date().toISOString() })
    await auditService.log({ actor_name: 'Finance', action: 'paid', entity: 'invoice', entity_id: invoiceId, detail: `${inv.invoice_number} marked paid.` })
    return inv
  },

  packagedProducts: () =>
    db.select<MenuItem>('menu_items', { filters: [{ column: 'product_type', op: 'eq', value: 'packaged' }] }),
}
