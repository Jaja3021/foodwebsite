import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Award, Banknote, Building2, PackageX, TrendingUp } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { reportService } from '../../services/reports'
import { peso } from '../../utils/format'

const COLORS = ['#E89A12', '#4A2D1C', '#FFB51B', '#241811', '#B97B2A', '#6B4A2F']

export default function AdminOwnerCockpit() {
  const { data, loading } = useLiveQuery(
    async () => {
      const [overview, series, branch, channel, bestSellers, payments] = await Promise.all([
        reportService.businessOverview(),
        reportService.salesSeries('month'),
        reportService.salesByBranch(),
        reportService.salesByChannel(),
        reportService.bestSellers(5),
        reportService.paymentBreakdown(),
      ])
      return { overview, series, branch, channel, bestSellers, payments }
    },
    ['orders', 'order_items', 'payments', 'inventory', 'branches'],
  )

  const bestBranch = data?.branch[0]?.name ?? '—'
  const bestSeller = data?.bestSellers[0]?.name ?? '—'

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-ink px-6 py-8 text-cream sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Tapa Hey Owner Cockpit</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Business at a glance</h1>
        <p className="mt-1 text-sm text-cream/60">Good Food. Good Mood. — and the numbers behind it.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Banknote className="h-5 w-5" />} label="Total Sales" value={loading ? '…' : peso(data?.overview.totalRevenue ?? 0)} />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Total Orders" value={loading ? '…' : String(data?.overview.totalOrders ?? 0)} />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Gross Margin" value={loading ? '…' : `${(data?.overview.grossMargin ?? 0).toFixed(1)}%`} />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Food Cost" value={loading ? '…' : `${(data?.overview.foodCostPct ?? 0).toFixed(1)}%`} />
        <Kpi icon={<Building2 className="h-5 w-5" />} label="Best Branch" value={loading ? '…' : bestBranch} />
        <Kpi icon={<Award className="h-5 w-5" />} label="Best Seller" value={loading ? '…' : bestSeller} />
        <Kpi icon={<PackageX className="h-5 w-5" />} label="Low Stock Items" value={loading ? '…' : String(data?.overview.lowStock ?? 0)} tone={data?.overview.lowStock ? 'warn' : undefined} />
        <Kpi icon={<AlertTriangle className="h-5 w-5" />} label="Cash Exceptions" value={loading ? '…' : String(data?.overview.cashExceptions ?? 0)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Sales Trend — This Month</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.series ?? []} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#211A16" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#211A16A0' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#211A16A0' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => peso(Number(v))} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                <Bar dataKey="sales" fill="#E89A12" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Sales by Branch</h2>
          <ul className="mt-4 space-y-3">
            {(data?.branch ?? []).map((b, i) => {
              const max = Math.max(...(data?.branch ?? []).map((x) => x.value), 1)
              return (
                <li key={b.name}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-ink">{b.name}</span>
                    <span className="text-body/60">{peso(b.value)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/8">
                    <div className="h-full rounded-full" style={{ width: `${(b.value / max) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-1">
          <h2 className="font-display text-lg font-bold text-ink">Sales by Channel</h2>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.channel ?? []} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {(data?.channel ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => peso(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5 lg:col-span-1">
          <h2 className="font-display text-lg font-bold text-ink">Top Products</h2>
          <ul className="mt-4 space-y-3">
            {(data?.bestSellers ?? []).map((b) => (
              <li key={b.name} className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{b.name}</span>
                <span className="font-semibold text-warm">{peso(b.revenue)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 lg:col-span-1">
          <h2 className="font-display text-lg font-bold text-ink">Payment Performance</h2>
          <ul className="mt-4 space-y-3">
            {(data?.payments ?? []).map((p) => (
              <li key={p.name} className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{p.name}</span>
                <span className="text-body/60">{p.count} txns</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function Kpi({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone?: 'warn' }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone === 'warn' ? 'bg-red-100 text-red-600' : 'bg-gold/20 text-warm'}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-lg font-extrabold text-ink">{value}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-body/45">{label}</p>
      </div>
    </div>
  )
}
