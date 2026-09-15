import { useState } from 'react'
import { Gift, History } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { loyaltyService, POINTS_PER_PESO, PESO_PER_POINT } from '../../services/loyalty'
import { Badge, Button, EmptyState, Input, Modal, SkeletonRows } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { relativeTime } from '../../utils/format'

export default function AdminLoyalty() {
  const [redeeming, setRedeeming] = useState<{ id: string; name: string; balance: number } | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const toast = useToast()

  const { data, loading, reload } = useLiveQuery(
    async () => ({
      accounts: await loyaltyService.withCustomers(),
      transactions: await loyaltyService.listTransactions(),
    }),
    ['loyalty_accounts', 'loyalty_transactions'],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-body/60">
          Earn rate: <strong className="text-ink">₱100 spent = {(100 * POINTS_PER_PESO).toFixed(0)} pt</strong> · Redeem rate:{' '}
          <strong className="text-ink">100 pts = ₱{(100 * PESO_PER_POINT).toFixed(0)}</strong>
        </p>
        <Button variant="outline" icon={<History className="h-4 w-4" />} onClick={() => setHistoryOpen(true)}>
          Transaction history
        </Button>
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : !data?.accounts.length ? (
        <EmptyState icon={<Gift className="h-10 w-10" />} title="No loyalty members yet" message="Accounts are created automatically the first time a signed-in customer completes an order." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream/60 text-left text-[11px] uppercase tracking-wide text-body/50">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Lifetime</th>
                <th className="px-4 py-3">Reward value</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/6">
              {data.accounts.map((a) => (
                <tr key={a.id} className="hover:bg-cream/40">
                  <td className="px-4 py-3 font-semibold text-ink">{a.customer?.full_name}</td>
                  <td className="px-4 py-3"><Badge tone="gold">{a.points_balance} pts</Badge></td>
                  <td className="px-4 py-3 text-body/60">{a.lifetime_points} pts</td>
                  <td className="px-4 py-3 text-body/60">₱{(a.points_balance * PESO_PER_POINT).toFixed(0)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={a.points_balance <= 0}
                      onClick={() => setRedeeming({ id: a.id, name: a.customer?.full_name ?? '', balance: a.points_balance })}
                    >
                      Redeem
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {redeeming && (
        <RedeemModal
          account={redeeming}
          onClose={() => setRedeeming(null)}
          onSaved={() => { setRedeeming(null); toast.success('Points redeemed.'); reload() }}
        />
      )}

      {historyOpen && (
        <Modal open onClose={() => setHistoryOpen(false)} title="Loyalty Transaction History" size="lg">
          {!data?.transactions.length ? (
            <EmptyState title="No transactions yet" />
          ) : (
            <ul className="divide-y divide-ink/8">
              {data.transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{t.note}</p>
                    <p className="text-xs text-body/45">{relativeTime(t.created_at)}</p>
                  </div>
                  <span className={`font-bold ${t.points >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.points >= 0 ? '+' : ''}{t.points} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  )
}

function RedeemModal({
  account,
  onClose,
  onSaved,
}: {
  account: { id: string; name: string; balance: number }
  onClose: () => void
  onSaved: () => void
}) {
  const { busy, run } = useAction()
  const [points, setPoints] = useState(String(Math.min(100, account.balance)))
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    const n = Number(points)
    if (!n || n <= 0) return setError('Enter a valid number of points.')
    run(() => loyaltyService.redeem(account.id, n), { onSuccess: onSaved, onError: setError })
  }

  return (
    <Modal open onClose={onClose} title={`Redeem Points — ${account.name}`} size="sm" footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} onClick={save}>Redeem</Button></>}>
      <div className="space-y-3">
        <p className="text-sm text-body/60">Available balance: <strong className="text-ink">{account.balance} pts</strong></p>
        <Input label="Points to redeem" type="number" value={points} onChange={(e) => setPoints(e.target.value)} error={error} />
        <p className="text-xs text-body/50">≈ ₱{((Number(points) || 0) * PESO_PER_POINT).toFixed(0)} reward value</p>
      </div>
    </Modal>
  )
}
