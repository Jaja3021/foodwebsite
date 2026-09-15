import { useEffect, useState } from 'react'
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, XCircle, Ban } from 'lucide-react'
import type { Order, PaymentMethod } from '../../types'
import { paymentService, isDemoMode, type DemoScenario } from '../../services/payment'
import { peso, PAYMENT_METHOD_LABEL } from '../../utils/format'
import { Button } from '../ui'

type Phase = 'choose' | 'processing' | 'success' | 'failed' | 'cancelled'

interface Props {
  order: Order
  method: PaymentMethod
  onSuccess: (orderId: string) => void
  onRetry: () => void
  onCancel: () => void
}

/**
 * Test-mode payment surface. No card data is collected and no real money moves —
 * the scenario picker drives a simulated authorisation against the payments table.
 */
export function PaymentModal({ order, method, onSuccess, onRetry, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('choose')
  const [message, setMessage] = useState('')
  const [reference, setReference] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'choose') onCancel()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [phase, onCancel])

  const run = async (scenario: DemoScenario) => {
    setPhase('processing')
    try {
      const result = await paymentService.process({ order, method, scenario })
      setMessage(result.message)
      setReference(result.payment.transaction_reference)
      if (result.status === 'paid' || result.status === 'pending') {
        setPhase('success')
        setTimeout(() => onSuccess(order.id), 1100)
      } else if (result.status === 'failed') {
        setPhase('failed')
      } else {
        setPhase('cancelled')
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Your payment could not be completed. Please try again.')
      setPhase('failed')
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm animate-fadeIn" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-offwhite shadow-lift animate-pop sm:rounded-3xl"
      >
        <header className="bg-ink px-6 py-5 text-cream">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-gold" />
              <span className="font-display text-lg font-bold">Secure Checkout</span>
            </div>
            <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">
              {isDemoMode ? 'Demo / Test' : 'Stripe Test'}
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-cream/50">Amount due</p>
              <p className="font-display text-3xl font-extrabold text-gold">{peso(order.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-cream/50">Order</p>
              <p className="text-sm font-bold">{order.order_number}</p>
            </div>
          </div>
        </header>

        <div className="px-6 py-6">
          {phase === 'choose' && (
            <>
              <div className="mb-5 flex items-center gap-3 rounded-2xl bg-cream p-4">
                <CreditCard className="h-5 w-5 shrink-0 text-golddark" />
                <div className="text-sm">
                  <p className="font-bold text-ink">Paying with {PAYMENT_METHOD_LABEL[method]}</p>
                  <p className="text-xs text-body/60">
                    {method === 'cash'
                      ? 'Your order is confirmed now; you pay on hand-over.'
                      : 'No real card is charged in this demo build.'}
                  </p>
                </div>
              </div>

              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-body/50">
                Choose a test scenario
              </p>
              <div className="space-y-2.5">
                <ScenarioButton
                  tone="success"
                  title="Successful Payment"
                  description={method === 'cash' ? 'Confirm the order for cash on hand-over' : 'Authorise and capture the amount'}
                  onClick={() => run('success')}
                />
                <ScenarioButton
                  tone="failed"
                  title="Failed Payment"
                  description="Simulate a declined transaction"
                  onClick={() => run('failure')}
                />
                <ScenarioButton
                  tone="cancelled"
                  title="Cancelled Payment"
                  description="Simulate the customer backing out"
                  onClick={() => run('cancel')}
                />
              </div>

              <button
                onClick={onCancel}
                className="mx-auto mt-5 block text-xs font-semibold uppercase tracking-wide text-body/45 transition hover:text-body"
              >
                Back to checkout
              </button>
            </>
          )}

          {phase === 'processing' && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="relative">
                <Loader2 className="h-14 w-14 animate-spin text-gold" />
              </div>
              <p className="mt-6 font-display text-xl font-bold text-ink">Processing your payment…</p>
              <p className="mt-1.5 text-sm text-body/55">Please wait. Do not close this window.</p>
            </div>
          )}

          {phase === 'success' && (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 animate-pop">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </span>
              <p className="mt-5 font-display text-xl font-bold text-ink">Payment Successful</p>
              <p className="mt-1.5 text-sm text-body/60">{message}</p>
              <p className="mt-3 rounded-full bg-cream px-3 py-1 font-mono text-[11px] text-body/60">{reference}</p>
            </div>
          )}

          {phase === 'failed' && (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-9 w-9 text-red-600" />
              </span>
              <p className="mt-5 font-display text-xl font-bold text-ink">Payment Failed</p>
              <p className="mt-1.5 max-w-xs text-sm text-body/60">{message}</p>
              <p className="mt-2 text-xs text-body/45">Your order was not charged and is still waiting for payment.</p>
              <div className="mt-6 flex w-full gap-3">
                <Button variant="outline" className="flex-1" onClick={onCancel}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setPhase('choose')}>
                  Retry Payment
                </Button>
              </div>
            </div>
          )}

          {phase === 'cancelled' && (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/8">
                <Ban className="h-9 w-9 text-body/50" />
              </span>
              <p className="mt-5 font-display text-xl font-bold text-ink">Payment Cancelled</p>
              <p className="mt-1.5 max-w-xs text-sm text-body/60">{message}</p>
              <div className="mt-6 flex w-full gap-3">
                <Button variant="outline" className="flex-1" onClick={onRetry}>
                  Return to Checkout
                </Button>
                <Button className="flex-1" onClick={() => setPhase('choose')}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-ink/10 bg-white px-6 py-3 text-center text-[11px] text-body/45">
          🟡 Demo mode — this transaction is simulated. No real money is charged.
        </footer>
      </div>
    </div>
  )
}

function ScenarioButton({
  tone,
  title,
  description,
  onClick,
}: {
  tone: 'success' | 'failed' | 'cancelled'
  title: string
  description: string
  onClick: () => void
}) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 hover:border-emerald-400 text-emerald-700',
    failed: 'border-red-200 bg-red-50 hover:border-red-400 text-red-700',
    cancelled: 'border-ink/15 bg-white hover:border-ink/35 text-body/70',
  }
  const icons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    failed: <XCircle className="h-5 w-5" />,
    cancelled: <Ban className="h-5 w-5" />,
  }
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition active:scale-[0.99] ${styles[tone]}`}
    >
      {icons[tone]}
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs opacity-75">{description}</span>
      </span>
    </button>
  )
}
