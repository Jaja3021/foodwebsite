import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownRight, ArrowUpRight, CalendarCheck, Receipt, TrendingUp, Users } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { reportService, percentChange, RANGE_LABEL, type RangeKey } from '../../services/reports'
import { orderService } from '../../services/orders'
import { peso, relativeTime, ORDER_TYPE_LABEL } from '../../utils/format'
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge'
import { EmptyState, SkeletonRows } from '../../components/ui'

export default function Dashboard() {
  const [range, setRange] = useState<RangeKey>('week')

  const { data, loading } = useLiveQuery(
    async () => {
      const [stats, series, orders, bestSellers] = await Promise.all([
        reportService.dashboard(),
        reportService.salesSeries(range),
        orderService.listOrders({ limit: 8 }),
        reportService.bestSellers(5),
      ])
      const items = await orderService.listItemsForOrders(orders.map((o) => o.id))
      return { stats, series, orders, items, bestSellers }
    },
    ['orders', 'order_items', 'payments', 'reservations', 'customers'],
    [range],
  )

  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's Sales"
          value={peso(stats?.salesToday ?? 0)}
          change={percentChange(stats?.salesToday ?? 0, stats?.salesYesterday ?? 0)}
          caption="vs yesterday"
          icon={<TrendingUp className="h-5 w-5" />}
          loading={loading}
        />
        <StatCard
          label="Orders Today"
          value={String(stats?.ordersToday ?? 0)}
          change={percentChange(stats?.ordersToday ?? 0, stats?.ordersYesterday ?? 0)}
          caption="vs yesterday"
          icon={<Receipt className="h-5 w-5" />}
          loading={loading}
        />
        <StatCard
          label="Reservations"
          value={String(stats?.reservationsToday ?? 0)}
          change={percentChange(stats?.reservationsToday ?? 0, stats?.reservationsYesterday ?? 0)}
          caption="booked for today"
          icon={<CalendarCheck className="h-5 w-5" />}
          loading={loading}
        />
        <StatCard
          label="Customers"
          value={String(stats?.customersTotal ?? 0)}
          change={percentChange(stats?.customersTotal ?? 0, stats?.customersLastMonth ?? 0)}
          caption="vs last month"
          icon={<Users className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Sales Overview</h2>
              <p className="text-xs text-body/50">Paid orders only · {RANGE_LABEL[range]}</p>
            </div>
            <div className="flex gap-1 rounded-full bg-cream p-1">
              {(Object.keys(RANGE_LABEL) as RangeKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    range === r ? 'bg-ink text-cream shadow-sm' : 'text-body/60 hover:text-ink'
                  }`}
                >
                  {RANGE_LABEL[r]}
                </button>
              ))}
            </div>
          </header>

          <div className="h-72">
            {loading ? (
              <div className="skeleton h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.series ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFB51B" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#FFB51B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#211A16" strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#211A16A0' }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#211A16A0' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: 'none',
                      boxShadow: '0 12px 32px -12px rgba(23,18,14,0.35)',
                      fontSize: 12,
                    }}
                    formatter={(value, name) => [name === 'sales' ? peso(Number(value)) : String(value), name === 'sales' ? 'Sales' : 'Orders']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#E89A12" strokeWidth={2.5} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Best Sellers</h2>
          <p className="text-xs text-body/50">All-time quantity sold</p>
          <ul className="mt-5 space-y-4">
            {loading ? (
              <SkeletonRows rows={5} />
            ) : (
              (data?.bestSellers ?? []).map((item, i) => {
                const max = data?.bestSellers[0]?.quantity ?? 1
                return (
                  <li key={item.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream text-[11px] font-bold text-warm">
                          {i + 1}
                        </span>
                        <span className="truncate font-semibold text-ink">{item.name}</span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-body/55">{item.quantity} sold</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/8">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${(item.quantity / max) * 100}%` }} />
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </section>
      </div>

      <section className="card overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-ink">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm font-semibold text-warm transition hover:text-golddark">
            View all →
          </Link>
        </header>

        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={5} />
          </div>
        ) : !data?.orders.length ? (
          <EmptyState title="No orders yet" message="Orders placed on the website will appear here instantly." />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="bg-cream/60 text-left text-[11px] uppercase tracking-wide text-body/50">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Order ID</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Items</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Total</th>
                    <th className="px-5 py-3 font-semibold">Payment</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/6">
                  {data.orders.map((o) => (
                    <tr key={o.id} className="transition hover:bg-cream/40">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-ink">{o.order_number}</td>
                      <td className="px-5 py-3 font-medium text-ink">{o.customer_name}</td>
                      <td className="px-5 py-3 text-body/60">
                        {data.items.filter((i) => i.order_id === o.id).reduce((s, i) => s + i.quantity, 0)} items
                      </td>
                      <td className="px-5 py-3 text-body/60">{ORDER_TYPE_LABEL[o.order_type]}</td>
                      <td className="px-5 py-3 font-semibold text-ink">{peso(o.total)}</td>
                      <td className="px-5 py-3">
                        <PaymentStatusBadge status={o.payment_status} />
                      </td>
                      <td className="px-5 py-3">
                        <OrderStatusBadge status={o.order_status} />
                      </td>
                      <td className="px-5 py-3 text-xs text-body/50">{relativeTime(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-ink/6 lg:hidden">
              {data.orders.map((o) => (
                <li key={o.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-ink">{o.order_number}</p>
                      <p className="truncate text-sm font-bold text-ink">{o.customer_name}</p>
                      <p className="text-xs text-body/50">
                        {ORDER_TYPE_LABEL[o.order_type]} · {relativeTime(o.created_at)}
                      </p>
                    </div>
                    <p className="shrink-0 font-display text-lg font-bold text-warm">{peso(o.total)}</p>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <OrderStatusBadge status={o.order_status} />
                    <PaymentStatusBadge status={o.payment_status} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  change,
  caption,
  icon,
  loading,
}: {
  label: string
  value: string
  change: number | null
  caption: string
  icon: React.ReactNode
  loading?: boolean
}) {
  const up = (change ?? 0) >= 0
  return (
    <article className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-body/50">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-golddark">{icon}</span>
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-8 w-24" />
      ) : (
        <p className="mt-2 font-display text-3xl font-extrabold text-ink">{value}</p>
      )}
      <p className="mt-1.5 flex items-center gap-1 text-xs">
        {change != null && (
          <span className={`flex items-center font-bold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(change).toFixed(0)}%
          </span>
        )}
        <span className="text-body/45">{caption}</span>
      </p>
    </article>
  )
}
