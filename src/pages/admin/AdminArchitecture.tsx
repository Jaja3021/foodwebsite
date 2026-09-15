import { ArrowDown } from 'lucide-react'

/** Section 42 — static, Tapa Hey-branded architecture diagram. */
const LAYERS: Array<{ title: string; tone: string; items: string[] }> = [
  {
    title: 'Internal Users',
    tone: 'bg-ink text-cream',
    items: ['Owner', 'Operations', 'Branch Manager', 'Cashier', 'Kitchen', 'Warehouse', 'Procurement', 'Finance', 'Marketing', 'QA / Admin', 'Delivery Staff'],
  },
  {
    title: 'Customer & Revenue Channels',
    tone: 'bg-warm text-cream',
    items: ['Dine-in', 'POS', 'Takeout', 'Online Website', 'Delivery', 'Packaged Products', 'B2B / Reseller'],
  },
  {
    title: 'Integration & Order Orchestration',
    tone: 'bg-golddark text-ink',
    items: ['Order Capture API', 'Order Routing', 'Validation', 'Payment Mapping', 'Customer ID Resolution', 'Event Log', 'Monitoring'],
  },
  {
    title: 'Core Operating Systems',
    tone: 'bg-gold text-ink',
    items: ['POS', 'Payments', 'Inventory / BOM', 'Procurement', 'Kitchen (KDS)', 'Warehouse', 'Fulfillment / Delivery', 'CRM / Loyalty', 'B2B', 'Finance', 'Reporting'],
  },
  {
    title: 'Data & Control',
    tone: 'bg-cream text-ink ring-1 ring-ink/10',
    items: ['Master Data', 'Orders', 'Inventory', 'Payments', 'Customers', 'Finance', 'Audit Log'],
  },
  {
    title: 'Owner Cockpit',
    tone: 'bg-ink text-cream',
    items: ['Sales', 'Margin', 'Inventory Health', 'Branch Performance', 'Customers', 'Operations'],
  },
]

export default function AdminArchitecture() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-ink px-6 py-8 text-center text-cream sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">System Architecture</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
          Tapa <span className="text-gold">Hey</span> Enterprise System
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-cream/60">
          Every channel — website, POS, kitchen, inventory, procurement, delivery, loyalty, B2B and finance — reads and writes
          through one central data layer (Supabase in production, a browser-persisted demo store here) so the Owner Cockpit
          always reflects what's actually happening across the business.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        {LAYERS.map((layer, i) => (
          <div key={layer.title} className="w-full max-w-4xl">
            <div className={`rounded-2xl p-4 shadow-soft ${layer.tone}`}>
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider opacity-80">{layer.title}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {layer.items.map((item) => (
                  <span key={item} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            {i < LAYERS.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="h-5 w-5 text-gold" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">Central Backend</h2>
        <p className="mt-2 text-sm leading-relaxed text-body/70">
          A single data facade (<code className="rounded bg-cream px-1.5 py-0.5 text-xs">src/lib/db.ts</code>) talks to Supabase
          Postgres + Auth + Storage + Realtime when configured, or to a browser-persisted demo store otherwise — so the exact
          same services power the website, POS terminal, kitchen display, and every admin module with zero code changes between
          demo mode and production.
        </p>
      </div>
    </div>
  )
}
