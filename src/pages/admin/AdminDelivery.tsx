import { Bike, MapPin } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { deliveryService, DELIVERY_FLOW, DELIVERY_STATUS_LABEL } from '../../services/delivery'
import { Badge, Button, EmptyState, SkeletonRows } from '../../components/ui'
import { relativeTime } from '../../utils/format'
import type { Delivery, DeliveryStatus } from '../../types'

const TONE: Record<DeliveryStatus, 'neutral' | 'amber' | 'blue' | 'green'> = {
  preparing: 'neutral',
  ready_for_pickup: 'amber',
  picked_up: 'blue',
  out_for_delivery: 'blue',
  delivered: 'green',
}

export default function AdminDelivery() {
  const { data, loading, reload } = useLiveQuery(() => deliveryService.list(), ['deliveries'])

  return (
    <div className="space-y-5">
      <p className="text-sm text-body/60">Demo courier dispatch — created automatically when a delivery order starts preparing.</p>
      {loading ? (
        <SkeletonRows rows={5} />
      ) : !data?.length ? (
        <EmptyState icon={<Bike className="h-10 w-10" />} title="No deliveries in progress" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((d) => (
            <DeliveryCard key={d.id} delivery={d} onAdvance={reload} />
          ))}
        </div>
      )}
    </div>
  )
}

function DeliveryCard({ delivery, onAdvance }: { delivery: Delivery; onAdvance: () => void }) {
  const { busy, run } = useAction()
  const idx = DELIVERY_FLOW.indexOf(delivery.status)
  const isDone = delivery.status === 'delivered'

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-bold text-ink">{delivery.order_number}</p>
        <Badge tone={TONE[delivery.status]}>{DELIVERY_STATUS_LABEL[delivery.status]}</Badge>
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-sm text-body/65">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {delivery.address || 'Address on file'}
      </p>
      <p className="mt-1 text-xs text-body/50">Courier: {delivery.courier_name}</p>
      <p className="mt-1 text-[11px] text-body/40">Updated {relativeTime(delivery.updated_at)}</p>

      <div className="mt-3 flex gap-1">
        {DELIVERY_FLOW.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-gold' : 'bg-ink/10'}`} />
        ))}
      </div>

      {!isDone && (
        <Button size="sm" className="mt-4 w-full" loading={busy} onClick={() => run(() => deliveryService.advance(delivery.id), { onSuccess: onAdvance })}>
          Mark {DELIVERY_STATUS_LABEL[DELIVERY_FLOW[idx + 1]]}
        </Button>
      )}
    </div>
  )
}
