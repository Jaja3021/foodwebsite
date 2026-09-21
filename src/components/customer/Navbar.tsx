import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, ShoppingBag, User, X, LogOut, Package, CalendarCheck, Heart } from 'lucide-react'
import { Logo } from '../Brand'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { Avatar, Button } from '../ui'

const LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
]

export function Navbar({ className = '' }: { className?: string }) {
  const { count, openCart } = useCart()
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const setHeight = () => {
      document.documentElement.style.setProperty('--navbar-h', `${el.offsetHeight}px`)
    }
    setHeight()
    const observer = new ResizeObserver(setHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setAccountOpen(false)
  }, [location.pathname])

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-offwhite/95 shadow-soft backdrop-blur-md' : 'bg-offwhite'
      } ${className}`}
    >
      <nav className="container-th flex items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === '/home'}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? 'text-warm' : 'text-body/70 hover:text-warm'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-gold" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={openCart}
            aria-label={`Cart with ${count} items`}
            className="relative rounded-full p-2.5 text-body transition hover:bg-ink/5"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink animate-pop">
                {count}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full p-1 transition hover:bg-ink/5"
                aria-label="Account menu"
              >
                <Avatar name={user.full_name} size={34} />
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-ink/10 animate-pop">
                    <div className="border-b border-ink/8 px-4 py-3">
                      <p className="truncate text-sm font-bold text-ink">{user.full_name}</p>
                      <p className="truncate text-xs text-body/55">{user.email}</p>
                    </div>
                    <MenuLink to="/account" icon={<User className="h-4 w-4" />} label="My Profile" />
                    <MenuLink to="/account/orders" icon={<Package className="h-4 w-4" />} label="My Orders" />
                    <MenuLink to="/account/reservations" icon={<CalendarCheck className="h-4 w-4" />} label="Reservations" />
                    <MenuLink to="/account/favorites" icon={<Heart className="h-4 w-4" />} label="Favorites" />
                    {user.staff && (
                      <MenuLink to="/admin" icon={<Package className="h-4 w-4" />} label="Admin Dashboard" />
                    )}
                    <button
                      onClick={async () => {
                        await signOut()
                        navigate('/home')
                      }}
                      className="flex w-full items-center gap-2.5 border-t border-ink/8 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/login" className="hidden rounded-full p-2.5 text-body transition hover:bg-ink/5 sm:block" aria-label="Sign in">
              <User className="h-5 w-5" />
            </Link>
          )}

          <Button size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/menu')}>
            Order Now
          </Button>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-full p-2.5 text-body transition hover:bg-ink/5 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-ink/10 bg-offwhite px-5 pb-5 pt-3 lg:hidden animate-fadeIn">
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === '/home'}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive ? 'bg-gold/15 text-warm' : 'text-body/75 hover:bg-ink/5'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            {!user && (
              <li>
                <NavLink to="/login" className="block rounded-xl px-4 py-3 text-sm font-semibold text-body/75 hover:bg-ink/5">
                  Sign in
                </NavLink>
              </li>
            )}
          </ul>
          <Button className="mt-3 w-full" onClick={() => navigate('/menu')}>
            Order Now
          </Button>
        </div>
      )}
    </header>
  )
}

function MenuLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-body transition hover:bg-cream">
      <span className="text-body/50">{icon}</span>
      {label}
    </Link>
  )
}
