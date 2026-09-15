import { buildSeed } from '../data/seed'

/**
 * Browser-persisted relational store used when no Supabase project is configured.
 * Table shapes match `supabase/schema.sql` exactly, so the service layer above it
 * is identical for both backends.
 */

export type Row = Record<string, any>
export type DbShape = Record<string, Row[]>

export type TableName =
  | 'profiles'
  | 'staff'
  | 'menu_categories'
  | 'menu_items'
  | 'customers'
  | 'orders'
  | 'order_items'
  | 'payments'
  | 'reservations'
  | 'restaurant_tables'
  | 'inventory'
  | 'inventory_transactions'
  | 'reviews'
  | 'gallery'
  | 'website_content'
  | 'restaurant_settings'
  | 'notifications'
  | 'favorites'
  | 'branches'
  | 'recipe_items'
  | 'suppliers'
  | 'purchase_requests'
  | 'purchase_orders'
  | 'purchase_order_items'
  | 'deliveries'
  | 'loyalty_accounts'
  | 'loyalty_transactions'
  | 'promotions'
  | 'promotion_usage'
  | 'resellers'
  | 'b2b_orders'
  | 'b2b_order_items'
  | 'invoices'
  | 'cashier_shifts'
  | 'audit_logs'
  | 'integrations'

// v2: bumped for the enterprise-system expansion (new modules/tables) so returning
// browsers pick up the richer seed instead of an old v1 snapshot missing them.
const STORAGE_KEY = 'tapahey.db.v2'
const CHANGE_KEY = 'tapahey.db.change.v2'

type Listener = (table: TableName) => void
const listeners = new Set<Listener>()

let cache: DbShape | null = null

function read(): DbShape {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      cache = JSON.parse(raw) as DbShape
      return cache
    }
  } catch {
    /* corrupted storage falls through to a fresh seed */
  }
  cache = buildSeed()
  persist()
  return cache
}

function persist() {
  if (!cache) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    /* quota exceeded — the in-memory copy still works for this session */
  }
}

function announce(table: TableName) {
  listeners.forEach((fn) => fn(table))
  try {
    // Cross-tab realtime: other tabs pick this up via the `storage` event.
    localStorage.setItem(CHANGE_KEY, JSON.stringify({ table, at: Date.now() }))
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CHANGE_KEY && e.newValue) {
      cache = null // another tab wrote; drop our copy and re-read
      try {
        const { table } = JSON.parse(e.newValue) as { table: TableName }
        listeners.forEach((fn) => fn(table))
      } catch {
        /* ignore */
      }
    }
  })
}

export function onLocalChange(fn: Listener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function resetLocalDb() {
  cache = buildSeed()
  persist()
  announce('orders')
}

export function exportLocalDb(): DbShape {
  return structuredClone(read())
}

function table(name: TableName): Row[] {
  const db = read()
  if (!db[name]) db[name] = []
  return db[name]
}

export interface Filter {
  column: string
  op: 'eq' | 'neq' | 'in' | 'gte' | 'lte' | 'ilike'
  value: any
}

export interface QueryOptions {
  filters?: Filter[]
  order?: { column: string; ascending?: boolean }
  limit?: number
}

function matches(row: Row, f: Filter): boolean {
  const v = row[f.column]
  switch (f.op) {
    case 'eq':
      return v === f.value
    case 'neq':
      return v !== f.value
    case 'in':
      return Array.isArray(f.value) && f.value.includes(v)
    case 'gte':
      return v >= f.value
    case 'lte':
      return v <= f.value
    case 'ilike':
      return String(v ?? '').toLowerCase().includes(String(f.value).toLowerCase())
    default:
      return true
  }
}

export const localDb = {
  select(name: TableName, opts: QueryOptions = {}): Row[] {
    let rows = table(name).slice()
    if (opts.filters) rows = rows.filter((r) => opts.filters!.every((f) => matches(r, f)))
    if (opts.order) {
      const { column, ascending = true } = opts.order
      rows.sort((a, b) => {
        const av = a[column]
        const bv = b[column]
        if (av === bv) return 0
        return (av > bv ? 1 : -1) * (ascending ? 1 : -1)
      })
    }
    if (opts.limit) rows = rows.slice(0, opts.limit)
    return structuredClone(rows)
  },

  insert(name: TableName, values: Row): Row {
    const rows = table(name)
    rows.push(values)
    persist()
    announce(name)
    return structuredClone(values)
  },

  insertMany(name: TableName, values: Row[]): Row[] {
    const rows = table(name)
    rows.push(...values)
    persist()
    announce(name)
    return structuredClone(values)
  },

  update(name: TableName, id: string, patch: Row): Row | null {
    const rows = table(name)
    const idx = rows.findIndex((r) => r.id === id)
    if (idx === -1) return null
    rows[idx] = { ...rows[idx], ...patch }
    persist()
    announce(name)
    return structuredClone(rows[idx])
  },

  remove(name: TableName, id: string): void {
    const db = read()
    db[name] = table(name).filter((r) => r.id !== id)
    persist()
    announce(name)
  },
}
