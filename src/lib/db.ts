import { supabase, isSupabaseConfigured, SUPABASE_BUCKET } from './supabase'
import { localDb, onLocalChange, type Filter, type QueryOptions, type TableName } from './localDb'

/**
 * One async data facade over two interchangeable backends:
 *   - Supabase/Postgres when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set
 *   - a browser-persisted store otherwise, so the demo runs with zero setup
 *
 * Every service in src/services talks only to this module.
 */

export type { Filter, QueryOptions, TableName }

export const backend: 'supabase' | 'local' = isSupabaseConfigured ? 'supabase' : 'local'

export function uid(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export class DataError extends Error {
  cause?: unknown
  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'DataError'
    this.cause = cause
  }
}

// Tables whose schema (see supabase/schema.sql) omits created_at/updated_at —
// db.insert/update must not send columns these tables don't have.
const NO_CREATED_AT = new Set<TableName>(['website_content', 'restaurant_settings', 'integrations', 'purchase_order_items', 'b2b_order_items', 'cashier_shifts'])
const NO_UPDATED_AT = new Set<TableName>([
  'restaurant_tables', 'branches', 'order_items', 'inventory_transactions', 'notifications', 'favorites',
  'recipe_items', 'suppliers', 'purchase_orders', 'purchase_order_items', 'loyalty_transactions', 'promotions',
  'promotion_usage', 'resellers', 'b2b_order_items', 'invoices', 'cashier_shifts', 'audit_logs',
])

// Columns Postgres computes itself (`generated always as (...) stored`) — Supabase
// rejects any insert that supplies them explicitly. The local demo store has no
// database engine to compute them, so callers still pass a value for local mode;
// strip it only on the Supabase path.
const GENERATED_COLUMNS: Partial<Record<TableName, string[]>> = {
  order_items: ['subtotal'],
  purchase_order_items: ['subtotal'],
  b2b_order_items: ['subtotal'],
}

function applyFilters(query: any, filters: Filter[] = []) {
  let q = query
  filters.forEach((f) => {
    switch (f.op) {
      case 'eq':
        q = q.eq(f.column, f.value)
        break
      case 'neq':
        q = q.neq(f.column, f.value)
        break
      case 'in':
        q = q.in(f.column, f.value)
        break
      case 'gte':
        q = q.gte(f.column, f.value)
        break
      case 'lte':
        q = q.lte(f.column, f.value)
        break
      case 'ilike':
        q = q.ilike(f.column, `%${f.value}%`)
        break
    }
  })
  return q
}

export const db = {
  async select<T>(table: TableName, opts: QueryOptions = {}): Promise<T[]> {
    if (!supabase) return localDb.select(table, opts) as T[]
    let q = applyFilters(supabase.from(table).select('*'), opts.filters)
    if (opts.order) q = q.order(opts.order.column, { ascending: opts.order.ascending ?? true })
    if (opts.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (error) throw new DataError(error.message, error)
    return (data ?? []) as T[]
  },

  async selectOne<T>(table: TableName, id: string): Promise<T | null> {
    const rows = await db.select<T>(table, { filters: [{ column: 'id', op: 'eq', value: id }], limit: 1 })
    return rows[0] ?? null
  },

  async insert<T>(table: TableName, values: Record<string, any>): Promise<T> {
    const row: Record<string, any> = { id: values.id ?? uid(), ...values }
    if (!NO_CREATED_AT.has(table)) row.created_at ??= nowIso()
    if (!NO_UPDATED_AT.has(table)) row.updated_at ??= nowIso()
    if (!supabase) return localDb.insert(table, row) as T
    const remoteRow = { ...row }
    GENERATED_COLUMNS[table]?.forEach((col) => delete remoteRow[col])
    const { data, error } = await supabase.from(table).insert(remoteRow).select().single()
    if (error) throw new DataError(error.message, error)
    return data as T
  },

  async insertMany<T>(table: TableName, values: Record<string, any>[]): Promise<T[]> {
    const rows = values.map((v) => {
      const row: Record<string, any> = { id: v.id ?? uid(), ...v }
      if (!NO_CREATED_AT.has(table)) row.created_at ??= nowIso()
      return row
    })
    if (!supabase) return localDb.insertMany(table, rows) as T[]
    const generated = GENERATED_COLUMNS[table]
    const remoteRows = generated ? rows.map((r) => { const c = { ...r }; generated.forEach((col) => delete c[col]); return c }) : rows
    const { data, error } = await supabase.from(table).insert(remoteRows).select()
    if (error) throw new DataError(error.message, error)
    return (data ?? []) as T[]
  },

  async update<T>(table: TableName, id: string, patch: Record<string, any>): Promise<T> {
    const body = NO_UPDATED_AT.has(table) ? { ...patch } : { ...patch, updated_at: nowIso() }
    if (!supabase) {
      const row = localDb.update(table, id, body)
      if (!row) throw new DataError('Record not found.')
      return row as T
    }
    const { data, error } = await supabase.from(table).update(body).eq('id', id).select().single()
    if (error) throw new DataError(error.message, error)
    return data as T
  },

  async remove(table: TableName, id: string): Promise<void> {
    if (!supabase) return localDb.remove(table, id)
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw new DataError(error.message, error)
  },

  /** Fires whenever `table` changes — Supabase Realtime, or cross-tab events locally. */
  subscribe(tables: TableName[], cb: (table: TableName) => void): () => void {
    if (!supabase) {
      return onLocalChange((t) => {
        if (tables.includes(t)) cb(t)
      }) as unknown as () => void
    }
    const client = supabase
    const channel = client.channel(`th-${tables.join('-')}-${Math.random().toString(36).slice(2, 8)}`)
    tables.forEach((t) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => cb(t))
    })
    channel.subscribe()
    return () => {
      client.removeChannel(channel)
    }
  },

  /** Uploads to Supabase Storage when configured; falls back to an inline data URL. */
  async uploadImage(file: File, folder = 'gallery'): Promise<string> {
    if (!supabase) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new DataError('Could not read that image file.'))
        reader.readAsDataURL(file)
      })
    }
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${folder}/${uid()}.${ext}`
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, { upsert: true })
    if (error) throw new DataError(error.message, error)
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path)
    return data.publicUrl
  },
}

export const eq = (column: string, value: any): Filter => ({ column, op: 'eq', value })
