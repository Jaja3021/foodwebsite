import { useState } from 'react'
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { menuService } from '../../services/menu'
import { Badge, Button, ConfirmDialog, EmptyState, Input, Modal, SkeletonRows, Textarea } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import type { MenuCategory } from '../../types'

export default function AdminCategories() {
  const [editing, setEditing] = useState<MenuCategory | 'new' | null>(null)
  const [deleting, setDeleting] = useState<MenuCategory | null>(null)
  const toast = useToast()
  const { busy, run } = useAction()

  const { data, loading, reload } = useLiveQuery(
    async () => {
      const categories = await menuService.listCategories()
      const items = await menuService.listItems()
      return { categories, items }
    },
    ['menu_categories', 'menu_items'],
  )

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
          Add Category
        </Button>
      </div>

      <section className="card overflow-hidden">
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={5} />
          </div>
        ) : !data?.categories.length ? (
          <EmptyState title="No categories yet" message="Create a category before adding menu items." />
        ) : (
          <ul className="divide-y divide-ink/6">
            {data.categories.map((c) => {
              const count = data.items.filter((i) => i.category_id === c.id).length
              return (
                <li key={c.id} className="flex items-center gap-3 px-5 py-4">
                  <GripVertical className="h-4 w-4 shrink-0 text-body/30" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-ink">{c.name}</p>
                      {!c.active && <Badge tone="neutral">Hidden</Badge>}
                    </div>
                    <p className="truncate text-xs text-body/50">{c.description}</p>
                  </div>
                  <Badge tone="gold">{count} items</Badge>
                  <button
                    onClick={() => setEditing(c)}
                    aria-label={`Edit ${c.name}`}
                    className="rounded-lg p-2 text-body/50 transition hover:bg-ink/5 hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(c)}
                    aria-label={`Delete ${c.name}`}
                    className="rounded-lg p-2 text-body/45 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {editing && (
        <CategoryForm
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this category?"
        message={`${deleting?.name} will be removed. This only works if no menu items use it.`}
        confirmLabel="Delete category"
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          run(() => menuService.deleteCategory(deleting.id), {
            onSuccess: () => {
              toast.success(`${deleting.name} deleted.`)
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

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: MenuCategory | null
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const { busy, run } = useAction()
  const [form, setForm] = useState({
    name: category?.name ?? '',
    description: category?.description ?? '',
    active: category?.active ?? true,
  })
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    if (!form.name.trim()) return setError('Please enter a category name.')
    run(
      () =>
        category
          ? menuService.updateCategory(category.id, form)
          : menuService.createCategory({ ...form, sort_order: 99 }),
      {
        onSuccess: () => {
          toast.success(category ? 'Category updated.' : 'Category added.')
          onSaved()
        },
        onError: setError,
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? `Edit ${category.name}` : 'Add Category'}
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
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          error={error}
        />
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-cream px-4 py-3">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="h-4 w-4 rounded border-ink/25 text-gold focus:ring-gold"
          />
          <span className="text-sm font-semibold text-ink">Visible on the customer menu</span>
        </label>
      </div>
    </Modal>
  )
}
