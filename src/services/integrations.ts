import { db, uid } from '../lib/db'
import type { Integration } from '../types'

export const DEFAULT_INTEGRATIONS: Array<Pick<Integration, 'key' | 'name' | 'category' | 'status'>> = [
  { key: 'stripe', name: 'Stripe', category: 'Payment Gateway', status: 'demo' },
  { key: 'gcash', name: 'GCash', category: 'Payment Gateway', status: 'demo' },
  { key: 'maya', name: 'Maya', category: 'Payment Gateway', status: 'demo' },
  { key: 'delivery_platform', name: 'Delivery Platform', category: 'Delivery', status: 'demo' },
  { key: 'accounting', name: 'Accounting Export', category: 'Finance', status: 'demo' },
  { key: 'email', name: 'Email', category: 'Notifications', status: 'demo' },
  { key: 'sms', name: 'SMS', category: 'Notifications', status: 'demo' },
  { key: 'maps', name: 'Google Maps', category: 'Location', status: 'demo' },
]

export const integrationService = {
  async list(): Promise<Integration[]> {
    const rows = await db.select<Integration>('integrations')
    if (rows.length) return rows
    // Self-heal: seed defaults the first time this page is opened.
    const seeded = await db.insertMany<Integration>(
      'integrations',
      DEFAULT_INTEGRATIONS.map((i) => ({ id: uid('itg'), ...i })),
    )
    return seeded
  },

  toggle: (id: string, status: Integration['status']) => db.update<Integration>('integrations', id, { status }),
}
