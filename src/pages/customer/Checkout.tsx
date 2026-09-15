import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, Bike, CreditCard, ShoppingBag, Store, Smartphone, Wallet, ShieldCheck } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { orderService } from '../../services/orders'
import { menuService } from '../../services/menu'
import { promotionService } from '../../services/promotions'
import { Button, EmptyState, Input, Textarea } from '../../components/ui'
import { PaymentModal } from '../../components/customer/PaymentModal'
import { isValidEmail, isValidPhone, peso } from '../../utils/format'
import type { Order, OrderType, PaymentMethod } from '../../types'

const ORDER_TYPES: Array<{ value: OrderType; label: string; description: string; icon: typeof Store }> = [
  { value: 'dine_in', label: 'Dine-in', description: 'Eat at the restaurant', icon: Store },
  { value: 'takeout', label: 'Takeout', description: 'Pick it up yourself', icon: ShoppingBag },
  { value: 'delivery', label: 'Delivery', description: 'Brought to your door', icon: Bike },
]

const METHODS: Array<{ value: PaymentMethod; label: string; description: string; icon: typeof Wallet }> = [
  { value: 'cash', label: 'Cash', description: 'Pay on hand-over', icon: Banknote },
  { value: 'gcash', label: 'GCash', description: 'E-wallet (test)', icon: Smartphone },
  { value: 'maya', label: 'Maya', description: 'E-wallet (test)', icon: Wallet },
  { value: 'card', label: 'Credit/Debit Card', description: 'Test card payment', icon: CreditCard },
]

export default function Checkout() {
  const { lines, subtotal, totals, clear } = useCart()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [orderType, setOrderType] = useState<OrderType>('delivery')
  const [method, setMethod] = useState<PaymentMethod>('gcash')
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    delivery_city: 'Quezon City',
    delivery_postal_code: '',
    delivery_instructions: '',
    table_number: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [placing, setPlacing] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null)
  const [unavailable, setUnavailable] = useState<string[]>([])
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [applyingPromo, setApplyingPromo] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm((f) => ({
      ...f,
      customer_name: f.customer_name || user.full_name,
      customer_email: f.customer_email || user.email,
      customer_phone: f.customer_phone || user.phone || '',
      delivery_address: f.delivery_address || user.customer?.address || '',
    }))
  }, [user])

  // Guard against checking out items the kitchen has since disabled.
  useEffect(() => {
    let active = true
    menuService.listItems().then((items) => {
      if (!active) return
      const byId = new Map(items.map((i) => [i.id, i]))
      setUnavailable(
        lines.filter((l) => !byId.get(l.menu_item_id)?.available).map((l) => l.name),
      )
    })
    return () => {
      active = false
    }
  }, [lines])

  const money = useMemo(() => totals(orderType, appliedPromo?.discount ?? 0), [orderType, totals, appliedPromo])

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setApplyingPromo(true)
    setPromoError(null)
    try {
      const { promotion, discount } = await promotionService.apply(promoCode, subtotal)
      setAppliedPromo({ code: promotion.code, discount })
      toast.success(`${promotion.code} applied — ${peso(discount)} off.`)
    } catch (e) {
      setAppliedPromo(null)
      setPromoError(e instanceof Error ? e.message : 'That promo code is not valid.')
    } finally {
      setApplyingPromo(false)
    }
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.customer_name.trim()) next.customer_name = 'Please enter your full name.'
    if (!isValidEmail(form.customer_email)) next.customer_email = 'Please enter a valid email address.'
    if (!isValidPhone(form.customer_phone)) next.customer_phone = 'Please enter a valid phone number.'
    if (orderType === 'delivery') {
      if (!form.delivery_address.trim()) next.delivery_address = 'Please enter a delivery address.'
      if (!form.delivery_city.trim()) next.delivery_city = 'Please enter a city.'
    }
    if (orderType === 'dine_in' && !form.table_number.trim()) next.table_number = 'Please enter a table number.'
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error('Please complete the highlighted fields.')
      return false
    }
    return true
  }

  const placeOrder = async () => {
    if (placing || pendingOrder) return
    if (!lines.length) {
      toast.error('Your cart is empty.')
      return
    }
    if (unavailable.length) {
      toast.error(`${unavailable.join(', ')} is no longer available. Please remove it from your cart.`)
      return
    }
    if (!validate()) return

    setPlacing(true)
    try {
      const order = await orderService.createOrder({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        order_type: orderType,
        delivery_address: form.delivery_address.trim(),
        delivery_city: form.delivery_city.trim(),
        delivery_postal_code: form.delivery_postal_code.trim(),
        table_number: form.table_number.trim(),
        notes: [form.notes.trim(), form.delivery_instructions.trim() && `Delivery: ${form.delivery_instructions.trim()}`]
          .filter(Boolean)
          .join(' · '),
        lines,
        subtotal: money.subtotal,
        delivery_fee: money.delivery_fee,
        discount: money.discount,
        total: money.total,
        customer_id: user?.customer?.id ?? null,
        promo_code: appliedPromo?.code ?? null,
      })
      if (appliedPromo) {
        const promos = await promotionService.list()
        const promo = promos.find((p) => p.code === appliedPromo.code)
        if (promo) {
          await promotionService.recordUsage({
            promotion_id: promo.id,
            order_id: order.id,
            customer_email: order.customer_email,
            discount_applied: appliedPromo.discount,
          })
        }
      }
      setPendingOrder(order)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'We could not place your order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  if (!lines.length && !pendingOrder) {
    return (
      <section className="section bg-offwhite">
        <div className="container-th max-w-xl">
          <EmptyState
            icon={<ShoppingBag className="h-10 w-10" />}
            title="Your cart is empty"
            message="Add a few plates before heading to checkout."
            action={<Button onClick={() => navigate('/menu')}>Browse the menu</Button>}
          />
        </div>
      </section>
    )
  }

  return (
    <>
      <header className="bg-ink px-5 py-12 text-center sm:px-8">
        <h1 className="font-display text-4xl font-extrabold text-cream md:text-5xl">Checkout</h1>
        <p className="mt-3 text-sm text-cream/60">Almost there — just a few details and your food is on its way.</p>
      </header>

      <section className="section bg-offwhite pt-10">
        <div className="container-th grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {unavailable.length > 0 && (
              <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <strong>{unavailable.join(', ')}</strong> {unavailable.length === 1 ? 'is' : 'are'} no longer available.
                Please remove {unavailable.length === 1 ? 'it' : 'them'} from your cart to continue.
              </div>
            )}

            <Step number={1} title="Customer Information">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  error={errors.customer_name}
                  placeholder="Juan Dela Cruz"
                  required
                />
                <Input
                  label="Phone number"
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  error={errors.customer_phone}
                  placeholder="+63 917 555 0101"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  className="sm:col-span-2"
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  error={errors.customer_email}
                  hint="Your receipt and order tracking link go here."
                  placeholder="juan@example.com"
                  required
                />
              </div>
            </Step>

            <Step number={2} title="Order Type">
              <div className="grid gap-3 sm:grid-cols-3">
                {ORDER_TYPES.map((t) => {
                  const Icon = t.icon
                  const active = orderType === t.value
                  return (
                    <button
                      key={t.value}
                      onClick={() => setOrderType(t.value)}
                      className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition ${
                        active ? 'border-gold bg-gold/10 shadow-soft' : 'border-ink/10 bg-white hover:border-ink/25'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${active ? 'text-golddark' : 'text-body/45'}`} />
                      <span className="text-sm font-bold text-ink">{t.label}</span>
                      <span className="text-xs text-body/55">{t.description}</span>
                    </button>
                  )
                })}
              </div>

              {orderType === 'delivery' && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 animate-fadeIn">
                  <Input
                    label="Delivery address"
                    className="sm:col-span-2"
                    value={form.delivery_address}
                    onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                    error={errors.delivery_address}
                    placeholder="12 Mabini St, Brgy. San Isidro"
                    required
                  />
                  <Input
                    label="City"
                    value={form.delivery_city}
                    onChange={(e) => setForm({ ...form, delivery_city: e.target.value })}
                    error={errors.delivery_city}
                    required
                  />
                  <Input
                    label="Postal code"
                    value={form.delivery_postal_code}
                    onChange={(e) => setForm({ ...form, delivery_postal_code: e.target.value })}
                    placeholder="1100"
                  />
                  <Textarea
                    label="Delivery instructions"
                    className="sm:col-span-2"
                    value={form.delivery_instructions}
                    onChange={(e) => setForm({ ...form, delivery_instructions: e.target.value })}
                    placeholder="Gate code, landmark, or where to leave the order…"
                  />
                </div>
              )}

              {orderType === 'dine_in' && (
                <div className="mt-5 max-w-xs animate-fadeIn">
                  <Input
                    label="Table number"
                    value={form.table_number}
                    onChange={(e) => setForm({ ...form, table_number: e.target.value })}
                    error={errors.table_number}
                    placeholder="T3"
                    required
                  />
                </div>
              )}

              <Textarea
                label="Order notes (optional)"
                className="mt-4"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Extra sawsawan, no onions, egg well done…"
              />
            </Step>

            <Step number={3} title="Order Summary">
              <ul className="divide-y divide-ink/8">
                {lines.map((l) => (
                  <li key={l.menu_item_id} className="flex items-center gap-3 py-3">
                    <img src={l.image_url} alt={l.name} className="h-14 w-14 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{l.name}</p>
                      <p className="text-xs text-body/55">
                        {l.quantity} × {peso(l.price)}
                      </p>
                    </div>
                    <p className="font-display text-base font-bold text-warm">{peso(l.price * l.quantity)}</p>
                  </li>
                ))}
              </ul>
            </Step>

            <Step number={4} title="Payment Method">
              <div className="grid gap-3 sm:grid-cols-2">
                {METHODS.map((m) => {
                  const Icon = m.icon
                  const active = method === m.value
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMethod(m.value)}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                        active ? 'border-gold bg-gold/10 shadow-soft' : 'border-ink/10 bg-white hover:border-ink/25'
                      }`}
                    >
                      <Icon className={`h-6 w-6 shrink-0 ${active ? 'text-golddark' : 'text-body/45'}`} />
                      <span>
                        <span className="block text-sm font-bold text-ink">{m.label}</span>
                        <span className="block text-xs text-body/55">{m.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-cream px-4 py-3 text-xs text-body/60">
                <ShieldCheck className="h-4 w-4 shrink-0 text-golddark" />
                Demo build — payments are simulated in test mode and no real money is charged.
              </p>
            </Step>
          </div>

          <aside className="h-fit lg:sticky lg:top-28">
            <div className="card overflow-hidden">
              <div className="bg-ink px-6 py-4">
                <h2 className="font-display text-lg font-bold text-cream">Order Total</h2>
              </div>
              <div className="space-y-3 px-6 py-5">
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    error={promoError}
                  />
                  <Button variant="outline" size="md" loading={applyingPromo} onClick={applyPromo}>
                    Apply
                  </Button>
                </div>
                <Row label={`Subtotal (${lines.reduce((s, l) => s + l.quantity, 0)} items)`} value={peso(money.subtotal)} />
                <Row label={appliedPromo ? `Discount (${appliedPromo.code})` : 'Discount'} value={money.discount ? `−${peso(money.discount)}` : peso(0)} />
                <Row label="Delivery fee" value={money.delivery_fee ? peso(money.delivery_fee) : 'Free'} />
                <div className="flex items-center justify-between border-t border-dashed border-ink/15 pt-4">
                  <span className="font-display text-lg font-bold text-ink">TOTAL</span>
                  <span className="font-display text-3xl font-extrabold text-warm">{peso(money.total)}</span>
                </div>
                <Button
                  className="mt-3 w-full"
                  size="lg"
                  loading={placing}
                  disabled={unavailable.length > 0}
                  onClick={placeOrder}
                >
                  {placing ? 'Placing order…' : `Pay ${peso(money.total)}`}
                </Button>
                <p className="text-center text-[11px] text-body/45">
                  By placing this order you agree to our demo terms. Subtotal {peso(subtotal)}.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {pendingOrder && (
        <PaymentModal
          order={pendingOrder}
          method={method}
          onSuccess={(orderId) => {
            clear()
            navigate(`/order/success/${orderId}`)
          }}
          onRetry={() => setPendingOrder(null)}
          onCancel={() => setPendingOrder(null)}
        />
      )}
    </>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 sm:p-7">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-display text-base font-extrabold text-ink">
          {number}
        </span>
        <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      </header>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-body/60">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  )
}
