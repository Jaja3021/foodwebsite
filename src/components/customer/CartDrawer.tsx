import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart, DELIVERY_FEE } from '../../hooks/useCart'
import { peso } from '../../utils/format'
import { Button, EmptyState } from '../ui'

export function CartDrawer() {
  const { lines, isOpen, closeCart, increment, decrement, remove, clear, subtotal, count } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeCart])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-fadeIn" onClick={closeCart} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-offwhite shadow-lift animate-slideIn">
        <header className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Your Order</h2>
            <p className="text-xs text-body/55">{count} item{count === 1 ? '' : 's'} in cart</p>
          </div>
          <button onClick={closeCart} aria-label="Close cart" className="rounded-full p-2 text-body/50 transition hover:bg-ink/5 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-5">
            <EmptyState
              icon={<ShoppingBag className="h-10 w-10" />}
              title="Your cart is empty"
              message="Add a silog plate or two and they will show up right here."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    closeCart()
                    navigate('/menu')
                  }}
                >
                  Browse the menu
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="scroll-slim flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {lines.map((line) => (
                <div key={line.menu_item_id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-soft ring-1 ring-ink/5">
                  <img src={line.image_url} alt={line.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{line.name}</p>
                        <p className="text-xs text-body/55">{peso(line.price)} each</p>
                      </div>
                      <button
                        onClick={() => remove(line.menu_item_id)}
                        aria-label={`Remove ${line.name}`}
                        className="rounded-lg p-1.5 text-body/40 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full bg-cream p-1">
                        <QtyButton onClick={() => decrement(line.menu_item_id)} label={`Decrease ${line.name}`}>
                          <Minus className="h-3.5 w-3.5" />
                        </QtyButton>
                        <span className="w-7 text-center text-sm font-bold text-ink">{line.quantity}</span>
                        <QtyButton onClick={() => increment(line.menu_item_id)} label={`Increase ${line.name}`}>
                          <Plus className="h-3.5 w-3.5" />
                        </QtyButton>
                      </div>
                      <p className="font-display text-base font-bold text-warm">{peso(line.price * line.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={clear}
                className="mx-auto mt-2 block text-xs font-semibold uppercase tracking-wide text-body/45 transition hover:text-red-600"
              >
                Clear cart
              </button>
            </div>

            <footer className="space-y-3 border-t border-ink/10 bg-white px-5 py-4">
              <Row label="Subtotal" value={peso(subtotal)} />
              <Row label="Delivery fee" value={`${peso(DELIVERY_FEE)} (delivery only)`} muted />
              <div className="flex items-center justify-between border-t border-dashed border-ink/15 pt-3">
                <span className="font-display text-base font-bold text-ink">Total</span>
                <span className="font-display text-2xl font-extrabold text-warm">{peso(subtotal)}</span>
              </div>
              <p className="text-[11px] text-body/50">Delivery fee and any discount are applied at checkout.</p>
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  closeCart()
                  navigate('/checkout')
                }}
              >
                Go to Checkout
              </Button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}

function QtyButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink shadow-sm transition hover:bg-gold active:scale-90"
    >
      {children}
    </button>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? 'text-body/50' : 'text-body/70'}>{label}</span>
      <span className={muted ? 'text-body/50' : 'font-semibold text-ink'}>{value}</span>
    </div>
  )
}
