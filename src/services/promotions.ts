import { db, uid, DataError } from '../lib/db'
import type { Promotion, PromotionUsage } from '../types'

export const promotionService = {
  list: () => db.select<Promotion>('promotions', { order: { column: 'created_at', ascending: false } }),

  create: (values: Partial<Promotion>) =>
    db.insert<Promotion>('promotions', { id: uid('promo'), active: true, ...values }),

  update: (id: string, patch: Partial<Promotion>) => db.update<Promotion>('promotions', id, patch),

  remove: (id: string) => db.remove('promotions', id),

  /** Validates a code against dates/min purchase and returns the discount amount, or throws. */
  async apply(code: string, subtotal: number): Promise<{ promotion: Promotion; discount: number }> {
    const rows = await db.select<Promotion>('promotions', {
      filters: [{ column: 'code', op: 'eq', value: code.trim().toUpperCase() }],
      limit: 1,
    })
    const promo = rows[0]
    if (!promo || !promo.active) throw new DataError('That promo code is not valid.')
    const today = new Date().toISOString().slice(0, 10)
    if (today < promo.start_date || today > promo.end_date) throw new DataError('That promo code has expired or is not active yet.')
    if (subtotal < promo.min_purchase) throw new DataError(`Spend at least ₱${promo.min_purchase} to use ${promo.code}.`)
    const discount = promo.discount_type === 'percent' ? Math.round(subtotal * (promo.discount_value / 100)) : promo.discount_value
    return { promotion: promo, discount: Math.min(discount, subtotal) }
  },

  recordUsage: (input: { promotion_id: string; order_id: string; customer_email: string; discount_applied: number }) =>
    db.insert<PromotionUsage>('promotion_usage', { id: uid('pu'), ...input }),
}
