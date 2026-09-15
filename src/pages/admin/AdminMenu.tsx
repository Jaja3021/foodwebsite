import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Star, Trash2, Upload } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { menuService } from '../../services/menu'
import { db } from '../../lib/db'
import { Badge, Button, ConfirmDialog, EmptyState, Input, Modal, Select, SkeletonRows, Textarea } from '../../components/ui'
import { peso } from '../../utils/format'
import { suggestMenuImage } from '../../utils/menuImages'
import { useToast } from '../../hooks/useToast'
import type { MenuCategory, MenuItem } from '../../types'

const BLANK = {
  name: '',
  description: '',
  category_id: '',
  price: '',
  discount_price: '',
  image_url: '/images/menu/side.jpg',
  prep_time_minutes: '15',
  available: true,
  best_seller: false,
}

export default function AdminMenu() {
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<MenuItem | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const toast = useToast()
  const { busy, run } = useAction()

  const { data, loading, reload } = useLiveQuery(
    async () => ({
      items: await menuService.listItems(),
      categories: await menuService.listCategories(),
    }),
    ['menu_items', 'menu_categories'],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.items ?? []).filter(
      (i) =>
        (categoryFilter === 'all' || i.category_id === categoryFilter) &&
        (!q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)),
    )
  }, [data, search, categoryFilter])

  const categoryName = (id: string) => data?.categories.find((c) => c.id === id)?.name ?? '—'

  const toggleField = (item: MenuItem, field: 'available' | 'best_seller') =>
    run(() => menuService.updateItem(item.id, { [field]: !item[field] }), {
      onSuccess: () => {
        toast.success(
          field === 'available'
            ? `${item.name} is now ${item.available ? 'unavailable' : 'available'}.`
            : `${item.name} ${item.best_seller ? 'removed from' : 'marked as'} best seller.`,
        )
        reload()
      },
      onError: toast.error,
    })

  return (
    <div className="space-y-5">
      <div className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items…"
            aria-label="Search menu items"
            className="field pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="field cursor-pointer lg:w-52"
        >
          <option value="all">All categories</option>
          {data?.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
          Add Menu Item
        </Button>
      </div>

      {loading ? (
        <div className="card p-5">
          <SkeletonRows rows={6} />
        </div>
      ) : !filtered.length ? (
        <EmptyState
          title="No menu items"
          message="Add your first dish and it will appear on the customer menu instantly."
          action={<Button onClick={() => setEditing('new')}>Add Menu Item</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="card flex gap-4 p-4">
              <img src={item.image_url} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-ink">{item.name}</h3>
                    <p className="text-xs text-body/45">{categoryName(item.category_id)}</p>
                  </div>
                  <div className="text-right">
                    {item.discount_price != null && (
                      <p className="text-[11px] text-body/40 line-through">{peso(item.price)}</p>
                    )}
                    <p className="font-display text-lg font-bold text-warm">
                      {peso(item.discount_price ?? item.price)}
                    </p>
                  </div>
                </div>

                <p className="mt-1 line-clamp-2 flex-1 text-xs text-body/55">{item.description}</p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <button onClick={() => toggleField(item, 'available')} disabled={busy}>
                    <Badge tone={item.available ? 'green' : 'red'}>{item.available ? 'Available' : 'Disabled'}</Badge>
                  </button>
                  <button onClick={() => toggleField(item, 'best_seller')} disabled={busy}>
                    <Badge tone={item.best_seller ? 'gold' : 'neutral'}>
                      <Star className={`h-3 w-3 ${item.best_seller ? 'fill-current' : ''}`} /> Best Seller
                    </Badge>
                  </button>
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => setEditing(item)}
                      aria-label={`Edit ${item.name}`}
                      className="rounded-lg p-1.5 text-body/50 transition hover:bg-ink/5 hover:text-ink"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(item)}
                      aria-label={`Delete ${item.name}`}
                      className="rounded-lg p-1.5 text-body/45 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <MenuItemForm
          item={editing === 'new' ? null : editing}
          categories={data?.categories ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this menu item?"
        message={`${deleting?.name} will be removed from the menu permanently. Past orders keep their record.`}
        confirmLabel="Delete item"
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          run(() => menuService.deleteItem(deleting.id), {
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

function MenuItemForm({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: MenuItem | null
  categories: MenuCategory[]
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const { busy, run } = useAction()
  const [uploading, setUploading] = useState(false)
  // Once the image has been picked explicitly (existing item, upload, or a
  // manually typed URL) stop overwriting it as the name keeps changing.
  const [imageTouched, setImageTouched] = useState(!!item)
  const [form, setForm] = useState(
    item
      ? {
          name: item.name,
          description: item.description,
          category_id: item.category_id,
          price: String(item.price),
          discount_price: item.discount_price != null ? String(item.discount_price) : '',
          image_url: item.image_url,
          prep_time_minutes: String(item.prep_time_minutes),
          available: item.available,
          best_seller: item.best_seller,
        }
      : { ...BLANK, category_id: categories[0]?.id ?? '' },
  )
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    if (!form.name.trim()) return setError('Please enter a name.')
    if (!form.category_id) return setError('Please pick a category.')
    const price = Number(form.price)
    if (!price || price <= 0) return setError('Please enter a price greater than zero.')
    const discount = form.discount_price ? Number(form.discount_price) : null
    if (discount != null && (discount <= 0 || discount >= price)) {
      return setError('The discount price must be lower than the regular price.')
    }

    const values = {
      name: form.name.trim(),
      description: form.description.trim(),
      category_id: form.category_id,
      price,
      discount_price: discount,
      image_url: form.image_url,
      prep_time_minutes: Number(form.prep_time_minutes) || 15,
      available: form.available,
      best_seller: form.best_seller,
    }

    run(() => (item ? menuService.updateItem(item.id, values) : menuService.createItem(values)), {
      onSuccess: () => {
        toast.success(item ? `${values.name} updated.` : `${values.name} added to the menu.`)
        onSaved()
      },
      onError: setError,
    })
  }

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const url = await db.uploadImage(file, 'menu')
      setForm((f) => ({ ...f, image_url: url }))
      setImageTouched(true)
      toast.success('Image uploaded.')
    } catch {
      toast.error('We could not upload that image. Please try another file.')
    } finally {
      setUploading(false)
    }
  }

  const setName = (name: string) => {
    setForm((f) => ({ ...f, name, image_url: imageTouched ? f.image_url : suggestMenuImage(name) }))
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? `Edit ${item.name}` : 'Add Menu Item'}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" loading={busy} onClick={save}>
            {item ? 'Save Changes' : 'Add Item'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          className="sm:col-span-2"
          value={form.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Classic Tapsilog"
          hint={!item ? 'The food image below is picked automatically to match this name.' : undefined}
          required
        />
        <Textarea
          label="Description"
          className="sm:col-span-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Sweet-savoury beef tapa, garlic rice and a sunny-side-up egg."
        />
        <Select
          label="Category"
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          required
        />
        <Input
          label="Preparation time (minutes)"
          type="number"
          min={1}
          value={form.prep_time_minutes}
          onChange={(e) => setForm({ ...form, prep_time_minutes: e.target.value })}
        />
        <Input
          label="Price (₱)"
          type="number"
          min={0}
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <Input
          label="Discount price (₱)"
          type="number"
          min={0}
          step="0.01"
          value={form.discount_price}
          onChange={(e) => setForm({ ...form, discount_price: e.target.value })}
          hint="Leave blank for no discount."
        />

        <div className="sm:col-span-2">
          <span className="label">Food image</span>
          <div className="flex items-center gap-4">
            <img src={form.image_url} alt="" className="h-24 w-24 rounded-xl object-cover ring-1 ring-ink/10" />
            <div className="flex-1 space-y-2">
              <label className="btn-outline btn-sm w-fit cursor-pointer">
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
              </label>
              <input
                value={form.image_url}
                onChange={(e) => {
                  setForm({ ...form, image_url: e.target.value })
                  setImageTouched(true)
                }}
                placeholder="/images/menu/tapa.jpg"
                aria-label="Image URL"
                className="field text-xs"
              />
              {!item && (
                <button
                  type="button"
                  onClick={() => {
                    setImageTouched(false)
                    setForm((f) => ({ ...f, image_url: suggestMenuImage(f.name) }))
                  }}
                  className="text-[11px] font-semibold text-warm hover:text-golddark"
                >
                  Reset to auto-matched image
                </button>
              )}
            </div>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-cream px-4 py-3">
          <input
            type="checkbox"
            checked={form.available}
            onChange={(e) => setForm({ ...form, available: e.target.checked })}
            className="h-4 w-4 rounded border-ink/25 text-gold focus:ring-gold"
          />
          <span className="text-sm font-semibold text-ink">Available to order</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-cream px-4 py-3">
          <input
            type="checkbox"
            checked={form.best_seller}
            onChange={(e) => setForm({ ...form, best_seller: e.target.checked })}
            className="h-4 w-4 rounded border-ink/25 text-gold focus:ring-gold"
          />
          <span className="text-sm font-semibold text-ink">Mark as best seller</span>
        </label>

        {error && <p className="sm:col-span-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      </div>
    </Modal>
  )
}
