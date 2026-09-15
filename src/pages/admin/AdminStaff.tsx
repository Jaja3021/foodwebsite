import { useState } from 'react'
import { Plus, Shield, Trash2, UserCog } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { staffService, STAFF_ROLE_LABEL } from '../../services/staff'
import { Avatar, Badge, Button, ConfirmDialog, EmptyState, Input, Modal, Select, SkeletonRows } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_PERMISSIONS } from '../../lib/auth'
import type { Staff, StaffRole } from '../../types'

const ROLES: StaffRole[] = ['super_admin', 'manager', 'cashier', 'kitchen', 'content_manager']

export default function AdminStaff() {
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<Staff | null>(null)
  const toast = useToast()
  const { user } = useAuth()
  const { busy, run } = useAction()

  const { data, loading, reload } = useLiveQuery(async () => staffService.list(), ['staff'])

  const toggleActive = (s: Staff) =>
    run(() => staffService.update(s.id, { active: !s.active }), {
      onSuccess: () => {
        toast.success(`${s.full_name} ${s.active ? 'deactivated' : 'activated'}.`)
        reload()
      },
      onError: toast.error,
    })

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>
          Add Staff Member
        </Button>
      </div>

      {loading ? (
        <div className="card p-5">
          <SkeletonRows rows={5} />
        </div>
      ) : !data?.length ? (
        <EmptyState icon={<UserCog className="h-10 w-10" />} title="No staff members yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => (
            <article key={s.id} className="card p-5">
              <div className="flex items-start gap-3">
                <Avatar name={s.full_name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{s.full_name}</p>
                  <p className="truncate text-xs text-body/50">{s.email}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone="gold">
                  <Shield className="h-3 w-3" /> {STAFF_ROLE_LABEL[s.role]}
                </Badge>
                <Badge tone={s.active ? 'green' : 'neutral'}>{s.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-body/50">
                Access: {ROLE_PERMISSIONS[s.role].join(', ')}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleActive(s)} disabled={s.id === user?.staff?.id}>
                  {s.active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button size="sm" variant="danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setDeleting(s)} disabled={s.id === user?.staff?.id}>
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {adding && (
        <StaffForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            reload()
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Remove this staff member?"
        message={`${deleting?.full_name} will lose access to the admin dashboard.`}
        confirmLabel="Remove"
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          run(() => staffService.remove(deleting.id), {
            onSuccess: () => {
              toast.success(`${deleting.full_name} removed.`)
              setDeleting(null)
              reload()
            },
            onError: toast.error,
          })
        }
      />
    </div>
  )
}

function StaffForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const { busy, run } = useAction()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: 'cashier' as StaffRole, password: 'DemoStaff123!' })
  const [error, setError] = useState<string | null>(null)

  const save = () =>
    run(() => staffService.create(form), {
      onSuccess: () => {
        toast.success(`${form.full_name} added as ${STAFF_ROLE_LABEL[form.role]}.`)
        onSaved()
      },
      onError: setError,
    })

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Staff Member"
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={busy} onClick={save}>Add Staff</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={error} required />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
          options={ROLES.map((r) => ({ value: r, label: STAFF_ROLE_LABEL[r] }))}
        />
        <Input
          label="Temporary password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          hint="Share this with the staff member so they can sign in."
        />
      </div>
    </Modal>
  )
}
