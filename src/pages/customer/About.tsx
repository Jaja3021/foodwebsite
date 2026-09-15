import { Link } from 'react-router-dom'
import { Flame, HeartHandshake, PiggyBank, Sparkles, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { contentService } from '../../services/content'
import { SectionHeading } from './Home'

const ICONS: Record<string, LucideIcon> = { UtensilsCrossed, Flame, PiggyBank, HeartHandshake, Sparkles }

export default function About() {
  const { data } = useLiveQuery(
    async () => ({
      about: await contentService.getSection<any>('about'),
      why: await contentService.getSection<any>('why_choose_us'),
    }),
    ['website_content'],
  )

  const about = data?.about
  const why = data?.why

  return (
    <>
      <header className="bg-ink px-5 py-14 text-center sm:px-8 md:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold">Our Story</p>
        <h1 className="font-display text-4xl font-extrabold text-cream md:text-6xl">
          {about?.title ?? 'More Than Just Tapsilog'}
        </h1>
      </header>

      <section className="section bg-offwhite">
        <div className="container-th grid items-center gap-12 lg:grid-cols-2">
          <img
            src={about?.image_url ?? '/images/about.jpg'}
            alt="Tapa Hey"
            className="aspect-[4/3] w-full rounded-4xl object-cover shadow-lift"
          />
          <div>
            <p className="text-lg font-semibold leading-relaxed text-ink">{about?.description}</p>
            <p className="mt-5 text-sm leading-relaxed text-body/65">{about?.story}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {(about?.highlights ?? []).map((h: any) => (
                <div key={h.title} className="rounded-2xl bg-cream p-5">
                  <Sparkles className="mb-2 h-5 w-5 text-golddark" />
                  <p className="text-sm font-bold text-ink">{h.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-body/60">{h.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-cream">
        <div className="container-th">
          <SectionHeading eyebrow="Why Tapa Hey" title={why?.title ?? 'The Tapa Hey Difference'} description={why?.description} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(why?.cards ?? []).map((card: any) => {
              const Icon = ICONS[card.icon] ?? Sparkles
              return (
                <div key={card.title} className="card p-7 transition hover:-translate-y-1.5 hover:shadow-lift">
                  <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold text-ink">
                    <Icon className="h-7 w-7" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-ink">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-body/60">{card.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-ink px-5 py-16 text-center sm:px-8">
        <div className="container-th">
          <h2 className="font-display text-3xl font-extrabold text-cream md:text-4xl">Hungry yet?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-cream/65">
            Order online for delivery, takeout, or reserve a table for the barkada.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/menu" className="btn-gold btn-lg">
              Order Now
            </Link>
            <Link to="/reservations" className="btn-ghost-light btn-lg">
              Reserve a Table
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
