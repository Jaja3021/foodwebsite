import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, Phone, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { Button, Input } from '../../components/ui'
import { backend } from '../../lib/db'

export function Login() {
  const { signIn } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const user = await signIn(email, password)
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}!`)
      navigate(user.staff ? '/admin' : '/account')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to track orders and save your favorites.">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="juan@tapahey.demo"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          error={error}
          required
        />
        <Button type="submit" className="w-full" size="lg" loading={busy}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-body/60">
        New here?{' '}
        <Link to="/register" className="font-bold text-warm transition hover:text-golddark">
          Create an account
        </Link>
      </p>

      {backend === 'local' && (
        <div className="mt-6 rounded-2xl bg-cream p-4 text-xs text-body/65">
          <p className="mb-1.5 font-bold uppercase tracking-wide text-body/50">Demo customer account</p>
          <p>
            <code className="font-mono">juan@tapahey.demo</code> · <code className="font-mono">DemoCustomer123!</code>
          </p>
          <p className="mt-2">
            Staff?{' '}
            <Link to="/admin/login" className="font-bold text-warm">
              Use the admin login →
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  )
}

export function Register() {
  const { signUp } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) {
      setError('Please use at least 8 characters for your password.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await signUp(form)
      toast.success('Account created. Welcome to Tapa Hey!')
      navigate('/account')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Save your details for faster checkout next time.">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Full name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          placeholder="Juan Dela Cruz"
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="juan@example.com"
          required
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+63 917 555 0101"
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="At least 8 characters"
          error={error}
          required
        />
        <Button type="submit" className="w-full" size="lg" loading={busy}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-body/60">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-warm transition hover:text-golddark">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="section bg-cream">
      <div className="container-th max-w-md">
        <div className="card p-8">
          <div className="mb-7 text-center">
            <img src="/images/logo.png" alt="Tapa Hey" className="mx-auto h-16 w-16" />
            <h1 className="mt-3 font-display text-3xl font-extrabold text-ink">{title}</h1>
            <p className="mt-1.5 text-sm text-body/60">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}

export const AuthIcons = { Lock, Mail, Phone, User }
