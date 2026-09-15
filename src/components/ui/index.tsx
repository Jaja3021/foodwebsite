import {
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Star, X } from 'lucide-react'
import { initials } from '../../utils/format'

/* ---------- Button ---------- */

type Variant = 'gold' | 'dark' | 'outline' | 'ghostLight' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  gold: 'btn-gold',
  dark: 'btn-dark',
  outline: 'btn-outline',
  ghostLight: 'btn-ghost-light',
  danger: 'btn bg-red-600 text-white hover:bg-red-700 active:scale-[0.97]',
}
const SIZES: Record<Size, string> = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' }

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'gold',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

/* ---------- Form fields ---------- */

interface FieldWrapProps {
  label?: string
  error?: string | null
  hint?: string
  required?: boolean
  children: ReactNode
}

function FieldWrap({ label, error, hint, required, children }: FieldWrapProps) {
  return (
    <label className="block">
      {label && (
        <span className="label">
          {label}
          {required && <span className="ml-1 text-gold">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-body/50">{hint}</span>
      ) : null}
    </label>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | null
  hint?: string
}

export function Input({ label, error, hint, className = '', ...rest }: InputProps) {
  return (
    <FieldWrap label={label} error={error} hint={hint} required={rest.required}>
      <input
        {...rest}
        className={`field ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''} ${className}`}
      />
    </FieldWrap>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string | null
  hint?: string
}

export function Textarea({ label, error, hint, className = '', ...rest }: TextareaProps) {
  return (
    <FieldWrap label={label} error={error} hint={hint} required={rest.required}>
      <textarea {...rest} className={`field min-h-[96px] resize-y ${className}`} />
    </FieldWrap>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string | null
  hint?: string
  options: Array<{ value: string; label: string }>
}

export function Select({ label, error, hint, options, className = '', ...rest }: SelectProps) {
  return (
    <FieldWrap label={label} error={error} hint={hint} required={rest.required}>
      <select {...rest} className={`field cursor-pointer ${className}`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  )
}

/* ---------- Modal ---------- */

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[92vh] w-full ${widths[size]} flex-col overflow-hidden rounded-t-3xl bg-offwhite shadow-lift animate-pop sm:rounded-3xl`}
      >
        {title && (
          <header className="flex items-center justify-between gap-4 border-b border-ink/10 px-6 py-4">
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-body/50 transition hover:bg-ink/5 hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          </header>
        )}
        <div className="scroll-slim flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-ink/10 bg-white px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
  loading,
  onCancel,
  onConfirm,
}: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'gold'} size="sm" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-body/80">{message}</p>
    </Modal>
  )
}

/* ---------- Feedback / state ---------- */

export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-gold ${className}`} />
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-body/60">
      <Spinner className="h-7 w-7" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14 w-full" />
      ))}
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  message?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 bg-white/60 px-6 py-14 text-center">
      {icon && <div className="text-gold">{icon}</div>}
      <h4 className="text-base font-bold text-ink">{title}</h4>
      {message && <p className="max-w-sm text-sm text-body/60">{message}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      title="We hit a snag"
      message={message}
      action={onRetry ? <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button> : undefined}
    />
  )
}

/* ---------- Display ---------- */

const BADGE_TONES: Record<string, string> = {
  neutral: 'bg-ink/8 text-body/70',
  gold: 'bg-gold/20 text-warm',
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-sky-100 text-sky-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode
  tone?: keyof typeof BADGE_TONES
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function Rating({ value, size = 16, className = '' }: { value: number; size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= Math.round(value) ? 'fill-gold text-gold' : 'fill-transparent text-ink/20'}
        />
      ))}
    </div>
  )
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-warm font-display font-bold text-cream"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  )
}

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          onClick={() => onChange(i)}
          className="transition hover:scale-110"
        >
          <Star className={`h-7 w-7 ${i <= value ? 'fill-gold text-gold' : 'fill-transparent text-ink/25'}`} />
        </button>
      ))}
    </div>
  )
}
