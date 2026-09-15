import { Plug } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { integrationService } from '../../services/integrations'
import { Badge, SkeletonRows } from '../../components/ui'
import { isSupabaseConfigured } from '../../lib/supabase'

export default function AdminIntegrations() {
  const { data, loading, reload } = useLiveQuery(() => integrationService.list(), ['integrations'])

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800 ring-1 ring-amber-200">
        <strong className="font-bold">🟡 Demo Mode.</strong> No real credentials are required to demonstrate this system —
        every integration below runs in a safe, simulated mode. Flip a switch to "Connected" once real API keys are added via
        environment variables (see <code>.env.example</code>); no code changes needed.
      </div>

      {loading ? (
        <SkeletonRows rows={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card flex items-center justify-between p-5">
            <div>
              <p className="font-semibold text-ink">Supabase Backend</p>
              <p className="text-xs text-body/50">Auth · Postgres · Storage · Realtime</p>
            </div>
            <Badge tone={isSupabaseConfigured ? 'green' : 'amber'}>{isSupabaseConfigured ? 'Connected' : 'Demo'}</Badge>
          </div>
          {(data ?? []).map((it) => (
            <div key={it.id} className="card flex items-center justify-between p-5">
              <div>
                <p className="font-semibold text-ink">{it.name}</p>
                <p className="text-xs text-body/50">{it.category}</p>
              </div>
              <button
                onClick={() => integrationService.toggle(it.id, it.status === 'demo' ? 'connected' : 'demo').then(reload)}
                title="Demo credentials only — toggled for presentation purposes"
              >
                <Badge tone={it.status === 'connected' ? 'green' : 'amber'}>{it.status === 'connected' ? 'Connected' : 'Demo'}</Badge>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card flex items-start gap-3 p-5">
        <Plug className="mt-0.5 h-5 w-5 shrink-0 text-warm" />
        <p className="text-sm text-body/65">
          All modules are already wired to call these integrations through internal service functions
          (<code>src/services/*.ts</code>), so pointing any of them at a real provider later is a drop-in swap — the rest of
          the system (orders, kitchen, inventory, reporting) does not change.
        </p>
      </div>
    </div>
  )
}
