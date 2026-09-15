import { db, uid, DataError } from '../lib/db'
import type { CashierShift, Order, Payment, PaymentMethod } from '../types'
import { auditService } from './audit'

export const shiftService = {
  list: () => db.select<CashierShift>('cashier_shifts', { order: { column: 'opened_at', ascending: false } }),

  async openFor(staffId: string, staffName: string, openingCash: number): Promise<CashierShift> {
    const open = await db.select<CashierShift>('cashier_shifts', {
      filters: [
        { column: 'staff_id', op: 'eq', value: staffId },
        { column: 'status', op: 'eq', value: 'open' },
      ],
    })
    if (open[0]) return open[0]
    const shift = await db.insert<CashierShift>('cashier_shifts', {
      id: uid('sft'),
      staff_id: staffId,
      staff_name: staffName,
      opening_cash: openingCash,
      closing_cash_expected: null,
      closing_cash_actual: null,
      cash_difference: null,
      status: 'open',
      opened_at: new Date().toISOString(),
      closed_at: null,
    })
    await auditService.log({ actor_name: staffName, action: 'opened', entity: 'cashier_shift', entity_id: shift.id, detail: `Shift opened with ₱${openingCash.toLocaleString('en-PH')} float.` })
    return shift
  },

  currentOpen: (staffId: string) =>
    db
      .select<CashierShift>('cashier_shifts', {
        filters: [
          { column: 'staff_id', op: 'eq', value: staffId },
          { column: 'status', op: 'eq', value: 'open' },
        ],
      })
      .then((r) => r[0] ?? null),

  async close(shiftId: string, actualCash: number): Promise<CashierShift> {
    const shift = await db.selectOne<CashierShift>('cashier_shifts', shiftId)
    if (!shift) throw new DataError('Shift not found.')
    const cashSales = await financeService.cashSalesDuring(shift.opened_at, new Date().toISOString())
    const expected = shift.opening_cash + cashSales
    const updated = await db.update<CashierShift>('cashier_shifts', shiftId, {
      closing_cash_expected: expected,
      closing_cash_actual: actualCash,
      cash_difference: Number((actualCash - expected).toFixed(2)),
      status: 'closed',
      closed_at: new Date().toISOString(),
    })
    await auditService.log({ actor_name: shift.staff_name, action: 'closed', entity: 'cashier_shift', entity_id: shiftId, detail: `Shift closed. Expected ₱${expected.toFixed(0)}, counted ₱${actualCash.toFixed(0)}.` })
    return updated
  },
}

export const financeService = {
  async cashSalesDuring(fromIso: string, toIso: string): Promise<number> {
    const payments = await db.select<Payment>('payments', {
      filters: [
        { column: 'payment_method', op: 'eq', value: 'cash' },
        { column: 'payment_status', op: 'eq', value: 'paid' },
      ],
    })
    return payments.filter((p) => p.created_at >= fromIso && p.created_at <= toIso).reduce((s, p) => s + p.amount, 0)
  },

  /** End-of-day summary — section 47. */
  async dailyClosing(dateIso: string) {
    const [payments, orders] = await Promise.all([db.select<Payment>('payments'), db.select<Order>('orders')])
    const day = dateIso.slice(0, 10)
    const dayPayments = payments.filter((p) => p.created_at.slice(0, 10) === day)
    const dayOrders = orders.filter((o) => o.created_at.slice(0, 10) === day)

    const byMethod: Record<PaymentMethod, number> = { cash: 0, gcash: 0, maya: 0, card: 0 }
    let totalSales = 0
    dayPayments
      .filter((p) => p.payment_status === 'paid')
      .forEach((p) => {
        byMethod[p.payment_method] += p.amount
        totalSales += p.amount
      })
    const refunds = dayPayments.filter((p) => p.payment_status === 'refunded').reduce((s, p) => s + p.amount, 0)
    const voids = dayOrders.filter((o) => o.order_status === 'cancelled').length
    const discounts = dayOrders.reduce((s, o) => s + (o.discount ?? 0), 0)
    const onlineSales = dayOrders.filter((o) => o.channel === 'website').reduce((s, o) => s + o.total, 0)

    return {
      date: day,
      totalSales,
      cash: byMethod.cash,
      gcash: byMethod.gcash,
      maya: byMethod.maya,
      card: byMethod.card,
      onlineSales,
      refunds,
      voids,
      discounts,
      orderCount: dayOrders.length,
    }
  },
}
