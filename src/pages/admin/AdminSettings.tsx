import { useEffect, useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { contentService } from '../../services/content'
import { resetLocalDb } from '../../lib/localDb'
import { backend } from '../../lib/db'
import { paymentMode } from '../../services/payment'
import { Button, ConfirmDialog, Input } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { DemoModeBanner } from '../../components/Brand'

export default function AdminSettings() {
  const { data, reload } = useLiveQuery(async () => contentService.getSettings(), [])
  const { busy, run } = useAction()
  const toast = useToast()
  const [form, setForm] = useState<any>({})
  const [resetting, setResetting] = useState(false)

  useEffect(() => setForm(data ?? {}), [data])

  const save = () =>
    run(() => contentService.updateSettings(form), {
      onSuccess: () => {
        toast.success('Restaurant settings saved.')
        reload()
      },
      onError: toast.error,
    })

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold text-ink">Restaurant Details</h2>
        <p className="mt-1 text-sm text-body/55">These details power the site footer, contact page and receipts.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Restaurant name" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Tagline" value={form.tagline ?? ''} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          <Input label="Address" className="sm:col-span-2" value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="Phone" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Opening hours" value={form.opening_hours ?? ''} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} />
          <Input label="Delivery fee (₱)" type="number" value={form.delivery_fee ?? 0} onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value) })} />
        </div>
        <div className="mt-6 flex justify-end border-t border-ink/8 pt-5">
          <Button icon={<Save className="h-4 w-4" />} loading={busy} onClick={save}>
            Save Settings
          </Button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-xl font-bold text-ink">System Status</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatusRow label="Database backend" value={backend === 'supabase' ? 'Supabase (PostgreSQL)' : 'Local demo database'} />
          <StatusRow label="Payment mode" value={paymentMode === 'stripe' ? 'Stripe (Test Mode)' : 'Demo Payment Simulator'} />
          <StatusRow label="Environment" value={import.meta.env.MODE} />
        </div>
        <div className="mt-4">
          <DemoModeBanner compact />
        </div>
      </div>

      {backend === 'local' && (
        <div className="card border-2 border-red-100 p-6">
          <h2 className="font-display text-xl font-bold text-red-700">Danger Zone</h2>
          <p className="mt-1 text-sm text-body/55">
            Reset the local demo database back to its original seed data. This clears every order, review, and change
            made during this demo session.
          </p>
          <Button variant="danger" className="mt-4" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setResetting(true)}>
            Reset Demo Data
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={resetting}
        title="Reset all demo data?"
        message="This permanently clears every order, customer, review, and setting change and restores the original seed data. This cannot be undone."
        confirmLabel="Reset everything"
        onCancel={() => setResetting(false)}
        onConfirm={() => {
          resetLocalDb()
          setResetting(false)
          toast.success('Demo data reset. Reloading…')
          setTimeout(() => window.location.reload(), 800)
        }}
      />
    </div>
  )
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-cream p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-body/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}
