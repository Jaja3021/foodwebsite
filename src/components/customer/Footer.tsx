import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone, Clock } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { contentService } from '../../services/content'

const QUICK_LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
]

export function Footer() {
  const { data } = useLiveQuery(
    async () => ({
      footer: await contentService.getSection<{ tagline: string; blurb: string; facebook: string; instagram: string; tiktok: string }>('footer'),
      location: await contentService.getSection<{ address: string; phone: string; email: string; opening_hours: string }>('location'),
    }),
    ['website_content'],
  )

  const footer = data?.footer
  const location = data?.location

  return (
    <footer className="bg-ink text-cream">
      <div className="container-th grid gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Tapa Hey" className="h-14 w-14" />
            <div>
              <p className="font-display text-2xl font-extrabold">
                Tapa <span className="text-gold">Hey</span>
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                {footer?.tagline ?? 'Good Food. Good Mood.'}
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
            {footer?.blurb ?? 'Serving fresh, affordable Filipino breakfast plates in Quezon City since 2018.'}
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gold">Quick Links</h4>
          <ul className="grid grid-cols-2 gap-y-2.5 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-cream/70 transition hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gold">Visit Us</h4>
          <ul className="space-y-3 text-sm text-cream/70">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>{location?.address ?? '123 Food Street, Brgy. San Isidro, Quezon City'}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <a href={`tel:${location?.phone ?? ''}`} className="transition hover:text-gold">
                {location?.phone ?? '+63 917 555 0199'}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <a href={`mailto:${location?.email ?? ''}`} className="transition hover:text-gold">
                {location?.email ?? 'hello@tapahey.demo'}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>{location?.opening_hours ?? '6:00 AM – 10:00 PM, daily'}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gold">Follow Along</h4>
          <div className="flex gap-3">
            <Social href={footer?.facebook ?? '#'} label="Facebook">
              <span className="text-sm font-bold">FB</span>
            </Social>
            <Social href={footer?.instagram ?? '#'} label="Instagram">
              <span className="text-sm font-bold">IG</span>
            </Social>
            <Social href={footer?.tiktok ?? '#'} label="TikTok">
              <span className="text-sm font-bold">TT</span>
            </Social>
          </div>
          <Link
            to="/admin/login"
            className="mt-6 inline-block text-xs font-semibold uppercase tracking-wide text-cream/40 transition hover:text-gold"
          >
            Staff Login →
          </Link>
        </div>
      </div>

      <div className="border-t border-cream/10 px-5 py-5 text-center text-xs text-cream/45 sm:px-8">
        © {new Date().getFullYear()} Tapa Hey Restaurant Management System. Demo build — no real transactions are processed.
      </div>
    </footer>
  )
}

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-gold hover:text-ink"
    >
      {children}
    </a>
  )
}
