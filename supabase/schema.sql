-- =========================================================================
-- TAPA HEY — Restaurant Management System
-- Supabase / PostgreSQL schema
--
-- Run this in the Supabase SQL editor (or `supabase db push` with this file
-- in supabase/migrations), THEN run seed.sql.
--
-- Safe to re-run at any time: it drops and recreates every Tapa Hey table
-- and type first, so a half-finished or outdated previous run can never
-- leave stale columns behind. Re-running this always wipes Tapa Hey data
-- (auth.users is untouched — Supabase Auth accounts are never dropped).
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- CLEAN SLATE — drop children before parents, then the enum types.
-- ---------------------------------------------------------------------
drop table if exists integrations cascade;
drop table if exists audit_logs cascade;
drop table if exists cashier_shifts cascade;
drop table if exists invoices cascade;
drop table if exists b2b_order_items cascade;
drop table if exists b2b_orders cascade;
drop table if exists resellers cascade;
drop table if exists promotion_usage cascade;
drop table if exists promotions cascade;
drop table if exists loyalty_transactions cascade;
drop table if exists loyalty_accounts cascade;
drop table if exists deliveries cascade;
drop table if exists purchase_order_items cascade;
drop table if exists purchase_orders cascade;
drop table if exists purchase_requests cascade;
drop table if exists suppliers cascade;
drop table if exists recipe_items cascade;
drop table if exists branches cascade;
drop table if exists favorites cascade;
drop table if exists notifications cascade;
drop table if exists inventory_transactions cascade;
drop table if exists inventory cascade;
drop table if exists reviews cascade;
drop table if exists gallery cascade;
drop table if exists website_content cascade;
drop table if exists restaurant_settings cascade;
drop table if exists reservations cascade;
drop table if exists payments cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists restaurant_tables cascade;
drop table if exists customers cascade;
drop table if exists menu_items cascade;
drop table if exists menu_categories cascade;
drop table if exists staff cascade;
drop table if exists profiles cascade;

drop type if exists inventory_txn_type cascade;
drop type if exists reservation_status cascade;
drop type if exists payment_method cascade;
drop type if exists payment_status cascade;
drop type if exists order_status cascade;
drop type if exists order_type cascade;
drop type if exists staff_role cascade;
drop type if exists product_type cascade;
drop type if exists order_channel cascade;
drop type if exists purchase_request_status cascade;
drop type if exists purchase_order_status cascade;
drop type if exists delivery_status cascade;
drop type if exists discount_type cascade;
drop type if exists b2b_order_status cascade;
drop type if exists invoice_status cascade;

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
create type staff_role as enum (
  'super_admin', 'operations', 'manager', 'cashier', 'kitchen', 'warehouse',
  'procurement', 'finance', 'marketing', 'content_manager', 'qa_admin', 'delivery_staff'
);
create type order_type as enum ('dine_in', 'takeout', 'delivery');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled');
create type payment_status as enum ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded');
create type payment_method as enum ('cash', 'gcash', 'maya', 'card');
create type reservation_status as enum ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show');
create type inventory_txn_type as enum ('stock_in', 'stock_out', 'adjustment');
create type product_type as enum ('menu', 'packaged');
create type order_channel as enum ('pos', 'website', 'delivery_platform');
create type purchase_request_status as enum ('pending', 'approved', 'rejected', 'converted');
create type purchase_order_status as enum ('draft', 'sent', 'received', 'cancelled');
create type delivery_status as enum ('preparing', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered');
create type discount_type as enum ('percent', 'fixed');
create type b2b_order_status as enum ('pending', 'confirmed', 'fulfilled', 'cancelled');
create type invoice_status as enum ('unpaid', 'paid', 'overdue');

-- ---------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------

-- One row per Supabase Auth user (id matches auth.users.id).
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role staff_role not null default 'cashier',
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references menu_categories(id) on delete restrict,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price > 0),
  discount_price numeric(10,2) check (discount_price is null or discount_price < price),
  image_url text not null default '',
  prep_time_minutes int not null default 15,
  available boolean not null default true,
  best_seller boolean not null default false,
  sort_order int not null default 0,
  sku text not null default '',
  barcode text,
  cost numeric(10,2) not null default 0,
  wholesale_price numeric(10,2),
  product_type product_type not null default 'menu',
  batch_number text,
  expiration_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_menu_items_category on menu_items(category_id);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_customers_profile on customers(profile_id);

create table if not exists restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  seats int not null default 2,
  area text not null default 'Main Hall',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text not null default '',
  phone text not null default '',
  active boolean not null default true,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references customers(id) on delete set null,
  order_type order_type not null,
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_status payment_status not null default 'pending',
  order_status order_status not null default 'pending',
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text,
  delivery_city text,
  delivery_postal_code text,
  table_number text,
  notes text,
  branch_id uuid references branches(id) on delete set null,
  channel order_channel not null default 'website',
  promo_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_status on orders(order_status);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_orders_email on orders(customer_email);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  item_name text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  subtotal numeric(10,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_items_order on order_items(order_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  amount numeric(10,2) not null,
  currency text not null default 'PHP',
  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  transaction_reference text not null unique,
  provider text not null default 'demo' check (provider in ('demo', 'stripe', 'cash')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payments_order on payments(order_id);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  reserved_date date not null,
  reserved_time time not null,
  guests int not null check (guests > 0),
  table_id uuid references restaurant_tables(id) on delete set null,
  special_request text,
  status reservation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_reservations_date on reservations(reserved_date);

create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  stock numeric(10,2) not null default 0,
  unit text not null default 'kg',
  minimum_stock numeric(10,2) not null default 0,
  supplier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references inventory(id) on delete cascade,
  type inventory_txn_type not null,
  quantity numeric(10,2) not null check (quantity > 0),
  note text,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists idx_inv_txn_inventory on inventory_transactions(inventory_id);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  customer_name text not null,
  avatar_url text,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  approved boolean not null default false,
  reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_reviews_approved on reviews(approved);

create table if not exists gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  image_url text not null,
  sort_order int not null default 0,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists website_content (
  id uuid primary key default gen_random_uuid(),
  section text not null unique,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Tapa Hey',
  tagline text not null default 'Good Food. Good Mood.',
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  opening_hours text not null default '',
  map_embed_url text not null default '',
  delivery_fee numeric(10,2) not null default 50,
  currency text not null default 'PHP',
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('order', 'payment', 'reservation', 'inventory', 'review')),
  title text not null,
  message text not null,
  read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_read on notifications(read);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, menu_item_id)
);

-- ---------------------------------------------------------------------
-- ENTERPRISE MODULES (recipes/BOM, procurement, delivery, loyalty,
-- promotions, B2B/reseller, finance, audit, integrations)
-- ---------------------------------------------------------------------

create table if not exists recipe_items (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  inventory_id uuid not null references inventory(id) on delete cascade,
  ingredient_name text not null,
  quantity_per_serving numeric(10,3) not null check (quantity_per_serving > 0),
  unit text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_recipe_items_menu_item on recipe_items(menu_item_id);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  products text not null default '',
  lead_time_days int not null default 2,
  payment_terms text not null default 'COD',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists purchase_requests (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references inventory(id) on delete cascade,
  ingredient_name text not null,
  requested_qty numeric(10,2) not null check (requested_qty > 0),
  unit text not null,
  reason text not null default '',
  status purchase_request_status not null default 'pending',
  requested_by text not null default 'System',
  approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  purchase_request_id uuid references purchase_requests(id) on delete set null,
  status purchase_order_status not null default 'draft',
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  received_at timestamptz
);

create table if not exists purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  inventory_id uuid not null references inventory(id) on delete restrict,
  ingredient_name text not null,
  quantity numeric(10,2) not null check (quantity > 0),
  unit_cost numeric(10,2) not null default 0,
  subtotal numeric(10,2) generated always as (quantity * unit_cost) stored
);
create index if not exists idx_po_items_po on purchase_order_items(purchase_order_id);

create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  order_number text not null,
  courier_name text not null default '',
  address text not null default '',
  status delivery_status not null default 'preparing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_deliveries_order on deliveries(order_id);

create table if not exists loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade unique,
  points_balance int not null default 0,
  lifetime_points int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  loyalty_account_id uuid not null references loyalty_accounts(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  points int not null,
  type text not null check (type in ('earn', 'redeem')),
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_loyalty_txn_account on loyalty_transactions(loyalty_account_id);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null default '',
  discount_type discount_type not null default 'percent',
  discount_value numeric(10,2) not null default 0,
  min_purchase numeric(10,2) not null default 0,
  start_date date not null,
  end_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists promotion_usage (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references promotions(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  customer_email text not null,
  discount_applied numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists resellers (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  credit_limit numeric(10,2) not null default 0,
  credit_terms_days int not null default 15,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists b2b_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  reseller_id uuid not null references resellers(id) on delete restrict,
  status b2b_order_status not null default 'pending',
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists b2b_order_items (
  id uuid primary key default gen_random_uuid(),
  b2b_order_id uuid not null references b2b_orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  product_name text not null,
  sku text not null default '',
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null default 0,
  subtotal numeric(10,2) generated always as (quantity * unit_price) stored
);
create index if not exists idx_b2b_items_order on b2b_order_items(b2b_order_id);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  b2b_order_id uuid not null references b2b_orders(id) on delete cascade,
  reseller_id uuid not null references resellers(id) on delete restrict,
  amount numeric(10,2) not null default 0,
  status invoice_status not null default 'unpaid',
  due_date date not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists cashier_shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  staff_name text not null,
  opening_cash numeric(10,2) not null default 0,
  closing_cash_expected numeric(10,2),
  closing_cash_actual numeric(10,2),
  cash_difference numeric(10,2),
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists idx_shifts_staff on cashier_shifts(staff_id);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_name text not null,
  action text not null,
  entity text not null,
  entity_id text,
  detail text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_created on audit_logs(created_at desc);

create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  category text not null,
  status text not null default 'demo' check (status in ('connected', 'demo')),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','staff','menu_categories','menu_items','customers','orders',
    'payments','reservations','inventory','reviews','gallery','restaurant_settings',
    'purchase_requests','deliveries','loyalty_accounts','b2b_orders','integrations'
  ]) loop
    execute format(
      'drop trigger if exists trg_set_updated_at on %I; create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table staff enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table reservations enable row level security;
alter table restaurant_tables enable row level security;
alter table inventory enable row level security;
alter table inventory_transactions enable row level security;
alter table reviews enable row level security;
alter table gallery enable row level security;
alter table website_content enable row level security;
alter table restaurant_settings enable row level security;
alter table notifications enable row level security;
alter table favorites enable row level security;

-- Helper: is the current user an active staff member?
create or replace function is_staff() returns boolean as $$
  select exists (
    select 1 from staff s
    join profiles p on p.id = s.profile_id
    where p.id = auth.uid() and s.active = true
  );
$$ language sql security definer stable;

-- Public read access — anonymous visitors browse the menu, gallery, reviews, content.
create policy "menu categories are public" on menu_categories for select using (active = true or is_staff());
create policy "menu items are public" on menu_items for select using (true);
create policy "approved gallery is public" on gallery for select using (approved = true or is_staff());
create policy "approved reviews are public" on reviews for select using (approved = true or is_staff());
create policy "website content is public" on website_content for select using (true);
create policy "restaurant settings are public" on restaurant_settings for select using (true);
create policy "tables are public" on restaurant_tables for select using (true);

-- Staff manage catalog / content.
create policy "staff manage menu categories" on menu_categories for all using (is_staff()) with check (is_staff());
create policy "staff manage menu items" on menu_items for all using (is_staff()) with check (is_staff());
create policy "staff manage gallery" on gallery for all using (is_staff()) with check (is_staff());
create policy "staff manage website content" on website_content for all using (is_staff()) with check (is_staff());
create policy "staff manage settings" on restaurant_settings for all using (is_staff()) with check (is_staff());
create policy "staff manage tables" on restaurant_tables for all using (is_staff()) with check (is_staff());
create policy "staff manage inventory" on inventory for all using (is_staff()) with check (is_staff());
create policy "staff manage inventory txns" on inventory_transactions for all using (is_staff()) with check (is_staff());
create policy "staff manage staff" on staff for all using (is_staff()) with check (is_staff());
create policy "staff manage notifications" on notifications for all using (is_staff()) with check (is_staff());
create policy "public flows can create notifications" on notifications for insert with check (true);

-- Profiles: a user reads/updates their own row; staff read all.
create policy "read own profile" on profiles for select using (auth.uid() = id or is_staff());
create policy "update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);

-- Customers: guest checkout creates a row; staff manage all; a signed-in
-- customer reads/updates their own row.
create policy "anyone can create a customer record" on customers for insert with check (true);
create policy "staff manage customers" on customers for all using (is_staff()) with check (is_staff());
create policy "customers read own row" on customers for select using (profile_id = auth.uid());
create policy "customers update own row" on customers for update using (profile_id = auth.uid());

-- Orders: anyone can create an order (guest checkout); staff see/manage all;
-- a signed-in customer sees only their own orders. The checkout flow also
-- needs to flip payment_status/order_status itself once the demo payment
-- simulator (or Stripe webhook, in production) resolves — but only while
-- the order is still unsettled, so a guest can never rewrite history on an
-- order that has already been paid, completed, or cancelled.
create policy "anyone can place an order" on orders for insert with check (true);
create policy "checkout can update an order still in progress" on orders for update
  using (payment_status in ('pending', 'processing'))
  with check (true);
create policy "staff manage orders" on orders for all using (is_staff()) with check (is_staff());
create policy "customers read own orders" on orders for select using (
  customer_id in (select id from customers where profile_id = auth.uid())
);

create policy "anyone can add order items to a new order" on order_items for insert with check (true);
create policy "staff manage order items" on order_items for all using (is_staff()) with check (is_staff());
create policy "customers read own order items" on order_items for select using (
  order_id in (
    select o.id from orders o
    join customers c on c.id = o.customer_id
    where c.profile_id = auth.uid()
  )
);

-- Payments: created by the checkout flow. The demo payment simulator resolves
-- a payment's status client-side, so guests may update a payment while it is
-- still pending/processing — never once it has already settled.
create policy "anyone can create a payment" on payments for insert with check (true);
create policy "checkout can update a payment still in progress" on payments for update
  using (payment_status in ('pending', 'processing'))
  with check (true);
create policy "staff manage payments" on payments for all using (is_staff()) with check (is_staff());
create policy "customers read own payments" on payments for select using (
  customer_id in (select id from customers where profile_id = auth.uid())
);

-- Reservations: anyone can request one; staff manage all; owners read their own.
create policy "anyone can request a reservation" on reservations for insert with check (true);
create policy "staff manage reservations" on reservations for all using (is_staff()) with check (is_staff());
create policy "customers read own reservations" on reservations for select using (
  customer_id in (select id from customers where profile_id = auth.uid())
);

-- Reviews: anyone can submit (starts unapproved); staff moderate; owners read their own.
create policy "anyone can submit a review" on reviews for insert with check (true);
create policy "staff manage reviews" on reviews for all using (is_staff()) with check (is_staff());
create policy "customers read own reviews" on reviews for select using (
  customer_id in (select id from customers where profile_id = auth.uid())
);

-- Favorites: fully owned by the signed-in customer.
create policy "customers manage own favorites" on favorites for all using (
  customer_id in (select id from customers where profile_id = auth.uid())
) with check (
  customer_id in (select id from customers where profile_id = auth.uid())
);
create policy "staff read favorites" on favorites for select using (is_staff());

create policy "only staff read notifications" on notifications for select using (is_staff());

-- ---------------------------------------------------------------------
-- Enterprise modules — RLS. These are internal/back-office data: staff
-- (any active role) manage everything; a signed-in customer may read their
-- own loyalty account. Nothing here is public.
-- ---------------------------------------------------------------------
alter table branches enable row level security;
alter table recipe_items enable row level security;
alter table suppliers enable row level security;
alter table purchase_requests enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table deliveries enable row level security;
alter table loyalty_accounts enable row level security;
alter table loyalty_transactions enable row level security;
alter table promotions enable row level security;
alter table promotion_usage enable row level security;
alter table resellers enable row level security;
alter table b2b_orders enable row level security;
alter table b2b_order_items enable row level security;
alter table invoices enable row level security;
alter table cashier_shifts enable row level security;
alter table audit_logs enable row level security;
alter table integrations enable row level security;

create policy "staff manage branches" on branches for all using (is_staff()) with check (is_staff());
create policy "branches are readable for checkout" on branches for select using (true);
create policy "staff manage recipe items" on recipe_items for all using (is_staff()) with check (is_staff());
create policy "staff manage suppliers" on suppliers for all using (is_staff()) with check (is_staff());
create policy "staff manage purchase requests" on purchase_requests for all using (is_staff()) with check (is_staff());
create policy "staff manage purchase orders" on purchase_orders for all using (is_staff()) with check (is_staff());
create policy "staff manage purchase order items" on purchase_order_items for all using (is_staff()) with check (is_staff());
create policy "staff manage deliveries" on deliveries for all using (is_staff()) with check (is_staff());

create policy "staff manage loyalty accounts" on loyalty_accounts for all using (is_staff()) with check (is_staff());
create policy "customers read own loyalty account" on loyalty_accounts for select using (
  customer_id in (select id from customers where profile_id = auth.uid())
);
create policy "staff manage loyalty transactions" on loyalty_transactions for all using (is_staff()) with check (is_staff());
create policy "customers read own loyalty transactions" on loyalty_transactions for select using (
  loyalty_account_id in (
    select la.id from loyalty_accounts la
    join customers c on c.id = la.customer_id
    where c.profile_id = auth.uid()
  )
);

create policy "staff manage promotions" on promotions for all using (is_staff()) with check (is_staff());
create policy "promo codes are readable for checkout" on promotions for select using (active = true or is_staff());
create policy "staff manage promotion usage" on promotion_usage for all using (is_staff()) with check (is_staff());
create policy "checkout can record promotion usage" on promotion_usage for insert with check (true);

create policy "staff manage resellers" on resellers for all using (is_staff()) with check (is_staff());
create policy "staff manage b2b orders" on b2b_orders for all using (is_staff()) with check (is_staff());
create policy "staff manage b2b order items" on b2b_order_items for all using (is_staff()) with check (is_staff());
create policy "staff manage invoices" on invoices for all using (is_staff()) with check (is_staff());
create policy "staff manage cashier shifts" on cashier_shifts for all using (is_staff()) with check (is_staff());
create policy "staff manage audit logs" on audit_logs for all using (is_staff()) with check (is_staff());
create policy "anyone can write an audit entry" on audit_logs for insert with check (true);
create policy "staff manage integrations" on integrations for all using (is_staff()) with check (is_staff());
