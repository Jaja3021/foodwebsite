import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Printer } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { reportService, RANGE_LABEL, type RangeKey } from '../../services/reports'
import { Button, SkeletonRows } from '../../components/ui'
import { downloadCsv, peso, toCsv } from '../../utils/format'

const COLORS = ['#E89A12', '#4A2D1C', '#FFB51B', '#241811', '#B97B2A', '#6B4A2F']

export default function AdminReports() {
  const [range, setRange] = useState<RangeKey>('month')

  const { data, loading } = useLiveQuery(
    async () => {
      const [summary, series, bestSellers, categories, payments] = await Promise.all([
        reportService.revenueSummary(range),
        reportService.salesSeries(range),
        reportService.bestSellers(10),
        reportService.salesByCategory(),
        reportService.paymentBreakdown(),
      ])
      return { summary, series, bestSellers, categories, payments }
    },
    ['orders', 'order_items', 'payments'],
    [range],
  )

  const exportOrders = () => {
    if (!data) return
    const rows = data.bestSellers.map((b) => ({ Item: b.name, 'Quantity Sold': b.quantity, Revenue: b.revenue }))
    downloadCsv(`tapa-hey-best-sellers-${range}.csv`, toCsv(rows))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-cream p-1">
          {(Object.keys(RANGE_LABEL) as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                range === r ? 'bg-ink text-cream' : 'text-body/60 hover:text-ink'
              }`}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />} onClick={exportOrders}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Print Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatBox label="Revenue" value={peso(data?.summary.revenue ?? 0)} />
        <StatBox label="Orders" value={String(data?.summary.orders ?? 0)} />
        <StatBox label="Paid Orders" value={String(data?.summary.paidOrders ?? 0)} />
        <StatBox label="Cancelled" value={String(data?.summary.cancelled ?? 0)} />
        <StatBox label="Avg. Ticket" value={peso(data?.summary.averageTicket ?? 0)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Revenue Report — Sales by {range === 'year' ? 'Month' : 'Day'}</h2>
          <div className="mt-4 h-64">
            {loading ? (
              <div className="skeleton h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.series ?? []} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#211A16" strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#211A16A0' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#211A16A0' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => peso(Number(v))} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                  <Bar dataKey="sales" fill="#E89A12" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Category Report</h2>
          <p className="text-xs text-body/50">Revenue share by menu category</p>
          <div className="mt-2 h-64">
            {loading ? (
              <div className="skeleton h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.categories ?? []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {(data?.categories ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => peso(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {(data?.categories ?? []).map((c, i) => (
              <li key={c.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate text-body/65">{c.name}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Best Sellers</h2>
          {loading ? (
            <SkeletonRows rows={6} />
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wide text-body/45">
                <tr>
                  <th className="pb-2">Item</th>
                  <th className="pb-2 text-right">Qty Sold</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {(data?.bestSellers ?? []).map((b) => (
                  <tr key={b.name}>
                    <td className="py-2 font-medium text-ink">{b.name}</td>
                    <td className="py-2 text-right text-body/65">{b.quantity}</td>
                    <td className="py-2 text-right font-semibold text-ink">{peso(b.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Payment Report</h2>
          <p className="text-xs text-body/50">Breakdown of how customers pay</p>
          <ul className="mt-4 space-y-3">
            {(data?.payments ?? []).map((p) => {
              const max = Math.max(...(data?.payments ?? []).map((x) => x.amount), 1)
              return (
                <li key={p.name}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-ink">{p.name}</span>
                    <span className="text-body/60">
                      {p.count} txns · {peso(p.amount)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/8">
                    <div className="h-full rounded-full bg-golddark" style={{ width: `${(p.amount / max) * 100}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="font-display text-2xl font-extrabold text-warm">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-body/45">{label}</p>
    </div>
  )
}
