import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { galleryService } from '../../services/content'
import { ConfirmDialog, EmptyState, Input, SkeletonCard } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import type { GalleryImage } from '../../types'

export default function AdminGallery() {
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [deleting, setDeleting] = useState<GalleryImage | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const { busy, run } = useAction()

  const { data, loading, reload } = useLiveQuery(async () => galleryService.listAll(), ['gallery'])

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      await galleryService.upload(file, title)
      toast.success('Photo uploaded to the gallery.')
      setTitle('')
      reload()
    } catch {
      toast.error('We could not upload that image.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const move = (id: string, dir: -1 | 1) =>
    run(() => galleryService.move(id, dir), { onSuccess: reload })

  const toggleApproved = (img: GalleryImage) =>
    run(() => galleryService.update(img.id, { approved: !img.approved }), {
      onSuccess: () => {
        toast.success(img.approved ? 'Hidden from the website.' : 'Now visible on the website.')
        reload()
      },
    })

  return (
    <div className="space-y-5">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <Input
          label="Photo title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Golden hour at Tapa Hey"
          className="flex-1"
        />
        <label className="btn-gold btn-md w-fit cursor-pointer">
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading…' : 'Upload Image'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !data?.length ? (
        <EmptyState icon={<ImageIcon className="h-10 w-10" />} title="No photos yet" message="Upload the first gallery photo above." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((img, i) => (
            <article key={img.id} className="card overflow-hidden">
              <div className="relative aspect-square">
                <img src={img.image_url} alt={img.title} className={`h-full w-full object-cover ${!img.approved ? 'opacity-40 grayscale' : ''}`} />
                {!img.approved && (
                  <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase text-cream">Hidden</span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-ink">{img.title}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex gap-1">
                    <IconBtn label="Move left" onClick={() => move(img.id, -1)} disabled={i === 0 || busy}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn label="Move right" onClick={() => move(img.id, 1)} disabled={i === data.length - 1 || busy}>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                  <div className="flex gap-1">
                    <IconBtn label={img.approved ? 'Hide' : 'Show'} onClick={() => toggleApproved(img)} disabled={busy}>
                      {img.approved ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </IconBtn>
                    <IconBtn label="Delete" danger onClick={() => setDeleting(img)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this photo?"
        message={`"${deleting?.title}" will be removed from the gallery.`}
        confirmLabel="Delete photo"
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          run(() => galleryService.remove(deleting.id), {
            onSuccess: () => {
              toast.success('Photo deleted.')
              setDeleting(null)
              reload()
            },
          })
        }
      />
    </div>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded-lg p-1.5 transition disabled:opacity-30 ${
        danger ? 'text-body/45 hover:bg-red-50 hover:text-red-600' : 'text-body/50 hover:bg-ink/5 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
