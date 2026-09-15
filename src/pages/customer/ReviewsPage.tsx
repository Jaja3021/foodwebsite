import { useState } from 'react'
import { MessageSquarePlus, Quote } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { reviewService } from '../../services/reviews'
import { Avatar, Button, EmptyState, Input, Modal, Rating, StarPicker, Textarea } from '../../components/ui'
import { formatDate } from '../../utils/format'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

export default function ReviewsPage() {
  const [open, setOpen] = useState(false)
  const { data, loading, reload } = useLiveQuery(async () => reviewService.listApproved(), ['reviews'])

  const reviews = data ?? []
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }))

  return (
    <>
      <header className="bg-ink px-5 py-14 text-center sm:px-8 md:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold">Reviews</p>
        <h1 className="font-display text-4xl font-extrabold text-cream md:text-6xl">What Our Customers Say</h1>
      </header>

      <section className="section bg-offwhite">
        <div className="container-th grid gap-10 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit lg:sticky lg:top-28">
            <div className="card p-7 text-center">
              <p className="font-display text-6xl font-extrabold text-warm">{average.toFixed(1)}</p>
              <Rating value={average} size={22} className="mt-2 justify-center" />
              <p className="mt-2 text-sm text-body/55">{reviews.length} published reviews</p>

              <div className="mt-6 space-y-2">
                {breakdown.map((b) => (
                  <div key={b.stars} className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-body/60">{b.stars}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/8">
                      <div
                        className="h-full rounded-full bg-gold transition-all duration-500"
                        style={{ width: `${reviews.length ? (b.count / reviews.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-semibold text-body/60">{b.count}</span>
                  </div>
                ))}
              </div>

              <Button className="mt-6 w-full" icon={<MessageSquarePlus className="h-4 w-4" />} onClick={() => setOpen(true)}>
                Write a Review
              </Button>
            </div>
          </aside>

          <div className="space-y-5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-40 w-full" />)
            ) : reviews.length === 0 ? (
              <EmptyState title="No reviews yet" message="Be the first to tell everyone about your Tapa Hey meal." />
            ) : (
              reviews.map((r) => (
                <article key={r.id} className="card p-6">
                  <div className="flex items-start gap-4">
                    <Avatar name={r.customer_name} src={r.avatar_url} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-ink">{r.customer_name}</p>
                        <span className="text-xs text-body/45">{formatDate(r.created_at)}</span>
                      </div>
                      <Rating value={r.rating} size={15} className="mt-1" />
                      <p className="mt-3 text-sm leading-relaxed text-body/75">{r.comment}</p>

                      {r.reply && (
                        <div className="mt-4 rounded-2xl bg-cream p-4">
                          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-golddark">
                            <Quote className="h-3.5 w-3.5" /> Tapa Hey replied
                          </p>
                          <p className="mt-1.5 text-sm text-body/70">{r.reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <ReviewModal open={open} onClose={() => setOpen(false)} onDone={reload} />
    </>
  )
}

export function ReviewModal({
  open,
  onClose,
  onDone,
  orderId,
}: {
  open: boolean
  onClose: () => void
  onDone?: () => void
  orderId?: string
}) {
  const { user } = useAuth()
  const toast = useToast()
  const { busy, run } = useAction()
  const [name, setName] = useState(user?.full_name ?? '')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () =>
    run(
      () =>
        reviewService.create({
          customer_name: name || user?.full_name || '',
          rating,
          comment,
          customer_id: user?.customer?.id ?? null,
          order_id: orderId ?? null,
        }),
      {
        onSuccess: () => {
          toast.success('Thanks! Your review is now waiting for approval.')
          setComment('')
          setError(null)
          onClose()
          onDone?.()
        },
        onError: setError,
      },
    )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Write a Review"
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" loading={busy} onClick={submit}>
            Submit Review
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Dela Cruz" required />
        <div>
          <span className="label">Your rating</span>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <Textarea
          label="Your review"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell everyone about your meal…"
          error={error}
          hint="Reviews appear on the site once the team approves them."
          required
        />
      </div>
    </Modal>
  )
}
