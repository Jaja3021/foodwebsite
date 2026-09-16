import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, LayoutDashboard, ShoppingBag, ArrowRight } from 'lucide-react'
import { DemoModeBanner } from '../components/Brand'
import { useAuth } from '../hooks/useAuth'

const DEMO_ADMIN_EMAIL = 'admin@tapahey.demo'
const DEMO_ADMIN_PASSWORD = 'DemoAdmin123!'

const OPTIONS = [
  {
    to: '/home',
    icon: ShoppingBag,
    title: 'Customer Website',
    description: 'Browse the menu, add to cart, checkout, and track an order — exactly as a diner would.',
    cta: 'Enter Website',
    autoLogin: false,
  },
  {
    to: '/admin',
    icon: LayoutDashboard,
    title: 'Admin Dashboard',
    description: 'Manage orders, menu, inventory, reservations, reviews, staff, and view sales reports.',
    cta: 'Open Dashboard',
    autoLogin: true,
  },
  {
    to: '/pos',
    icon: ChefHat,
    title: 'Point of Sale',
    description: 'Take a walk-in order at the counter — dine-in or takeout, paid on the spot.',
    cta: 'Open POS',
    autoLogin: true,
  },
]

export default function Launcher() {
  const navigate = useNavigate()
  const { user, signIn } = useAuth()
  const [entering, setEntering] = useState<string | null>(null)

  const enter = async (opt: (typeof OPTIONS)[number]) => {
    if (!opt.autoLogin || user?.staff?.active) {
      navigate(opt.to)
      return
    }
    setEntering(opt.to)
    try {
      await signIn(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)
    } catch {
      /* Falls through to the real login screen if the demo account is unavailable. */
    } finally {
      setEntering(null)
      navigate(opt.to)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <DemoModeBanner />
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-16">
        <img src="/images/logo.png" alt="Tapa Hey" className="h-24 w-24" />
        <h1 className="mt-4 text-center font-display text-4xl font-extrabold text-cream sm:text-5xl">
          Tapa <span className="text-gold">Hey</span>
        </h1>
        <p className="mt-2 text-center text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Good Food. Good Mood.
        </p>
        <p className="mt-4 max-w-md text-center text-sm text-cream/60">
          Restaurant Management System demo. Choose where you'd like to go.
        </p>

        <div className="mt-12 grid w-full max-w-5xl gap-5 sm:grid-cols-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.to}
              onClick={() => enter(opt)}
              disabled={entering === opt.to}
              className="group flex flex-col items-start rounded-3xl bg-white/5 p-7 text-left ring-1 ring-cream/10 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/10 hover:ring-gold/40 disabled:cursor-wait disabled:opacity-70"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold text-ink transition group-hover:scale-110">
                <opt.icon className="h-7 w-7" />
              </span>
              <h2 className="mt-5 font-display text-xl font-bold text-cream">{opt.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-cream/60">{opt.description}</p>
              <span className="mt-5 flex items-center gap-1.5 text-sm font-bold text-gold">
                {entering === opt.to ? 'Entering…' : opt.cta}
                {entering !== opt.to && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-cream/35">
          Demo admin login: <code className="font-mono text-cream/55">admin@tapahey.demo</code> /{' '}
          <code className="font-mono text-cream/55">DemoAdmin123!</code>
        </p>
      </div>
    </div>
  )
}
