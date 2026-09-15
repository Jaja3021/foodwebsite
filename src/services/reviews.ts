import { db, uid, DataError } from '../lib/db'
import type { Review } from '../types'
import { notificationService } from './notifications'

export const reviewService = {
  listApproved: (limit?: number) =>
    db.select<Review>('reviews', {
      filters: [{ column: 'approved', op: 'eq', value: true }],
      order: { column: 'created_at', ascending: false },
      limit,
    }),

  listAll: () => db.select<Review>('reviews', { order: { column: 'created_at', ascending: false } }),

  listByCustomer: (customerId: string) =>
    db.select<Review>('reviews', {
      filters: [{ column: 'customer_id', op: 'eq', value: customerId }],
      order: { column: 'created_at', ascending: false },
    }),

  async create(input: {
    customer_name: string
    rating: number
    comment: string
    customer_id?: string | null
    order_id?: string | null
  }): Promise<Review> {
    if (!input.customer_name.trim()) throw new DataError('Please enter your name.')
    if (input.rating < 1 || input.rating > 5) throw new DataError('Please pick a rating from 1 to 5.')
    if (input.comment.trim().length < 10) throw new DataError('Please write at least 10 characters.')

    const review = await db.insert<Review>('reviews', {
      id: uid('rev'),
      customer_id: input.customer_id ?? null,
      order_id: input.order_id ?? null,
      customer_name: input.customer_name.trim(),
      avatar_url: null,
      rating: input.rating,
      comment: input.comment.trim(),
      approved: false,
      reply: null,
    })

    await notificationService.create({
      type: 'review',
      title: 'New review awaiting approval',
      message: `${review.customer_name} left a ${review.rating}-star review.`,
      link: '/admin/reviews',
    })
    return review
  },

  setApproved: (id: string, approved: boolean) => db.update<Review>('reviews', id, { approved }),

  reply: (id: string, reply: string) => db.update<Review>('reviews', id, { reply: reply.trim() || null }),

  remove: (id: string) => db.remove('reviews', id),

  stats(reviews: Review[]) {
    const approved = reviews.filter((r) => r.approved)
    const total = approved.length
    const average = total ? approved.reduce((s, r) => s + r.rating, 0) / total : 0
    const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: approved.filter((r) => r.rating === stars).length,
    }))
    return { total, average, breakdown, pending: reviews.filter((r) => !r.approved).length }
  },
}
