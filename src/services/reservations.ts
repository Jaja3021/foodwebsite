import { db, uid, DataError } from '../lib/db'
import type { Reservation, ReservationStatus, RestaurantTable } from '../types'
import { notificationService } from './notifications'
import { isValidEmail, isValidPhone } from '../utils/format'

export const reservationService = {
  list: (opts?: { status?: ReservationStatus; customerId?: string }) =>
    db.select<Reservation>('reservations', {
      filters: [
        ...(opts?.status ? [{ column: 'status', op: 'eq' as const, value: opts.status }] : []),
        ...(opts?.customerId ? [{ column: 'customer_id', op: 'eq' as const, value: opts.customerId }] : []),
      ],
      order: { column: 'reserved_date', ascending: false },
    }),

  listByEmail: (email: string) =>
    db.select<Reservation>('reservations', {
      filters: [{ column: 'email', op: 'eq', value: email.trim().toLowerCase() }],
      order: { column: 'reserved_date', ascending: false },
    }),

  listTables: () =>
    db.select<RestaurantTable>('restaurant_tables', { order: { column: 'label', ascending: true } }),

  async create(input: {
    full_name: string
    email: string
    phone: string
    reserved_date: string
    reserved_time: string
    guests: number
    special_request?: string
    customer_id?: string | null
  }): Promise<Reservation> {
    if (!input.full_name.trim()) throw new DataError('Please enter your name.')
    if (!isValidEmail(input.email)) throw new DataError('Please enter a valid email address.')
    if (!isValidPhone(input.phone)) throw new DataError('Please enter a valid phone number.')
    if (!input.reserved_date || !input.reserved_time) throw new DataError('Please pick a date and time.')
    if (input.guests < 1 || input.guests > 30) throw new DataError('Guests must be between 1 and 30.')

    const today = new Date().toISOString().slice(0, 10)
    if (input.reserved_date < today) throw new DataError('Please choose a date that has not passed.')

    const reservation = await db.insert<Reservation>('reservations', {
      id: uid('rsv'),
      customer_id: input.customer_id ?? null,
      full_name: input.full_name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone,
      reserved_date: input.reserved_date,
      reserved_time: input.reserved_time,
      guests: input.guests,
      table_id: null,
      special_request: input.special_request?.trim() || null,
      status: 'pending',
    })

    await notificationService.create({
      type: 'reservation',
      title: 'New reservation',
      message: `${reservation.full_name} requested a table for ${reservation.guests} on ${reservation.reserved_date} at ${reservation.reserved_time}.`,
      link: '/admin/reservations',
    })
    return reservation
  },

  updateStatus: (id: string, status: ReservationStatus) =>
    db.update<Reservation>('reservations', id, { status }),

  reschedule: (id: string, reserved_date: string, reserved_time: string) =>
    db.update<Reservation>('reservations', id, { reserved_date, reserved_time, status: 'confirmed' }),

  assignTable: (id: string, table_id: string | null) => db.update<Reservation>('reservations', id, { table_id }),

  remove: (id: string) => db.remove('reservations', id),
}
