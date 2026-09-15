import { useMemo, useState } from 'react'
import { Calendar, Check, ChefHat, Users, X } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { reservationService } from '../../services/reservations'
import { Button, EmptyState, Input, Modal, Select, SkeletonRows } from '../../components/ui'
import { ReservationStatusBadge } from '../../components/StatusBadge'
import { formatDate, formatTime, RESERVATION_STATUS_LABEL } from '../../utils/format'
import { useToast } from '../../hooks/useToast'
import type { Reservation, ReservationStatus } from '../../types'

const FILTERS: Array<{ value: ReservationStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'seated', label: 'Seated' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

export default function AdminReservations() {
  const [filter, setFilter] = useState<ReservationStatus | 'all'>('all')
  const [rescheduling, setRescheduling] = useState<Reservation | null>(null)
  const toast = useToast()
  const { busy, run } = useAction()

  const { data, loading, reload } = useLiveQuery(async () => reservationService.list(), ['reservations'])

  const filtered = useMemo(() => {
    const list = data ?? []
    return filter === 'all' ? list : list.filter((r) => r.status === filter)
  }, [data, filter])

  const setStatus = (r: Reservation, status: ReservationStatus) =>
    run(() => reservationService.updateStatus(r.id, status), {
      onSuccess: () => {
        toast.success(`${r.full_name}'s reservation is now ${RESERVATION_STATUS_LABEL[status]}.`)
        reload()
      },
      onError: toast.error,
    })

  return (
    <div className="space-y-5">
      <div className="scroll-slim -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              filter === f.value ? 'bg-ink text-cream' : 'bg-cream text-body/65 hover:bg-ink/8'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-5">
          <SkeletonRows rows={5} />
        </div>
      ) : !filtered.length ? (
        <EmptyState icon={<Calendar className="h-10 w-10" />} title="No reservations" message="Nothing matches this filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-ink">{r.full_name}</p>
                  <p className="text-xs text-body/50">
                    {r.email} · {r.phone}
                  </p>
                </div>
                <ReservationStatusBadge status={r.status} />
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-body/70">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-golddark" /> {formatDate(r.reserved_date)}
                </span>
                <span>{formatTime(r.reserved_time)}</span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-golddark" /> {r.guests}
                </span>
              </div>

              {r.special_request && (
                <p className="mt-2.5 rounded-xl bg-cream px-3.5 py-2.5 text-xs text-body/65">{r.special_request}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {r.status === 'pending' && (
                  <>
                    <Button size="sm" loading={busy} onClick={() => setStatus(r, 'confirmed')} icon={<Check className="h-3.5 w-3.5" />}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="danger" loading={busy} onClick={() => setStatus(r, 'cancelled')} icon={<X className="h-3.5 w-3.5" />}>
                      Reject
                    </Button>
                  </>
                )}
                {r.status === 'confirmed' && (
                  <>
                    <Button size="sm" onClick={() => setStatus(r, 'seated')} icon={<ChefHat className="h-3.5 w-3.5" />}>
                      Mark Seated
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRescheduling(r)}>
                      Reschedule
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setStatus(r, 'cancelled')}>
                      Cancel
                    </Button>
                  </>
                )}
                {r.status === 'seated' && (
                  <Button size="sm" onClick={() => setStatus(r, 'completed')}>
                    Mark Completed
                  </Button>
                )}
                {(r.status === 'pending' || r.status === 'confirmed') && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(r, 'no_show')}>
                    No Show
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {rescheduling && (
        <RescheduleModal
          reservation={rescheduling}
          onClose={() => setRescheduling(null)}
          onSaved={() => {
            setRescheduling(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

function RescheduleModal({
  reservation,
  onClose,
  onSaved,
}: {
  reservation: Reservation
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const { busy, run } = useAction()
  const [date, setDate] = useState(reservation.reserved_date)
  const [time, setTime] = useState(reservation.reserved_time)

  const save = () =>
    run(() => reservationService.reschedule(reservation.id, date, time), {
      onSuccess: () => {
        toast.success('Reservation rescheduled.')
        onSaved()
      },
      onError: toast.error,
    })

  return (
    <Modal
      open
      onClose={onClose}
      title={`Reschedule ${reservation.full_name}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" loading={busy} onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select
          label="Time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          options={Array.from({ length: 16 }, (_, i) => {
            const h = String(6 + i).padStart(2, '0')
            return { value: `${h}:00`, label: formatTime(`${h}:00`) }
          })}
        />
      </div>
    </Modal>
  )
}
