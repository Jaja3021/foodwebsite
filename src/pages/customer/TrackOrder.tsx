import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bike, Check, ChefHat, ClipboardCheck, PackageCheck, Search, XCircle, Star } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { orderService, statusSteps } from '../../services/orders'
import { Button, EmptyState, LoadingBlock } from '../../components/ui'
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge'
import { formatDateTime, ORDER_STATUS_LABEL, ORDER_TYPE_LABEL, peso } from '../../utils/format'
import { ReviewModal } from './ReviewsPage'
import type { OrderStatus } from '../../types'

const STEP_ICONS: Record<OrderStatus, typeof Check> = {
  pending: ClipboardCheck,
  confirmed: Check,
  preparing: ChefHat,
  ready: PackageCheck,
  out_for_delivery: Bike,
  completed: PackageCheck,
  cancelled: XCircle,
}

const STEP_COPY: Record<OrderStatus, string> = {
  pending: 'Order Received',
  confirmed: 'Order Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function TrackOrder() {
  const { orderNumber } = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(orderNumber ?? '')
  const [reviewOpen, setReviewOpen] = useState(false)

  useEffect(() => setQuery(orderNumber ?? ''), [orderNumber])

  const { data: order, loading } = useLiveQuery(
    async () => (orderNumber ? orderService.getByOrderNumber(orderNumber) : null),
    ['orders', 'payments'],
    [orderNumber],
  )

  return (
    <>
      <header className="bg-ink px-5 py-12 text-center sm:px-8">
        <h1 className="font-display text-4xl font-extrabold text-cream md:text-5xl">Track Your Order</h1>
        <p className="mt-3 text-sm text-cream/60">Enter your order number to see live kitchen updates.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (query.trim()) navigate(`/track/${query.trim().toUpperCase()}`)
          }}
          className="mx-auto mt-6 flex max-w-md gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="TH-20260914-1048"
            aria-label="Order number"
            className="field-dark flex-1"
          />
          <Button type="submit" icon={<Search className="h-4 w-4" />}>
            Track
          </Button>
        </form>
      </header>

      <section className="section bg-offwhite">
        <div className="container-th max-w-3xl">
          {!orderNumber ? (
            <EmptyState
              title="Enter an order number"
              message="You will find it on your receipt, in the format TH-YYYYMMDD-0000."
            />
          ) : loading ? (
            <LoadingBlock label="Looking up your order…" />
          ) : !order ? (
            <EmptyState
              title="We could not find that order"
              message={`No order matches ${orderNumber}. Double-check the number on your receipt.`}
              action={
                <Link to="/menu" className="btn-gold btn-md">
                  Order something new
                </Link>
              }
            />
          ) : (
            <>
              <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-cream px-6 py-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-body/45">Order Number</p>
                    <p className="font-display text-2xl font-extrabold text-ink">#{order.order_number}</p>
                    <p className="mt-1 text-xs text-body/55">Placed {formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <OrderStatusBadge status={order.order_status} />
                    <PaymentStatusBadge status={order.payment_status} />
                  </div>
                </div>

                <div className="px-6 py-7">
                  {order.order_status === 'cancelled' ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-5 text-red-700">
                      <XCircle className="h-7 w-7 shrink-0" />
                      <div>
                        <p className="font-bold">This order was cancelled</p>
                        <p className="text-sm opacity-80">
                          {order.payment_status === 'refunded'
                            ? 'Your payment has been refunded.'
                            : 'No payment was captured for this order.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Timeline order={order} />
                  )}
                </div>

                <div className="border-t border-ink/10 px-6 py-5">
                  <h2 className="mb-3 font-display text-lg font-bold text-ink">Order Details</h2>
                  <ul className="divide-y divide-ink/8">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="text-body/75">
                          <strong className="text-ink">{item.quantity}×</strong> {item.item_name}
                        </span>
                        <span className="font-semibold text-ink">{peso(item.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-ink/15 pt-4">
                    <span className="font-display text-base font-bold text-ink">
                      Total · {ORDER_TYPE_LABEL[order.order_type]}
                    </span>
                    <span className="font-display text-2xl font-extrabold text-warm">{peso(order.total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to={`/order/success/${order.id}`} className="btn-outline btn-md">
                  View Receipt
                </Link>
                {order.order_status === 'completed' && (
                  <Button icon={<Star className="h-4 w-4" />} onClick={() => setReviewOpen(true)}>
                    Leave a Review
                  </Button>
                )}
                <Link to="/menu" className="btn-gold btn-md">
                  Order Again
                </Link>
              </div>

              <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} orderId={order.id} />
            </>
          )}
        </div>
      </section>
    </>
  )
}

function Timeline({ order }: { order: { order_status: OrderStatus; order_type: 'dine_in' | 'takeout' | 'delivery' } }) {
  const steps = statusSteps(order.order_type)
  const currentIndex = steps.indexOf(order.order_status)

  return (
    <ol className="relative space-y-0">
      {steps.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        const Icon = STEP_ICONS[step]
        return (
          <li key={step} className="relative flex gap-4 pb-8 last:pb-0">
            {i < steps.length - 1 && (
              <span
                className={`absolute left-[21px] top-11 h-[calc(100%-2rem)] w-0.5 ${done ? 'bg-gold' : 'bg-ink/10'}`}
              />
            )}
            <span
              className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all ${
                done
                  ? 'bg-gold text-ink'
                  : active
                    ? 'bg-ink text-gold ring-4 ring-gold/25'
                    : 'bg-ink/8 text-body/35'
              }`}
            >
              {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <div className="pt-1.5">
              <p className={`font-bold ${done || active ? 'text-ink' : 'text-body/40'}`}>
                {STEP_COPY[step]} {done && <span className="text-gold">✓</span>}
              </p>
              <p className="text-sm text-body/55">
                {active
                  ? `Happening now — ${ORDER_STATUS_LABEL[step].toLowerCase()}`
                  : done
                    ? 'Done'
                    : 'Waiting'}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
