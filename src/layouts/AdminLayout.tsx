import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Bike,
  Briefcase,
  Building2,
  CalendarCheck,
  ChefHat,
  Crown,
  ExternalLink,
  Gift,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu as MenuIcon,
  Network,
  Package,
  PackageSearch,
  Plug,
  PlayCircle,
  Landmark,
  ScrollText,
  Settings,
  ShoppingCart,
  Star,
  Tags,
  Tag,
  TrendingUp,
  Users,
  UserCog,
  X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { canAccess, bypassStaffLogin } from '../lib/auth'
import { useLiveQuery } from '../hooks/useLiveQuery'
import { notificationService } from '../services/notifications'
import { Avatar, LoadingBlock } from '../components/ui'
import { DemoModeBanner } from '../components/Brand'
import { STAFF_ROLE_LABEL } from '../services/staff'
import { relativeTime } from '../utils/format'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, section: 'dashboard', end: true },
  { to: '/admin/owner-cockpit', label: 'Owner Cockpit', icon: Crown, section: 'owner_cockpit' },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, section: 'orders' },
  { to: '/admin/kitchen', label: 'Kitchen (KDS)', icon: ChefHat, section: 'kitchen' },
  { to: '/admin/menu', label: 'Menu', icon: ChefHat, section: 'menu' },
  { to: '/admin/categories', label: 'Categories', icon: Tags, section: 'categories' },
  { to: '/admin/reservations', label: 'Reservations', icon: CalendarCheck, section: 'reservations' },
  { to: '/admin/customers', label: 'Customers', icon: Users, section: 'customers' },
  { to: '/admin/loyalty', label: 'Loyalty', icon: Gift, section: 'loyalty' },
  { to: '/admin/promotions', label: 'Promotions', icon: Tag, section: 'promotions' },
  { to: '/admin/inventory', label: 'Inventory', icon: Package, section: 'inventory' },
  { to: '/admin/procurement', label: 'Procurement', icon: PackageSearch, section: 'procurement' },
  { to: '/admin/delivery', label: 'Delivery', icon: Bike, section: 'delivery' },
  { to: '/admin/branches', label: 'Branches', icon: Building2, section: 'branches' },
  { to: '/admin/b2b', label: 'B2B / Reseller', icon: Briefcase, section: 'b2b' },
  { to: '/admin/finance', label: 'Finance', icon: Landmark, section: 'finance' },
  { to: '/admin/reports', label: 'Sales & Reports', icon: TrendingUp, section: 'reports' },
  { to: '/admin/reviews', label: 'Reviews', icon: Star, section: 'reviews' },
  { to: '/admin/gallery', label: 'Gallery', icon: ImageIcon, section: 'gallery' },
  { to: '/admin/content', label: 'Website Content', icon: LayoutTemplate, section: 'content' },
  { to: '/admin/staff', label: 'Staff', icon: UserCog, section: 'staff' },
  { to: '/admin/audit', label: 'Audit Log', icon: ScrollText, section: 'audit' },
  { to: '/admin/architecture', label: 'System Architecture', icon: Network, section: 'architecture' },
  { to: '/admin/integrations', label: 'Integrations', icon: Plug, section: 'integrations' },
  { to: '/admin/demo-center', label: 'Demo Center', icon: PlayCircle, section: 'demo_center' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, section: 'settings' },
]

export function AdminLayout() {
  const { user, loading, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const { data: notifications, reload } = useLiveQuery(
    async () => notificationService.list(12),
    ['notifications'],
  )

  useEffect(() => {
    setSidebarOpen(false)
    setBellOpen(false)
  }, [location.pathname])

  // TEMPORARY: no login gate on the admin dashboard — auto-enter as the demo
  // Super Admin. See bypassStaffLogin() in lib/auth.ts.
  useEffect(() => {
    if (!loading && !user) bypassStaffLogin()
  }, [loading, user])

  if (loading || !user) return <LoadingBlock label="Loading the dashboard…" />
  if (!user.staff || !user.staff.active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream p-6">
        <div className="card max-w-md p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Staff access only</h1>
          <p className="mt-2 text-sm text-body/65">
            This account is not linked to an active staff member. Sign in with a staff account to open the dashboard.
          </p>
          <button onClick={() => signOut().then(() => navigate('/admin/login'))} className="btn-gold btn-md mt-5">
            Sign in as staff
          </button>
        </div>
      </div>
    )
  }

  const allowed = NAV.filter((n) => canAccess(user, n.section))
  const unread = (notifications ?? []).filter((n) => !n.read).length

  return (
    <div className="flex min-h-screen bg-cream">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink text-cream transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-cream/10 px-5 py-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img src="/images/logo.png" alt="" className="h-10 w-10" />
            <span>
              <span className="block font-display text-lg font-extrabold leading-none">
                Tapa <span className="text-gold">Hey</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-cream/45">Admin Panel</span>
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-cream/60 lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="scroll-slim flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {allowed.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-gold text-ink shadow-gold' : 'text-cream/65 hover:bg-white/5 hover:text-cream'
                }`
              }
            >
              <n.icon style={{ width: 18, height: 18 }} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-cream/10 p-3">
          <Link
            to="/home"
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-cream/60 transition hover:bg-white/5 hover:text-cream"
          >
            <ExternalLink className="h-4 w-4" /> View website
          </Link>
          {canAccess(user, 'pos') && (
            <Link
              to="/pos"
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-cream/60 transition hover:bg-white/5 hover:text-cream"
            >
              <ExternalLink className="h-4 w-4" /> Open POS
            </Link>
          )}
          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <DemoModeBanner />
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/10 bg-offwhite/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-body transition hover:bg-ink/5 lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-bold text-ink">
              {allowed.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ??
                'Admin'}
            </h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setBellOpen((o) => !o)}
              className="relative rounded-xl p-2 text-body transition hover:bg-ink/5"
              aria-label={`Notifications, ${unread} unread`}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white" style={{ height: 18, minWidth: 18 }}>
                  {unread}
                </span>
              )}
            </button>

            {bellOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-ink/10 animate-pop">
                  <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3">
                    <p className="text-sm font-bold text-ink">Notifications</p>
                    <button
                      onClick={async () => {
                        await notificationService.markAllRead()
                        reload()
                      }}
                      className="text-xs font-semibold text-warm transition hover:text-golddark"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="scroll-slim max-h-80 overflow-y-auto">
                    {(notifications ?? []).length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-body/50">You are all caught up.</p>
                    ) : (
                      (notifications ?? []).map((n) => (
                        <button
                          key={n.id}
                          onClick={async () => {
                            await notificationService.markRead(n.id)
                            reload()
                            if (n.link) navigate(n.link)
                          }}
                          className={`flex w-full gap-3 border-b border-ink/5 px-4 py-3 text-left transition hover:bg-cream ${
                            n.read ? 'opacity-60' : ''
                          }`}
                        >
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-ink/20' : 'bg-gold'}`} />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-ink">{n.title}</span>
                            <span className="block truncate text-xs text-body/60">{n.message}</span>
                            <span className="block text-[11px] text-body/40">{relativeTime(n.created_at)}</span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 border-l border-ink/10 pl-3">
            <Avatar name={user.full_name} size={34} />
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight text-ink">{user.full_name}</p>
              <p className="text-[11px] text-body/50">{STAFF_ROLE_LABEL[user.staff.role]}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/** Blocks a staff member from a section their role does not cover. */
export function RequireSection({ section, children }: { section: string; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!canAccess(user, section)) {
    return (
      <div className="card p-10 text-center">
        <h2 className="font-display text-xl font-bold text-ink">You do not have access to this section</h2>
        <p className="mt-2 text-sm text-body/60">
          Your role ({user?.staff ? STAFF_ROLE_LABEL[user.staff.role] : 'unknown'}) does not include this area. Ask a
          Super Admin if you need it.
        </p>
      </div>
    )
  }
  return <>{children}</>
}
