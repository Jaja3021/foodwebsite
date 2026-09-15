import { useMemo, useState } from 'react'
import { Check, MessageSquare, Star, Trash2, X } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { reviewService } from '../../services/reviews'
import { Avatar, Badge, Button, ConfirmDialog, EmptyState, Modal, Rating, SkeletonRows, Textarea } from '../../components/ui'
import { formatDate } from '../../utils/format'
import { useToast } from '../../hooks/useToast'
import type { Review } from '../../types'

export default function AdminReviews() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [replyingTo, setReplyingTo] = useState<Review | null>(null)
  const [deleting, setDeleting] = useState<Review | null>(null)
  const toast = useToast()
  const { busy, run } = useAction()

  const { data, loading, reload } = useLiveQuery(async () => reviewService.listAll(), ['reviews'])
  const stats = useMemo(() => reviewService.stats(data ?? []), [data])

  const filtered = useMemo(() => {
    const list = data ?? []
    if (filter === 'pending') return list.filter((r) => !r.approved)
    if (filter === 'approved') return list.filter((r) => r.approved)
    return list
  }, [data, filter])

  const setApproved = (r: Review, approved: boolean) =>
    run(() => reviewService.setApproved(r.id, approved), {
      onSuccess: () => {
        toast.success(approved ? 'Review approved and now live.' : 'Review hidden from the website.')
        reload()
      },
      onError: toast.error,
    })

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <StatBox label="Average" value={stats.average.toFixed(1)} accent />
        <StatBox label="Total" value={String(stats.total)} />
        <StatBox label="5★" value={String(stats.breakdown[0].count)} />
        <StatBox label="4★" value={String(stats.breakdown[1].count)} />
        <StatBox label="3★" value={String(stats.breakdown[2].count)} />
        <StatBox label="2★" value={String(stats.breakdown[3].count)} />
        <StatBox label="1★" value={String(stats.breakdown[4].count)} />
      </div>

      <div className="flex gap-1.5">
        {(['all', 'pending', 'approved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${
              filter === f ? 'bg-ink text-cream' : 'bg-cream text-body/65 hover:bg-ink/8'
            }`}
          >
            {f} {f === 'pending' && stats.pending > 0 && `(${stats.pending})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-5">
          <SkeletonRows rows={5} />
        </div>
      ) : !filtered.length ? (
        <EmptyState icon={<Star className="h-10 w-10" />} title="No reviews here" />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-start gap-3">
                <Avatar name={r.customer_name} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-ink">{r.customer_name}</p>
                    <div className="flex items-center gap-2">
                      <Badge tone={r.approved ? 'green' : 'amber'}>{r.approved ? 'Approved' : 'Pending'}</Badge>
                      <span className="text-xs text-body/45">{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                  <Rating value={r.rating} size={14} className="mt-1" />
                  <p className="mt-2 text-sm text-body/75">{r.comment}</p>
                  {r.reply && (
                    <p className="mt-3 rounded-xl bg-cream p-3 text-sm text-body/65">
                      <strong className="text-golddark">Reply:</strong> {r.reply}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {!r.approved ? (
                      <Button size="sm" loading={busy} icon={<Check className="h-3.5 w-3.5" />} onClick={() => setApproved(r, true)}>
                        Approve
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" loading={busy} icon={<X className="h-3.5 w-3.5" />} onClick={() => setApproved(r, false)}>
                        Hide
                      </Button>
                    )}
                    <Button size="sm" variant="outline" icon={<MessageSquare className="h-3.5 w-3.5" />} onClick={() => setReplyingTo(r)}>
                      Reply
                    </Button>
                    <Button size="sm" variant="danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setDeleting(r)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {replyingTo && (
        <ReplyModal
          review={replyingTo}
          onClose={() => setReplyingTo(null)}
          onSaved={() => {
            setReplyingTo(null)
            reload()
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this review?"
        message="This will permanently remove the review from the site."
        confirmLabel="Delete review"
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          run(() => reviewService.remove(deleting.id), {
            onSuccess: () => {
              toast.success('Review deleted.')
              setDeleting(null)
              reload()
            },
          })
        }
      />
    </div>
  )
}

function ReplyModal({ review, onClose, onSaved }: { review: Review; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const { busy, run } = useAction()
  const [reply, setReply] = useState(review.reply ?? '')

  const save = () =>
    run(() => reviewService.reply(review.id, reply), {
      onSuccess: () => {
        toast.success('Reply posted.')
        onSaved()
      },
    })

  return (
    <Modal
      open
      onClose={onClose}
      title={`Reply to ${review.customer_name}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={busy} onClick={save}>Post Reply</Button>
        </>
      }
    >
      <p className="mb-3 rounded-xl bg-cream p-3 text-sm text-body/70">{review.comment}</p>
      <Textarea label="Your reply" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Salamat po!" />
    </Modal>
  )
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-4 text-center">
      <p className={`font-display text-2xl font-extrabold ${accent ? 'text-warm' : 'text-ink'}`}>{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-body/45">{label}</p>
    </div>
  )
}
