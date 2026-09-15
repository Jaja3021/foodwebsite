import { db, uid } from '../lib/db'
import type { InventoryItem, RecipeItem } from '../types'

/**
 * Recipe / BOM (Bill of Materials) — section 14/15. Each menu item can have
 * zero or more recipe lines, each pointing at an inventory ingredient and how
 * much of it one serving consumes. inventoryService.consumeForOrder() reads
 * this table to auto-deduct stock when an order completes.
 */
export const recipeService = {
  listAll: () => db.select<RecipeItem>('recipe_items'),

  listForItem: (menuItemId: string) =>
    db.select<RecipeItem>('recipe_items', { filters: [{ column: 'menu_item_id', op: 'eq', value: menuItemId }] }),

  async addLine(input: { menu_item_id: string; inventory_id: string; quantity_per_serving: number }) {
    const ingredient = await db.selectOne<InventoryItem>('inventory', input.inventory_id)
    if (!ingredient) throw new Error('Ingredient not found.')
    return db.insert<RecipeItem>('recipe_items', {
      id: uid('rcp'),
      menu_item_id: input.menu_item_id,
      inventory_id: input.inventory_id,
      ingredient_name: ingredient.name,
      quantity_per_serving: input.quantity_per_serving,
      unit: ingredient.unit,
    })
  },

  remove: (id: string) => db.remove('recipe_items', id),

  /** ₱ cost of one serving, using each ingredient's average unit cost. */
  async costFor(menuItemId: string, ingredientCost: Map<string, number>): Promise<number> {
    const lines = await recipeService.listForItem(menuItemId)
    return lines.reduce((sum, l) => sum + l.quantity_per_serving * (ingredientCost.get(l.inventory_id) ?? 0), 0)
  },
}
