import { useState } from 'react'
import { Plus, Tag } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { promotionService } from '../../services/promotions'
import { Badge, Button, EmptyState, Input, Modal, Select, SkeletonRows } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import type { Promotion } from '../../types'

export default function AdminPromotions() {
  const [adding, setAdding] = useState(false)
  const toast = useToast()
  const { data, loading, reload } = useLiveQuery(() => promotionService.list(), ['promotions'])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>New Promotion</Button>
      </div>

      {loading ? (
        <SkeletonRows rows={4} />
      ) : !data?.length ? (
        <EmptyState icon={<Tag className="h-10 w-10" />} title="No promotions yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => {
            const expired = today > p.end_date
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-extrabold tracking-wide text-warm">{p.code}</p>
                  <Badge tone={!p.active ? 'neutral' : expired ? 'red' : 'green'}>
                    {!p.active ? 'Disabled' : expired ? 'Expired' : 'Active'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-body/65">{p.description}</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {p.discount_type === 'percent' ? `${p.discount_value}% off` : `₱${p.discount_value} off`}
                  {p.min_purchase ? ` · min. ₱${p.min_purchase}` : ''}
                </p>
                <p className="mt-1 text-xs text-body/45">{p.start_date} → {p.end_date}</p>
                <button
                  className="mt-3 text-xs font-semibold text-warm hover:text-golddark"
                  onClick={() => promotionService.update(p.id, { active: !p.active }).then(reload)}
                >
                  {p.active ? 'Disable' : 'Enable'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {adding && <PromoForm onClose={() => setAdding(false)} onSaved={() => { setAdding(false); toast.success('Promotion created.'); reload() }} />}
    </div>
  )
}

function PromoForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { busy, run } = useAction()
  const today = new Date().toISOString().slice(0, 10)
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)
  const [form, setForm] = useState<Partial<Promotion>>({
    code: '', description: '', discount_type: 'percent', discount_value: 10, min_purchase: 0, start_date: today, end_date: in60,
  })
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    if (!form.code?.trim()) return setError('Enter a promo code.')
    run(() => promotionService.create({ ...form, code: form.code!.trim().toUpperCase() }), { onSuccess: onSaved, onError: setError })
  }

  return (
    <Modal open onClose={onClose} title="New Promotion" size="sm" footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} onClick={save}>Create</Button></>}>
      <div className="space-y-4">
        <Input label="Promo code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} error={error} required />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Discount type"
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value as Promotion['discount_type'] })}
            options={[{ value: 'percent', label: 'Percent (%)' }, { value: 'fixed', label: 'Fixed amount (₱)' }]}
          />
          <Input label="Value" type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
        </div>
        <Input label="Minimum purchase (₱)" type="number" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: Number(e.target.value) })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <Input label="End date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
      </div>
    </Modal>
  )
}
