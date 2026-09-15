import { db, uid } from '../lib/db'
import type { MenuCategory, MenuItem } from '../types'

export const menuService = {
  listCategories: (opts?: { activeOnly?: boolean }) =>
    db.select<MenuCategory>('menu_categories', {
      filters: opts?.activeOnly ? [{ column: 'active', op: 'eq', value: true }] : [],
      order: { column: 'sort_order', ascending: true },
    }),

  listItems: (opts?: { availableOnly?: boolean; categoryId?: string }) =>
    db.select<MenuItem>('menu_items', {
      filters: [
        ...(opts?.availableOnly ? [{ column: 'available', op: 'eq' as const, value: true }] : []),
        ...(opts?.categoryId ? [{ column: 'category_id', op: 'eq' as const, value: opts.categoryId }] : []),
      ],
      order: { column: 'sort_order', ascending: true },
    }),

  listBestSellers: async (limit = 6) => {
    const items = await db.select<MenuItem>('menu_items', {
      filters: [
        { column: 'best_seller', op: 'eq', value: true },
        { column: 'available', op: 'eq', value: true },
      ],
      order: { column: 'sort_order', ascending: true },
    })
    if (items.length >= limit) return items.slice(0, limit)
    const rest = await db.select<MenuItem>('menu_items', {
      filters: [{ column: 'available', op: 'eq', value: true }],
      order: { column: 'sort_order', ascending: true },
    })
    const ids = new Set(items.map((i) => i.id))
    return [...items, ...rest.filter((i) => !ids.has(i.id))].slice(0, limit)
  },

  getItem: (id: string) => db.selectOne<MenuItem>('menu_items', id),

  createItem: (values: Partial<MenuItem>) =>
    db.insert<MenuItem>('menu_items', {
      id: uid('itm'),
      sort_order: 99,
      prep_time_minutes: 15,
      available: true,
      best_seller: false,
      discount_price: null,
      image_url: '/images/menu/side.jpg',
      sku: `TH-${Date.now().toString(36).toUpperCase()}`,
      barcode: null,
      cost: 0,
      wholesale_price: null,
      product_type: 'menu',
      batch_number: null,
      expiration_date: null,
      ...values,
    }),

  updateItem: (id: string, patch: Partial<MenuItem>) => db.update<MenuItem>('menu_items', id, patch),

  deleteItem: (id: string) => db.remove('menu_items', id),

  createCategory: (values: Partial<MenuCategory>) =>
    db.insert<MenuCategory>('menu_categories', {
      id: uid('cat'),
      active: true,
      sort_order: 99,
      description: null,
      slug: (values.name ?? '').toLowerCase().replace(/\s+/g, '-'),
      ...values,
    }),

  updateCategory: (id: string, patch: Partial<MenuCategory>) =>
    db.update<MenuCategory>('menu_categories', id, patch),

  deleteCategory: async (id: string) => {
    const items = await db.select<MenuItem>('menu_items', {
      filters: [{ column: 'category_id', op: 'eq', value: id }],
      limit: 1,
    })
    if (items.length) throw new Error('This category still has menu items. Move or delete them first.')
    return db.remove('menu_categories', id)
  },
}

export const effectivePrice = (item: MenuItem) => item.discount_price ?? item.price
