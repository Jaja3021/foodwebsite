import { useState } from 'react'
import { X } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { contentService, galleryService } from '../../services/content'
import { EmptyState } from '../../components/ui'

export default function GalleryPage() {
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null)

  const { data, loading } = useLiveQuery(
    async () => ({
      copy: await contentService.getSection<any>('gallery'),
      images: await galleryService.listApproved(),
    }),
    ['gallery', 'website_content'],
  )

  return (
    <>
      <header className="bg-ink px-5 py-14 text-center sm:px-8 md:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold">Gallery</p>
        <h1 className="font-display text-4xl font-extrabold text-cream md:text-6xl">
          {data?.copy?.title ?? 'Our Food Moments'}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-cream/65">{data?.copy?.description}</p>
      </header>

      <section className="section bg-offwhite">
        <div className="container-th">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton aspect-square w-full" />
              ))}
            </div>
          ) : !data?.images.length ? (
            <EmptyState title="No photos yet" message="The team has not published any gallery photos." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {data.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setLightbox({ url: img.image_url, title: img.title })}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <img
                    src={img.image_url}
                    alt={img.title}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ink/90 to-transparent p-4 text-left text-xs font-semibold text-cream transition-transform duration-300 group-hover:translate-y-0">
                    {img.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/90 p-5 animate-fadeIn"
          onClick={() => setLightbox(null)}
        >
          <button aria-label="Close" className="absolute right-5 top-5 rounded-full bg-white/10 p-2.5 text-cream transition hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>
          <figure className="max-h-full max-w-3xl animate-pop" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.title} className="max-h-[75vh] w-full rounded-3xl object-contain" />
            <figcaption className="mt-4 text-center text-sm font-semibold text-cream">{lightbox.title}</figcaption>
          </figure>
        </div>
      )}
    </>
  )
}
