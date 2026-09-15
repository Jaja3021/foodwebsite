import { useMemo, useState } from 'react'
import { Plus, Search, User } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { customerService } from '../../services/customers'
import { Avatar, Badge, Button, EmptyState, Input, Modal, Rating, SkeletonRows } from '../../components/ui'
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge'
import { ORDER_TYPE_LABEL, peso, relativeTime } from '../../utils/format'
import { useToast } from '../../hooks/useToast'

export default function AdminCustomers() {
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const { data, loading, reload } = useLiveQuery(async () => customerService.listWithStats(), ['customers', 'orders'])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter(
      (c) => !q || c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    )
  }, [data, search])

  return (
    <div className="space-y-5">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers…"
            aria-label="Search customers"
            className="field pl-10"
          />
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>
          Add Customer
        </Button>
      </div>

      <section className="card overflow-hidden">
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={6} />
          </div>
        ) : !filtered.length ? (
          <EmptyState icon={<User className="h-10 w-10" />} title="No customers found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-left text-[11px] uppercase tracking-wide text-body/50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Total Spent</th>
                  <th className="px-4 py-3 font-semibold">Last Order</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setViewingId(c.id)}
                    className="cursor-pointer transition hover:bg-cream/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.full_name} size={32} />
                        <span className="font-semibold text-ink">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body/65">{c.email}</td>
                    <td className="px-4 py-3 text-body/65">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-body/65">{c.order_count}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{peso(c.total_spent)}</td>
                    <td className="px-4 py-3 text-xs text-body/50">
                      {c.last_order_at ? relativeTime(c.last_order_at) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={c.active ? 'green' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {adding && (
        <AddCustomerModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            reload()
          }}
        />
      )}

      {viewingId && <CustomerDetailModal customerId={viewingId} onClose={() => setViewingId(null)} />}
    </div>
  )
}

function AddCustomerModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const { busy, run } = useAction()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '' })
  const [error, setError] = useState<string | null>(null)

  const save = () =>
    run(() => customerService.create(form), {
      onSuccess: () => {
        toast.success(`${form.full_name} added.`)
        onSaved()
      },
      onError: setError,
    })

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Customer"
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" loading={busy} onClick={save}>
            Add Customer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={error} required />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
    </Modal>
  )
}

function CustomerDetailModal({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const { data, loading } = useLiveQuery(async () => customerService.detail(customerId), ['orders', 'reservations', 'reviews', 'favorites'], [customerId])

  return (
    <Modal open onClose={onClose} title={data?.customer.full_name ?? 'Customer'} size="lg">
      {loading || !data ? (
        <SkeletonRows rows={5} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatBox label="Total Spent" value={peso(data.total_spent)} />
            <StatBox label="Orders" value={String(data.orders.length)} />
            <StatBox label="Reviews" value={String(data.reviews.length)} />
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-body/50">Contact</h4>
            <p className="text-sm text-body/75">{data.customer.email} · {data.customer.phone ?? 'No phone'}</p>
            {data.customer.address && <p className="text-sm text-body/60">{data.customer.address}</p>}
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-body/50">Orders</h4>
            {data.orders.length === 0 ? (
              <p className="text-sm text-body/50">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-ink/8 rounded-2xl bg-white ring-1 ring-ink/5">
                {data.orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="font-mono text-xs text-ink">{o.order_number}</span>
                    <span className="text-body/55">{ORDER_TYPE_LABEL[o.order_type]}</span>
                    <OrderStatusBadge status={o.order_status} />
                    <PaymentStatusBadge status={o.payment_status} />
                    <span className="font-semibold text-ink">{peso(o.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-body/50">Reviews</h4>
            {data.reviews.length === 0 ? (
              <p className="text-sm text-body/50">No reviews yet.</p>
            ) : (
              <div className="space-y-2">
                {data.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl bg-cream p-3">
                    <Rating value={r.rating} size={13} />
                    <p className="mt-1 text-sm text-body/70">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {data.favorites.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-body/50">Favorite Items</h4>
              <div className="flex flex-wrap gap-2">
                {data.favorites.map((f) => (
                  <Badge key={f.id} tone="gold">{f.name}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream p-4 text-center">
      <p className="font-display text-2xl font-extrabold text-ink">{value}</p>
      <p className="text-xs text-body/50">{label}</p>
    </div>
  )
}
