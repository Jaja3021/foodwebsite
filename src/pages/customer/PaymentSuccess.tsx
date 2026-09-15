import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Clock, MapPin, Printer, Receipt } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { orderService } from '../../services/orders'
import { Button, EmptyState, LoadingBlock } from '../../components/ui'
import { PaymentStatusBadge } from '../../components/StatusBadge'
import {
  formatDateTime,
  ORDER_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  peso,
} from '../../utils/format'

export default function PaymentSuccess() {
  const { orderId = '' } = useParams()
  const { data: order, loading } = useLiveQuery(
    async () => orderService.getWithItems(orderId),
    ['orders', 'payments'],
    [orderId],
  )

  if (loading) return <LoadingBlock label="Loading your receipt…" />
  if (!order) {
    return (
      <section className="section bg-offwhite">
        <div className="container-th max-w-lg">
          <EmptyState
            title="Order not found"
            message="We could not find that order. Check the link or track it using your order number."
            action={
              <Link to="/track" className="btn-gold btn-md">
                Track an order
              </Link>
            }
          />
        </div>
      </section>
    )
  }

  const paid = order.payment_status === 'paid'
  const prepMinutes = order.order_type === 'delivery' ? '25–40' : '15–25'

  return (
    <section className="section bg-cream">
      <div className="container-th max-w-3xl">
        <div className="text-center no-print">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 animate-pop">
            <CheckCircle2 className="h-11 w-11 text-emerald-600" />
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold text-ink md:text-5xl">
            {paid ? 'Payment Successful ✓' : 'Order Confirmed ✓'}
          </h1>
          <p className="mt-3 text-lg text-body/70">
            Thank you, {order.customer_name.split(' ')[0]}! Your order has been confirmed.
          </p>
        </div>

        <div className="card mt-9 overflow-hidden">
          <div className="bg-ink px-6 py-6 text-center text-cream sm:px-8">
            <img src="/images/logo.png" alt="Tapa Hey" className="mx-auto h-16 w-16" />
            <p className="mt-2 font-display text-2xl font-extrabold">
              Tapa <span className="text-gold">Hey</span>
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Good Food. Good Mood.</p>
            <div className="mt-5 rounded-2xl bg-white/5 px-5 py-3">
              <p className="text-xs uppercase tracking-wide text-cream/50">Order Number</p>
              <p className="font-display text-2xl font-extrabold text-gold">#{order.order_number}</p>
            </div>
          </div>

          <div className="grid gap-4 border-b border-ink/10 px-6 py-5 sm:grid-cols-2 sm:px-8">
            <Detail label="Date" value={formatDateTime(order.created_at)} />
            <Detail label="Customer" value={order.customer_name} />
            <Detail label="Order Type" value={ORDER_TYPE_LABEL[order.order_type]} />
            <Detail
              label="Payment"
              value={
                <span className="flex items-center gap-2">
                  {PAYMENT_METHOD_LABEL[order.payment?.payment_method ?? 'cash']}
                  <PaymentStatusBadge status={order.payment_status} />
                </span>
              }
            />
            {order.delivery_address && <Detail label="Deliver to" value={order.delivery_address} />}
            {order.table_number && <Detail label="Table" value={order.table_number} />}
            {order.payment?.transaction_reference && (
              <Detail label="Reference" value={<span className="font-mono text-xs">{order.payment.transaction_reference}</span>} />
            )}
          </div>

          <div className="px-6 py-5 sm:px-8">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Receipt className="h-5 w-5 text-golddark" /> Your Items
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-[11px] uppercase tracking-wide text-body/45">
                  <th className="pb-2 font-semibold">Item</th>
                  <th className="pb-2 text-center font-semibold">Qty</th>
                  <th className="pb-2 text-right font-semibold">Price</th>
                  <th className="pb-2 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 font-medium text-ink">{item.item_name}</td>
                    <td className="py-2.5 text-center text-body/65">{item.quantity}</td>
                    <td className="py-2.5 text-right text-body/65">{peso(item.unit_price)}</td>
                    <td className="py-2.5 text-right font-semibold text-ink">{peso(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="mt-5 space-y-2 border-t border-dashed border-ink/15 pt-4 text-sm">
              <SummaryRow label="Subtotal" value={peso(order.subtotal)} />
              {order.discount > 0 && <SummaryRow label="Discount" value={`−${peso(order.discount)}`} />}
              <SummaryRow label="Delivery fee" value={order.delivery_fee ? peso(order.delivery_fee) : 'Free'} />
              <div className="flex items-center justify-between border-t border-ink/15 pt-3">
                <dt className="font-display text-lg font-bold text-ink">TOTAL</dt>
                <dd className="font-display text-2xl font-extrabold text-warm">{peso(order.total)}</dd>
              </div>
            </dl>

            {order.notes && (
              <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-xs text-body/65">
                <strong className="text-ink">Notes:</strong> {order.notes}
              </p>
            )}

            <div className="mt-5 flex items-center gap-2.5 rounded-2xl bg-gold/15 px-4 py-3.5">
              <Clock className="h-5 w-5 shrink-0 text-golddark" />
              <p className="text-sm text-body/75">
                Estimated {order.order_type === 'delivery' ? 'delivery' : 'preparation'}:{' '}
                <strong className="text-ink">{prepMinutes} minutes</strong>
              </p>
            </div>
          </div>

          <div className="border-t border-ink/10 bg-white px-6 py-4 text-center text-[11px] text-body/45 sm:px-8">
            Demo receipt — no real payment was processed. Salamat po! 🧡
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 no-print">
          <Link to={`/track/${order.order_number}`} className="btn-gold btn-lg">
            <MapPin className="h-4 w-4" /> Track Order
          </Link>
          <Button variant="outline" size="lg" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Print Receipt
          </Button>
          <Link to="/home" className="btn-outline btn-lg">
            Back to Home
          </Link>
        </div>
      </div>
    </section>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-body/60">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  )
}
