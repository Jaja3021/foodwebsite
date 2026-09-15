import { useState } from 'react'
import { History, Package, Plus } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { inventoryService, inventoryStatus } from '../../services/inventory'
import { Button, EmptyState, Input, Modal, Select, SkeletonRows } from '../../components/ui'
import { InventoryStatusBadge } from '../../components/StatusBadge'
import { relativeTime } from '../../utils/format'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import type { InventoryItem, InventoryTransaction } from '../../types'

export default function AdminInventory() {
  const [adding, setAdding] = useState(false)
  const [txnItem, setTxnItem] = useState<InventoryItem | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const { data, loading, reload } = useLiveQuery(
    async () => ({
      items: await inventoryService.list(),
      transactions: await inventoryService.listTransactions(),
    }),
    ['inventory', 'inventory_transactions'],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" icon={<History className="h-4 w-4" />} onClick={() => setHistoryOpen(true)}>
          Transactions
        </Button>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>
          Add Ingredient
        </Button>
      </div>

      <section className="card overflow-hidden">
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={6} />
          </div>
        ) : !data?.items.length ? (
          <EmptyState icon={<Package className="h-10 w-10" />} title="No ingredients tracked yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-left text-[11px] uppercase tracking-wide text-body/50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ingredient</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Minimum</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {data.items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-cream/40">
                    <td className="px-4 py-3 font-semibold text-ink">{item.name}</td>
                    <td className="px-4 py-3 text-body/70">
                      {item.stock} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-body/50">
                      {item.minimum_stock} {item.unit}
                    </td>
                    <td className="px-4 py-3">
                      <InventoryStatusBadge status={inventoryStatus(item)} />
                    </td>
                    <td className="px-4 py-3 text-body/60">{item.supplier ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-body/45">{relativeTime(item.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setTxnItem(item)}>
                        Adjust Stock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {adding && (
        <IngredientForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            reload()
          }}
        />
      )}

      {txnItem && (
        <StockTransactionModal
          item={txnItem}
          onClose={() => setTxnItem(null)}
          onSaved={() => {
            setTxnItem(null)
            reload()
          }}
        />
      )}

      {historyOpen && (
        <Modal open onClose={() => setHistoryOpen(false)} title="Inventory Transactions" size="lg">
          {!data?.transactions.length ? (
            <EmptyState title="No transactions yet" />
          ) : (
            <ul className="divide-y divide-ink/8">
              {data.transactions.map((t) => {
                const item = data.items.find((i) => i.id === t.inventory_id)
                return <TransactionRow key={t.id} txn={t} itemName={item?.name ?? 'Unknown'} unit={item?.unit ?? ''} />
              })}
            </ul>
          )}
        </Modal>
      )}
    </div>
  )
}

function TransactionRow({ txn, itemName, unit }: { txn: InventoryTransaction; itemName: string; unit: string }) {
  const tone = txn.type === 'stock_in' ? 'text-emerald-600' : txn.type === 'stock_out' ? 'text-red-500' : 'text-golddark'
  const sign = txn.type === 'stock_in' ? '+' : txn.type === 'stock_out' ? '−' : '~'
  return (
    <li className="flex items-center justify-between gap-3 py-3 text-sm">
      <div>
        <p className="font-semibold text-ink">{itemName}</p>
        <p className="text-xs text-body/45">
          {txn.note ?? txn.type.replace('_', ' ')} · {relativeTime(txn.created_at)} {txn.created_by ? `· ${txn.created_by}` : ''}
        </p>
      </div>
      <span className={`font-bold ${tone}`}>
        {sign}
        {txn.quantity} {unit}
      </span>
    </li>
  )
}

function IngredientForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const { busy, run } = useAction()
  const [form, setForm] = useState({ name: '', stock: '0', unit: 'kg', minimum_stock: '5', supplier: '' })
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    if (!form.name.trim()) return setError('Please enter an ingredient name.')
    run(
      () =>
        inventoryService.create({
          name: form.name.trim(),
          stock: Number(form.stock) || 0,
          unit: form.unit,
          minimum_stock: Number(form.minimum_stock) || 0,
          supplier: form.supplier.trim() || null,
        }),
      { onSuccess: () => { toast.success(`${form.name} added to inventory.`); onSaved() }, onError: setError },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Ingredient"
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={busy} onClick={save}>Add</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Ingredient name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={error} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Starting stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <Select
            label="Unit"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            options={['kg', 'L', 'pcs', 'cans', 'bottles'].map((u) => ({ value: u, label: u }))}
          />
        </div>
        <Input label="Minimum stock" type="number" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} />
        <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
      </div>
    </Modal>
  )
}

function StockTransactionModal({
  item,
  onClose,
  onSaved,
}: {
  item: InventoryItem
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const { user } = useAuth()
  const { busy, run } = useAction()
  const [type, setType] = useState<InventoryTransaction['type']>('stock_in')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    const qty = Number(quantity)
    if (!qty || qty <= 0) return setError('Please enter a quantity greater than zero.')
    run(
      () =>
        inventoryService.recordTransaction({
          inventory_id: item.id,
          type,
          quantity: qty,
          note: note.trim() || undefined,
          created_by: user?.full_name,
        }),
      { onSuccess: () => { toast.success(`${item.name} stock updated.`); onSaved() }, onError: setError },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Adjust Stock — ${item.name}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={busy} onClick={save}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="rounded-xl bg-cream px-4 py-2.5 text-sm text-body/65">
          Current stock: <strong className="text-ink">{item.stock} {item.unit}</strong>
        </p>
        <Select
          label="Transaction type"
          value={type}
          onChange={(e) => setType(e.target.value as InventoryTransaction['type'])}
          options={[
            { value: 'stock_in', label: 'Stock In (delivery received)' },
            { value: 'stock_out', label: 'Stock Out (usage / waste)' },
            { value: 'adjustment', label: 'Adjustment (set to exact amount)' },
          ]}
        />
        <Input
          label={type === 'adjustment' ? `New stock amount (${item.unit})` : `Quantity (${item.unit})`}
          type="number"
          min={0}
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={error}
          required
        />
        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Weekly delivery, spillage, etc." />
      </div>
    </Modal>
  )
}
