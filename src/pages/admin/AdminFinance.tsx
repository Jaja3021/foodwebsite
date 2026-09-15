import { useState } from 'react'
import { CalendarCheck2, Landmark } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { shiftService, financeService } from '../../services/finance'
import { auditService } from '../../services/audit'
import { Badge, Button, EmptyState, SkeletonRows } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { peso, relativeTime } from '../../utils/format'

export default function AdminFinance() {
  const toast = useToast()
  const today = new Date().toISOString().slice(0, 10)
  const { busy, run } = useAction()
  const [closingReport, setClosingReport] = useState<Awaited<ReturnType<typeof financeService.dailyClosing>> | null>(null)

  const { data, loading } = useLiveQuery(() => shiftService.list(), ['cashier_shifts'])

  const closeDay = () =>
    run(() => financeService.dailyClosing(today), {
      onSuccess: async (report) => {
        setClosingReport(report)
        await auditService.log({ actor_name: 'Finance', action: 'closed', entity: 'business_day', entity_id: today, detail: `Business day ${today} closed — total sales ${peso(report.totalSales)}.` })
        toast.success('Business day closed. Daily sales report generated below.')
      },
    })

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">End-of-Day Closing</h2>
            <p className="text-sm text-body/60">Reconciles every payment method against today's sales and generates the daily report.</p>
          </div>
          <Button icon={<CalendarCheck2 className="h-4 w-4" />} loading={busy} onClick={closeDay}>
            Close Business Day
          </Button>
        </div>

        {closingReport && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Total Sales" value={peso(closingReport.totalSales)} />
            <Stat label="Cash" value={peso(closingReport.cash)} />
            <Stat label="GCash" value={peso(closingReport.gcash)} />
            <Stat label="Maya" value={peso(closingReport.maya)} />
            <Stat label="Card" value={peso(closingReport.card)} />
            <Stat label="Online Sales" value={peso(closingReport.onlineSales)} />
            <Stat label="Refunds" value={peso(closingReport.refunds)} />
            <Stat label="Voids" value={String(closingReport.voids)} />
            <Stat label="Discounts" value={peso(closingReport.discounts)} />
            <Stat label="Orders" value={String(closingReport.orderCount)} />
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Cashier Shifts</h2>
        {loading ? (
          <SkeletonRows rows={4} />
        ) : !data?.length ? (
          <EmptyState icon={<Landmark className="h-10 w-10" />} title="No shifts recorded yet" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-left text-[11px] uppercase tracking-wide text-body/50">
                <tr>
                  <th className="px-4 py-3">Cashier</th>
                  <th className="px-4 py-3">Opening Cash</th>
                  <th className="px-4 py-3">Expected</th>
                  <th className="px-4 py-3">Actual</th>
                  <th className="px-4 py-3">Difference</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Opened</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {data.map((s) => (
                  <tr key={s.id} className="hover:bg-cream/40">
                    <td className="px-4 py-3 font-semibold text-ink">{s.staff_name}</td>
                    <td className="px-4 py-3 text-body/70">{peso(s.opening_cash)}</td>
                    <td className="px-4 py-3 text-body/70">{s.closing_cash_expected != null ? peso(s.closing_cash_expected) : '—'}</td>
                    <td className="px-4 py-3 text-body/70">{s.closing_cash_actual != null ? peso(s.closing_cash_actual) : '—'}</td>
                    <td className={`px-4 py-3 font-semibold ${!s.cash_difference ? 'text-body/50' : s.cash_difference < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {s.cash_difference != null ? peso(s.cash_difference) : '—'}
                    </td>
                    <td className="px-4 py-3"><Badge tone={s.status === 'open' ? 'amber' : 'neutral'}>{s.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-body/45">{relativeTime(s.opened_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-cream p-3 text-center">
      <p className="font-display text-lg font-extrabold text-warm">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-body/45">{label}</p>
    </div>
  )
}
