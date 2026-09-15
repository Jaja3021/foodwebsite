import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { CalendarCheck, Heart, LogOut, Package, Star, User as UserIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { orderService } from '../../services/orders'
import { reservationService } from '../../services/reservations'
import { reviewService } from '../../services/reviews'
import { favoriteService } from '../../services/customers'
import { auth } from '../../lib/auth'
import { Avatar, Button, EmptyState, Input, LoadingBlock, Rating } from '../../components/ui'
import { OrderStatusBadge, PaymentStatusBadge, ReservationStatusBadge } from '../../components/StatusBadge'
import { formatDate, formatDateTime, formatTime, ORDER_TYPE_LABEL, peso } from '../../utils/format'
import { MenuItemCard } from '../../components/customer/MenuItemCard'
import { useToast } from '../../hooks/useToast'

const TABS = [
  { to: '/account', label: 'Profile', icon: UserIcon, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/reservations', label: 'Reservations', icon: CalendarCheck },
  { to: '/account/reviews', label: 'Reviews', icon: Star },
  { to: '/account/favorites', label: 'Favorites', icon: Heart },
]

export function AccountLayout() {
  const { user, loading, signOut } = useAuth()

  if (loading) return <LoadingBlock />
  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="section bg-cream">
      <div className="container-th grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit lg:sticky lg:top-28">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <Avatar name={user.full_name} size={52} />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold text-ink">{user.full_name}</p>
                <p className="truncate text-xs text-body/55">{user.email}</p>
              </div>
            </div>
            <nav className="mt-5 space-y-1">
              {TABS.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                      isActive ? 'bg-gold/15 text-warm' : 'text-body/65 hover:bg-ink/5'
                    }`
                  }
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </NavLink>
              ))}
              {user.staff && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-body/65 transition hover:bg-ink/5"
                >
                  <Package className="h-4 w-4" /> Admin Dashboard
                </Link>
              )}
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </nav>
          </div>
        </aside>

        <div>
          <Outlet />
        </div>
      </div>
    </section>
  )
}

export function AccountProfile() {
  const { user, refresh } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ full_name: user?.full_name ?? '', phone: user?.phone ?? '' })
  const [busy, setBusy] = useState(false)

  if (!user) return null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await auth.updateProfile(user.id, form)
      await refresh()
      toast.success('Profile updated.')
    } catch {
      toast.error('We could not save your profile. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-7">
      <h1 className="font-display text-2xl font-bold text-ink">My Profile</h1>
      <p className="mt-1 text-sm text-body/55">Keep your details current for faster checkout.</p>
      <form onSubmit={save} className="mt-6 grid max-w-lg gap-4">
        <Input label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email" value={user.email} disabled hint="Contact the restaurant to change your email." />
        <Button type="submit" loading={busy} className="w-fit">
          Save Changes
        </Button>
      </form>
    </div>
  )
}

export function AccountOrders() {
  const { user } = useAuth()
  const { data, loading } = useLiveQuery(
    async () => {
      const orders = await orderService.listOrdersByEmail(user?.email ?? '')
      const items = await orderService.listItemsForOrders(orders.map((o) => o.id))
      return { orders, items }
    },
    ['orders', 'order_items'],
    [user?.email],
  )

  if (loading) return <LoadingBlock />
  if (!data?.orders.length) {
    return (
      <EmptyState
        icon={<Package className="h-10 w-10" />}
        title="No orders yet"
        message="Once you place an order it will show up here with live status."
        action={
          <Link to="/menu" className="btn-gold btn-md">
            Browse the menu
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-ink">Order History</h1>
      {data.orders.map((order) => {
        const items = data.items.filter((i) => i.order_id === order.id)
        return (
          <article key={order.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold text-ink">#{order.order_number}</p>
                <p className="text-xs text-body/50">
                  {formatDateTime(order.created_at)} · {ORDER_TYPE_LABEL[order.order_type]}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <OrderStatusBadge status={order.order_status} />
                <PaymentStatusBadge status={order.payment_status} />
              </div>
            </div>

            <p className="mt-3 text-sm text-body/65">
              {items.map((i) => `${i.quantity}× ${i.item_name}`).join(', ') || '—'}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/8 pt-4">
              <span className="font-display text-xl font-extrabold text-warm">{peso(order.total)}</span>
              <div className="flex gap-2">
                <Link to={`/track/${order.order_number}`} className="btn-outline btn-sm">
                  Track
                </Link>
                <Link to={`/order/success/${order.id}`} className="btn-dark btn-sm">
                  Receipt
                </Link>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function AccountReservations() {
  const { user } = useAuth()
  const { data, loading } = useLiveQuery(
    async () => reservationService.listByEmail(user?.email ?? ''),
    ['reservations'],
    [user?.email],
  )

  if (loading) return <LoadingBlock />
  if (!data?.length) {
    return (
      <EmptyState
        icon={<CalendarCheck className="h-10 w-10" />}
        title="No reservations yet"
        message="Reserve a table and it will appear here."
        action={
          <Link to="/reservations" className="btn-gold btn-md">
            Reserve a table
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-ink">My Reservations</h1>
      {data.map((r) => (
        <article key={r.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-bold text-ink">
              {formatDate(r.reserved_date)} · {formatTime(r.reserved_time)}
            </p>
            <p className="text-sm text-body/55">
              {r.guests} guest{r.guests === 1 ? '' : 's'}
              {r.special_request ? ` · ${r.special_request}` : ''}
            </p>
          </div>
          <ReservationStatusBadge status={r.status} />
        </article>
      ))}
    </div>
  )
}

export function AccountReviews() {
  const { user } = useAuth()
  const { data, loading } = useLiveQuery(
    async () => (user?.customer ? reviewService.listByCustomer(user.customer.id) : []),
    ['reviews'],
    [user?.customer?.id],
  )

  if (loading) return <LoadingBlock />
  if (!data?.length) {
    return (
      <EmptyState
        icon={<Star className="h-10 w-10" />}
        title="No reviews yet"
        message="Completed an order? Head to order tracking and leave a review."
      />
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-ink">My Reviews</h1>
      {data.map((r) => (
        <article key={r.id} className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <Rating value={r.rating} size={15} />
            <span className="text-xs text-body/45">
              {formatDate(r.created_at)} · {r.approved ? 'Published' : 'Awaiting approval'}
            </span>
          </div>
          <p className="mt-2.5 text-sm text-body/75">{r.comment}</p>
          {r.reply && (
            <p className="mt-3 rounded-xl bg-cream p-3.5 text-sm text-body/70">
              <strong className="text-golddark">Tapa Hey replied:</strong> {r.reply}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}

export function AccountFavorites() {
  const { user } = useAuth()
  const toast = useToast()
  const customerId = user?.customer?.id
  const { data, loading, reload } = useLiveQuery(
    async () => (customerId ? favoriteService.list(customerId) : []),
    ['favorites', 'menu_items'],
    [customerId],
  )

  if (loading) return <LoadingBlock />
  if (!data?.length) {
    return (
      <EmptyState
        icon={<Heart className="h-10 w-10" />}
        title="No favorites yet"
        message="Tap the heart on any menu item to save it here."
        action={
          <Link to="/menu" className="btn-gold btn-md">
            Browse the menu
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-bold text-ink">Favorite Items</h1>
      <div className="grid gap-5 sm:grid-cols-2">
        {data.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            isFavorite
            onToggleFavorite={async (i) => {
              if (!customerId) return
              await favoriteService.toggle(customerId, i.id)
              toast.success(`${i.name} removed from favorites.`)
              reload()
            }}
          />
        ))}
      </div>
    </div>
  )
}
