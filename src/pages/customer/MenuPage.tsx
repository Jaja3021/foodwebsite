import { useMemo, useState } from 'react'
import { Search, UtensilsCrossed } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { menuService } from '../../services/menu'
import { favoriteService } from '../../services/customers'
import { MenuItemCard } from '../../components/customer/MenuItemCard'
import { EmptyState, ErrorState, SkeletonCard } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { MenuItem } from '../../types'

export default function MenuPage() {
  const [active, setActive] = useState('all')
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const toast = useToast()
  const customerId = user?.customer?.id

  const { data, loading, error, reload } = useLiveQuery(
    async () => {
      const [categories, items, favorites] = await Promise.all([
        menuService.listCategories({ activeOnly: true }),
        menuService.listItems(),
        customerId ? favoriteService.list(customerId) : Promise.resolve([]),
      ])
      return { categories, items, favoriteIds: new Set(favorites.map((f) => f.id)) }
    },
    ['menu_items', 'menu_categories', 'favorites'],
    [customerId],
  )

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    return items.filter((item) => {
      const matchesCategory = active === 'all' || item.category_id === active
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [data, active, search])

  const categoryName = (id: string) => data?.categories.find((c) => c.id === id)?.name

  const toggleFavorite = async (item: MenuItem) => {
    if (!customerId) {
      toast.toast('Sign in to save your favorites.', 'info')
      return
    }
    const added = await favoriteService.toggle(customerId, item.id)
    toast.success(added ? `${item.name} saved to favorites.` : `${item.name} removed from favorites.`)
    reload()
  }

  return (
    <>
      <header className="bg-ink px-5 py-14 text-center sm:px-8 md:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold">Order Now</p>
        <h1 className="font-display text-4xl font-extrabold text-cream md:text-6xl">Our Menu</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-cream/65 md:text-base">
          Every plate is cooked to order. Add what you like to the cart and check out in under a minute.
        </p>
      </header>

      <section className="sticky top-[68px] z-40 border-b border-ink/10 bg-offwhite/95 backdrop-blur-md">
        <div className="container-th flex flex-col gap-3 px-5 py-4 sm:px-8 lg:flex-row lg:items-center">
          <div className="scroll-slim -mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1">
            <CategoryPill label="All" active={active === 'all'} onClick={() => setActive('all')} />
            {data?.categories.map((c) => (
              <CategoryPill key={c.id} label={c.name} active={active === c.id} onClick={() => setActive(c.id)} />
            ))}
          </div>
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the menu…"
              aria-label="Search the menu"
              className="field pl-10"
            />
          </div>
        </div>
      </section>

      <section className="section bg-offwhite pt-10">
        <div className="container-th">
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<UtensilsCrossed className="h-10 w-10" />}
              title="Nothing matches that"
              message="Try a different category or clear your search."
            />
          ) : (
            <>
              <p className="mb-6 text-sm text-body/55">
                Showing {filtered.length} item{filtered.length === 1 ? '' : 's'}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    categoryName={categoryName(item.category_id)}
                    isFavorite={data?.favoriteIds.has(item.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
        active ? 'bg-ink text-cream shadow-soft' : 'bg-white text-body/70 ring-1 ring-ink/10 hover:bg-cream'
      }`}
    >
      {label}
    </button>
  )
}
