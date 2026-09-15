import { db, uid } from '../lib/db'
import type { Notification } from '../types'

export const notificationService = {
  list: (limit = 30) =>
    db.select<Notification>('notifications', { order: { column: 'created_at', ascending: false }, limit }),

  create: (input: Pick<Notification, 'type' | 'title' | 'message'> & { link?: string | null }) =>
    db.insert<Notification>('notifications', {
      id: uid('ntf'),
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      read: false,
    }),

  markRead: (id: string) => db.update<Notification>('notifications', id, { read: true }),

  async markAllRead() {
    const unread = await db.select<Notification>('notifications', {
      filters: [{ column: 'read', op: 'eq', value: false }],
    })
    await Promise.all(unread.map((n) => db.update('notifications', n.id, { read: true })))
  },

  remove: (id: string) => db.remove('notifications', id),
}
