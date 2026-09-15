import { useState } from 'react'
import { Briefcase, Minus, Plus, ReceiptText } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { resellerService, b2bService, type B2BLine } from '../../services/b2b'
import { Badge, Button, EmptyState, Modal, Select, SkeletonRows } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { peso, relativeTime } from '../../utils/format'
import type { Reseller } from '../../types'

const TABS = ['orders', 'invoices', 'resellers'] as const
type Tab = (typeof TABS)[number]

export default function AdminB2B() {
  const [tab, setTab] = useState<Tab>('orders')
  const [ordering, setOrdering] = useState(false)
  const toast = useToast()

  const { data, loading, reload } = useLiveQuery(
    async () => ({
      resellers: await resellerService.list(),
      orders: await b2bService.listOrders(),
      invoices: await b2bService.listInvoices(),
    }),
    ['resellers', 'b2b_orders', 'b2b_order_items', 'invoices'],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-cream p-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${tab === t ? 'bg-ink text-cream' : 'text-body/60 hover:text-ink'}`}>
              {t}
            </button>
          ))}
        </div>
        {tab === 'orders' && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setOrdering(true)}>New Bulk Order</Button>}
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : tab === 'orders' ? (
        !data?.orders.length ? (
          <EmptyState icon={<Briefcase className="h-10 w-10" />} title="No B2B orders yet" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-left text-[11px] uppercase tracking-wide text-body/50">
                <tr><th className="px-4 py-3">Order #</th><th className="px-4 py-3">Reseller</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Placed</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {data.orders.map((o) => {
                  const reseller = data.resellers.find((r) => r.id === o.reseller_id)
                  return (
                    <tr key={o.id} className="hover:bg-cream/40">
                      <td className="px-4 py-3 font-semibold text-ink">{o.order_number}</td>
                      <td className="px-4 py-3 text-body/70">{reseller?.business_name ?? '—'}</td>
                      <td className="px-4 py-3 text-body/70">{peso(o.total)}</td>
                      <td className="px-4 py-3"><Badge tone={o.status === 'fulfilled' ? 'green' : 'amber'}>{o.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-body/45">{relativeTime(o.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {o.status !== 'fulfilled' && (
                          <Button size="sm" variant="outline" onClick={() => b2bService.fulfill(o.id).then(() => { toast.success('Order fulfilled.'); reload() })}>Fulfill</Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'invoices' ? (
        !data?.invoices.length ? (
          <EmptyState icon={<ReceiptText className="h-10 w-10" />} title="No invoices yet" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-left text-[11px] uppercase tracking-wide text-body/50">
                <tr><th className="px-4 py-3">Invoice #</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {data.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-cream/40">
                    <td className="px-4 py-3 font-semibold text-ink">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-body/70">{peso(inv.amount)}</td>
                    <td className="px-4 py-3 text-body/60">{inv.due_date}</td>
                    <td className="px-4 py-3">
                      <Badge tone={inv.status === 'paid' ? 'green' : new Date(inv.due_date) < new Date() ? 'red' : 'amber'}>{inv.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.status !== 'paid' && (
                        <Button size="sm" onClick={() => b2bService.markInvoicePaid(inv.id).then(() => { toast.success('Invoice marked paid.'); reload() })}>Mark Paid</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : !data?.resellers.length ? (
        <EmptyState icon={<Briefcase className="h-10 w-10" />} title="No resellers yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.resellers.map((r) => (
            <div key={r.id} className="card p-5">
              <p className="font-display text-lg font-bold text-ink">{r.business_name}</p>
              <p className="text-xs text-body/50">{r.contact_name} · {r.phone}</p>
              <p className="mt-2 text-sm text-body/65">Credit limit: {peso(r.credit_limit)} · Terms: Net {r.credit_terms_days}</p>
              <Badge tone={r.status === 'active' ? 'green' : 'neutral'} className="mt-3">{r.status}</Badge>
            </div>
          ))}
        </div>
      )}

      {ordering && data && (
        <BulkOrderModal
          resellers={data.resellers}
          onClose={() => setOrdering(false)}
          onSaved={() => { setOrdering(false); toast.success('Bulk order placed and invoiced.'); reload() }}
        />
      )}
    </div>
  )
}

function BulkOrderModal({ resellers, onClose, onSaved }: { resellers: Reseller[]; onClose: () => void; onSaved: () => void }) {
  const { busy, run } = useAction()
  const { data: products } = useLiveQuery(() => b2bService.packagedProducts(), ['menu_items'])
  const [resellerId, setResellerId] = useState(resellers[0]?.id ?? '')
  const [qty, setQty] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  const lines: B2BLine[] = (products ?? [])
    .filter((p) => (qty[p.id] ?? 0) > 0)
    .map((p) => ({ menu_item_id: p.id, product_name: p.name, sku: p.sku, quantity: qty[p.id], unit_price: p.wholesale_price ?? p.price }))
  const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)

  const save = () => {
    if (!resellerId) return setError('Choose a reseller.')
    if (!lines.length) return setError('Add quantity for at least one product.')
    run(() => b2bService.createOrder({ reseller_id: resellerId, lines, terms_days: resellers.find((r) => r.id === resellerId)?.credit_terms_days ?? 15 }), {
      onSuccess: onSaved,
      onError: setError,
    })
  }

  return (
    <Modal open onClose={onClose} title="New B2B Bulk Order" size="md" footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} onClick={save}>Place Order · {peso(total)}</Button></>}>
      <div className="space-y-4">
        <Select label="Reseller" value={resellerId} onChange={(e) => setResellerId(e.target.value)} options={resellers.map((r) => ({ value: r.id, label: r.business_name }))} error={error} />
        <div className="space-y-2">
          {(products ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-ink">{p.name}</p>
                <p className="text-xs text-body/50">{p.sku} · Wholesale {peso(p.wholesale_price ?? p.price)}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-white p-1">
                <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gold" onClick={() => setQty({ ...qty, [p.id]: Math.max(0, (qty[p.id] ?? 0) - 1) })}><Minus className="h-3 w-3" /></button>
                <span className="w-8 text-center text-xs font-bold">{qty[p.id] ?? 0}</span>
                <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gold" onClick={() => setQty({ ...qty, [p.id]: (qty[p.id] ?? 0) + 1 })}><Plus className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
