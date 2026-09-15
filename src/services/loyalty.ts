import { db, uid } from '../lib/db'
import type { Customer, LoyaltyAccount, LoyaltyTransaction, Order } from '../types'
import { notificationService } from './notifications'

/** ₱100 spent = 1 point. Configurable from Admin ▸ Loyalty. */
export const POINTS_PER_PESO = 1 / 100
/** 100 points = ₱50 reward. */
export const PESO_PER_POINT = 0.5

export const loyaltyService = {
  listAccounts: () => db.select<LoyaltyAccount>('loyalty_accounts'),

  listTransactions: (accountId?: string) =>
    db.select<LoyaltyTransaction>('loyalty_transactions', {
      filters: accountId ? [{ column: 'loyalty_account_id', op: 'eq', value: accountId }] : [],
      order: { column: 'created_at', ascending: false },
    }),

  async accountFor(customerId: string): Promise<LoyaltyAccount> {
    const existing = await db.select<LoyaltyAccount>('loyalty_accounts', {
      filters: [{ column: 'customer_id', op: 'eq', value: customerId }],
      limit: 1,
    })
    if (existing[0]) return existing[0]
    return db.insert<LoyaltyAccount>('loyalty_accounts', {
      id: uid('lya'),
      customer_id: customerId,
      points_balance: 0,
      lifetime_points: 0,
    })
  },

  /** Called when an order completes — section 19/27. No-ops for walk-in/guest orders. */
  async accrueForOrder(order: Order): Promise<void> {
    if (!order.customer_id) return
    const points = Math.floor(order.total * POINTS_PER_PESO)
    if (points <= 0) return
    const account = await loyaltyService.accountFor(order.customer_id)
    await db.update<LoyaltyAccount>('loyalty_accounts', account.id, {
      points_balance: account.points_balance + points,
      lifetime_points: account.lifetime_points + points,
    })
    await db.insert<LoyaltyTransaction>('loyalty_transactions', {
      id: uid('lyt'),
      loyalty_account_id: account.id,
      order_id: order.id,
      points,
      type: 'earn',
      note: `Earned from order ${order.order_number}`,
    })
    await notificationService.create({
      type: 'loyalty',
      title: 'Loyalty points earned',
      message: `${order.customer_name} earned ${points} pts from ${order.order_number}.`,
      link: '/admin/loyalty',
    })
  },

  async redeem(accountId: string, points: number): Promise<LoyaltyAccount> {
    const account = await db.selectOne<LoyaltyAccount>('loyalty_accounts', accountId)
    if (!account) throw new Error('Loyalty account not found.')
    if (points <= 0 || points > account.points_balance) throw new Error('Not enough points to redeem.')
    const updated = await db.update<LoyaltyAccount>('loyalty_accounts', accountId, {
      points_balance: account.points_balance - points,
    })
    await db.insert<LoyaltyTransaction>('loyalty_transactions', {
      id: uid('lyt'),
      loyalty_account_id: accountId,
      order_id: null,
      points: -points,
      type: 'redeem',
      note: `Redeemed for ₱${(points * PESO_PER_POINT).toFixed(0)} reward`,
    })
    return updated
  },

  async withCustomers() {
    const [accounts, customers] = await Promise.all([loyaltyService.listAccounts(), db.select<Customer>('customers')])
    const byId = new Map(customers.map((c) => [c.id, c]))
    return accounts
      .map((a) => ({ ...a, customer: byId.get(a.customer_id) }))
      .filter((a) => a.customer)
      .sort((a, b) => b.points_balance - a.points_balance)
  },
}
