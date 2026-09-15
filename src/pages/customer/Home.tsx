import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Clock,
  Flame,
  HeartHandshake,
  MapPin,
  Phone,
  PiggyBank,
  Quote,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { menuService } from '../../services/menu'
import { reviewService } from '../../services/reviews'
import { contentService, galleryService } from '../../services/content'
import { MenuItemCard } from '../../components/customer/MenuItemCard'
import { Avatar, Button, Rating, SkeletonCard } from '../../components/ui'
import { formatDate } from '../../utils/format'

const ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Flame,
  PiggyBank,
  HeartHandshake,
  Sparkles,
}

export default function Home() {
  const { data, loading } = useLiveQuery(
    async () => {
      const [hero, favoritesCopy, about, why, reviewsCopy, galleryCopy, location, items, reviews, gallery] =
        await Promise.all([
          contentService.getSection<any>('hero'),
          contentService.getSection<any>('favorites'),
          contentService.getSection<any>('about'),
          contentService.getSection<any>('why_choose_us'),
          contentService.getSection<any>('reviews'),
          contentService.getSection<any>('gallery'),
          contentService.getSection<any>('location'),
          menuService.listBestSellers(6),
          reviewService.listApproved(6),
          galleryService.listApproved(),
        ])
      return { hero, favoritesCopy, about, why, reviewsCopy, galleryCopy, location, items, reviews, gallery }
    },
    ['website_content', 'menu_items', 'reviews', 'gallery'],
  )

  return (
    <>
      <Hero content={data?.hero} />
      <Favorites copy={data?.favoritesCopy} items={data?.items ?? []} loading={loading} />
      <About content={data?.about} />
      <WhyChooseUs content={data?.why} />
      <Reviews copy={data?.reviewsCopy} reviews={data?.reviews ?? []} />
      <Gallery copy={data?.galleryCopy} images={data?.gallery ?? []} />
      <Location content={data?.location} />
    </>
  )
}

/* ---------- 1. Hero ---------- */

function Hero({ content }: { content?: any }) {
  const navigate = useNavigate()
  return (
    <section className="relative overflow-hidden bg-ink">
      <img
        src={content?.image_url ?? '/images/hero.jpg'}
        alt="Classic Filipino tapsilog on a dark wooden table"
        className="absolute inset-0 h-full w-full object-cover object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent md:hidden" />

      <div className="container-th relative px-5 py-20 sm:px-8 md:py-32 lg:py-40">
        <div className="max-w-xl animate-fadeUp">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold ring-1 ring-gold/30">
            {content?.eyebrow ?? 'GOOD FOOD. GOOD MOOD.'}
          </p>
          <h1 className="font-display text-5xl font-extrabold leading-[0.95] text-cream sm:text-6xl md:text-7xl">
            {content?.title ?? 'Tapa'} <span className="text-gold">Hey</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-cream/75 sm:text-lg">
            {content?.description ?? 'Classic Filipino tapsilog, made fresh and served with a smile.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/menu')} icon={<UtensilsCrossed className="h-5 w-5" />}>
              {content?.primary_button ?? 'Order Now'}
            </Button>
            <Button size="lg" variant="ghostLight" onClick={() => navigate('/menu')}>
              {content?.secondary_button ?? 'View Menu'}
            </Button>
          </div>

          <dl className="mt-12 flex flex-wrap gap-8">
            <Stat value="6AM–10PM" label="Open daily" />
            <Stat value="15 min" label="Average prep" />
            <Stat value="₱79+" label="Complete meals" />
          </dl>
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-2xl font-extrabold text-gold">{value}</dt>
      <dd className="text-xs font-semibold uppercase tracking-wide text-cream/50">{label}</dd>
    </div>
  )
}

/* ---------- 2. Menu favorites ---------- */

function Favorites({ copy, items, loading }: { copy?: any; items: any[]; loading: boolean }) {
  return (
    <section className="section bg-offwhite">
      <div className="container-th">
        <SectionHeading
          eyebrow="Our Menu"
          title={copy?.title ?? 'Tapsilog Favorites'}
          description={copy?.description ?? 'All-time favorite Filipino meals, cooked fresh and served hot.'}
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : items.map((item) => <MenuItemCard key={item.id} item={item} />)}
        </div>
        <div className="mt-10 text-center">
          <Link to="/menu" className="btn-outline btn-lg inline-flex">
            See the full menu <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. About ---------- */

function About({ content }: { content?: any }) {
  return (
    <section className="section bg-cream">
      <div className="container-th grid items-center gap-12 lg:grid-cols-2">
        <div className="relative">
          <img
            src={content?.image_url ?? '/images/about.jpg'}
            alt="Tapa Hey dining room"
            className="aspect-[4/3] w-full rounded-4xl object-cover shadow-lift"
          />
          <div className="absolute -bottom-6 -right-2 hidden rounded-3xl bg-gold px-6 py-5 shadow-gold sm:block lg:-right-6">
            <p className="font-display text-3xl font-extrabold text-ink">2018</p>
            <p className="text-xs font-bold uppercase tracking-wide text-ink/70">Serving since</p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-golddark">Our Story</p>
          <h2 className="font-display text-4xl font-extrabold leading-tight text-ink md:text-5xl">
            {content?.title ?? 'More Than Just Tapsilog'}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-body/70">
            {content?.description ?? 'Tapa Hey is all about serving fresh, affordable, and delicious Filipino meals for everyone.'}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-body/60">{content?.story}</p>

          <ul className="mt-8 space-y-4">
            {(content?.highlights ?? []).map((h: any) => (
              <li key={h.title} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-bold text-ink">{h.title}</p>
                  <p className="text-sm text-body/60">{h.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link to="/about" className="btn-dark btn-md mt-8 inline-flex">
            {content?.button_text ?? 'Our Story'} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- 4. Why choose us ---------- */

function WhyChooseUs({ content }: { content?: any }) {
  return (
    <section className="section bg-ink text-cream">
      <div className="container-th">
        <SectionHeading
          eyebrow="Why Tapa Hey"
          title={content?.title ?? 'The Tapa Hey Difference'}
          description={content?.description}
          light
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(content?.cards ?? []).map((card: any, i: number) => {
            const Icon = ICONS[card.icon] ?? Sparkles
            return (
              <div
                key={card.title}
                className="group rounded-3xl bg-white/5 p-7 ring-1 ring-cream/10 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/10 hover:ring-gold/40"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold text-ink transition group-hover:scale-110">
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="font-display text-lg font-bold text-cream">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/60">{card.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. Reviews ---------- */

function Reviews({ copy, reviews }: { copy?: any; reviews: any[] }) {
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  return (
    <section className="section bg-offwhite">
      <div className="container-th">
        <SectionHeading
          eyebrow="Reviews"
          title={copy?.title ?? 'What Our Customers Say'}
          description={copy?.description}
        />
        {reviews.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Rating value={average} size={20} />
            <span className="text-sm font-semibold text-body/60">
              {average.toFixed(1)} from {reviews.length} reviews
            </span>
          </div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <figure key={r.id} className="card flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-lift">
              <Quote className="h-7 w-7 text-gold/50" />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-body/75">“{r.comment}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-ink/8 pt-4">
                <Avatar name={r.customer_name} src={r.avatar_url} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{r.customer_name}</p>
                  <p className="text-xs text-body/50">{formatDate(r.created_at)}</p>
                </div>
                <Rating value={r.rating} size={14} />
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/reviews" className="btn-outline btn-md inline-flex">
            Read all reviews <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- 6. Gallery ---------- */

function Gallery({ copy, images }: { copy?: any; images: any[] }) {
  return (
    <section className="section bg-cream">
      <div className="container-th">
        <SectionHeading
          eyebrow="Gallery"
          title={copy?.title ?? 'Our Food Moments'}
          description={copy?.description}
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {images.slice(0, 8).map((img, i) => (
            <figure
              key={img.id}
              className={`group relative overflow-hidden rounded-2xl bg-white shadow-soft ${
                i === 0 ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <img
                src={img.image_url}
                alt={img.title}
                loading="lazy"
                className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                  i === 0 ? 'aspect-square' : 'aspect-square'
                }`}
              />
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ink/90 to-transparent p-4 text-xs font-semibold text-cream transition-transform duration-300 group-hover:translate-y-0">
                {img.title}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/gallery" className="btn-outline btn-md inline-flex">
            View the gallery <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- 7. Location ---------- */

function Location({ content }: { content?: any }) {
  return (
    <section className="section bg-offwhite">
      <div className="container-th">
        <SectionHeading eyebrow="Visit" title={content?.title ?? 'Find Us'} description={content?.description} />
        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <InfoCard icon={<MapPin className="h-5 w-5" />} title="Address">
              {content?.address ?? '123 Food Street, Brgy. San Isidro, Quezon City'}
            </InfoCard>
            <InfoCard icon={<Phone className="h-5 w-5" />} title="Phone">
              <a href={`tel:${content?.phone ?? ''}`} className="transition hover:text-warm">
                {content?.phone ?? '+63 917 555 0199'}
              </a>
            </InfoCard>
            <InfoCard icon={<Clock className="h-5 w-5" />} title="Opening Hours">
              {content?.opening_hours ?? '6:00 AM – 10:00 PM, daily'}
            </InfoCard>
            <Link to="/reservations" className="btn-gold btn-md w-full">
              Reserve a Table
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl shadow-lift ring-1 ring-ink/10 lg:col-span-3">
            <iframe
              title="Tapa Hey location map"
              src={content?.map_embed_url}
              className="h-full min-h-[340px] w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card flex gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-golddark">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-body/45">{title}</p>
        <p className="mt-1 text-sm font-medium leading-relaxed text-body/80">{children}</p>
      </div>
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
  align = 'center',
}: {
  eyebrow?: string
  title: string
  description?: string
  light?: boolean
  align?: 'center' | 'left'
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && (
        <p className={`mb-3 text-xs font-bold uppercase tracking-[0.2em] ${light ? 'text-gold' : 'text-golddark'}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`font-display text-4xl font-extrabold leading-tight md:text-5xl ${light ? 'text-cream' : 'text-ink'}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-base leading-relaxed ${light ? 'text-cream/65' : 'text-body/65'}`}>{description}</p>
      )}
    </div>
  )
}
