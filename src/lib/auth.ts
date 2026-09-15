import { supabase } from './supabase'
import { db, uid, nowIso, DataError } from './db'
import type { Customer, Profile, Staff } from '../types'

export interface SessionUser {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: 'customer' | 'staff'
  staff: Staff | null
  customer: Customer | null
}

const SESSION_KEY = 'tapahey.session.v1'
const listeners = new Set<(u: SessionUser | null) => void>()

function emit(user: SessionUser | null) {
  listeners.forEach((fn) => fn(user))
}

async function hydrate(profile: Profile): Promise<SessionUser> {
  const [staffRows, customerRows] = await Promise.all([
    db.select<Staff>('staff', { filters: [{ column: 'profile_id', op: 'eq', value: profile.id }], limit: 1 }),
    db.select<Customer>('customers', { filters: [{ column: 'profile_id', op: 'eq', value: profile.id }], limit: 1 }),
  ])
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    phone: profile.phone,
    role: profile.role,
    staff: staffRows[0] ?? null,
    customer: customerRows[0] ?? null,
  }
}

export const auth = {
  onChange(fn: (u: SessionUser | null) => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  async getUser(): Promise<SessionUser | null> {
    if (supabase) {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return null
      const profile = await db.selectOne<Profile>('profiles', data.user.id)
      if (!profile) return null
      return hydrate(profile)
    }
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const profile = await db.selectOne<Profile>('profiles', raw)
    if (!profile) return null
    return hydrate(profile)
  },

  async signIn(email: string, password: string): Promise<SessionUser> {
    const normalised = email.trim().toLowerCase()
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalised, password })
      if (error) throw new DataError('Incorrect email or password.')
      const profile = await db.selectOne<Profile>('profiles', data.user.id)
      if (!profile) throw new DataError('No profile is linked to this account.')
      const user = await hydrate(profile)
      emit(user)
      return user
    }

    const rows = await db.select<Profile>('profiles', {
      filters: [{ column: 'email', op: 'eq', value: normalised }],
      limit: 1,
    })
    const profile = rows[0]
    if (!profile || profile.password !== password) throw new DataError('Incorrect email or password.')
    localStorage.setItem(SESSION_KEY, profile.id)
    const user = await hydrate(profile)
    emit(user)
    return user
  },

  async signUp(input: { email: string; password: string; full_name: string; phone?: string }): Promise<SessionUser> {
    const normalised = input.email.trim().toLowerCase()

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email: normalised, password: input.password })
      if (error) throw new DataError(error.message)
      if (!data.user) throw new DataError('Check your inbox to confirm your email, then sign in.')
      const profile = await db.insert<Profile>('profiles', {
        id: data.user.id,
        email: normalised,
        full_name: input.full_name,
        phone: input.phone ?? null,
        avatar_url: null,
        role: 'customer',
      })
      await ensureCustomer(profile)
      const user = await hydrate(profile)
      emit(user)
      return user
    }

    const existing = await db.select<Profile>('profiles', {
      filters: [{ column: 'email', op: 'eq', value: normalised }],
      limit: 1,
    })
    if (existing.length) throw new DataError('An account with that email already exists.')

    const profile = await db.insert<Profile>('profiles', {
      id: uid('prf'),
      email: normalised,
      full_name: input.full_name,
      phone: input.phone ?? null,
      avatar_url: null,
      role: 'customer',
      password: input.password,
    })
    await ensureCustomer(profile)
    localStorage.setItem(SESSION_KEY, profile.id)
    const user = await hydrate(profile)
    emit(user)
    return user
  },

  async signOut(): Promise<void> {
    if (supabase) await supabase.auth.signOut()
    localStorage.removeItem(SESSION_KEY)
    emit(null)
  },

  async updateProfile(id: string, patch: Partial<Profile>): Promise<SessionUser> {
    const profile = await db.update<Profile>('profiles', id, patch)
    const customers = await db.select<Customer>('customers', {
      filters: [{ column: 'profile_id', op: 'eq', value: id }],
      limit: 1,
    })
    if (customers[0]) {
      await db.update('customers', customers[0].id, {
        full_name: patch.full_name ?? customers[0].full_name,
        phone: patch.phone ?? customers[0].phone,
      })
    }
    const user = await hydrate(profile)
    emit(user)
    return user
  },
}

async function ensureCustomer(profile: Profile): Promise<Customer> {
  const rows = await db.select<Customer>('customers', {
    filters: [{ column: 'email', op: 'eq', value: profile.email }],
    limit: 1,
  })
  if (rows[0]) {
    return rows[0].profile_id ? rows[0] : db.update<Customer>('customers', rows[0].id, { profile_id: profile.id })
  }
  return db.insert<Customer>('customers', {
    id: uid('cus'),
    profile_id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    address: null,
    active: true,
    created_at: nowIso(),
  })
}

export { ensureCustomer }

export const ROLE_PERMISSIONS: Record<Staff['role'], string[]> = {
  super_admin: [
    'dashboard', 'orders', 'pos', 'menu', 'categories', 'reservations', 'customers',
    'inventory', 'reports', 'reviews', 'gallery', 'content', 'staff', 'settings',
    'branches', 'procurement', 'kitchen', 'delivery', 'loyalty', 'promotions', 'b2b',
    'finance', 'owner_cockpit', 'architecture', 'integrations', 'demo_center', 'audit',
  ],
  operations: ['dashboard', 'branches', 'orders', 'inventory', 'procurement', 'kitchen', 'delivery', 'reports'],
  manager: ['dashboard', 'orders', 'pos', 'menu', 'categories', 'reservations', 'customers', 'inventory', 'reports', 'staff'],
  cashier: ['dashboard', 'orders', 'pos', 'customers'],
  kitchen: ['orders', 'kitchen'],
  warehouse: ['inventory', 'procurement'],
  procurement: ['procurement'],
  finance: ['dashboard', 'reports', 'finance', 'b2b'],
  marketing: ['customers', 'loyalty', 'promotions', 'content', 'gallery', 'reviews'],
  content_manager: ['content', 'gallery', 'reviews'],
  qa_admin: ['staff', 'audit', 'settings', 'integrations'],
  delivery_staff: ['delivery'],
}

export function canAccess(user: SessionUser | null, section: string): boolean {
  if (!user?.staff || !user.staff.active) return false
  return ROLE_PERMISSIONS[user.staff.role].includes(section)
}

/**
 * TEMPORARY DEMO CONVENIENCE — auto-signs in as the seeded Super Admin so
 * /admin and /pos can be opened straight from the launcher with no login
 * screen, the same way /home needs none. Remove this (and restore the
 * `/admin/login` redirect in AdminLayout/POS) before any real deployment —
 * it only works in local demo mode, where the seeded credentials exist.
 */
let bypassInFlight = false
export async function bypassStaffLogin(): Promise<void> {
  if (bypassInFlight) return
  bypassInFlight = true
  try {
    await auth.signIn('admin@tapahey.demo', 'DemoAdmin123!')
  } catch {
    /* Supabase mode, or the demo account was removed — fall back to the real login screen. */
  } finally {
    bypassInFlight = false
  }
}
