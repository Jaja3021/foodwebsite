import { useState } from 'react'
import { CalendarCheck, Clock, Users } from 'lucide-react'
import { reservationService } from '../../services/reservations'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { Button, Input, Select, Textarea } from '../../components/ui'
import { formatTime } from '../../utils/format'

const TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
]

export default function Reservations() {
  const { user } = useAuth()
  const toast = useToast()
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    reserved_date: today,
    reserved_time: '18:00',
    guests: '2',
    special_request: '',
  })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const reservation = await reservationService.create({
        ...form,
        guests: Number(form.guests),
        customer_id: user?.customer?.id ?? null,
      })
      setDone(reservation.id)
      toast.success('Reservation request sent! The team will confirm shortly.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not save your reservation.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <header className="bg-ink px-5 py-14 text-center sm:px-8 md:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold">Reservations</p>
        <h1 className="font-display text-4xl font-extrabold text-cream md:text-6xl">Reserve a Table</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-cream/65">
          Book ahead for the barkada, a birthday, or an early breakfast before work.
        </p>
      </header>

      <section className="section bg-offwhite">
        <div className="container-th grid max-w-5xl gap-8 lg:grid-cols-[1fr_300px]">
          {done ? (
            <div className="card p-10 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 animate-pop">
                <CalendarCheck className="h-8 w-8 text-emerald-600" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-bold text-ink">Reservation requested</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-body/65">
                We have your request for {form.guests} guest{form.guests === '1' ? '' : 's'} on{' '}
                <strong className="text-ink">{form.reserved_date}</strong> at{' '}
                <strong className="text-ink">{formatTime(form.reserved_time)}</strong>. The team will confirm by email
                shortly.
              </p>
              <Button className="mt-6" variant="outline" onClick={() => setDone(null)}>
                Make another reservation
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="card space-y-4 p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Juan Dela Cruz"
                  required
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+63 917 555 0101"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  className="sm:col-span-2"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@example.com"
                  required
                />
                <Input
                  label="Date"
                  type="date"
                  min={today}
                  value={form.reserved_date}
                  onChange={(e) => setForm({ ...form, reserved_date: e.target.value })}
                  required
                />
                <Select
                  label="Time"
                  value={form.reserved_time}
                  onChange={(e) => setForm({ ...form, reserved_time: e.target.value })}
                  options={TIMES.map((t) => ({ value: t, label: formatTime(t) }))}
                />
                <Select
                  label="Guests"
                  className="sm:col-span-2"
                  value={form.guests}
                  onChange={(e) => setForm({ ...form, guests: e.target.value })}
                  options={Array.from({ length: 20 }, (_, i) => ({
                    value: String(i + 1),
                    label: `${i + 1} guest${i === 0 ? '' : 's'}`,
                  }))}
                />
              </div>
              <Textarea
                label="Special request"
                value={form.special_request}
                onChange={(e) => setForm({ ...form, special_request: e.target.value })}
                placeholder="Birthday celebration, high chair needed, window seat…"
                error={error}
              />
              <Button type="submit" className="w-full" size="lg" loading={busy}>
                Request Reservation
              </Button>
            </form>
          )}

          <aside className="space-y-4">
            <InfoCard icon={<Clock className="h-5 w-5" />} title="Opening hours">
              Daily, 6:00 AM – 10:00 PM. Last reservation seating is at 9:00 PM.
            </InfoCard>
            <InfoCard icon={<Users className="h-5 w-5" />} title="Large groups">
              Parties of 10 or more? Add a note and we will set up the function room.
            </InfoCard>
            <InfoCard icon={<CalendarCheck className="h-5 w-5" />} title="Confirmation">
              Requests start as <strong>Pending</strong>. A staff member confirms them from the admin dashboard.
            </InfoCard>
          </aside>
        </div>
      </section>
    </>
  )
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-golddark">{icon}</span>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-body/60">{children}</p>
    </div>
  )
}
