export type UUID = string

export type StaffRole =
  | 'super_admin'
  | 'operations'
  | 'manager'
  | 'cashier'
  | 'kitchen'
  | 'warehouse'
  | 'procurement'
  | 'finance'
  | 'marketing'
  | 'content_manager'
  | 'qa_admin'
  | 'delivery_staff'

export type OrderType = 'dine_in' | 'takeout' | 'delivery'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'

export type PaymentMethod = 'cash' | 'gcash' | 'maya' | 'card'

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface Profile {
  id: UUID
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: 'customer' | 'staff'
  created_at: string
  updated_at: string
  /** Local demo backend only. Never present when running against Supabase Auth. */
  password?: string
}

export interface Staff {
  id: UUID
  profile_id: UUID
  email: string
  full_name: string
  role: StaffRole
  phone: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: UUID
  name: string
  slug: string
  description: string | null
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export type ProductType = 'menu' | 'packaged'

export interface MenuItem {
  id: UUID
  category_id: UUID
  name: string
  description: string
  price: number
  discount_price: number | null
  image_url: string
  prep_time_minutes: number
  available: boolean
  best_seller: boolean
  sort_order: number
  /** Enterprise product-master fields (section 8 / 3D packaged products). */
  sku: string
  barcode: string | null
  cost: number
  wholesale_price: number | null
  product_type: ProductType
  batch_number: string | null
  expiration_date: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: UUID
  profile_id: UUID | null
  full_name: string
  email: string
  phone: string | null
  address: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: UUID
  order_number: string
  customer_id: UUID | null
  order_type: OrderType
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  payment_status: PaymentStatus
  order_status: OrderStatus
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string | null
  delivery_city: string | null
  delivery_postal_code: string | null
  table_number: string | null
  notes: string | null
  branch_id: UUID | null
  channel: 'pos' | 'website' | 'delivery_platform'
  promo_code: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: UUID
  order_id: UUID
  menu_item_id: UUID
  item_name: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export interface Payment {
  id: UUID
  order_id: UUID
  customer_id: UUID | null
  amount: number
  currency: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  transaction_reference: string
  provider: 'demo' | 'stripe' | 'cash'
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: UUID
  customer_id: UUID | null
  full_name: string
  email: string
  phone: string
  reserved_date: string
  reserved_time: string
  guests: number
  table_id: UUID | null
  special_request: string | null
  status: ReservationStatus
  created_at: string
  updated_at: string
}

export interface RestaurantTable {
  id: UUID
  label: string
  seats: number
  area: string
  active: boolean
  created_at: string
}

export interface InventoryItem {
  id: UUID
  name: string
  stock: number
  unit: string
  minimum_stock: number
  supplier: string | null
  created_at: string
  updated_at: string
}

export interface InventoryTransaction {
  id: UUID
  inventory_id: UUID
  type: 'stock_in' | 'stock_out' | 'adjustment'
  quantity: number
  note: string | null
  created_by: string | null
  created_at: string
}

export interface Review {
  id: UUID
  customer_id: UUID | null
  order_id: UUID | null
  customer_name: string
  avatar_url: string | null
  rating: number
  comment: string
  approved: boolean
  reply: string | null
  created_at: string
  updated_at: string
}

export interface GalleryImage {
  id: UUID
  title: string
  image_url: string
  sort_order: number
  approved: boolean
  created_at: string
  updated_at: string
}

export interface WebsiteContent {
  id: UUID
  section: string
  content: Record<string, unknown>
  updated_at: string
}

export interface RestaurantSettings {
  id: UUID
  name: string
  tagline: string
  address: string
  phone: string
  email: string
  opening_hours: string
  map_embed_url: string
  delivery_fee: number
  currency: string
  updated_at: string
}

export interface Notification {
  id: UUID
  type:
    | 'order'
    | 'payment'
    | 'reservation'
    | 'inventory'
    | 'review'
    | 'procurement'
    | 'delivery'
    | 'b2b'
    | 'loyalty'
  title: string
  message: string
  read: boolean
  link: string | null
  created_at: string
}

/* ================= ENTERPRISE MODULES ================= */

export interface Branch {
  id: UUID
  name: string
  code: string
  address: string
  phone: string
  active: boolean
  is_main: boolean
  created_at: string
}

export interface RecipeItem {
  id: UUID
  menu_item_id: UUID
  inventory_id: UUID
  ingredient_name: string
  quantity_per_serving: number
  unit: string
  created_at: string
}

export interface Supplier {
  id: UUID
  name: string
  contact_name: string
  phone: string
  email: string
  products: string
  lead_time_days: number
  payment_terms: string
  status: 'active' | 'inactive'
  created_at: string
}

export type PurchaseRequestStatus = 'pending' | 'approved' | 'rejected' | 'converted'

export interface PurchaseRequest {
  id: UUID
  inventory_id: UUID
  ingredient_name: string
  requested_qty: number
  unit: string
  reason: string
  status: PurchaseRequestStatus
  requested_by: string
  approved_by: string | null
  created_at: string
  updated_at: string
}

export type PurchaseOrderStatus = 'draft' | 'sent' | 'received' | 'cancelled'

export interface PurchaseOrder {
  id: UUID
  po_number: string
  supplier_id: UUID
  purchase_request_id: string | null
  status: PurchaseOrderStatus
  total: number
  created_at: string
  received_at: string | null
}

export interface PurchaseOrderItem {
  id: UUID
  purchase_order_id: UUID
  inventory_id: UUID
  ingredient_name: string
  quantity: number
  unit_cost: number
  subtotal: number
}

export type DeliveryStatus = 'preparing' | 'ready_for_pickup' | 'picked_up' | 'out_for_delivery' | 'delivered'

export interface Delivery {
  id: UUID
  order_id: UUID
  order_number: string
  courier_name: string
  address: string
  status: DeliveryStatus
  created_at: string
  updated_at: string
}

export interface LoyaltyAccount {
  id: UUID
  customer_id: UUID
  points_balance: number
  lifetime_points: number
  created_at: string
  updated_at: string
}

export interface LoyaltyTransaction {
  id: UUID
  loyalty_account_id: UUID
  order_id: string | null
  points: number
  type: 'earn' | 'redeem'
  note: string
  created_at: string
}

export type DiscountType = 'percent' | 'fixed'

export interface Promotion {
  id: UUID
  code: string
  description: string
  discount_type: DiscountType
  discount_value: number
  min_purchase: number
  start_date: string
  end_date: string
  active: boolean
  created_at: string
}

export interface PromotionUsage {
  id: UUID
  promotion_id: UUID
  order_id: UUID
  customer_email: string
  discount_applied: number
  created_at: string
}

export interface Reseller {
  id: UUID
  business_name: string
  contact_name: string
  phone: string
  email: string
  credit_limit: number
  credit_terms_days: number
  status: 'active' | 'inactive'
  created_at: string
}

export type B2BOrderStatus = 'pending' | 'confirmed' | 'fulfilled' | 'cancelled'

export interface B2BOrder {
  id: UUID
  order_number: string
  reseller_id: UUID
  status: B2BOrderStatus
  subtotal: number
  total: number
  created_at: string
  updated_at: string
}

export interface B2BOrderItem {
  id: UUID
  b2b_order_id: UUID
  menu_item_id: UUID
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  subtotal: number
}

export type InvoiceStatus = 'unpaid' | 'paid' | 'overdue'

export interface Invoice {
  id: UUID
  invoice_number: string
  b2b_order_id: UUID
  reseller_id: UUID
  amount: number
  status: InvoiceStatus
  due_date: string
  paid_at: string | null
  created_at: string
}

export interface CashierShift {
  id: UUID
  staff_id: string
  staff_name: string
  opening_cash: number
  closing_cash_expected: number | null
  closing_cash_actual: number | null
  cash_difference: number | null
  status: 'open' | 'closed'
  opened_at: string
  closed_at: string | null
}

export interface AuditLog {
  id: UUID
  actor_name: string
  action: string
  entity: string
  entity_id: string | null
  detail: string
  created_at: string
}

export interface Integration {
  id: UUID
  key: string
  name: string
  category: string
  status: 'connected' | 'demo'
  updated_at: string
}

export interface Favorite {
  id: UUID
  customer_id: UUID
  menu_item_id: UUID
  created_at: string
}

export interface CartLine {
  menu_item_id: UUID
  name: string
  price: number
  image_url: string
  quantity: number
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
  payment?: Payment | null
}
