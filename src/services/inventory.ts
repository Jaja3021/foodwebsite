import { db, uid, DataError } from '../lib/db'
import type { InventoryItem, InventoryStatus, InventoryTransaction, OrderItem, RecipeItem } from '../types'
import { notificationService } from './notifications'
import { procurementService } from './procurement'

/** Legacy fallback recipe map used only for menu items with no `recipe_items` BOM row. */
const RECIPES: Record<string, Array<{ ingredient: string; qty: number }>> = {
  Tapsilog: [
    { ingredient: 'Beef Tapa', qty: 0.15 },
    { ingredient: 'Rice', qty: 0.2 },
    { ingredient: 'Eggs', qty: 1 },
    { ingredient: 'Garlic', qty: 0.01 },
  ],
  Longsilog: [
    { ingredient: 'Longganisa', qty: 0.12 },
    { ingredient: 'Rice', qty: 0.2 },
    { ingredient: 'Eggs', qty: 1 },
  ],
  Hotsilog: [
    { ingredient: 'Hotdog', qty: 0.12 },
    { ingredient: 'Rice', qty: 0.2 },
    { ingredient: 'Eggs', qty: 1 },
  ],
  Silog: [
    { ingredient: 'Rice', qty: 0.2 },
    { ingredient: 'Eggs', qty: 1 },
    { ingredient: 'Cooking Oil', qty: 0.02 },
  ],
}

function recipeFor(itemName: string) {
  if (itemName.includes('Tapsilog')) return RECIPES.Tapsilog
  if (itemName.includes('Longsilog')) return RECIPES.Longsilog
  if (itemName.includes('Hotsilog')) return RECIPES.Hotsilog
  if (itemName.toLowerCase().includes('silog')) return RECIPES.Silog
  return []
}

export function inventoryStatus(item: InventoryItem): InventoryStatus {
  if (item.stock <= 0) return 'out_of_stock'
  if (item.stock < item.minimum_stock) return 'low_stock'
  return 'in_stock'
}

export const INVENTORY_STATUS_LABEL: Record<InventoryStatus, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
}

export const inventoryService = {
  list: () => db.select<InventoryItem>('inventory', { order: { column: 'name', ascending: true } }),

  create: (values: Partial<InventoryItem>) =>
    db.insert<InventoryItem>('inventory', {
      id: uid('inv'),
      stock: 0,
      minimum_stock: 0,
      unit: 'kg',
      supplier: null,
      ...values,
    }),

  update: (id: string, patch: Partial<InventoryItem>) => db.update<InventoryItem>('inventory', id, patch),

  remove: (id: string) => db.remove('inventory', id),

  listTransactions: (limit = 60) =>
    db.select<InventoryTransaction>('inventory_transactions', {
      order: { column: 'created_at', ascending: false },
      limit,
    }),

  async recordTransaction(input: {
    inventory_id: string
    type: InventoryTransaction['type']
    quantity: number
    note?: string
    created_by?: string
  }): Promise<InventoryItem> {
    const item = await db.selectOne<InventoryItem>('inventory', input.inventory_id)
    if (!item) throw new DataError('Ingredient not found.')
    if (input.quantity <= 0) throw new DataError('Quantity must be greater than zero.')

    const delta =
      input.type === 'stock_in' ? input.quantity : input.type === 'stock_out' ? -input.quantity : input.quantity - item.stock

    const nextStock = Math.max(0, Number((item.stock + delta).toFixed(3)))

    await db.insert<InventoryTransaction>('inventory_transactions', {
      id: uid('itx'),
      inventory_id: item.id,
      type: input.type,
      quantity: input.quantity,
      note: input.note ?? null,
      created_by: input.created_by ?? null,
    })

    const updated = await db.update<InventoryItem>('inventory', item.id, { stock: nextStock })
    await warnIfLow(updated)
    return updated
  },

  /**
   * Called when an order is completed (section 15). Uses the data-driven
   * `recipe_items` BOM when one exists for a menu item, falling back to the
   * legacy name-based heuristic for items nobody has built a recipe for yet.
   */
  async consumeForOrder(orderId: string): Promise<void> {
    const [orderItems, stock, recipeItems] = await Promise.all([
      db.select<OrderItem>('order_items', { filters: [{ column: 'order_id', op: 'eq', value: orderId }] }),
      db.select<InventoryItem>('inventory'),
      db.select<RecipeItem>('recipe_items'),
    ])
    const byId = new Map(stock.map((s) => [s.id, s]))
    const byName = new Map(stock.map((s) => [s.name, s]))
    const recipesByMenuItem = new Map<string, RecipeItem[]>()
    recipeItems.forEach((r) => {
      const list = recipesByMenuItem.get(r.menu_item_id) ?? []
      list.push(r)
      recipesByMenuItem.set(r.menu_item_id, list)
    })

    const usage = new Map<string, number>() // inventory_id -> qty

    orderItems.forEach((oi) => {
      const bom = recipesByMenuItem.get(oi.menu_item_id)
      if (bom?.length) {
        bom.forEach((r) => usage.set(r.inventory_id, (usage.get(r.inventory_id) ?? 0) + r.quantity_per_serving * oi.quantity))
      } else {
        recipeFor(oi.item_name).forEach(({ ingredient, qty }) => {
          const item = byName.get(ingredient)
          if (!item) return
          usage.set(item.id, (usage.get(item.id) ?? 0) + qty * oi.quantity)
        })
      }
    })

    for (const [inventoryId, qty] of usage) {
      const item = byId.get(inventoryId)
      if (!item || qty <= 0) continue
      const nextStock = Math.max(0, Number((item.stock - qty).toFixed(3)))
      await db.insert<InventoryTransaction>('inventory_transactions', {
        id: uid('itx'),
        inventory_id: item.id,
        type: 'stock_out',
        quantity: Number(qty.toFixed(3)),
        note: `Auto-deducted for order ${orderId}`,
        created_by: 'system',
      })
      const updated = await db.update<InventoryItem>('inventory', item.id, { stock: nextStock })
      await warnIfLow(updated)
    }
  },
}

async function warnIfLow(item: InventoryItem) {
  const status = inventoryStatus(item)
  if (status === 'in_stock') return
  await notificationService.create({
    type: 'inventory',
    title: status === 'out_of_stock' ? 'Out of stock' : 'Low stock warning',
    message:
      status === 'out_of_stock'
        ? `${item.name} has run out.`
        : `${item.name} is below minimum stock (${item.stock} ${item.unit} left).`,
    link: '/admin/inventory',
  })
  // Section 16: automated replenishment — low/out-of-stock kicks off procurement.
  await procurementService.autoCreateRequest(item)
}
