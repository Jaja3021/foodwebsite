import { useState } from 'react'
import { CheckCircle2, PackageSearch, Plus, Truck, XCircle } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { supplierService, procurementService } from '../../services/procurement'
import { inventoryService } from '../../services/inventory'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { Badge, Button, EmptyState, Input, Modal, Select, SkeletonRows } from '../../components/ui'
import { relativeTime } from '../../utils/format'
import type { PurchaseRequestStatus, Supplier } from '../../types'

const TABS = ['requests', 'orders', 'suppliers'] as const
type Tab = (typeof TABS)[number]
const TAB_LABEL: Record<Tab, string> = { requests: 'Purchase Requests', orders: 'Purchase Orders', suppliers: 'Suppliers' }

const REQUEST_TONE: Record<PurchaseRequestStatus, 'amber' | 'green' | 'red' | 'blue'> = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  converted: 'blue',
}

export default function AdminProcurement() {
  const [tab, setTab] = useState<Tab>('requests')
  const [addingSupplier, setAddingSupplier] = useState(false)
  const [converting, setConverting] = useState<string | null>(null)
  const { user } = useAuth()
  const toast = useToast()

  const { data, loading, reload } = useLiveQuery(
    async () => ({
      requests: await procurementService.listRequests(),
      orders: await procurementService.listOrders(),
      suppliers: await supplierService.list(),
      inventory: await inventoryService.list(),
    }),
    ['purchase_requests', 'purchase_orders', 'purchase_order_items', 'suppliers', 'inventory'],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-cream p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${tab === t ? 'bg-ink text-cream' : 'text-body/60 hover:text-ink'}`}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        {tab === 'suppliers' && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddingSupplier(true)}>Add Supplier</Button>
        )}
      </div>

      {loading ? (
        <SkeletonRows rows={6} />
      ) : tab === 'requests' ? (
        !data?.requests.length ? (
          <EmptyState icon={<PackageSearch className="h-10 w-10" />} title="No purchase requests yet" message="They're created automatically when an ingredient drops below its minimum stock." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-left text-[11px] uppercase tracking-wide text-body/50">
                <tr>
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {data.requests.map((r) => (
                  <tr key={r.id} className="hover:bg-cream/40">
                    <td className="px-4 py-3 font-semibold text-ink">{r.ingredient_name}</td>
                    <td className="px-4 py-3 text-body/70">{r.requested_qty} {r.unit}</td>
                    <td className="max-w-xs px-4 py-3 text-xs text-body/50">{r.reason}</td>
                    <td className="px-4 py-3"><Badge tone={REQUEST_TONE[r.status]}>{r.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-body/45">{relativeTime(r.created_at)} · {r.requested_by}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                            title="Approve"
                            onClick={() => procurementService.approveRequest(r.id, user?.full_name ?? 'Manager').then(() => { toast.success('Request approved.'); reload() })}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                            title="Reject"
                            onClick={() => procurementService.rejectRequest(r.id, user?.full_name ?? 'Manager').then(() => { toast.success('Request rejected.'); reload() })}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {r.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => setConverting(r.id)}>Create PO</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'orders' ? (
        !data?.orders.length ? (
          <EmptyState icon={<Truck className="h-10 w-10" />} title="No purchase orders yet" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-left text-[11px] uppercase tracking-wide text-body/50">
                <tr>
                  <th className="px-4 py-3">PO #</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {data.orders.map((po) => {
                  const supplier = data.suppliers.find((s) => s.id === po.supplier_id)
                  return (
                    <tr key={po.id} className="hover:bg-cream/40">
                      <td className="px-4 py-3 font-semibold text-ink">{po.po_number}</td>
                      <td className="px-4 py-3 text-body/70">{supplier?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-body/70">₱{po.total.toLocaleString('en-PH')}</td>
                      <td className="px-4 py-3"><Badge tone={po.status === 'received' ? 'green' : 'amber'}>{po.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-body/45">{relativeTime(po.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {po.status !== 'received' && (
                          <Button
                            size="sm"
                            onClick={() => procurementService.receiveOrder(po.id, user?.full_name ?? 'Warehouse').then(() => { toast.success('Goods received — inventory updated.'); reload() })}
                          >
                            Receive
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      ) : !data?.suppliers.length ? (
        <EmptyState icon={<PackageSearch className="h-10 w-10" />} title="No suppliers yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.suppliers.map((s) => (
            <div key={s.id} className="card p-5">
              <p className="font-display text-lg font-bold text-ink">{s.name}</p>
              <p className="text-xs text-body/50">{s.contact_name} · {s.phone}</p>
              <p className="mt-2 text-sm text-body/65">Supplies: {s.products}</p>
              <p className="mt-1 text-xs text-body/50">Lead time: {s.lead_time_days} day(s) · Terms: {s.payment_terms}</p>
              <Badge tone={s.status === 'active' ? 'green' : 'neutral'} className="mt-3">{s.status}</Badge>
            </div>
          ))}
        </div>
      )}

      {addingSupplier && <SupplierForm onClose={() => setAddingSupplier(false)} onSaved={() => { setAddingSupplier(false); reload() }} />}
      {converting && data && (
        <ConvertToPoModal
          requestId={converting}
          suppliers={data.suppliers}
          onClose={() => setConverting(null)}
          onSaved={() => { setConverting(null); toast.success('Purchase order sent to supplier.'); reload() }}
        />
      )}
    </div>
  )
}

function SupplierForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { busy, run } = useAction()
  const [form, setForm] = useState<Partial<Supplier>>({ name: '', contact_name: '', phone: '', email: '', products: '', lead_time_days: 2, payment_terms: 'COD' })
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    if (!form.name?.trim()) return setError('Please enter a supplier name.')
    run(() => supplierService.create(form), { onSuccess: onSaved, onError: setError })
  }

  return (
    <Modal open onClose={onClose} title="Add Supplier" size="sm" footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} onClick={save}>Add</Button></>}>
      <div className="space-y-4">
        <Input label="Supplier name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={error} required />
        <Input label="Contact person" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <Input label="Products supplied" value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Lead time (days)" type="number" value={form.lead_time_days} onChange={(e) => setForm({ ...form, lead_time_days: Number(e.target.value) })} />
          <Input label="Payment terms" value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} />
        </div>
      </div>
    </Modal>
  )
}

function ConvertToPoModal({
  requestId,
  suppliers,
  onClose,
  onSaved,
}: {
  requestId: string
  suppliers: Supplier[]
  onClose: () => void
  onSaved: () => void
}) {
  const { busy, run } = useAction()
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '')
  const [unitCost, setUnitCost] = useState('100')
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    if (!supplierId) return setError('Choose a supplier.')
    run(() => procurementService.convertToPurchaseOrder(requestId, supplierId, Number(unitCost) || 0), {
      onSuccess: onSaved,
      onError: setError,
    })
  }

  return (
    <Modal open onClose={onClose} title="Create Purchase Order" size="sm" footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} onClick={save}>Send to Supplier</Button></>}>
      <div className="space-y-4">
        <Select label="Supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} error={error} />
        <Input label="Unit cost (₱)" type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
      </div>
    </Modal>
  )
}
