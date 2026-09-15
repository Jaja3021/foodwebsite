import { useMemo } from 'react'
import { ChefHat, Clock } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { orderService } from '../../services/orders'
import { db } from '../../lib/db'
import { Badge, Button, EmptyState } from '../../components/ui'
import { ORDER_TYPE_LABEL, relativeTime } from '../../utils/format'
import type { Order, OrderItem, OrderStatus } from '../../types'

/**
 * Kitchen Display System (section 13). Reuses `orders` / `order_items` rather
 * than a duplicate kitchen_orders table — order_status already models the
 * NEW → ACCEPTED → PREPARING → READY → COMPLETE flow the KDS needs.
 */
const COLUMNS: Array<{ status: OrderStatus; title: string; next: OrderStatus | null; action: string }> = [
  { status: 'confirmed', title: 'New Orders', next: 'preparing', action: 'Start Cooking' },
  { status: 'preparing', title: 'Preparing', next: 'ready', action: 'Mark Ready' },
  { status: 'ready', title: 'Ready', next: 'completed', action: 'Complete' },
]

export default function AdminKitchen() {
  const { data, loading, reload } = useLiveQuery(
    async () => {
      const orders = await db.select<Order>('orders', {
        filters: [{ column: 'order_status', op: 'in', value: ['confirmed', 'preparing', 'ready'] }],
        order: { column: 'created_at', ascending: true },
      })
      const items = await orderService.listItemsForOrders(orders.map((o) => o.id))
      return { orders, items }
    },
    ['orders', 'order_items'],
  )

  const grouped = useMemo(() => {
    const map = new Map<OrderStatus, Order[]>()
    COLUMNS.forEach((c) => map.set(c.status, []))
    data?.orders.forEach((o) => map.get(o.order_status)?.push(o))
    return map
  }, [data])

  if (loading) return <div className="p-10 text-center text-body/50">Loading kitchen queue…</div>

  const total = data?.orders.length ?? 0

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-body/60">
        <ChefHat className="h-4 w-4 text-warm" /> Realtime kitchen queue — {total} active order{total === 1 ? '' : 's'}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col.status} className="rounded-2xl bg-cream/60 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">{col.title}</h3>
              <Badge tone="neutral">{grouped.get(col.status)?.length ?? 0}</Badge>
            </div>
            <div className="space-y-3">
              {!grouped.get(col.status)?.length ? (
                <EmptyState title="Nothing here" />
              ) : (
                grouped.get(col.status)!.map((order) => (
                  <KitchenTicket
                    key={order.id}
                    order={order}
                    items={data?.items.filter((i) => i.order_id === order.id) ?? []}
                    nextStatus={col.next}
                    actionLabel={col.action}
                    onAdvance={reload}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function KitchenTicket({
  order,
  items,
  nextStatus,
  actionLabel,
  onAdvance,
}: {
  order: Order
  items: OrderItem[]
  nextStatus: OrderStatus | null
  actionLabel: string
  onAdvance: () => void
}) {
  const { busy, run } = useAction()
  return (
    <div className="rounded-xl bg-white p-4 shadow-soft ring-1 ring-ink/5">
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-extrabold text-ink">#{order.order_number.slice(-4)}</p>
        <span className="flex items-center gap-1 text-[11px] text-body/45">
          <Clock className="h-3 w-3" /> {relativeTime(order.created_at)}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-body/50">
        {ORDER_TYPE_LABEL[order.order_type]} {order.table_number ? `· Table ${order.table_number}` : ''}
      </p>
      <ul className="mt-2.5 space-y-1 text-sm">
        {items.map((i) => (
          <li key={i.id} className="flex justify-between">
            <span className="font-medium text-ink">{i.quantity}x {i.item_name}</span>
          </li>
        ))}
      </ul>
      {nextStatus && (
        <Button
          size="sm"
          className="mt-3 w-full"
          loading={busy}
          onClick={() => run(() => orderService.updateStatus(order.id, nextStatus), { onSuccess: onAdvance })}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
