import { db, uid, DataError } from '../lib/db'
import type {
  InventoryItem,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequest,
  Supplier,
} from '../types'
import { notificationService } from './notifications'
import { auditService } from './audit'
import { inventoryService } from './inventory'

/**
 * Procurement (section 17 / 3.D / 16): Low stock → Purchase Request → Manager
 * approval → Purchase Order → Supplier → Goods Received → Inventory updated.
 */

function poNumber() {
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `PO-${stamp}-${Math.floor(100 + Math.random() * 899)}`
}

export const supplierService = {
  list: () => db.select<Supplier>('suppliers', { order: { column: 'name', ascending: true } }),
  create: (values: Partial<Supplier>) =>
    db.insert<Supplier>('suppliers', { id: uid('sup'), status: 'active', ...values }),
  update: (id: string, patch: Partial<Supplier>) => db.update<Supplier>('suppliers', id, patch),
  remove: (id: string) => db.remove('suppliers', id),
}

export const procurementService = {
  listRequests: () =>
    db.select<PurchaseRequest>('purchase_requests', { order: { column: 'created_at', ascending: false } }),

  listOrders: () =>
    db.select<PurchaseOrder>('purchase_orders', { order: { column: 'created_at', ascending: false } }),

  listOrderItems: (poId: string) =>
    db.select<PurchaseOrderItem>('purchase_order_items', { filters: [{ column: 'purchase_order_id', op: 'eq', value: poId }] }),

  /** Auto-triggered from inventory when stock drops below minimum (idempotent-ish: skips if one is already pending). */
  async autoCreateRequest(item: InventoryItem, actor = 'System (auto low-stock)'): Promise<void> {
    const existing = await db.select<PurchaseRequest>('purchase_requests', {
      filters: [
        { column: 'inventory_id', op: 'eq', value: item.id },
        { column: 'status', op: 'eq', value: 'pending' },
      ],
    })
    if (existing.length) return
    const requestedQty = Math.max(item.minimum_stock * 2 - item.stock, item.minimum_stock)
    await db.insert<PurchaseRequest>('purchase_requests', {
      id: uid('pr'),
      inventory_id: item.id,
      ingredient_name: item.name,
      requested_qty: Number(requestedQty.toFixed(2)),
      unit: item.unit,
      reason: `Auto-generated: stock (${item.stock} ${item.unit}) is below minimum (${item.minimum_stock} ${item.unit}).`,
      status: 'pending',
      requested_by: actor,
      approved_by: null,
    })
    await notificationService.create({
      type: 'procurement',
      title: 'Purchase request created',
      message: `${item.name}: restock request for ${requestedQty.toFixed(0)} ${item.unit} awaiting manager approval.`,
      link: '/admin/procurement',
    })
  },

  async createRequest(input: { inventory_id: string; requested_qty: number; reason: string; requested_by: string }) {
    const item = await db.selectOne<InventoryItem>('inventory', input.inventory_id)
    if (!item) throw new DataError('Ingredient not found.')
    return db.insert<PurchaseRequest>('purchase_requests', {
      id: uid('pr'),
      inventory_id: item.id,
      ingredient_name: item.name,
      requested_qty: input.requested_qty,
      unit: item.unit,
      reason: input.reason,
      status: 'pending',
      requested_by: input.requested_by,
      approved_by: null,
    })
  },

  async approveRequest(id: string, approver: string): Promise<PurchaseRequest> {
    const updated = await db.update<PurchaseRequest>('purchase_requests', id, { status: 'approved', approved_by: approver })
    await auditService.log({ actor_name: approver, action: 'approved', entity: 'purchase_request', entity_id: id, detail: `Approved restock request for ${updated.ingredient_name}.` })
    return updated
  },

  async rejectRequest(id: string, approver: string): Promise<PurchaseRequest> {
    return db.update<PurchaseRequest>('purchase_requests', id, { status: 'rejected', approved_by: approver })
  },

  /** Converts an approved request into a Purchase Order sent to a supplier. */
  async convertToPurchaseOrder(requestId: string, supplierId: string, unitCost: number): Promise<PurchaseOrder> {
    const request = await db.selectOne<PurchaseRequest>('purchase_requests', requestId)
    if (!request) throw new DataError('Purchase request not found.')
    if (request.status !== 'approved') throw new DataError('Only approved requests can become a purchase order.')
    const supplier = await db.selectOne<Supplier>('suppliers', supplierId)
    if (!supplier) throw new DataError('Supplier not found.')

    const total = Number((unitCost * request.requested_qty).toFixed(2))
    const po = await db.insert<PurchaseOrder>('purchase_orders', {
      id: uid('po'),
      po_number: poNumber(),
      supplier_id: supplierId,
      purchase_request_id: requestId,
      status: 'sent',
      total,
      received_at: null,
    })
    await db.insert<PurchaseOrderItem>('purchase_order_items', {
      id: uid('poi'),
      purchase_order_id: po.id,
      inventory_id: request.inventory_id,
      ingredient_name: request.ingredient_name,
      quantity: request.requested_qty,
      unit_cost: unitCost,
      subtotal: total,
    })
    await db.update<PurchaseRequest>('purchase_requests', requestId, { status: 'converted' })
    await auditService.log({ actor_name: supplier.name, action: 'sent', entity: 'purchase_order', entity_id: po.id, detail: `${po.po_number} sent to ${supplier.name} for ${request.ingredient_name}.` })
    return po
  },

  /** Goods Received: marks the PO received and stocks the ingredient back in. */
  async receiveOrder(poId: string, receivedBy: string): Promise<PurchaseOrder> {
    const po = await db.selectOne<PurchaseOrder>('purchase_orders', poId)
    if (!po) throw new DataError('Purchase order not found.')
    if (po.status === 'received') return po
    const items = await procurementService.listOrderItems(poId)
    for (const item of items) {
      await inventoryService.recordTransaction({
        inventory_id: item.inventory_id,
        type: 'stock_in',
        quantity: item.quantity,
        note: `Received ${po.po_number}`,
        created_by: receivedBy,
      })
    }
    const updated = await db.update<PurchaseOrder>('purchase_orders', poId, {
      status: 'received',
      received_at: new Date().toISOString(),
    })
    await auditService.log({ actor_name: receivedBy, action: 'received', entity: 'purchase_order', entity_id: poId, detail: `${po.po_number} received into inventory.` })
    return updated
  },
}
