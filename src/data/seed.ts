import type { DbShape } from '../lib/localDb'

/**
 * Demo seed data. Mirrors `supabase/seed.sql` so the local demo backend and a real
 * Supabase project start from the same state.
 */

const now = new Date()
const iso = (d: Date) => d.toISOString()
const daysAgo = (n: number, hour = 12) => {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  d.setHours(hour, Math.floor(Math.random() * 59), 0, 0)
  return iso(d)
}
const dateOnly = (n: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const C = {
  tapsilog: 'cat-0001',
  silog: 'cat-0002',
  sides: 'cat-0003',
  drinks: 'cat-0004',
  desserts: 'cat-0005',
  promos: 'cat-0006',
  packaged: 'cat-0007',
}

const M = {
  classic: 'itm-0001',
  spicy: 'itm-0002',
  garlic: 'itm-0003',
  longsilog: 'itm-0004',
  hotsilog: 'itm-0005',
  tocilog: 'itm-0006',
  spamsilog: 'itm-0007',
  cornsilog: 'itm-0008',
  bangsilog: 'itm-0009',
  tinapasilog: 'itm-0010',
  dilissilog: 'itm-0011',
  pusitsilog: 'itm-0012',
  danggitsilog: 'itm-0013',
  tuyosilog: 'itm-0014',
  extraRice: 'itm-0015',
  garlicRice: 'itm-0016',
  friedEgg: 'itm-0017',
  atchara: 'itm-0018',
  icedTea: 'itm-0019',
  softdrink: 'itm-0020',
  water: 'itm-0021',
  coffee: 'itm-0022',
  gulaman: 'itm-0023',
  flan: 'itm-0024',
  halohalo: 'itm-0025',
  turon: 'itm-0026',
  barkada: 'itm-0027',
  solo: 'itm-0028',
}

const CU = {
  juan: 'cus-0001',
  maria: 'cus-0002',
  john: 'cus-0003',
  angela: 'cus-0004',
  mark: 'cus-0005',
}

const stamp = { created_at: daysAgo(120), updated_at: daysAgo(3) }

/** Fills product-master fields (section 8) for menu items that don't specify their own. */
function finalizeMenuItems(items: Record<string, any>[]): Record<string, any>[] {
  return items.map((item, i) => ({
    sku: `TH-${(item.category_id ?? 'GEN').replace('cat-000', 'C')}-${String(i + 1).padStart(3, '0')}`,
    barcode: `10${String(1000 + i)}`,
    cost: Math.round(item.price * 0.42),
    wholesale_price: null,
    product_type: 'menu',
    batch_number: null,
    expiration_date: null,
    ...item,
  }))
}

const PKG = {
  packagedTapa: 'pkg-0001',
  frozenTapa: 'pkg-0002',
  bottledSauce: 'pkg-0003',
  garlicOil: 'pkg-0004',
}

export function buildSeed(): DbShape {
  return {
    profiles: [
      {
        id: 'prf-admin',
        email: 'admin@tapahey.demo',
        full_name: 'Chef Andres Bautista',
        phone: '+63 917 100 0001',
        avatar_url: null,
        role: 'staff',
        password: 'DemoAdmin123!',
        ...stamp,
      },
      {
        id: 'prf-manager',
        email: 'manager@tapahey.demo',
        full_name: 'Liza Mercado',
        phone: '+63 917 100 0002',
        avatar_url: null,
        role: 'staff',
        password: 'DemoStaff123!',
        ...stamp,
      },
      {
        id: 'prf-cashier',
        email: 'cashier@tapahey.demo',
        full_name: 'Paolo Rivera',
        phone: '+63 917 100 0003',
        avatar_url: null,
        role: 'staff',
        password: 'DemoStaff123!',
        ...stamp,
      },
      {
        id: 'prf-kitchen',
        email: 'kitchen@tapahey.demo',
        full_name: 'Ramon Villanueva',
        phone: '+63 917 100 0004',
        avatar_url: null,
        role: 'staff',
        password: 'DemoStaff123!',
        ...stamp,
      },
      {
        id: 'prf-ops',
        email: 'operations@tapahey.demo',
        full_name: 'Nico Alvarez',
        phone: '+63 917 100 0005',
        avatar_url: null,
        role: 'staff',
        password: 'DemoStaff123!',
        ...stamp,
      },
      {
        id: 'prf-warehouse',
        email: 'warehouse@tapahey.demo',
        full_name: 'Ellen Pascual',
        phone: '+63 917 100 0006',
        avatar_url: null,
        role: 'staff',
        password: 'DemoStaff123!',
        ...stamp,
      },
      {
        id: 'prf-procurement',
        email: 'procurement@tapahey.demo',
        full_name: 'Carlo Ibarra',
        phone: '+63 917 100 0007',
        avatar_url: null,
        role: 'staff',
        password: 'DemoStaff123!',
        ...stamp,
      },
      {
        id: 'prf-finance',
        email: 'finance@tapahey.demo',
        full_name: 'Divina Ramos',
        phone: '+63 917 100 0008',
        avatar_url: null,
        role: 'staff',
        password: 'DemoStaff123!',
        ...stamp,
      },
      {
        id: 'prf-marketing',
        email: 'marketing@tapahey.demo',
        full_name: 'Kaye Santiago',
        phone: '+63 917 100 0009',
        avatar_url: null,
        role: 'staff',
        password: 'DemoStaff123!',
        ...stamp,
      },
      {
        id: 'prf-qa',
        email: 'qa@tapahey.demo',
        full_name: 'Ramil Cruz',
        phone: '+63 917 100 0010',
        avatar_url: null,
        role: 'staff',
        password: 'DemoStaff123!',
        ...stamp,
      },
      {
        id: 'prf-juan',
        email: 'juan@tapahey.demo',
        full_name: 'Juan Dela Cruz',
        phone: '+63 917 555 0101',
        avatar_url: null,
        role: 'customer',
        password: 'DemoCustomer123!',
        ...stamp,
      },
    ],

    staff: [
      {
        id: 'stf-0001',
        profile_id: 'prf-admin',
        email: 'admin@tapahey.demo',
        full_name: 'Chef Andres Bautista',
        role: 'super_admin',
        phone: '+63 917 100 0001',
        active: true,
        ...stamp,
      },
      {
        id: 'stf-0002',
        profile_id: 'prf-manager',
        email: 'manager@tapahey.demo',
        full_name: 'Liza Mercado',
        role: 'manager',
        phone: '+63 917 100 0002',
        active: true,
        ...stamp,
      },
      {
        id: 'stf-0003',
        profile_id: 'prf-cashier',
        email: 'cashier@tapahey.demo',
        full_name: 'Paolo Rivera',
        role: 'cashier',
        phone: '+63 917 100 0003',
        active: true,
        ...stamp,
      },
      {
        id: 'stf-0004',
        profile_id: 'prf-kitchen',
        email: 'kitchen@tapahey.demo',
        full_name: 'Ramon Villanueva',
        role: 'kitchen',
        phone: '+63 917 100 0004',
        active: true,
        ...stamp,
      },
      { id: 'stf-0005', profile_id: 'prf-ops', email: 'operations@tapahey.demo', full_name: 'Nico Alvarez', role: 'operations', phone: '+63 917 100 0005', active: true, ...stamp },
      { id: 'stf-0006', profile_id: 'prf-warehouse', email: 'warehouse@tapahey.demo', full_name: 'Ellen Pascual', role: 'warehouse', phone: '+63 917 100 0006', active: true, ...stamp },
      { id: 'stf-0007', profile_id: 'prf-procurement', email: 'procurement@tapahey.demo', full_name: 'Carlo Ibarra', role: 'procurement', phone: '+63 917 100 0007', active: true, ...stamp },
      { id: 'stf-0008', profile_id: 'prf-finance', email: 'finance@tapahey.demo', full_name: 'Divina Ramos', role: 'finance', phone: '+63 917 100 0008', active: true, ...stamp },
      { id: 'stf-0009', profile_id: 'prf-marketing', email: 'marketing@tapahey.demo', full_name: 'Kaye Santiago', role: 'marketing', phone: '+63 917 100 0009', active: true, ...stamp },
      { id: 'stf-0010', profile_id: 'prf-qa', email: 'qa@tapahey.demo', full_name: 'Ramil Cruz', role: 'qa_admin', phone: '+63 917 100 0010', active: true, ...stamp },
    ],

    menu_categories: [
      { id: C.tapsilog, name: 'Tapsilog', slug: 'tapsilog', description: 'Our signature beef tapa plates', sort_order: 1, active: true, ...stamp },
      { id: C.silog, name: 'Silog Meals', slug: 'silog-meals', description: 'Every Filipino breakfast classic', sort_order: 2, active: true, ...stamp },
      { id: C.sides, name: 'Sides', slug: 'sides', description: 'Add a little extra', sort_order: 3, active: true, ...stamp },
      { id: C.drinks, name: 'Drinks', slug: 'drinks', description: 'Cold, hot and everything between', sort_order: 4, active: true, ...stamp },
      { id: C.desserts, name: 'Desserts', slug: 'desserts', description: 'Sweet Filipino endings', sort_order: 5, active: true, ...stamp },
      { id: C.promos, name: 'Promos', slug: 'promos', description: 'Bundles that feed the barkada', sort_order: 6, active: true, ...stamp },
      { id: C.packaged, name: 'Packaged Products', slug: 'packaged-products', description: 'Take-home and reseller-ready packaged goods', sort_order: 7, active: true, ...stamp },
    ],

    menu_items: finalizeMenuItems([
      { id: M.classic, category_id: C.tapsilog, name: 'Classic Tapsilog', description: 'Sweet-savoury beef tapa, garlic rice and a sunny-side-up egg.', price: 99, discount_price: null, image_url: '/images/menu/tapa.jpg', prep_time_minutes: 15, available: true, best_seller: true, sort_order: 1, ...stamp },
      { id: M.spicy, category_id: C.tapsilog, name: 'Spicy Tapsilog', description: 'Beef tapa fired up with siling labuyo and house chili oil.', price: 109, discount_price: null, image_url: '/images/menu/tapa.jpg', prep_time_minutes: 15, available: true, best_seller: true, sort_order: 2, ...stamp },
      { id: M.garlic, category_id: C.tapsilog, name: 'Garlic Tapsilog', description: 'Double-garlic tapa with extra toasted garlic bits on top.', price: 109, discount_price: null, image_url: '/images/menu/tapa.jpg', prep_time_minutes: 15, available: true, best_seller: false, sort_order: 3, ...stamp },
      { id: M.longsilog, category_id: C.silog, name: 'Longsilog', description: 'Sweet Pampanga longganisa, garlic rice and egg.', price: 89, discount_price: null, image_url: '/images/menu/longanisa.jpg', prep_time_minutes: 12, available: true, best_seller: true, sort_order: 4, ...stamp },
      { id: M.hotsilog, category_id: C.silog, name: 'Hotsilog', description: 'Jumbo hotdogs grilled to a snap, with rice and egg.', price: 89, discount_price: null, image_url: '/images/menu/hotdog.jpg', prep_time_minutes: 10, available: true, best_seller: false, sort_order: 5, ...stamp },
      { id: M.tocilog, category_id: C.silog, name: 'Tocilog', description: 'Sweet cured pork tocino caramelised on the griddle.', price: 89, discount_price: null, image_url: '/images/menu/tocino.jpg', prep_time_minutes: 12, available: true, best_seller: true, sort_order: 6, ...stamp },
      { id: M.spamsilog, category_id: C.silog, name: 'Spamsilog', description: 'Thick-cut Spam, crisp on the edges, with rice and egg.', price: 119, discount_price: null, image_url: '/images/menu/spam.jpg', prep_time_minutes: 10, available: true, best_seller: false, sort_order: 7, ...stamp },
      { id: M.cornsilog, category_id: C.silog, name: 'Cornsilog', description: 'Sautéed corned beef with onions, rice and egg.', price: 95, discount_price: null, image_url: '/images/menu/cornbeef.jpg', prep_time_minutes: 12, available: true, best_seller: false, sort_order: 8, ...stamp },
      { id: M.bangsilog, category_id: C.silog, name: 'Bangsilog', description: 'Boneless daing na bangus fried until the skin crackles.', price: 119, discount_price: null, image_url: '/images/menu/bangus.jpg', prep_time_minutes: 15, available: true, best_seller: false, sort_order: 9, ...stamp },
      { id: M.tinapasilog, category_id: C.silog, name: 'Tinapasilog', description: 'Smoked tinapa flakes with tomatoes on the side.', price: 99, discount_price: null, image_url: '/images/menu/tinapa.jpg', prep_time_minutes: 12, available: true, best_seller: false, sort_order: 10, ...stamp },
      { id: M.dilissilog, category_id: C.silog, name: 'Dilis Silog', description: 'Crispy fried dilis with spiced vinegar dip.', price: 89, discount_price: null, image_url: '/images/menu/dilis.jpg', prep_time_minutes: 10, available: true, best_seller: false, sort_order: 11, ...stamp },
      { id: M.pusitsilog, category_id: C.silog, name: 'Pusit Silog', description: 'Grilled squid rings glazed in calamansi-soy.', price: 129, discount_price: null, image_url: '/images/menu/pusit.jpg', prep_time_minutes: 18, available: true, best_seller: false, sort_order: 12, ...stamp },
      { id: M.danggitsilog, category_id: C.silog, name: 'Danggit Silog', description: 'Cebu-style salted danggit, fried light and crisp.', price: 109, discount_price: null, image_url: '/images/menu/danggit.jpg', prep_time_minutes: 12, available: true, best_seller: false, sort_order: 13, ...stamp },
      { id: M.tuyosilog, category_id: C.silog, name: 'Tuyo Silog', description: 'Classic salted tuyo — the true Filipino breakfast.', price: 79, discount_price: null, image_url: '/images/menu/tuyo.jpg', prep_time_minutes: 10, available: false, best_seller: false, sort_order: 14, ...stamp },
      { id: M.extraRice, category_id: C.sides, name: 'Extra Rice', description: 'One cup of steamed rice.', price: 25, discount_price: null, image_url: '/images/menu/rice.jpg', prep_time_minutes: 3, available: true, best_seller: false, sort_order: 15, ...stamp },
      { id: M.garlicRice, category_id: C.sides, name: 'Garlic Rice', description: 'Fried rice tossed with toasted garlic.', price: 35, discount_price: null, image_url: '/images/menu/rice.jpg', prep_time_minutes: 5, available: true, best_seller: false, sort_order: 16, ...stamp },
      { id: M.friedEgg, category_id: C.sides, name: 'Fried Egg', description: 'Sunny-side-up, runny yolk guaranteed.', price: 20, discount_price: null, image_url: '/images/menu/egg.jpg', prep_time_minutes: 3, available: true, best_seller: false, sort_order: 17, ...stamp },
      { id: M.atchara, category_id: C.sides, name: 'Atchara', description: 'Pickled green papaya to cut the richness.', price: 25, discount_price: null, image_url: '/images/menu/side.jpg', prep_time_minutes: 2, available: true, best_seller: false, sort_order: 18, ...stamp },
      { id: M.icedTea, category_id: C.drinks, name: 'Bottomless Iced Tea', description: 'House-brewed lemon iced tea, free refills in-store.', price: 49, discount_price: null, image_url: '/images/menu/drink.jpg', prep_time_minutes: 3, available: true, best_seller: true, sort_order: 19, ...stamp },
      { id: M.softdrink, category_id: C.drinks, name: 'Soft Drinks', description: 'Ice-cold cola, lemon-lime or orange in can.', price: 35, discount_price: null, image_url: '/images/menu/drink.jpg', prep_time_minutes: 1, available: true, best_seller: false, sort_order: 20, ...stamp },
      { id: M.water, category_id: C.drinks, name: 'Bottled Water', description: '500ml purified water.', price: 20, discount_price: null, image_url: '/images/menu/drink.jpg', prep_time_minutes: 1, available: true, best_seller: false, sort_order: 21, ...stamp },
      { id: M.coffee, category_id: C.drinks, name: 'Barako Coffee', description: 'Strong Batangas barako, brewed per order.', price: 45, discount_price: null, image_url: '/images/menu/coffee.jpg', prep_time_minutes: 5, available: true, best_seller: false, sort_order: 22, ...stamp },
      { id: M.gulaman, category_id: C.drinks, name: "Sago't Gulaman", description: 'Sweet muscovado drink with sago pearls.', price: 45, discount_price: null, image_url: '/images/menu/drink.jpg', prep_time_minutes: 4, available: true, best_seller: false, sort_order: 23, ...stamp },
      { id: M.flan, category_id: C.desserts, name: 'Leche Flan', description: 'Silky custard under a burnt-sugar cap.', price: 59, discount_price: null, image_url: '/images/menu/dessert.jpg', prep_time_minutes: 3, available: true, best_seller: false, sort_order: 24, ...stamp },
      { id: M.halohalo, category_id: C.desserts, name: 'Halo-Halo', description: 'Shaved ice, sweet beans, leche flan and ube.', price: 89, discount_price: null, image_url: '/images/menu/dessert.jpg', prep_time_minutes: 6, available: true, best_seller: true, sort_order: 25, ...stamp },
      { id: M.turon, category_id: C.desserts, name: 'Turon', description: 'Caramelised banana spring rolls, two pieces.', price: 35, discount_price: null, image_url: '/images/menu/dessert.jpg', prep_time_minutes: 6, available: true, best_seller: false, sort_order: 26, ...stamp },
      { id: M.barkada, category_id: C.promos, name: 'Tapa Hey Barkada Bundle', description: '4 tapsilog plates, 4 iced teas and 2 turon to share.', price: 499, discount_price: 399, image_url: '/images/menu/promo.jpg', prep_time_minutes: 25, available: true, best_seller: true, sort_order: 27, ...stamp },
      { id: M.solo, category_id: C.promos, name: 'Solo Combo', description: 'Any silog meal plus a drink and leche flan.', price: 159, discount_price: 129, image_url: '/images/menu/promo.jpg', prep_time_minutes: 15, available: true, best_seller: false, sort_order: 28, ...stamp },
      { id: PKG.packagedTapa, category_id: C.packaged, name: 'Packaged Beef Tapa (500g)', description: 'Marinated raw beef tapa, vacuum-sealed, ready to fry at home.', price: 320, discount_price: null, image_url: '/images/menu/tapa.jpg', prep_time_minutes: 0, available: true, best_seller: false, sort_order: 29, sku: 'TH-PKG-001', barcode: '20001', cost: 190, wholesale_price: 240, product_type: 'packaged', batch_number: 'B2026-0091', expiration_date: dateOnly(45), ...stamp },
      { id: PKG.frozenTapa, category_id: C.packaged, name: 'Frozen Beef Tapa (1kg)', description: 'Bulk frozen beef tapa for households and resellers.', price: 580, discount_price: null, image_url: '/images/menu/tapa.jpg', prep_time_minutes: 0, available: true, best_seller: false, sort_order: 30, sku: 'TH-PKG-002', barcode: '20002', cost: 340, wholesale_price: 430, product_type: 'packaged', batch_number: 'B2026-0088', expiration_date: dateOnly(90), ...stamp },
      { id: PKG.bottledSauce, category_id: C.packaged, name: 'Tapa Hey Sawsawan (350ml)', description: 'House vinegar-soy dipping sauce, bottled.', price: 99, discount_price: null, image_url: '/images/menu/side.jpg', prep_time_minutes: 0, available: true, best_seller: false, sort_order: 31, sku: 'TH-PKG-003', barcode: '20003', cost: 42, wholesale_price: 65, product_type: 'packaged', batch_number: 'B2026-0102', expiration_date: dateOnly(180), ...stamp },
      { id: PKG.garlicOil, category_id: C.packaged, name: 'Toasted Garlic Oil (250ml)', description: 'House-toasted garlic oil for fried rice and dips.', price: 149, discount_price: null, image_url: '/images/menu/side.jpg', prep_time_minutes: 0, available: true, best_seller: false, sort_order: 32, sku: 'TH-PKG-004', barcode: '20004', cost: 78, wholesale_price: 110, product_type: 'packaged', batch_number: 'B2026-0075', expiration_date: dateOnly(120), ...stamp },
    ]),

    customers: [
      { id: CU.juan, profile_id: 'prf-juan', full_name: 'Juan Dela Cruz', email: 'juan@tapahey.demo', phone: '+63 917 555 0101', address: '12 Mabini St, Brgy. San Isidro, Quezon City', active: true, ...stamp },
      { id: CU.maria, profile_id: null, full_name: 'Maria Santos', email: 'maria.santos@example.com', phone: '+63 918 555 0102', address: '48 Rizal Ave, Brgy. Holy Spirit, Quezon City', active: true, ...stamp },
      { id: CU.john, profile_id: null, full_name: 'John Reyes', email: 'john.reyes@example.com', phone: '+63 919 555 0103', address: '7 Katipunan Ext, Brgy. Bagumbayan, Quezon City', active: true, ...stamp },
      { id: CU.angela, profile_id: null, full_name: 'Angela Cruz', email: 'angela.cruz@example.com', phone: '+63 920 555 0104', address: '90 Kalayaan Ave, Brgy. Diliman, Quezon City', active: true, ...stamp },
      { id: CU.mark, profile_id: null, full_name: 'Mark Garcia', email: 'mark.garcia@example.com', phone: '+63 921 555 0105', address: '3 Tandang Sora, Brgy. Culiat, Quezon City', active: true, ...stamp },
    ],

    orders: buildOrders(),
    order_items: buildOrderItems(),
    payments: buildPayments(),

    reservations: [
      { id: 'rsv-0001', customer_id: CU.juan, full_name: 'Juan Dela Cruz', email: 'juan@tapahey.demo', phone: '+63 917 555 0101', reserved_date: dateOnly(1), reserved_time: '18:30', guests: 4, table_id: 'tbl-0003', special_request: 'Birthday celebration, near the window please.', status: 'confirmed', created_at: daysAgo(2), updated_at: daysAgo(1) },
      { id: 'rsv-0002', customer_id: CU.maria, full_name: 'Maria Santos', email: 'maria.santos@example.com', phone: '+63 918 555 0102', reserved_date: dateOnly(0), reserved_time: '12:00', guests: 2, table_id: 'tbl-0001', special_request: null, status: 'seated', created_at: daysAgo(1), updated_at: daysAgo(0) },
      { id: 'rsv-0003', customer_id: CU.john, full_name: 'John Reyes', email: 'john.reyes@example.com', phone: '+63 919 555 0103', reserved_date: dateOnly(2), reserved_time: '19:00', guests: 6, table_id: null, special_request: 'Team dinner — one long table if possible.', status: 'pending', created_at: daysAgo(0), updated_at: daysAgo(0) },
      { id: 'rsv-0004', customer_id: CU.angela, full_name: 'Angela Cruz', email: 'angela.cruz@example.com', phone: '+63 920 555 0104', reserved_date: dateOnly(-2), reserved_time: '08:00', guests: 3, table_id: 'tbl-0002', special_request: null, status: 'completed', created_at: daysAgo(4), updated_at: daysAgo(2) },
      { id: 'rsv-0005', customer_id: CU.mark, full_name: 'Mark Garcia', email: 'mark.garcia@example.com', phone: '+63 921 555 0105', reserved_date: dateOnly(3), reserved_time: '07:30', guests: 2, table_id: null, special_request: 'Early breakfast before work.', status: 'pending', created_at: daysAgo(0), updated_at: daysAgo(0) },
    ],

    restaurant_tables: [
      { id: 'tbl-0001', label: 'T1', seats: 2, area: 'Main Hall', active: true, created_at: daysAgo(120) },
      { id: 'tbl-0002', label: 'T2', seats: 4, area: 'Main Hall', active: true, created_at: daysAgo(120) },
      { id: 'tbl-0003', label: 'T3', seats: 4, area: 'Window', active: true, created_at: daysAgo(120) },
      { id: 'tbl-0004', label: 'T4', seats: 6, area: 'Window', active: true, created_at: daysAgo(120) },
      { id: 'tbl-0005', label: 'T5', seats: 8, area: 'Function Room', active: true, created_at: daysAgo(120) },
      { id: 'tbl-0006', label: 'T6', seats: 2, area: 'Al Fresco', active: true, created_at: daysAgo(120) },
    ],

    inventory: [
      { id: 'inv-0001', name: 'Beef Tapa', stock: 42, unit: 'kg', minimum_stock: 15, supplier: 'Monterey Meats', ...stamp },
      { id: 'inv-0002', name: 'Eggs', stock: 320, unit: 'pcs', minimum_stock: 120, supplier: 'San Isidro Poultry', ...stamp },
      { id: 'inv-0003', name: 'Rice', stock: 86, unit: 'kg', minimum_stock: 40, supplier: 'Nueva Ecija Grains', ...stamp },
      { id: 'inv-0004', name: 'Garlic', stock: 8, unit: 'kg', minimum_stock: 10, supplier: 'Ilocos Produce', ...stamp },
      { id: 'inv-0005', name: 'Soy Sauce', stock: 24, unit: 'L', minimum_stock: 10, supplier: 'Datu Puti Distributors', ...stamp },
      { id: 'inv-0006', name: 'Vinegar', stock: 19, unit: 'L', minimum_stock: 10, supplier: 'Datu Puti Distributors', ...stamp },
      { id: 'inv-0007', name: 'Longganisa', stock: 5, unit: 'kg', minimum_stock: 12, supplier: 'Pampanga Sausage Co.', ...stamp },
      { id: 'inv-0008', name: 'Hotdog', stock: 14, unit: 'kg', minimum_stock: 8, supplier: 'Purefoods Supply', ...stamp },
      { id: 'inv-0009', name: 'Cooking Oil', stock: 0, unit: 'L', minimum_stock: 15, supplier: 'Golden Fry Trading', ...stamp },
      { id: 'inv-0010', name: 'Soft Drinks', stock: 180, unit: 'cans', minimum_stock: 60, supplier: 'Coca-Cola FEMSA', ...stamp },
      { id: 'inv-0011', name: 'Coffee', stock: 11, unit: 'kg', minimum_stock: 5, supplier: 'Batangas Barako Farms', ...stamp },
      { id: 'inv-0012', name: 'Water', stock: 240, unit: 'bottles', minimum_stock: 80, supplier: 'Wilkins Distribution', ...stamp },
    ],

    inventory_transactions: [
      { id: 'itx-0001', inventory_id: 'inv-0001', type: 'stock_in', quantity: 50, note: 'Weekly delivery', created_by: 'Liza Mercado', created_at: daysAgo(6) },
      { id: 'itx-0002', inventory_id: 'inv-0001', type: 'stock_out', quantity: 8, note: 'Service usage', created_by: 'Ramon Villanueva', created_at: daysAgo(2) },
      { id: 'itx-0003', inventory_id: 'inv-0009', type: 'stock_out', quantity: 15, note: 'Ran out during lunch rush', created_by: 'Ramon Villanueva', created_at: daysAgo(1) },
      { id: 'itx-0004', inventory_id: 'inv-0007', type: 'stock_out', quantity: 7, note: 'Service usage', created_by: 'Ramon Villanueva', created_at: daysAgo(1) },
    ],

    reviews: [
      { id: 'rev-0001', customer_id: CU.juan, order_id: 'ord-0001', customer_name: 'Juan Dela Cruz', avatar_url: null, rating: 5, comment: 'Affordable and super delicious. My favorite tapsilog place!', approved: true, reply: 'Salamat po, Juan! See you again soon. 🧡', created_at: daysAgo(5), updated_at: daysAgo(5) },
      { id: 'rev-0002', customer_id: CU.maria, order_id: 'ord-0002', customer_name: 'Maria Santos', avatar_url: null, rating: 5, comment: 'The garlic rice alone is worth the trip. Egg was perfectly runny and the tapa is so tender.', approved: true, reply: null, created_at: daysAgo(9), updated_at: daysAgo(9) },
      { id: 'rev-0003', customer_id: CU.john, order_id: null, customer_name: 'John Reyes', avatar_url: null, rating: 4, comment: 'Great value for money. Delivery arrived hot in 25 minutes. Would order again.', approved: true, reply: null, created_at: daysAgo(13), updated_at: daysAgo(13) },
      { id: 'rev-0004', customer_id: CU.angela, order_id: null, customer_name: 'Angela Cruz', avatar_url: null, rating: 5, comment: 'Staff are so friendly and the place is spotless. Tocilog is my go-to breakfast now.', approved: true, reply: null, created_at: daysAgo(17), updated_at: daysAgo(17) },
      { id: 'rev-0005', customer_id: CU.mark, order_id: null, customer_name: 'Mark Garcia', avatar_url: null, rating: 4, comment: 'Spicy tapsilog has real heat, not just for show. Bring extra rice!', approved: true, reply: null, created_at: daysAgo(21), updated_at: daysAgo(21) },
      { id: 'rev-0006', customer_id: null, order_id: null, customer_name: 'Rico Bautista', avatar_url: null, rating: 3, comment: 'Food was good but we waited a while during the Sunday rush.', approved: false, reply: null, created_at: daysAgo(1), updated_at: daysAgo(1) },
    ],

    gallery: [
      { id: 'gal-0001', title: 'Classic Tapsilog plate', image_url: '/images/menu/tapa.jpg', sort_order: 1, approved: true, ...stamp },
      { id: 'gal-0002', title: 'Longsilog, fresh off the griddle', image_url: '/images/menu/longanisa.jpg', sort_order: 2, approved: true, ...stamp },
      { id: 'gal-0003', title: 'Tocilog mornings', image_url: '/images/menu/tocino.jpg', sort_order: 3, approved: true, ...stamp },
      { id: 'gal-0004', title: 'Golden hour at Tapa Hey', image_url: '/images/about.jpg', sort_order: 4, approved: true, ...stamp },
      { id: 'gal-0005', title: 'Bangsilog with crackling skin', image_url: '/images/menu/bangus.jpg', sort_order: 5, approved: true, ...stamp },
      { id: 'gal-0006', title: 'Hotsilog for the kids', image_url: '/images/menu/hotdog.jpg', sort_order: 6, approved: true, ...stamp },
      { id: 'gal-0007', title: 'Crispy dilis and vinegar', image_url: '/images/menu/dilis.jpg', sort_order: 7, approved: true, ...stamp },
      { id: 'gal-0008', title: 'Pusit, straight off the grill', image_url: '/images/menu/pusit.jpg', sort_order: 8, approved: true, ...stamp },
    ],

    website_content: [
      {
        id: 'wc-hero',
        section: 'hero',
        content: {
          eyebrow: 'GOOD FOOD. GOOD MOOD.',
          title: 'Tapa Hey',
          description: 'Classic Filipino tapsilog, made fresh and served with a smile.',
          image_url: '/images/hero.jpg',
          primary_button: 'Order Now',
          secondary_button: 'View Menu',
        },
        updated_at: daysAgo(3),
      },
      {
        id: 'wc-favorites',
        section: 'favorites',
        content: {
          title: 'Tapsilog Favorites',
          description: 'All-time favorite Filipino meals, cooked fresh and served hot.',
        },
        updated_at: daysAgo(3),
      },
      {
        id: 'wc-about',
        section: 'about',
        content: {
          title: 'More Than Just Tapsilog',
          description:
            'Tapa Hey is all about serving fresh, affordable, and delicious Filipino meals for everyone.',
          story:
            'We started in 2018 as a single roadside stall in Quezon City with one recipe: Lola Ising\'s beef tapa, cured overnight in calamansi, soy and muscovado. Word got around. Today we cook the same tapa the same way — only now we serve it to hundreds of neighbours every morning, from tricycle drivers on the 6AM shift to families on lazy Sunday brunches.',
          image_url: '/images/about.jpg',
          button_text: 'Our Story',
          highlights: [
            { title: 'Fresh Ingredients', description: 'Meat and produce delivered every single morning.' },
            { title: 'Affordable Meals', description: 'Complete silog plates starting at ₱79.' },
            { title: 'Customer First', description: 'Hot, fast and always served with a smile.' },
          ],
        },
        updated_at: daysAgo(3),
      },
      {
        id: 'wc-why',
        section: 'why_choose_us',
        content: {
          title: 'The Tapa Hey Difference',
          description: 'Four reasons neighbours keep coming back every morning.',
          cards: [
            { icon: 'UtensilsCrossed', title: 'Authentic Filipino Taste', description: 'Recipes handed down three generations, unchanged.' },
            { icon: 'Flame', title: 'Freshly Cooked', description: 'Nothing sits under a heat lamp. Every plate is cooked to order.' },
            { icon: 'PiggyBank', title: 'Affordable Prices', description: 'Honest pricing for a full, satisfying meal.' },
            { icon: 'HeartHandshake', title: 'Friendly Service', description: 'You are family the moment you walk through the door.' },
          ],
        },
        updated_at: daysAgo(3),
      },
      {
        id: 'wc-reviews',
        section: 'reviews',
        content: { title: 'What Our Customers Say', description: 'Real reviews from real Tapa Hey regulars.' },
        updated_at: daysAgo(3),
      },
      {
        id: 'wc-gallery',
        section: 'gallery',
        content: { title: 'Our Food Moments', description: 'A look inside the kitchen and the plates we send out.' },
        updated_at: daysAgo(3),
      },
      {
        id: 'wc-location',
        section: 'location',
        content: {
          title: 'Find Us',
          description: 'Dine in, take out, or have it delivered hot to your door.',
          address: '123 Food Street, Brgy. San Isidro, Quezon City',
          phone: '+63 917 555 0199',
          email: 'hello@tapahey.demo',
          opening_hours: '6:00 AM – 10:00 PM, daily',
          map_embed_url:
            'https://www.openstreetmap.org/export/embed.html?bbox=121.02%2C14.63%2C121.08%2C14.68&layer=mapnik',
        },
        updated_at: daysAgo(3),
      },
      {
        id: 'wc-footer',
        section: 'footer',
        content: {
          tagline: 'Good Food. Good Mood.',
          blurb: 'Serving fresh, affordable Filipino breakfast plates in Quezon City since 2018.',
          facebook: 'https://facebook.com',
          instagram: 'https://instagram.com',
          tiktok: 'https://tiktok.com',
        },
        updated_at: daysAgo(3),
      },
    ],

    restaurant_settings: [
      {
        id: 'set-0001',
        name: 'Tapa Hey',
        tagline: 'Good Food. Good Mood.',
        address: '123 Food Street, Brgy. San Isidro, Quezon City',
        phone: '+63 917 555 0199',
        email: 'hello@tapahey.demo',
        opening_hours: '6:00 AM – 10:00 PM',
        map_embed_url:
          'https://www.openstreetmap.org/export/embed.html?bbox=121.02%2C14.63%2C121.08%2C14.68&layer=mapnik',
        delivery_fee: 50,
        currency: 'PHP',
        updated_at: daysAgo(3),
      },
    ],

    notifications: [
      { id: 'ntf-0001', type: 'inventory', title: 'Out of stock', message: 'Cooking Oil has run out. Reorder from Golden Fry Trading.', read: false, link: '/admin/inventory', created_at: daysAgo(1, 9) },
      { id: 'ntf-0002', type: 'inventory', title: 'Low stock warning', message: 'Longganisa is below the minimum stock level (5 kg left).', read: false, link: '/admin/inventory', created_at: daysAgo(1, 10) },
      { id: 'ntf-0003', type: 'review', title: 'New review awaiting approval', message: 'Rico Bautista left a 3-star review.', read: false, link: '/admin/reviews', created_at: daysAgo(1, 14) },
      { id: 'ntf-0004', type: 'reservation', title: 'New reservation', message: 'John Reyes reserved a table for 6 guests.', read: true, link: '/admin/reservations', created_at: daysAgo(0, 8) },
    ],

    favorites: [
      { id: 'fav-0001', customer_id: CU.juan, menu_item_id: M.classic, created_at: daysAgo(30) },
      { id: 'fav-0002', customer_id: CU.juan, menu_item_id: M.halohalo, created_at: daysAgo(20) },
    ],

    branches: [
      { id: 'brc-main', name: 'Tapa Hey – Main Branch', code: 'MAIN', address: '123 Food Street, Brgy. San Isidro, Quezon City', phone: '+63 917 555 0199', active: true, is_main: true, created_at: daysAgo(365) },
      { id: 'brc-02', name: 'Tapa Hey – Branch 02', code: 'BR02', address: '45 Commonwealth Ave, Brgy. Batasan Hills, Quezon City', phone: '+63 917 555 0210', active: true, is_main: false, created_at: daysAgo(240) },
      { id: 'brc-03', name: 'Tapa Hey – Branch 03', code: 'BR03', address: '8 Marcos Highway, Brgy. Santolan, Pasig City', phone: '+63 917 555 0311', active: true, is_main: false, created_at: daysAgo(120) },
    ],

    suppliers: [
      { id: 'sup-0001', name: 'Monterey Meats', contact_name: 'Ederic Tan', phone: '+63 918 200 1001', email: 'orders@montereymeats.demo', products: 'Beef Tapa', lead_time_days: 2, payment_terms: 'Net 15', status: 'active', created_at: daysAgo(300) },
      { id: 'sup-0002', name: 'San Isidro Poultry', contact_name: 'Grace Uy', phone: '+63 918 200 1002', email: 'sales@sipoultry.demo', products: 'Eggs', lead_time_days: 1, payment_terms: 'COD', status: 'active', created_at: daysAgo(300) },
      { id: 'sup-0003', name: 'Nueva Ecija Grains', contact_name: 'Bert Domingo', phone: '+63 918 200 1003', email: 'bert@negrains.demo', products: 'Rice', lead_time_days: 3, payment_terms: 'Net 30', status: 'active', created_at: daysAgo(300) },
      { id: 'sup-0004', name: 'Ilocos Produce', contact_name: 'Nena Lacsamana', phone: '+63 918 200 1004', email: 'nena@ilocosproduce.demo', products: 'Garlic, Onions', lead_time_days: 2, payment_terms: 'COD', status: 'active', created_at: daysAgo(300) },
      { id: 'sup-0005', name: 'Golden Fry Trading', contact_name: 'Wilson Sy', phone: '+63 918 200 1005', email: 'wilson@goldenfry.demo', products: 'Cooking Oil', lead_time_days: 2, payment_terms: 'Net 15', status: 'active', created_at: daysAgo(300) },
      { id: 'sup-0006', name: 'Pampanga Sausage Co.', contact_name: 'Dodie Reyes', phone: '+63 918 200 1006', email: 'dodie@pampangasausage.demo', products: 'Longganisa', lead_time_days: 2, payment_terms: 'Net 15', status: 'active', created_at: daysAgo(300) },
    ],

    recipe_items: [
      { id: 'rcp-0001', menu_item_id: M.classic, inventory_id: 'inv-0001', ingredient_name: 'Beef Tapa', quantity_per_serving: 0.15, unit: 'kg', created_at: daysAgo(300) },
      { id: 'rcp-0002', menu_item_id: M.classic, inventory_id: 'inv-0003', ingredient_name: 'Rice', quantity_per_serving: 0.2, unit: 'kg', created_at: daysAgo(300) },
      { id: 'rcp-0003', menu_item_id: M.classic, inventory_id: 'inv-0002', ingredient_name: 'Eggs', quantity_per_serving: 1, unit: 'pcs', created_at: daysAgo(300) },
      { id: 'rcp-0004', menu_item_id: M.classic, inventory_id: 'inv-0004', ingredient_name: 'Garlic', quantity_per_serving: 0.01, unit: 'kg', created_at: daysAgo(300) },
      { id: 'rcp-0005', menu_item_id: M.spicy, inventory_id: 'inv-0001', ingredient_name: 'Beef Tapa', quantity_per_serving: 0.15, unit: 'kg', created_at: daysAgo(300) },
      { id: 'rcp-0006', menu_item_id: M.spicy, inventory_id: 'inv-0003', ingredient_name: 'Rice', quantity_per_serving: 0.2, unit: 'kg', created_at: daysAgo(300) },
      { id: 'rcp-0007', menu_item_id: M.spicy, inventory_id: 'inv-0002', ingredient_name: 'Eggs', quantity_per_serving: 1, unit: 'pcs', created_at: daysAgo(300) },
      { id: 'rcp-0008', menu_item_id: M.longsilog, inventory_id: 'inv-0007', ingredient_name: 'Longganisa', quantity_per_serving: 0.12, unit: 'kg', created_at: daysAgo(300) },
      { id: 'rcp-0009', menu_item_id: M.longsilog, inventory_id: 'inv-0003', ingredient_name: 'Rice', quantity_per_serving: 0.2, unit: 'kg', created_at: daysAgo(300) },
      { id: 'rcp-0010', menu_item_id: M.longsilog, inventory_id: 'inv-0002', ingredient_name: 'Eggs', quantity_per_serving: 1, unit: 'pcs', created_at: daysAgo(300) },
      { id: 'rcp-0011', menu_item_id: M.hotsilog, inventory_id: 'inv-0008', ingredient_name: 'Hotdog', quantity_per_serving: 0.12, unit: 'kg', created_at: daysAgo(300) },
      { id: 'rcp-0012', menu_item_id: M.hotsilog, inventory_id: 'inv-0003', ingredient_name: 'Rice', quantity_per_serving: 0.2, unit: 'kg', created_at: daysAgo(300) },
      { id: 'rcp-0013', menu_item_id: M.hotsilog, inventory_id: 'inv-0002', ingredient_name: 'Eggs', quantity_per_serving: 1, unit: 'pcs', created_at: daysAgo(300) },
    ],

    purchase_requests: [
      { id: 'pr-0001', inventory_id: 'inv-0009', ingredient_name: 'Cooking Oil', requested_qty: 30, unit: 'L', reason: 'Auto-generated: stock (0 L) is below minimum (15 L).', status: 'pending', requested_by: 'System (auto low-stock)', approved_by: null, created_at: daysAgo(1), updated_at: daysAgo(1) },
      { id: 'pr-0002', inventory_id: 'inv-0007', ingredient_name: 'Longganisa', requested_qty: 24, unit: 'kg', reason: 'Auto-generated: stock (5 kg) is below minimum (12 kg).', status: 'approved', requested_by: 'System (auto low-stock)', approved_by: 'Liza Mercado', created_at: daysAgo(2), updated_at: daysAgo(1) },
      { id: 'pr-0003', inventory_id: 'inv-0004', ingredient_name: 'Garlic', requested_qty: 20, unit: 'kg', reason: 'Auto-generated: stock (8 kg) is below minimum (10 kg).', status: 'converted', requested_by: 'System (auto low-stock)', approved_by: 'Liza Mercado', created_at: daysAgo(6), updated_at: daysAgo(5) },
    ],

    purchase_orders: [
      { id: 'po-0001', po_number: 'PO-20260410-441', supplier_id: 'sup-0004', purchase_request_id: 'pr-0003', status: 'received', total: 2400, created_at: daysAgo(5), received_at: daysAgo(3) },
    ],
    purchase_order_items: [
      { id: 'poi-0001', purchase_order_id: 'po-0001', inventory_id: 'inv-0004', ingredient_name: 'Garlic', quantity: 20, unit_cost: 120, subtotal: 2400 },
    ],

    deliveries: [
      { id: 'dlv-0001', order_id: 'ord-0006', order_number: 'TH-20260406-1006', courier_name: 'Mang Rudy (Motor)', address: '12 Mabini St, Brgy. San Isidro, Quezon City', status: 'out_for_delivery', created_at: daysAgo(0, 11), updated_at: daysAgo(0, 11) },
    ],

    loyalty_accounts: [
      { id: 'lya-0001', customer_id: CU.juan, points_balance: 18, lifetime_points: 24, created_at: daysAgo(120), updated_at: daysAgo(0) },
      { id: 'lya-0002', customer_id: CU.maria, points_balance: 9, lifetime_points: 9, created_at: daysAgo(90), updated_at: daysAgo(9) },
      { id: 'lya-0003', customer_id: CU.john, points_balance: 5, lifetime_points: 5, created_at: daysAgo(60), updated_at: daysAgo(13) },
    ],
    loyalty_transactions: [
      { id: 'lyt-0001', loyalty_account_id: 'lya-0001', order_id: 'ord-0001', points: 3, type: 'earn', note: 'Earned from order TH-20260401-1001', created_at: daysAgo(5) },
      { id: 'lyt-0002', loyalty_account_id: 'lya-0001', order_id: 'ord-0011', points: -6, type: 'redeem', note: 'Redeemed for ₱3 reward', created_at: daysAgo(3) },
      { id: 'lyt-0003', loyalty_account_id: 'lya-0002', order_id: 'ord-0002', points: 1, type: 'earn', note: 'Earned from order TH-20260402-1002', created_at: daysAgo(9) },
      { id: 'lyt-0004', loyalty_account_id: 'lya-0003', order_id: 'ord-0003', points: 2, type: 'earn', note: 'Earned from order TH-20260403-1003', created_at: daysAgo(13) },
    ],

    promotions: [
      { id: 'promo-0001', code: 'TAPA10', description: '10% off your order', discount_type: 'percent', discount_value: 10, min_purchase: 0, start_date: dateOnly(-90), end_date: dateOnly(90), active: true, created_at: daysAgo(90) },
      { id: 'promo-0002', code: 'BREAKFAST50', description: '₱50 off breakfast orders over ₱250', discount_type: 'fixed', discount_value: 50, min_purchase: 250, start_date: dateOnly(-30), end_date: dateOnly(60), active: true, created_at: daysAgo(30) },
      { id: 'promo-0003', code: 'COMBO', description: 'Meal promo bundle — 15% off orders over ₱400', discount_type: 'percent', discount_value: 15, min_purchase: 400, start_date: dateOnly(-30), end_date: dateOnly(30), active: true, created_at: daysAgo(30) },
    ],
    promotion_usage: [],

    resellers: [
      { id: 'rsl-0001', business_name: 'Sari-Sari ni Aling Nena', contact_name: 'Nena Villareal', phone: '+63 917 700 2001', email: 'nena.sari@example.com', credit_limit: 20000, credit_terms_days: 15, status: 'active', created_at: daysAgo(150) },
      { id: 'rsl-0002', business_name: 'QC Pasalubong Center', contact_name: 'Ferdie Ocampo', phone: '+63 917 700 2002', email: 'ferdie@qcpasalubong.demo', credit_limit: 50000, credit_terms_days: 30, status: 'active', created_at: daysAgo(200) },
    ],
    b2b_orders: [
      {
        id: 'b2b-0001', order_number: 'B2B-20260501-220', reseller_id: 'rsl-0001', status: 'fulfilled', subtotal: 6400, total: 6400,
        created_at: daysAgo(40), updated_at: daysAgo(38),
      },
    ],
    b2b_order_items: [
      { id: 'b2bi-0001', b2b_order_id: 'b2b-0001', menu_item_id: PKG.packagedTapa, product_name: 'Packaged Beef Tapa (500g)', sku: 'TH-PKG-001', quantity: 20, unit_price: 240, subtotal: 4800 },
      { id: 'b2bi-0002', b2b_order_id: 'b2b-0001', menu_item_id: PKG.bottledSauce, product_name: 'Tapa Hey Sawsawan (350ml)', sku: 'TH-PKG-003', quantity: 20, unit_price: 65, subtotal: 1300 },
      { id: 'b2bi-0003', b2b_order_id: 'b2b-0001', menu_item_id: PKG.garlicOil, product_name: 'Toasted Garlic Oil (250ml)', sku: 'TH-PKG-004', quantity: 3, unit_price: 100, subtotal: 300 },
    ],
    invoices: [
      { id: 'inv-b2b-0001', invoice_number: 'INV-2026A1B2', b2b_order_id: 'b2b-0001', reseller_id: 'rsl-0001', amount: 6400, status: 'paid', due_date: dateOnly(-25), paid_at: daysAgo(37), created_at: daysAgo(40) },
    ],

    cashier_shifts: [
      { id: 'sft-0001', staff_id: 'stf-0003', staff_name: 'Paolo Rivera', opening_cash: 5000, closing_cash_expected: 18450, closing_cash_actual: 18400, cash_difference: -50, status: 'closed', opened_at: daysAgo(1, 6), closed_at: daysAgo(1, 22) },
    ],

    audit_logs: [
      { id: 'adt-0001', actor_name: 'Paolo Rivera', action: 'created', entity: 'order', entity_id: 'ord-0007', detail: 'Created POS-0007 for Table 1.', created_at: daysAgo(0, 12) },
      { id: 'adt-0002', actor_name: 'Paolo Rivera', action: 'payment_paid', entity: 'order', entity_id: 'ord-0007', detail: 'Payment completed via card.', created_at: daysAgo(0, 12) },
      { id: 'adt-0003', actor_name: 'Ramon Villanueva', action: 'status_changed', entity: 'order', entity_id: 'ord-0007', detail: 'TH-20260406-1007 moved to preparing.', created_at: daysAgo(0, 12) },
      { id: 'adt-0004', actor_name: 'Liza Mercado', action: 'approved', entity: 'purchase_request', entity_id: 'pr-0002', detail: 'Approved restock request for Longganisa.', created_at: daysAgo(1) },
      { id: 'adt-0005', actor_name: 'Chef Andres Bautista', action: 'updated', entity: 'menu_item', entity_id: M.classic, detail: 'Changed Classic Tapsilog price to ₱99.', created_at: daysAgo(10) },
    ],

    integrations: [],
  }
}

/* ---------- generated order history ---------- */

type SeedOrderSpec = {
  id: string
  num: string
  customer: string
  name: string
  email: string
  phone: string
  type: 'dine_in' | 'takeout' | 'delivery'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled'
  payment: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  method: 'cash' | 'gcash' | 'maya' | 'card'
  day: number
  hour: number
  lines: Array<[string, string, number, number]>
  address?: string
  table?: string
}

const ORDER_SPECS: SeedOrderSpec[] = [
  { id: 'ord-0001', num: 'TH-20260401-1001', customer: CU.juan, name: 'Juan Dela Cruz', email: 'juan@tapahey.demo', phone: '+63 917 555 0101', type: 'delivery', status: 'completed', payment: 'paid', method: 'gcash', day: 5, hour: 8, lines: [[M.classic, 'Classic Tapsilog', 2, 99], [M.icedTea, 'Bottomless Iced Tea', 1, 49]], address: '12 Mabini St, Brgy. San Isidro, Quezon City' },
  { id: 'ord-0002', num: 'TH-20260402-1002', customer: CU.maria, name: 'Maria Santos', email: 'maria.santos@example.com', phone: '+63 918 555 0102', type: 'dine_in', status: 'completed', payment: 'paid', method: 'cash', day: 9, hour: 7, lines: [[M.tocilog, 'Tocilog', 1, 89], [M.coffee, 'Barako Coffee', 1, 45]], table: 'T2' },
  { id: 'ord-0003', num: 'TH-20260403-1003', customer: CU.john, name: 'John Reyes', email: 'john.reyes@example.com', phone: '+63 919 555 0103', type: 'delivery', status: 'completed', payment: 'paid', method: 'card', day: 13, hour: 12, lines: [[M.spicy, 'Spicy Tapsilog', 2, 109], [M.extraRice, 'Extra Rice', 2, 25]], address: '7 Katipunan Ext, Brgy. Bagumbayan, Quezon City' },
  { id: 'ord-0004', num: 'TH-20260404-1004', customer: CU.angela, name: 'Angela Cruz', email: 'angela.cruz@example.com', phone: '+63 920 555 0104', type: 'takeout', status: 'completed', payment: 'paid', method: 'maya', day: 17, hour: 9, lines: [[M.longsilog, 'Longsilog', 3, 89]] },
  { id: 'ord-0005', num: 'TH-20260405-1005', customer: CU.mark, name: 'Mark Garcia', email: 'mark.garcia@example.com', phone: '+63 921 555 0105', type: 'dine_in', status: 'completed', payment: 'paid', method: 'cash', day: 21, hour: 19, lines: [[M.barkada, 'Tapa Hey Barkada Bundle', 1, 399]], table: 'T5' },
  { id: 'ord-0006', num: 'TH-20260406-1006', customer: CU.juan, name: 'Juan Dela Cruz', email: 'juan@tapahey.demo', phone: '+63 917 555 0101', type: 'delivery', status: 'out_for_delivery', payment: 'paid', method: 'gcash', day: 0, hour: 11, lines: [[M.garlic, 'Garlic Tapsilog', 1, 109], [M.halohalo, 'Halo-Halo', 1, 89]], address: '12 Mabini St, Brgy. San Isidro, Quezon City' },
  { id: 'ord-0007', num: 'TH-20260406-1007', customer: CU.maria, name: 'Maria Santos', email: 'maria.santos@example.com', phone: '+63 918 555 0102', type: 'dine_in', status: 'preparing', payment: 'paid', method: 'card', day: 0, hour: 12, lines: [[M.spamsilog, 'Spamsilog', 2, 119], [M.gulaman, "Sago't Gulaman", 2, 45]], table: 'T1' },
  { id: 'ord-0008', num: 'TH-20260406-1008', customer: CU.john, name: 'John Reyes', email: 'john.reyes@example.com', phone: '+63 919 555 0103', type: 'takeout', status: 'pending', payment: 'pending', method: 'cash', day: 0, hour: 13, lines: [[M.hotsilog, 'Hotsilog', 1, 89], [M.softdrink, 'Soft Drinks', 1, 35]] },
  { id: 'ord-0009', num: 'TH-20260406-1009', customer: CU.angela, name: 'Angela Cruz', email: 'angela.cruz@example.com', phone: '+63 920 555 0104', type: 'delivery', status: 'confirmed', payment: 'paid', method: 'maya', day: 0, hour: 14, lines: [[M.cornsilog, 'Cornsilog', 2, 95], [M.turon, 'Turon', 2, 35]], address: '90 Kalayaan Ave, Brgy. Diliman, Quezon City' },
  { id: 'ord-0010', num: 'TH-20260406-1010', customer: CU.mark, name: 'Mark Garcia', email: 'mark.garcia@example.com', phone: '+63 921 555 0105', type: 'dine_in', status: 'ready', payment: 'paid', method: 'cash', day: 0, hour: 15, lines: [[M.bangsilog, 'Bangsilog', 1, 119]], table: 'T4' },
  { id: 'ord-0011', num: 'TH-20260405-1011', customer: CU.juan, name: 'Juan Dela Cruz', email: 'juan@tapahey.demo', phone: '+63 917 555 0101', type: 'takeout', status: 'cancelled', payment: 'failed', method: 'card', day: 3, hour: 16, lines: [[M.pusitsilog, 'Pusit Silog', 1, 129]] },
  { id: 'ord-0012', num: 'TH-20260404-1012', customer: CU.maria, name: 'Maria Santos', email: 'maria.santos@example.com', phone: '+63 918 555 0102', type: 'delivery', status: 'completed', payment: 'paid', method: 'gcash', day: 2, hour: 18, lines: [[M.classic, 'Classic Tapsilog', 4, 99], [M.icedTea, 'Bottomless Iced Tea', 2, 49]], address: '48 Rizal Ave, Brgy. Holy Spirit, Quezon City' },
  { id: 'ord-0013', num: 'TH-20260403-1013', customer: CU.john, name: 'John Reyes', email: 'john.reyes@example.com', phone: '+63 919 555 0103', type: 'dine_in', status: 'completed', payment: 'paid', method: 'cash', day: 1, hour: 7, lines: [[M.danggitsilog, 'Danggit Silog', 2, 109], [M.coffee, 'Barako Coffee', 2, 45]], table: 'T3' },
  { id: 'ord-0014', num: 'TH-20260402-1014', customer: CU.angela, name: 'Angela Cruz', email: 'angela.cruz@example.com', phone: '+63 920 555 0104', type: 'takeout', status: 'completed', payment: 'paid', method: 'maya', day: 1, hour: 12, lines: [[M.solo, 'Solo Combo', 2, 129]] },
  { id: 'ord-0015', num: 'TH-20260401-1015', customer: CU.mark, name: 'Mark Garcia', email: 'mark.garcia@example.com', phone: '+63 921 555 0105', type: 'delivery', status: 'completed', payment: 'paid', method: 'card', day: 4, hour: 19, lines: [[M.spicy, 'Spicy Tapsilog', 3, 109], [M.flan, 'Leche Flan', 2, 59]], address: '3 Tandang Sora, Brgy. Culiat, Quezon City' },
]

function totalsFor(spec: SeedOrderSpec) {
  const subtotal = spec.lines.reduce((s, [, , qty, price]) => s + qty * price, 0)
  const delivery_fee = spec.type === 'delivery' ? 50 : 0
  return { subtotal, delivery_fee, total: subtotal + delivery_fee }
}

function buildOrders() {
  return ORDER_SPECS.map((spec) => {
    const { subtotal, delivery_fee, total } = totalsFor(spec)
    return {
      id: spec.id,
      order_number: spec.num,
      customer_id: spec.customer,
      order_type: spec.type,
      subtotal,
      delivery_fee,
      discount: 0,
      total,
      payment_status: spec.payment,
      order_status: spec.status,
      customer_name: spec.name,
      customer_email: spec.email,
      customer_phone: spec.phone,
      delivery_address: spec.address ?? null,
      delivery_city: spec.address ? 'Quezon City' : null,
      delivery_postal_code: spec.address ? '1100' : null,
      table_number: spec.table ?? null,
      notes: null,
      created_at: daysAgo(spec.day, spec.hour),
      updated_at: daysAgo(spec.day, spec.hour + 1),
    }
  })
}

function buildOrderItems() {
  const rows: Record<string, unknown>[] = []
  ORDER_SPECS.forEach((spec) => {
    spec.lines.forEach(([itemId, itemName, qty, price], i) => {
      rows.push({
        id: `oit-${spec.id}-${i}`,
        order_id: spec.id,
        menu_item_id: itemId,
        item_name: itemName,
        quantity: qty,
        unit_price: price,
        subtotal: qty * price,
        created_at: daysAgo(spec.day, spec.hour),
      })
    })
  })
  return rows
}

function buildPayments() {
  return ORDER_SPECS.filter((s) => s.payment !== 'pending').map((spec, i) => {
    const { total } = totalsFor(spec)
    return {
      id: `pay-${spec.id}`,
      order_id: spec.id,
      customer_id: spec.customer,
      amount: total,
      currency: 'PHP',
      payment_method: spec.method,
      payment_status: spec.payment,
      transaction_reference: `DEMO-${spec.num.replace('TH-', '')}-${1000 + i}`,
      provider: spec.method === 'cash' ? 'cash' : 'demo',
      created_at: daysAgo(spec.day, spec.hour),
      updated_at: daysAgo(spec.day, spec.hour),
    }
  })
}
