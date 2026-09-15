import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button, Input } from '../../components/ui'
import { backend } from '../../lib/db'
import { DemoModeBanner } from '../../components/Brand'

export default function AdminLogin() {
  const { user, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [forgot, setForgot] = useState(false)

  if (user?.staff?.active) return <Navigate to={(location.state as any)?.from ?? '/admin'} replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const signedIn = await signIn(email, password)
      if (!signedIn.staff?.active) {
        await signOut()
        setError('That account does not have staff access to the dashboard.')
        return
      }
      navigate((location.state as any)?.from ?? '/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <DemoModeBanner />
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img src="/images/logo.png" alt="Tapa Hey" className="mx-auto h-20 w-20" />
            <h1 className="mt-3 font-display text-3xl font-extrabold text-cream">
              Tapa <span className="text-gold">Hey</span> Admin
            </h1>
            <p className="mt-1.5 text-sm text-cream/55">Restaurant Management System</p>
          </div>

          <div className="rounded-3xl bg-offwhite p-8 shadow-lift">
            {forgot ? (
              <>
                <h2 className="font-display text-xl font-bold text-ink">Reset your password</h2>
                <p className="mt-2 text-sm text-body/60">
                  {backend === 'supabase'
                    ? 'Ask a Super Admin to send a reset link from Supabase → Authentication → Users.'
                    : 'This demo build stores staff credentials in the seeded demo database. Use the credentials below, or reset the demo data from Admin → Settings.'}
                </p>
                <Button variant="outline" className="mt-5 w-full" onClick={() => setForgot(false)}>
                  Back to sign in
                </Button>
              </>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tapahey.demo"
                  autoComplete="username"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  error={error}
                  required
                />

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-body/65">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-ink/25 text-gold focus:ring-gold"
                    />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setForgot(true)} className="text-sm font-semibold text-warm hover:text-golddark">
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full" size="lg" loading={busy} icon={<ShieldCheck className="h-4 w-4" />}>
                  Login
                </Button>
              </form>
            )}

            {backend === 'local' && !forgot && (
              <div className="mt-6 rounded-2xl bg-cream p-4 text-xs text-body/70">
                <p className="mb-2 font-bold uppercase tracking-wide text-body/50">Demo staff accounts</p>
                <ul className="space-y-1.5">
                  <li>
                    <strong>Super Admin</strong> — <code className="font-mono">admin@tapahey.demo</code> /{' '}
                    <code className="font-mono">DemoAdmin123!</code>
                  </li>
                  <li>
                    <strong>Manager</strong> — <code className="font-mono">manager@tapahey.demo</code> /{' '}
                    <code className="font-mono">DemoStaff123!</code>
                  </li>
                  <li>
                    <strong>Cashier</strong> — <code className="font-mono">cashier@tapahey.demo</code> /{' '}
                    <code className="font-mono">DemoStaff123!</code>
                  </li>
                  <li>
                    <strong>Kitchen</strong> — <code className="font-mono">kitchen@tapahey.demo</code> /{' '}
                    <code className="font-mono">DemoStaff123!</code>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-cream/45">
            <Link to="/home" className="transition hover:text-gold">
              ← Back to the website
            </Link>
            {' · '}
            <Link to="/" className="transition hover:text-gold">
              Choose mode
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
