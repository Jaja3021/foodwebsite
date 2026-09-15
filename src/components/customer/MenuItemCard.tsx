import { useState } from 'react'
import { Minus, Plus, ShoppingBag, Check, Heart } from 'lucide-react'
import type { MenuItem } from '../../types'
import { peso } from '../../utils/format'
import { useCart } from '../../hooks/useCart'
import { Badge, Button } from '../ui'

interface Props {
  item: MenuItem
  categoryName?: string
  isFavorite?: boolean
  onToggleFavorite?: (item: MenuItem) => void
}

export function MenuItemCard({ item, categoryName, isFavorite, onToggleFavorite }: Props) {
  const { add, lastAdded } = useCart()
  const [qty, setQty] = useState(1)
  const justAdded = lastAdded === item.id
  const hasDiscount = item.discount_price != null && item.discount_price < item.price
  const price = item.discount_price ?? item.price

  return (
    <article className="group card flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-cream">
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            item.available ? '' : 'opacity-45 grayscale'
          }`}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {item.best_seller && <Badge tone="gold">⭐ Best Seller</Badge>}
          {hasDiscount && <Badge tone="red">Save {peso(item.price - price)}</Badge>}
        </div>
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/45">
            <span className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream">
              Sold Out
            </span>
          </div>
        )}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(item)}
            aria-label={isFavorite ? `Remove ${item.name} from favorites` : `Save ${item.name} to favorites`}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-body/60 shadow-sm backdrop-blur transition hover:text-red-500"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold leading-tight text-ink">{item.name}</h3>
          <div className="shrink-0 text-right">
            {hasDiscount && <p className="text-xs text-body/40 line-through">{peso(item.price)}</p>}
            <p className="font-display text-xl font-extrabold text-warm">{peso(price)}</p>
          </div>
        </div>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-body/60">{item.description}</p>

        <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-body/45">
          {categoryName && <span>{categoryName}</span>}
          {categoryName && <span className="text-body/25">·</span>}
          <span>{item.prep_time_minutes} min</span>
          <span className="text-body/25">·</span>
          <span className={item.available ? 'text-emerald-600' : 'text-red-500'}>
            {item.available ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-cream p-1">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={!item.available}
              aria-label="Decrease quantity"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink shadow-sm transition hover:bg-gold disabled:opacity-40 active:scale-90"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-ink">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              disabled={!item.available}
              aria-label="Increase quantity"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink shadow-sm transition hover:bg-gold disabled:opacity-40 active:scale-90"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            size="sm"
            className="flex-1"
            disabled={!item.available}
            variant={justAdded ? 'dark' : 'gold'}
            icon={justAdded ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            onClick={() => {
              add(item, qty)
              setQty(1)
            }}
          >
            {justAdded ? 'Added' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </article>
  )
}
