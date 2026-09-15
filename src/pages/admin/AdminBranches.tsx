import { useState } from 'react'
import { Building2, Plus, Star } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { branchService } from '../../services/branches'
import { Badge, Button, EmptyState, Input, Modal, SkeletonRows } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import type { Branch } from '../../types'

export default function AdminBranches() {
  const [adding, setAdding] = useState(false)
  const { data, loading, reload } = useLiveQuery(() => branchService.list(), ['branches'])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-body/60">Multi-branch setup — each branch shares the same menu, inventory and staff pool but tracks its own sales.</p>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Add Branch</Button>
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : !data?.length ? (
        <EmptyState icon={<Building2 className="h-10 w-10" />} title="No branches yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg font-bold text-ink">{b.name}</p>
                  <p className="text-xs text-body/50">{b.code}</p>
                </div>
                {b.is_main && (
                  <Badge tone="gold">
                    <Star className="h-3 w-3" /> Main
                  </Badge>
                )}
              </div>
              <p className="mt-3 text-sm text-body/65">{b.address}</p>
              <p className="mt-1 text-sm text-body/50">{b.phone}</p>
              <div className="mt-4 flex items-center justify-between">
                <Badge tone={b.active ? 'green' : 'neutral'}>{b.active ? 'Active' : 'Inactive'}</Badge>
                <button
                  className="text-xs font-semibold text-warm hover:text-golddark"
                  onClick={() => branchService.update(b.id, { active: !b.active }).then(reload)}
                >
                  {b.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && <BranchForm onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload() }} />}
    </div>
  )
}

function BranchForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const { busy, run } = useAction()
  const [form, setForm] = useState<Partial<Branch>>({ name: '', code: '', address: '', phone: '' })
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    if (!form.name?.trim() || !form.code?.trim()) return setError('Name and code are required.')
    run(() => branchService.create(form), {
      onSuccess: () => { toast.success(`${form.name} added.`); onSaved() },
      onError: setError,
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Branch"
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={busy} onClick={save}>Add</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Branch name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={error} required />
        <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
    </Modal>
  )
}
