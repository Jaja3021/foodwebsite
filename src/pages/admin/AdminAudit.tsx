import { ScrollText } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { auditService } from '../../services/audit'
import { EmptyState, SkeletonRows } from '../../components/ui'
import { formatDateTime } from '../../utils/format'

export default function AdminAudit() {
  const { data, loading } = useLiveQuery(() => auditService.list(), ['audit_logs'])

  return (
    <div className="space-y-5">
      <p className="text-sm text-body/60">
        Section 7 governance trail — every order status change, payment event, inventory adjustment, procurement approval and
        shift close writes an entry here.
      </p>
      {loading ? (
        <SkeletonRows rows={8} />
      ) : !data?.length ? (
        <EmptyState icon={<ScrollText className="h-10 w-10" />} title="No activity logged yet" />
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-ink/6">
            {data.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                <div className="min-w-0 flex-1">
                  <p className="text-ink">
                    <strong className="font-semibold">{a.actor_name}</strong> {a.action.replace(/_/g, ' ')} — {a.detail}
                  </p>
                  <p className="mt-0.5 text-xs text-body/40">
                    {formatDateTime(a.created_at)} · {a.entity}
                    {a.entity_id ? ` #${a.entity_id.slice(-6)}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
