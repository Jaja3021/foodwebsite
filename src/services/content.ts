import { db, uid } from '../lib/db'
import type { GalleryImage, RestaurantSettings, WebsiteContent } from '../types'

export const contentService = {
  async getSection<T = Record<string, any>>(section: string): Promise<T | null> {
    const rows = await db.select<WebsiteContent>('website_content', {
      filters: [{ column: 'section', op: 'eq', value: section }],
      limit: 1,
    })
    return (rows[0]?.content as T) ?? null
  },

  listSections: () => db.select<WebsiteContent>('website_content'),

  async updateSection(section: string, content: Record<string, unknown>): Promise<WebsiteContent> {
    const rows = await db.select<WebsiteContent>('website_content', {
      filters: [{ column: 'section', op: 'eq', value: section }],
      limit: 1,
    })
    if (rows[0]) return db.update<WebsiteContent>('website_content', rows[0].id, { content })
    return db.insert<WebsiteContent>('website_content', { id: uid('wc'), section, content })
  },

  async getSettings(): Promise<RestaurantSettings> {
    const rows = await db.select<RestaurantSettings>('restaurant_settings', { limit: 1 })
    return rows[0]
  },

  async updateSettings(patch: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    const current = await contentService.getSettings()
    return db.update<RestaurantSettings>('restaurant_settings', current.id, patch)
  },
}

export const galleryService = {
  listApproved: () =>
    db.select<GalleryImage>('gallery', {
      filters: [{ column: 'approved', op: 'eq', value: true }],
      order: { column: 'sort_order', ascending: true },
    }),

  listAll: () => db.select<GalleryImage>('gallery', { order: { column: 'sort_order', ascending: true } }),

  async upload(file: File, title: string): Promise<GalleryImage> {
    const image_url = await db.uploadImage(file, 'gallery')
    const existing = await galleryService.listAll()
    return db.insert<GalleryImage>('gallery', {
      id: uid('gal'),
      title: title || file.name,
      image_url,
      sort_order: existing.length + 1,
      approved: true,
    })
  },

  update: (id: string, patch: Partial<GalleryImage>) => db.update<GalleryImage>('gallery', id, patch),

  remove: (id: string) => db.remove('gallery', id),

  async move(id: string, direction: -1 | 1): Promise<void> {
    const all = await galleryService.listAll()
    const idx = all.findIndex((g) => g.id === id)
    const swapIdx = idx + direction
    if (idx === -1 || swapIdx < 0 || swapIdx >= all.length) return
    const a = all[idx]
    const b = all[swapIdx]
    await db.update('gallery', a.id, { sort_order: b.sort_order })
    await db.update('gallery', b.id, { sort_order: a.sort_order })
  },
}
