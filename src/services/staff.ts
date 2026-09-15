import { db, uid, DataError } from '../lib/db'
import type { Profile, Staff, StaffRole } from '../types'
import { isValidEmail } from '../utils/format'
import { supabase } from '../lib/supabase'

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  super_admin: 'Owner / Super Admin',
  operations: 'Operations',
  manager: 'Branch Manager',
  cashier: 'Cashier',
  kitchen: 'Kitchen Staff',
  warehouse: 'Warehouse',
  procurement: 'Procurement',
  finance: 'Finance / Accounting',
  marketing: 'Marketing / CRM',
  content_manager: 'Content Manager',
  qa_admin: 'QA / Admin',
  delivery_staff: 'Delivery Staff',
}

export const staffService = {
  list: () => db.select<Staff>('staff', { order: { column: 'created_at', ascending: true } }),

  async create(input: { full_name: string; email: string; role: StaffRole; phone?: string; password?: string }): Promise<Staff> {
    if (!input.full_name.trim()) throw new DataError('Please enter a name.')
    if (!isValidEmail(input.email)) throw new DataError('Please enter a valid email address.')
    const email = input.email.trim().toLowerCase()

    const existing = await db.select<Staff>('staff', {
      filters: [{ column: 'email', op: 'eq', value: email }],
      limit: 1,
    })
    if (existing[0]) throw new DataError('A staff member with that email already exists.')

    let profileId = uid('prf')
    const existingProfiles = await db.select<Profile>('profiles', {
      filters: [{ column: 'email', op: 'eq', value: email }],
      limit: 1,
    })

    if (existingProfiles[0]) {
      profileId = existingProfiles[0].id
      await db.update('profiles', profileId, { role: 'staff' })
    } else if (!supabase) {
      await db.insert<Profile>('profiles', {
        id: profileId,
        email,
        full_name: input.full_name.trim(),
        phone: input.phone ?? null,
        avatar_url: null,
        role: 'staff',
        password: input.password || 'DemoStaff123!',
      })
    } else {
      throw new DataError(
        'Create the Supabase Auth user first (Dashboard → Authentication → Users), then add them here using the same email.',
      )
    }

    return db.insert<Staff>('staff', {
      id: uid('stf'),
      profile_id: profileId,
      email,
      full_name: input.full_name.trim(),
      role: input.role,
      phone: input.phone ?? null,
      active: true,
    })
  },

  update: (id: string, patch: Partial<Staff>) => db.update<Staff>('staff', id, patch),

  async remove(id: string): Promise<void> {
    const all = await staffService.list()
    const target = all.find((s) => s.id === id)
    if (target?.role === 'super_admin' && all.filter((s) => s.role === 'super_admin').length <= 1) {
      throw new DataError('You cannot remove the only Super Admin.')
    }
    return db.remove('staff', id)
  },
}
