import { useState } from 'react'
import { PlayCircle, Sparkles } from 'lucide-react'
import { demoScenarios, DEMO_SCENARIO_LIST, type ScenarioResult } from '../../services/demoScenarios'
import { Button } from '../../components/ui'
import { useToast } from '../../hooks/useToast'

export default function AdminDemoCenter() {
  const toast = useToast()
  const [running, setRunning] = useState<string | null>(null)
  const [log, setLog] = useState<ScenarioResult[]>([])

  const run = async (key: keyof typeof demoScenarios, label: string) => {
    setRunning(key)
    try {
      const result = await demoScenarios[key]()
      setLog((prev) => [result, ...prev].slice(0, 12))
      toast.success(`${label} complete.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That scenario could not run.')
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800 ring-1 ring-amber-200">
        <strong className="font-bold">🟡 Demo Mode.</strong> Each button below actually mutates the demo data — creates real
        orders, moves inventory, fires notifications — so you can narrate a live scenario instead of clicking through forms.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_SCENARIO_LIST.map((s) => (
          <div key={s.key} className="card p-5">
            <p className="font-display text-base font-bold text-ink">{s.label}</p>
            <p className="mt-1 text-sm text-body/60">{s.description}</p>
            <Button size="sm" className="mt-4 w-full" icon={<PlayCircle className="h-4 w-4" />} loading={running === s.key} onClick={() => run(s.key, s.label)}>
              Run Scenario
            </Button>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Sparkles className="h-4 w-4 text-warm" /> Scenario Log
        </h2>
        {!log.length ? (
          <p className="mt-3 text-sm text-body/50">Run a scenario to see what changed.</p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {log.map((r, i) => (
              <li key={i} className="rounded-xl bg-cream px-4 py-2.5 text-sm">
                <span className="font-semibold text-ink">{r.title}:</span> <span className="text-body/70">{r.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
