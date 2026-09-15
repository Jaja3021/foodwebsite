# Tapa Hey — Multi-Channel Restaurant & Food Business Management System

**Good Food. Good Mood.** A complete, working **enterprise system** for a
Filipino tapsilog restaurant chain — not just a website, but the whole
business: customer website, POS, Kitchen Display System, inventory with
recipe-based auto-deduction, procurement, delivery dispatch, loyalty & CRM,
B2B/reseller sales, finance & cashier shifts, multi-branch reporting, and an
Owner Cockpit — all reading and writing through one central backend
(`src/lib/db.ts`), the same architecture pattern described in
Admin → **System Architecture**.

See [Enterprise Modules](#enterprise-modules) below for the full module map,
or jump straight to Admin → **Demo Center** to run 10 pre-built end-to-end
scenarios (a POS sale, an online order, a low-stock → purchase-order chain, a
delivery dispatch, a B2B bulk order, an end-of-day close, and more) that
actually mutate the demo data so you can narrate a live walkthrough.

> 🟡 **DEMO BUILD.** No real money is ever charged. Payments run through a
> built-in Demo Payment Simulator (or Stripe **test mode**, if configured).
> See [Payments](#payments-demo-simulator--stripe-test-mode) below.

---

## Three entry points, one database

Opening the app (`/`) shows a launcher screen to pick where to go:

- **Customer Website** (`/home`) — the public site
- **Admin Dashboard** (`/admin`) — staff management, role-gated
- **Point of Sale** (`/pos`) — a counter terminal for cashiers/managers to take
  walk-in dine-in/takeout orders and charge them on the spot, using the same
  demo payment flow as online checkout

> ⚠️ **Temporary:** `/admin` and `/pos` currently skip the login screen and
> auto-enter as the seeded Super Admin (`bypassStaffLogin()` in
> `src/lib/auth.ts`), so the launcher goes straight in for easy demoing. This
> only works in local demo mode. Before any real deployment, remove that call
> from `AdminLayout.tsx` / `pages/pos/POS.tsx` so both routes go back to
> requiring `/admin/login`.

All three read and write the same backend, so an order rung up at the POS
terminal shows up in Admin → Orders exactly like one placed on the website.

## What's actually working

This is not a static mockup. Every button below changes real application state:

- Browse the live menu (Supabase-backed, or the built-in local database) → add
  to cart → adjust quantities → checkout.
- Checkout collects customer info, order type (dine-in / takeout / delivery),
  and payment method, then opens a **test payment flow** with Success / Failed
  / Cancelled scenarios.
- A successful (or cash-on-hand-over) payment **creates an order and a payment
  record**, generates an order number (`TH-YYYYMMDD-####`), and shows a
  printable receipt.
- The admin dashboard sees the new order **immediately** (same backend, live
  queries) and can advance its status (Pending → Confirmed → Preparing →
  Ready/Out for Delivery → Completed) or cancel it.
- The customer's **order tracking page** reflects every status change the
  admin makes, live.
- Admin can manage the menu, categories, reservations, customers, inventory
  (with automatic **recipe-based** stock deduction on completed orders),
  reviews (approve / reply / hide), the photo gallery, website content (hero,
  about, why-choose-us, location, footer), staff accounts with role-based
  permissions, and view sales reports with charts and CSV export.
- **Kitchen Display System** (`/admin/kitchen`) — a real-time board (New →
  Preparing → Ready) driven by the same `orders` data as everywhere else.
- **Procurement** (`/admin/procurement`) — low stock automatically creates a
  Purchase Request; a manager approves it; it converts to a Purchase Order
  sent to a supplier; receiving it restocks inventory.
- **Delivery** (`/admin/delivery`) — demo courier assignment and dispatch
  (Preparing → Ready for Pickup → Picked Up → Out for Delivery → Delivered),
  auto-created the moment a delivery order starts preparing.
- **Loyalty** (`/admin/loyalty`) — ₱100 spent = 1 point (configurable in
  code), earned automatically when an order completes, redeemable for a peso
  reward.
- **Promotions** (`/admin/promotions`) — percentage/fixed discount codes with
  date ranges and minimum purchase.
- **B2B / Reseller** (`/admin/b2b`) — wholesale bulk orders against packaged
  products, auto-invoiced with credit terms.
- **Finance** (`/admin/finance`) — cashier shift open/close with cash
  reconciliation, and an End-of-Day Closing report (sales by payment method,
  refunds, voids, discounts).
- **Owner Cockpit** (`/admin/owner-cockpit`) — an executive dashboard: total
  sales, gross margin, food cost %, best branch/product, low-stock count,
  sales trend, sales by branch/channel, top products, payment performance.
- **Multi-branch** (`/admin/branches`) — Main + two additional demo branches;
  orders and reports can be sliced by branch.
- **Audit Log** (`/admin/audit`) — every order status change, payment event,
  procurement approval and shift close is recorded with actor, action and
  timestamp.
- **System Architecture** (`/admin/architecture`) — a Tapa Hey–branded diagram
  of how every module connects through the central backend.
- **Integrations** (`/admin/integrations`) — a demo-mode status board for
  Stripe, GCash, Maya, delivery platforms, accounting, email/SMS and Maps;
  everything runs simulated until real credentials are added.
- **Demo Center** (`/admin/demo-center`) — 10 one-click scenarios that create
  real orders, move real inventory, and fire real notifications.

## Tech stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime) — with a
  zero-setup local fallback (see below)
- **Payments:** Stripe **test mode**, or the built-in Demo Payment Simulator
- **Charts:** Recharts · **Icons:** Lucide React

## Runs with zero setup

If you don't configure Supabase, the app automatically runs on a **local demo
database** — a relational store persisted in `localStorage`, seeded with the
same realistic data (`src/data/seed.ts`) that `supabase/seed.sql` also
produces. Every service in `src/services/*` talks to one facade
(`src/lib/db.ts`) that transparently switches between:

- **Local mode** (default): `src/lib/localDb.ts`. Cross-tab updates work via
  the browser's `storage` event, so an order placed on the customer site in
  one tab appears instantly in the admin dashboard open in another.
- **Supabase mode**: as soon as `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` are set, `src/lib/supabase.ts` creates a real
  client and every query, insert, update, upload, and realtime subscription
  goes to Postgres/Storage/Realtime instead.

This means you can demo the **entire** order → payment → admin → tracking
flow right now, with no accounts and no cloud project, and upgrade to
Supabase later without touching a single page component.

## Enterprise modules

```
                    TAPA HEY ENTERPRISE SYSTEM
                              │
   ┌───────────────┬──────────────────┬───────────────┐
   ↓               ↓                  ↓
INTERNAL USERS   CUSTOMER/REVENUE   ADMIN / OWNER
(Owner, Ops,     CHANNELS           │
Manager, Cashier (Dine-in, POS,     │
Kitchen,         Takeout, Online,   │
Warehouse,       Delivery,          │
Procurement,     Packaged, B2B)     │
Finance,               │            │
Marketing,             │            │
QA/Admin,              │            │
Delivery Staff)        │            │
   └───────────────┴──────────────────┴───────────────┘
                              │
                     src/lib/db.ts (central backend)
                    Supabase Postgres/Auth/Storage/Realtime
                    — or the local demo store, zero setup
                              │
   ┌───────┬──────────┬───────────┬────────────┬─────────┐
   ↓       ↓          ↓           ↓            ↓         ↓
 POS   Payments  Inventory/BOM Procurement  Kitchen(KDS) Delivery
   │                                              │
   ↓                                              ↓
Sales                                     Fulfillment/Dispatch
   │
   ↓
CRM/Loyalty · B2B/Reseller · Finance (shifts, EOD) · Reporting
   │
   ↓
            OWNER COCKPIT (sales, margin, branch, inventory)
```

This is rendered live and Tapa Hey–branded in the app at
Admin → **System Architecture**.

## Project structure

```
src/
  components/        Shared UI kit + customer-facing composed components
  layouts/           CustomerLayout, AdminLayout (sidebar/header/route guards)
  pages/customer/     Home, Menu, Checkout, Payment, Tracking, Account, Auth…
  pages/admin/        Dashboard, Orders, Kitchen, Procurement, Delivery,
                       Loyalty, Promotions, B2B, Finance, Owner Cockpit,
                       Branches, Architecture, Integrations, Demo Center,
                       Audit, Menu, Inventory, Reports, CMS, Staff…
  pages/pos/          POS terminal (shift-gated cashier checkout)
  hooks/             useAuth, useCart, useToast, useLiveQuery (realtime data)
  lib/               db.ts (facade), supabase.ts, localDb.ts, auth.ts
  services/          orders, payment, menu, inventory, recipes, procurement,
                       delivery, loyalty, promotions, b2b, finance, audit,
                       branches, integrations, demoScenarios, reports…
  data/seed.ts       Demo seed data (mirrors supabase/seed.sql)
  types/             Shared TypeScript domain types
supabase/
  schema.sql         Full Postgres schema + RLS policies (incl. enterprise modules)
  seed.sql           Matching demo data for a real Supabase project
```

## Installation

```bash
npm install
npm run dev       # http://localhost:5173
```

## Environment variables

Copy `.env.example` to `.env` and fill in only what you need:

```bash
# Supabase — leave BOTH blank to use the local demo database instead
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Stripe test mode — leave blank to use the Demo Payment Simulator
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_PAYMENT_API_URL=

# Server-side ONLY. Never prefixed with VITE_, never bundled into the
# frontend. Only your PaymentIntent-creating server should read this.
STRIPE_SECRET_KEY=
```

**The secret key is never imported by any frontend file.** `src/services/payment.ts`
calls `VITE_PAYMENT_API_URL` (a server you'd deploy separately, e.g. a Supabase
Edge Function) to create a Stripe PaymentIntent; that server is the only place
`STRIPE_SECRET_KEY` should ever be read.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Database:** open the SQL editor and run `supabase/schema.sql` **first**,
   then `supabase/seed.sql`. Order matters — `seed.sql` inserts into tables
   that only exist after `schema.sql` has run. `schema.sql` drops and
   recreates every Tapa Hey table on each run, so if you ever hit a column-
   mismatch error (from an older partial run, or from running `seed.sql`
   first by mistake), just re-run `schema.sql` then `seed.sql` again — it's
   always safe to start clean this way. (It never touches `auth.users`, so
   existing Supabase Auth accounts survive a reset.)
3. **Storage:** create a public bucket named `tapahey` (Storage → New bucket →
   toggle "Public"). This is where admin-uploaded menu photos and gallery
   images land (`SUPABASE_BUCKET` in `src/lib/supabase.ts`).
4. **Auth:** Authentication → Providers → make sure Email is enabled.
5. Copy your project URL and anon key into `.env` as `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY`, then restart `npm run dev`.

### Creating the admin account (Supabase mode)

Supabase Auth owns user credentials, so staff accounts need one extra manual
step per person:

1. Dashboard → Authentication → Users → **Add user** → enter
   `admin@tapahey.demo` and a password → **create**.
2. Copy that user's UUID.
3. Run the commented block at the bottom of `supabase/seed.sql`, substituting
   the UUID, to insert a matching `profiles` row and a `staff` row with
   `role = 'super_admin'`.
4. Sign in at `/admin/login`.

Once one Super Admin exists, use **Admin → Staff → Add Staff Member** for
everyone else — in Supabase mode it will tell you to create their Auth user
first, then link them the same way.

### In local mode (no setup needed)

Staff and customer accounts are already seeded. Sign in at `/admin/login`:

| Role | Email | Password |
|---|---|---|
| Owner / Super Admin | `admin@tapahey.demo` | `DemoAdmin123!` |
| Operations | `operations@tapahey.demo` | `DemoStaff123!` |
| Branch Manager | `manager@tapahey.demo` | `DemoStaff123!` |
| Cashier | `cashier@tapahey.demo` | `DemoStaff123!` |
| Kitchen | `kitchen@tapahey.demo` | `DemoStaff123!` |
| Warehouse | `warehouse@tapahey.demo` | `DemoStaff123!` |
| Procurement | `procurement@tapahey.demo` | `DemoStaff123!` |
| Finance / Accounting | `finance@tapahey.demo` | `DemoStaff123!` |
| Marketing / CRM | `marketing@tapahey.demo` | `DemoStaff123!` |
| QA / Admin | `qa@tapahey.demo` | `DemoStaff123!` |

Customer login at `/login`: `juan@tapahey.demo` / `DemoCustomer123!`

> The dashboard currently auto-enters as the Owner/Super Admin for fast
> demoing (see the temporary bypass note above). To see any other role's
> restricted sidebar, sign out and sign back in at `/admin/login` with that
> role's email/password.

Admin → Settings → **Reset Demo Data** restores the original seed at any time.

## Payments: Demo Simulator & Stripe test mode

`src/services/payment.ts` decides the mode automatically:

- **Demo mode** (default): no keys needed. Checkout opens a payment sheet
  where *you* pick the outcome — **Successful**, **Failed**, or **Cancelled**
  — so you can demo every branch of the flow on demand. A successful payment
  (or a cash order) creates the order and payment records and redirects to a
  receipt; a failed one leaves the order `pending` and offers **Retry**; a
  cancelled one returns to checkout. Every transaction reference is prefixed
  `DEMO_` so it's unmistakably a simulation.
- **Stripe test mode**: set `VITE_STRIPE_PUBLISHABLE_KEY` **and**
  `VITE_PAYMENT_API_URL` (pointing at a server/Edge Function you provide that
  creates a PaymentIntent using `STRIPE_SECRET_KEY` and Stripe's test
  environment). The client never sees or stores the secret key. Use Stripe's
  published test card numbers (e.g. `4242 4242 4242 4242`) — real card
  numbers are rejected by Stripe in test mode by design.

Either way: **no real money moves.** The order/payment tables record
`provider: 'demo' | 'stripe' | 'cash'` and `payment_status` so reporting looks
identical regardless of which mode produced the data.

## Security notes

- Row Level Security policies (`supabase/schema.sql`) mean anonymous visitors
  can only read public content (menu, approved reviews/gallery, settings) and
  insert orders/payments/reviews/reservations — they can never read another
  customer's data or write to admin-only tables. Staff-only writes are gated
  by an `is_staff()` policy helper.
- Checkout recomputes totals from the live menu server-side-style (in
  `orderService.createOrder`) rather than trusting the cart's numbers — a
  tampered price in the browser cannot change what gets charged.
- Payment status transitions happen in `paymentService.process`, not from a
  value the frontend claims — the "customer" never gets to declare their own
  order paid.
- Double-submission is blocked with an in-flight guard per order id, and a
  second "paid" payment on the same order is rejected.
- Admin routes are guarded by `AdminLayout` (must be signed in **and** have an
  active `staff` row) and by `RequireSection`, which checks the signed-in
  staff member's role against `ROLE_PERMISSIONS` before rendering a section.

## Staff roles & permissions

Defined in `ROLE_PERMISSIONS` (`src/lib/auth.ts`) and enforced per-section by
`RequireSection` on every admin route.

| Role | Access |
|---|---|
| Owner / Super Admin | Everything |
| Operations | Branches, Orders, Inventory, Procurement, Kitchen, Delivery, Reports |
| Branch Manager | Orders, POS, Menu, Categories, Reservations, Customers, Inventory, Reports, Staff |
| Cashier | Orders, POS, Customers |
| Kitchen | Orders, Kitchen (KDS) |
| Warehouse | Inventory, Procurement |
| Procurement | Procurement |
| Finance | Reports, Finance, B2B |
| Marketing / CRM | Customers, Loyalty, Promotions, Website Content, Gallery, Reviews |
| Content Manager | Website Content, Gallery, Reviews |
| QA / Admin | Staff, Audit Log, Settings, Integrations |
| Delivery Staff | Delivery |

## Build & deploy

```bash
npm run build     # tsc -b && vite build → dist/
npm run preview   # serve the production build locally
```

`dist/` is a static site — deploy it to Vercel, Netlify, Cloudflare Pages, or
any static host. Set the same environment variables in your host's dashboard
before building. If you're using Stripe, deploy the PaymentIntent-creating
server separately (Supabase Edge Functions are a natural fit) and point
`VITE_PAYMENT_API_URL` at it.

## License

Demo project for evaluation purposes.
