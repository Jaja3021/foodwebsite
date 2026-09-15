import { db } from '../lib/db'
import { orderService } from './orders'
import { inventoryService } from './inventory'
import { procurementService } from './procurement'
import { deliveryService } from './delivery'
import { b2bService, resellerService } from './b2b'
import { financeService } from './finance'
import type { MenuItem, PurchaseRequest, Supplier } from '../types'

export interface ScenarioResult {
  title: string
  summary: string
}

async function firstMenuItem(nameIncludes: string): Promise<MenuItem> {
  const items = await db.select<MenuItem>('menu_items')
  const found = items.find((i) => i.name.includes(nameIncludes)) ?? items[0]
  return found
}

export const demoScenarios = {
  async posSale(): Promise<ScenarioResult> {
    const classic = await firstMenuItem('Classic Tapsilog')
    const tea = await firstMenuItem('Bottomless Iced Tea')
    const lines = [
      { menu_item_id: classic.id, name: classic.name, price: classic.price, image_url: classic.image_url, quantity: 2 },
      { menu_item_id: tea.id, name: tea.name, price: tea.price, image_url: tea.image_url, quantity: 1 },
    ]
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0)
    const order = await orderService.createOrder({
      customer_name: 'Walk-in Customer', customer_email: 'walkin@tapahey.demo', customer_phone: 'N/A',
      order_type: 'dine_in', table_number: '3', lines, subtotal, delivery_fee: 0, discount: 0, total: subtotal, channel: 'pos',
    })
    await orderService.markPaid(order.id, 'paid')
    await orderService.updateStatus(order.id, 'confirmed')
    await orderService.updateStatus(order.id, 'preparing')
    await orderService.updateStatus(order.id, 'ready')
    await orderService.updateStatus(order.id, 'completed')
    return { title: 'POS Sale', summary: `${order.order_number} rang up, paid cash, cooked and completed — inventory deducted automatically.` }
  },

  async onlineOrder(): Promise<ScenarioResult> {
    const item = await firstMenuItem('Spicy Tapsilog')
    const lines = [{ menu_item_id: item.id, name: item.name, price: item.price, image_url: item.image_url, quantity: 1 }]
    const order = await orderService.createOrder({
      customer_name: 'Juan Dela Cruz', customer_email: 'juan@tapahey.demo', customer_phone: '+63 917 555 0101',
      order_type: 'delivery', delivery_address: '12 Mabini St, Brgy. San Isidro, Quezon City', delivery_city: 'Quezon City',
      lines, subtotal: item.price, delivery_fee: 50, discount: 0, total: item.price + 50, channel: 'website',
    })
    await orderService.markPaid(order.id, 'paid')
    await orderService.updateStatus(order.id, 'confirmed')
    return { title: 'Online Order', summary: `${order.order_number} placed on the website via GCash Demo and sent to the kitchen queue.` }
  },

  async paymentSuccess(): Promise<ScenarioResult> {
    const item = await firstMenuItem('Halo-Halo')
    const order = await orderService.createOrder({
      customer_name: 'Demo Shopper', customer_email: 'demo@tapahey.demo', customer_phone: 'N/A', order_type: 'takeout',
      lines: [{ menu_item_id: item.id, name: item.name, price: item.price, image_url: item.image_url, quantity: 1 }],
      subtotal: item.price, delivery_fee: 0, discount: 0, total: item.price, channel: 'pos',
    })
    await orderService.markPaid(order.id, 'paid')
    return { title: 'Payment Success', summary: `${order.order_number} — demo payment approved, order confirmed.` }
  },

  async paymentFailed(): Promise<ScenarioResult> {
    const item = await firstMenuItem('Tocilog')
    const order = await orderService.createOrder({
      customer_name: 'Demo Shopper', customer_email: 'demo@tapahey.demo', customer_phone: 'N/A', order_type: 'takeout',
      lines: [{ menu_item_id: item.id, name: item.name, price: item.price, image_url: item.image_url, quantity: 1 }],
      subtotal: item.price, delivery_fee: 0, discount: 0, total: item.price, channel: 'pos',
    })
    await orderService.markPaid(order.id, 'failed')
    return { title: 'Payment Failed', summary: `${order.order_number} — demo card declined. Order held, no inventory affected.` }
  },

  async lowInventory(): Promise<ScenarioResult> {
    const items = await inventoryService.list()
    const garlic = items.find((i) => i.name === 'Garlic') ?? items[0]
    const dropTo = Math.max(0, garlic.minimum_stock - 2)
    await inventoryService.recordTransaction({
      inventory_id: garlic.id, type: 'adjustment', quantity: dropTo, note: 'Demo Center: simulate low stock', created_by: 'Demo Center',
    })
    return { title: 'Low Inventory', summary: `${garlic.name} dropped to ${dropTo} ${garlic.unit} — low-stock alert fired and a purchase request was auto-created.` }
  },

  async purchaseOrder(): Promise<ScenarioResult> {
    let requests = await procurementService.listRequests()
    let pending = requests.find((r) => r.status === 'pending')
    if (!pending) {
      await demoScenarios.lowInventory()
      requests = await procurementService.listRequests()
      pending = requests.find((r) => r.status === 'pending')
    }
    if (!pending) return { title: 'Purchase Order', summary: 'No low-stock ingredient available to convert right now.' }
    const approved: PurchaseRequest = await procurementService.approveRequest(pending.id, 'Liza Mercado (Demo)')
    const suppliers = await db.select<Supplier>('suppliers')
    const supplier = suppliers[0]
    const po = await procurementService.convertToPurchaseOrder(approved.id, supplier.id, 120)
    await procurementService.receiveOrder(po.id, 'Ellen Pascual (Demo)')
    return { title: 'Purchase Order', summary: `${po.po_number} sent to ${supplier.name} and received — ${approved.ingredient_name} restocked.` }
  },

  async kitchenWorkflow(): Promise<ScenarioResult> {
    const item = await firstMenuItem('Longsilog')
    const order = await orderService.createOrder({
      customer_name: 'Dine-in Guest', customer_email: 'guest@tapahey.demo', customer_phone: 'N/A', order_type: 'dine_in', table_number: '6',
      lines: [{ menu_item_id: item.id, name: item.name, price: item.price, image_url: item.image_url, quantity: 3 }],
      subtotal: item.price * 3, delivery_fee: 0, discount: 0, total: item.price * 3, channel: 'pos',
    })
    await orderService.markPaid(order.id, 'paid')
    await orderService.updateStatus(order.id, 'confirmed')
    await orderService.updateStatus(order.id, 'preparing')
    await orderService.updateStatus(order.id, 'ready')
    return { title: 'Kitchen Workflow', summary: `${order.order_number} moved New → Accepted → Preparing → Ready on the Kitchen Display. Open Kitchen to complete it.` }
  },

  async delivery(): Promise<ScenarioResult> {
    const item = await firstMenuItem('Bangsilog')
    const order = await orderService.createOrder({
      customer_name: 'Angela Cruz', customer_email: 'angela.cruz@example.com', customer_phone: '+63 920 555 0104', order_type: 'delivery',
      delivery_address: '90 Kalayaan Ave, Brgy. Diliman, Quezon City', delivery_city: 'Quezon City',
      lines: [{ menu_item_id: item.id, name: item.name, price: item.price, image_url: item.image_url, quantity: 1 }],
      subtotal: item.price, delivery_fee: 50, discount: 0, total: item.price + 50, channel: 'website',
    })
    await orderService.markPaid(order.id, 'paid')
    await orderService.updateStatus(order.id, 'confirmed')
    await orderService.updateStatus(order.id, 'preparing')
    const deliveries = await deliveryService.list()
    const dlv = deliveries.find((d) => d.order_id === order.id)
    if (dlv) {
      await deliveryService.advance(dlv.id) // ready_for_pickup
      await deliveryService.advance(dlv.id) // picked_up
      await deliveryService.advance(dlv.id) // out_for_delivery
    }
    return { title: 'Delivery', summary: `${order.order_number} is out for delivery with a courier assigned. Open Delivery to mark it delivered.` }
  },

  async b2bOrder(): Promise<ScenarioResult> {
    const resellers = await resellerService.list()
    const reseller = resellers[0]
    const products = await b2bService.packagedProducts()
    const p = products[0]
    const order = await b2bService.createOrder({
      reseller_id: reseller.id, terms_days: reseller.credit_terms_days,
      lines: [{ menu_item_id: p.id, product_name: p.name, sku: p.sku, quantity: 15, unit_price: p.wholesale_price ?? p.price }],
    })
    return { title: 'B2B Order', summary: `${order.order_number} bulk order placed for ${reseller.business_name} and invoiced.` }
  },

  async endOfDayClosing(): Promise<ScenarioResult> {
    const today = new Date().toISOString()
    const report = await financeService.dailyClosing(today)
    return { title: 'End-of-Day Closing', summary: `Today: ₱${report.totalSales.toLocaleString('en-PH')} total sales across ${report.orderCount} orders. Open Finance for the full breakdown.` }
  },
}

export const DEMO_SCENARIO_LIST: Array<{ key: keyof typeof demoScenarios; label: string; description: string }> = [
  { key: 'posSale', label: '1. POS Sale', description: 'Ring up a dine-in order, pay cash, cook it and complete it.' },
  { key: 'onlineOrder', label: '2. Online Order', description: 'Customer website checkout with demo GCash payment.' },
  { key: 'paymentSuccess', label: '3. Payment Success', description: 'A demo payment that approves.' },
  { key: 'paymentFailed', label: '4. Payment Failed', description: 'A demo payment that declines.' },
  { key: 'lowInventory', label: '5. Low Inventory', description: 'Drop an ingredient below minimum stock.' },
  { key: 'purchaseOrder', label: '6. Purchase Order', description: 'Approve a request, send a PO, receive goods.' },
  { key: 'kitchenWorkflow', label: '7. Kitchen Workflow', description: 'Push an order through the KDS stages.' },
  { key: 'delivery', label: '8. Delivery', description: 'Assign a courier and dispatch a delivery order.' },
  { key: 'b2bOrder', label: '9. B2B Order', description: 'Reseller bulk order with an auto-generated invoice.' },
  { key: 'endOfDayClosing', label: '10. End-of-Day Closing', description: 'Generate today\'s reconciliation report.' },
]
