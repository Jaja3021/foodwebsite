import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Minus, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canAccess } from '../../lib/auth'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { menuService, effectivePrice } from '../../services/menu'
import { orderService } from '../../services/orders'
import { shiftService } from '../../services/finance'
import { PaymentModal } from '../../components/customer/PaymentModal'
import { Button, Input, LoadingBlock, Modal } from '../../components/ui'
import { peso } from '../../utils/format'
import { useToast } from '../../hooks/useToast'
import { DemoModeBanner } from '../../components/Brand'
import type { CartLine, CashierShift, MenuItem, Order, OrderType, PaymentMethod } from '../../types'

const METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'card', label: 'Card' },
]

export default function POS() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) navigate('/admin/login', { replace: true, state: { from: '/pos' } })
  }, [loading, user, navigate])

  if (loading || !user) return <LoadingBlock label="Loading the POS terminal…" />
  if (!canAccess(user, 'pos') || !user.staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream p-6">
        <div className="card max-w-md p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">POS access only for counter staff</h1>
          <p className="mt-2 text-sm text-body/65">Your role does not include the Point of Sale terminal.</p>
          <Link to="/admin" className="btn-gold btn-md mt-5 inline-flex">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <POSTerminal
      staffId={user.staff.id}
      staffName={user.full_name}
      onSignOut={() => signOut().then(() => navigate('/'))}
    />
  )
}

function POSTerminal({ staffId, staffName, onSignOut }: { staffId: string; staffName: string; onSignOut: () => void }) {
  const toast = useToast()
  const [shift, setShift] = useState<CashierShift | null>(null)
  const [shiftLoading, setShiftLoading] = useState(true)

  useEffect(() => {
    shiftService.currentOpen(staffId).then((s) => {
      setShift(s)
      setShiftLoading(false)
    })
  }, [staffId])
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [lines, setLines] = useState<CartLine[]>([])
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [placing, setPlacing] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null)
  const [lastCompleted, setLastCompleted] = useState<Order | null>(null)

  const { data, loading } = useLiveQuery(
    async () => ({
      categories: await menuService.listCategories({ activeOnly: true }),
      items: await menuService.listItems({ availableOnly: true }),
    }),
    ['menu_items', 'menu_categories'],
  )

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    const q = search.trim().toLowerCase()
    return items.filter(
      (i) => (category === 'all' || i.category_id === category) && (!q || i.name.toLowerCase().includes(q)),
    )
  }, [data, category, search])

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0)

  const addItem = (item: MenuItem) => {
    const price = effectivePrice(item)
    setLines((prev) => {
      const existing = prev.find((l) => l.menu_item_id === item.id)
      if (existing) return prev.map((l) => (l.menu_item_id === item.id ? { ...l, quantity: l.quantity + 1 } : l))
      return [...prev, { menu_item_id: item.id, name: item.name, price, image_url: item.image_url, quantity: 1 }]
    })
  }

  const setQty = (id: string, qty: number) =>
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.menu_item_id !== id) : prev.map((l) => (l.menu_item_id === id ? { ...l, quantity: qty } : l))))

  const clearOrder = () => {
    setLines([])
    setTableNumber('')
    setCustomerName('')
  }

  const charge = async () => {
    if (!lines.length) return toast.error('Add at least one item before charging.')
    if (orderType === 'dine_in' && !tableNumber.trim()) return toast.error('Please enter a table number.')

    setPlacing(true)
    try {
      const order = await orderService.createOrder({
        customer_name: customerName.trim() || 'Walk-in Customer',
        customer_email: 'walkin@tapahey.demo',
        customer_phone: 'N/A',
        order_type: orderType,
        table_number: tableNumber.trim(),
        lines,
        subtotal,
        delivery_fee: 0,
        discount: 0,
        total: subtotal,
        channel: 'pos',
      })
      setPendingOrder(order)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'We could not start this order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  if (shiftLoading) return <LoadingBlock label="Checking cashier shift…" />

  if (!shift) {
    return (
      <StartShiftModal
        staffId={staffId}
        staffName={staffName}
        onStarted={(s) => setShift(s)}
        onSignOut={onSignOut}
      />
    )
  }

  if (lastCompleted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 animate-pop">
          <ShoppingBag className="h-10 w-10 text-emerald-600" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-cream">Order Complete</h1>
        <p className="mt-2 text-cream/60">
          #{lastCompleted.order_number} · {peso(lastCompleted.total)}
        </p>
        <div className="mt-8 flex gap-3">
          <Button onClick={() => setLastCompleted(null)}>Start New Order</Button>
          <Link to="/admin/orders" className="btn-outline btn-md">
            View in Admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-cream">
      <DemoModeBanner compact={false} />
      <header className="flex items-center justify-between border-b border-ink/10 bg-ink px-5 py-3">
        <div className="flex items-center gap-2.5">
          <img src="/images/logo.png" alt="" className="h-9 w-9" />
          <span className="font-display text-lg font-bold text-cream">
            Tapa <span className="text-gold">Hey</span> POS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-cream/60">
            Cashier: {staffName} · Float {peso(shift.opening_cash)}
          </span>
          <button
            className="text-xs font-semibold text-cream/50 underline-offset-2 hover:text-cream hover:underline"
            onClick={async () => {
              const actual = window.prompt('Counted cash in the drawer (₱)?', String(shift.opening_cash))
              if (actual == null) return
              const closed = await shiftService.close(shift.id, Number(actual) || 0)
              toast.success(`Shift closed. Difference: ${peso(closed.cash_difference ?? 0)}`)
              setShift(null)
            }}
          >
            End Shift
          </button>
          <Link to="/admin" className="btn-ghost-light btn-sm">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <button onClick={onSignOut} className="rounded-full p-2 text-cream/60 transition hover:bg-white/10 hover:text-cream" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Menu grid */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-3 border-b border-ink/10 bg-offwhite p-4 sm:flex-row sm:items-center">
            <div className="scroll-slim -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1">
              <CategoryPill label="All" active={category === 'all'} onClick={() => setCategory('all')} />
              {data?.categories.map((c) => (
                <CategoryPill key={c.id} label={c.name} active={category === c.id} onClick={() => setCategory(c.id)} />
              ))}
            </div>
            <div className="relative sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="field pl-9"
                aria-label="Search menu"
              />
            </div>
          </div>

          <div className="scroll-slim grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[4/3] w-full" />)
              : filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="group overflow-hidden rounded-2xl bg-white text-left shadow-soft ring-1 ring-ink/5 transition hover:-translate-y-1 hover:shadow-lift active:scale-[0.98]"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={item.image_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-sm font-bold text-ink">{item.name}</p>
                      <p className="font-display text-base font-extrabold text-warm">{peso(effectivePrice(item))}</p>
                    </div>
                  </button>
                ))}
          </div>
        </div>

        {/* Order panel */}
        <aside className="flex w-full max-w-sm flex-col border-l border-ink/10 bg-white">
          <div className="border-b border-ink/10 p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${orderType === 'dine_in' ? 'bg-ink text-cream' : 'bg-cream text-body/65'}`}
              >
                Dine-in
              </button>
              <button
                onClick={() => setOrderType('takeout')}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${orderType === 'takeout' ? 'bg-ink text-cream' : 'bg-cream text-body/65'}`}
              >
                Takeout
              </button>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {orderType === 'dine_in' && (
                <input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Table #"
                  className="field text-sm"
                />
              )}
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name (optional)"
                className={`field text-sm ${orderType === 'dine_in' ? '' : 'col-span-2'}`}
              />
            </div>
          </div>

          <div className="scroll-slim flex-1 overflow-y-auto p-4">
            {!lines.length ? (
              <p className="py-10 text-center text-sm text-body/45">Tap a menu item to add it to this order.</p>
            ) : (
              <ul className="space-y-2.5">
                {lines.map((l) => (
                  <li key={l.menu_item_id} className="flex items-center gap-2.5 rounded-xl bg-cream p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{l.name}</p>
                      <p className="text-xs text-body/50">{peso(l.price)} each</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-white p-1">
                      <button onClick={() => setQty(l.menu_item_id, l.quantity - 1)} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gold" aria-label={`Decrease ${l.name}`}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold">{l.quantity}</span>
                      <button onClick={() => setQty(l.menu_item_id, l.quantity + 1)} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gold" aria-label={`Increase ${l.name}`}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => setQty(l.menu_item_id, 0)} className="text-body/35 hover:text-red-600" aria-label={`Remove ${l.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-ink/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-lg font-bold text-ink">Total</span>
              <span className="font-display text-2xl font-extrabold text-warm">{peso(subtotal)}</span>
            </div>

            <div className="mb-3 grid grid-cols-4 gap-1.5">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`rounded-lg py-2 text-xs font-semibold transition ${method === m.value ? 'bg-gold text-ink' : 'bg-cream text-body/60'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={clearOrder} className="rounded-xl px-3 py-3 text-body/45 transition hover:bg-red-50 hover:text-red-600" aria-label="Clear order">
                <X className="h-5 w-5" />
              </button>
              <Button className="flex-1" size="lg" loading={placing} onClick={charge}>
                Charge {peso(subtotal)}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {pendingOrder && (
        <PaymentModal
          order={pendingOrder}
          method={method}
          onSuccess={() => {
            setLastCompleted(pendingOrder)
            setPendingOrder(null)
            clearOrder()
          }}
          onRetry={() => setPendingOrder(null)}
          onCancel={() => setPendingOrder(null)}
        />
      )}
    </div>
  )
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
        active ? 'bg-ink text-cream' : 'bg-white text-body/65 ring-1 ring-ink/10 hover:bg-cream'
      }`}
    >
      {label}
    </button>
  )
}

function StartShiftModal({
  staffId,
  staffName,
  onStarted,
  onSignOut,
}: {
  staffId: string
  staffName: string
  onStarted: (shift: CashierShift) => void
  onSignOut: () => void
}) {
  const [opening, setOpening] = useState('5000')
  const [busy, setBusy] = useState(false)

  const start = async () => {
    setBusy(true)
    const shift = await shiftService.openFor(staffId, staffName, Number(opening) || 0)
    setBusy(false)
    onStarted(shift)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <Modal
        open
        onClose={onSignOut}
        title="Start Cashier Shift"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={onSignOut}>Sign out</Button>
            <Button size="sm" loading={busy} onClick={start}>Start Shift</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-body/60">Count the drawer float before taking any orders, {staffName}.</p>
          <Input label="Opening cash (₱)" type="number" value={opening} onChange={(e) => setOpening(e.target.value)} autoFocus />
        </div>
      </Modal>
    </div>
  )
}
