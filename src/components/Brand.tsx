import { Link } from 'react-router-dom'
import { backend } from '../lib/db'
import { isDemoMode } from '../services/payment'

export function Logo({ size = 44, to = '/home', showWordmark = true, light = false }: {
  size?: number
  to?: string
  showWordmark?: boolean
  light?: boolean
}) {
  return (
    <Link to={to} className="flex items-center gap-2.5 transition hover:opacity-90">
      <img src="/images/logo.png" alt="Tapa Hey" width={size} height={size} style={{ width: size, height: size }} />
      {showWordmark && (
        <span className="leading-none">
          <span className={`block font-display text-xl font-extrabold ${light ? 'text-cream' : 'text-ink'}`}>
            Tapa <span className="text-gold">Hey</span>
          </span>
          <span className={`block text-[10px] font-semibold uppercase tracking-[0.18em] ${light ? 'text-cream/60' : 'text-body/50'}`}>
            Good Food. Good Mood.
          </span>
        </span>
      )}
    </Link>
  )
}

/** Always-on reminder that no real money moves through this build. */
export function DemoModeBanner({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-golddark">
        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        Demo Mode
      </span>
    )
  }
  return (
    <div className="bg-gold px-4 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-ink sm:text-xs">
      🟡 Demo Mode — {isDemoMode ? 'simulated payments' : 'Stripe test mode'} · no real money is charged ·{' '}
      {backend === 'supabase' ? 'Supabase backend' : 'local demo database'}
    </div>
  )
}
