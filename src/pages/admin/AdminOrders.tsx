import { useMemo, useState } from 'react'
import { Eye, Search, XCircle, ChevronRight, Printer } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { orderService, nextStatus, statusSteps } from '../../services/orders'
import { Button, ConfirmDialog, EmptyState, Modal, Select, SkeletonRows } from '../../components/ui'
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge'
import {
  formatDateTime,
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  peso,
  relativeTime,
} from '../../utils/format'
import { useToast } from '../../hooks/useToast'
import type { Order, OrderStatus, OrderWithItems } from '../../types'

const FILTERS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminOrders() {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<OrderWithItems | null>(null)
  const [cancelling, setCancelling] = useState<Order | null>(null)
  const toast = useToast()
  const { busy, run } = useAction()

  const { data, loading, reload } = useLiveQuery(
    async () => {
      const orders = await orderService.listOrders()
      const items = await orderService.listItemsForOrders(orders.map((o) => o.id))
      return { orders, items }
    },
    ['orders', 'order_items', 'payments'],
  )

  const filtered = useMemo(() => {
    const orders = data?.orders ?? []
    const q = search.trim().toLowerCase()
    return orders.filter(
      (o) =>
        (filter === 'all' || o.order_status === filter) &&
        (!q ||
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_email.toLowerCase().includes(q)),
    )
  }, [data, filter, search])

  const counts = useMemo(() => {
    const orders = data?.orders ?? []
    return FILTERS.reduce<Record<string, number>>((acc, f) => {
      acc[f.value] = f.value === 'all' ? orders.length : orders.filter((o) => o.order_status === f.value).length
      return acc
    }, {})
  }, [data])

  const advance = (order: Order) => {
    const next = nextStatus(order)
    if (!next) return
    run(() => orderService.updateStatus(order.id, next), {
      onSuccess: () => {
        toast.success(`${order.order_number} is now ${ORDER_STATUS_LABEL[next]}.`)
        reload()
      },
      onError: toast.error,
    })
  }

  const setStatus = (order: Order, status: OrderStatus) =>
    run(() => orderService.updateStatus(order.id, status), {
      onSuccess: () => {
        toast.success(`${order.order_number} set to ${ORDER_STATUS_LABEL[status]}.`)
        reload()
        setViewing(null)
      },
      onError: toast.error,
    })

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="scroll-slim -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  filter === f.value ? 'bg-ink text-cream' : 'bg-cream text-body/65 hover:bg-ink/8'
                }`}
              >
                {f.label} <span className="opacity-60">{counts[f.value] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders…"
              aria-label="Search orders"
              className="field pl-10"
            />
          </div>
        </div>
      </div>

      <section className="card overflow-hidden">
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={6} />
          </div>
        ) : !filtered.length ? (
          <EmptyState title="No orders here" message="Try a different filter or clear your search." />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full text-sm">
                <thead className="bg-cream/60 text-left text-[11px] uppercase tracking-wide text-body/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order ID</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Items</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Payment</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/6">
                  {filtered.map((o) => {
                    const next = nextStatus(o)
                    return (
                      <tr key={o.id} className="transition hover:bg-cream/40">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-ink">{o.order_number}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{o.customer_name}</p>
                          <p className="text-xs text-body/45">{o.customer_phone}</p>
                        </td>
                        <td className="px-4 py-3 text-body/60">
                          {(data?.items ?? []).filter((i) => i.order_id === o.id).reduce((s, i) => s + i.quantity, 0)}
                        </td>
                        <td className="px-4 py-3 text-body/60">{ORDER_TYPE_LABEL[o.order_type]}</td>
                        <td className="px-4 py-3 font-semibold text-ink">{peso(o.total)}</td>
                        <td className="px-4 py-3">
                          <PaymentStatusBadge status={o.payment_status} />
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusBadge status={o.order_status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-body/50">{relativeTime(o.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <IconAction
                              label="View order"
                              onClick={async () => setViewing(await orderService.getWithItems(o.id))}
                            >
                              <Eye className="h-4 w-4" />
                            </IconAction>
                            {next && (
                              <Button size="sm" variant="outline" loading={busy} onClick={() => advance(o)}>
                                {ORDER_STATUS_LABEL[next]} <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {o.order_status !== 'completed' && o.order_status !== 'cancelled' && (
                              <IconAction label="Cancel order" danger onClick={() => setCancelling(o)}>
                                <XCircle className="h-4 w-4" />
                              </IconAction>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-ink/6 xl:hidden">
              {filtered.map((o) => {
                const next = nextStatus(o)
                return (
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={async () => setViewing(await orderService.getWithItems(o.id))}>
                        View
                      </Button>
                      {next && (
                        <Button size="sm" loading={busy} onClick={() => advance(o)}>
                          Mark {ORDER_STATUS_LABEL[next]}
                        </Button>
                      )}
                      {o.order_status !== 'completed' && o.order_status !== 'cancelled' && (
                        <Button size="sm" variant="danger" onClick={() => setCancelling(o)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      <OrderDetailModal order={viewing} onClose={() => setViewing(null)} onSetStatus={setStatus} busy={busy} />

      <ConfirmDialog
        open={!!cancelling}
        title="Cancel this order?"
        message={`${cancelling?.order_number} will be marked cancelled${
          cancelling?.payment_status === 'paid' ? ' and the payment marked refunded' : ''
        }. The customer will see this on their tracking page.`}
        confirmLabel="Cancel order"
        loading={busy}
        onCancel={() => setCancelling(null)}
        onConfirm={() =>
          cancelling &&
          run(() => orderService.cancelOrder(cancelling.id), {
            onSuccess: () => {
              toast.success(`${cancelling.order_number} was cancelled.`)
              setCancelling(null)
              reload()
            },
            onError: toast.error,
          })
        }
      />
    </div>
  )
}

function OrderDetailModal({
  order,
  onClose,
  onSetStatus,
  busy,
}: {
  order: OrderWithItems | null
  onClose: () => void
  onSetStatus: (order: Order, status: OrderStatus) => void
  busy: boolean
}) {
  if (!order) return null
  const steps = statusSteps(order.order_type)

  return (
    <Modal
      open
      onClose={onClose}
      title={`Order ${order.order_number}`}
      footer={
        <>
          <Button variant="outline" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.order_status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Detail label="Customer" value={order.customer_name} />
          <Detail label="Phone" value={order.customer_phone} />
          <Detail label="Email" value={order.customer_email} />
          <Detail label="Placed" value={formatDateTime(order.created_at)} />
          <Detail label="Order type" value={ORDER_TYPE_LABEL[order.order_type]} />
          {order.table_number && <Detail label="Table" value={order.table_number} />}
          {order.delivery_address && (
            <Detail
              label="Delivery address"
              value={[order.delivery_address, order.delivery_city, order.delivery_postal_code].filter(Boolean).join(', ')}
            />
          )}
          {order.payment && (
            <>
              <Detail label="Payment method" value={PAYMENT_METHOD_LABEL[order.payment.payment_method]} />
              <Detail label="Reference" value={<span className="font-mono text-xs">{order.payment.transaction_reference}</span>} />
            </>
          )}
        </div>

        {order.notes && (
          <p className="rounded-xl bg-cream px-4 py-3 text-sm text-body/70">
            <strong className="text-ink">Notes:</strong> {order.notes}
          </p>
        )}

        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-body/50">Items</h4>
          <ul className="divide-y divide-ink/8 rounded-2xl bg-white ring-1 ring-ink/5">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-body/75">
                  <strong className="text-ink">{item.quantity}×</strong> {item.item_name}
                </span>
                <span className="font-semibold text-ink">{peso(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label="Subtotal" value={peso(order.subtotal)} />
            {order.discount > 0 && <Row label="Discount" value={`−${peso(order.discount)}`} />}
            <Row label="Delivery fee" value={peso(order.delivery_fee)} />
            <div className="flex justify-between border-t border-ink/10 pt-2">
              <dt className="font-display text-base font-bold text-ink">Total</dt>
              <dd className="font-display text-xl font-extrabold text-warm">{peso(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-body/50">Update status</h4>
          <Select
            value={order.order_status}
            disabled={busy}
            onChange={(e) => onSetStatus(order, e.target.value as OrderStatus)}
            options={[...steps, 'cancelled' as OrderStatus].map((s) => ({
              value: s,
              label: ORDER_STATUS_LABEL[s],
            }))}
          />
          <p className="mt-2 text-xs text-body/50">
            The customer's tracking page updates the moment you change this.
          </p>
        </div>
      </div>
    </Modal>
  )
}

function IconAction({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 transition ${
        danger ? 'text-body/45 hover:bg-red-50 hover:text-red-600' : 'text-body/50 hover:bg-ink/5 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-body/45">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-body/60">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  )
}
