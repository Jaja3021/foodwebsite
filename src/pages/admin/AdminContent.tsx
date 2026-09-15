import { useEffect, useState } from 'react'
import { Save, Upload } from 'lucide-react'
import { useLiveQuery, useAction } from '../../hooks/useLiveQuery'
import { contentService } from '../../services/content'
import { db } from '../../lib/db'
import { Button, Input, Textarea } from '../../components/ui'
import { useToast } from '../../hooks/useToast'

const TABS = ['hero', 'about', 'why_choose_us', 'reviews', 'gallery', 'location', 'footer'] as const
type Tab = (typeof TABS)[number]
const TAB_LABEL: Record<Tab, string> = {
  hero: 'Hero',
  about: 'About',
  why_choose_us: 'Why Choose Us',
  reviews: 'Reviews',
  gallery: 'Gallery',
  location: 'Location',
  footer: 'Footer',
}

export default function AdminContent() {
  const [tab, setTab] = useState<Tab>('hero')
  const { data, reload } = useLiveQuery(async () => contentService.listSections(), ['website_content'])
  const toast = useToast()
  const { busy, run } = useAction()

  const section = data?.find((s) => s.section === tab)
  const [form, setForm] = useState<Record<string, any>>({})

  useEffect(() => {
    setForm(section?.content ?? {})
  }, [section?.section, section?.updated_at]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = () =>
    run(() => contentService.updateSection(tab, form), {
      onSuccess: () => {
        toast.success(`${TAB_LABEL[tab]} section updated on the website.`)
        reload()
      },
      onError: toast.error,
    })

  return (
    <div className="space-y-5">
      <div className="scroll-slim -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              tab === t ? 'bg-ink text-cream' : 'bg-cream text-body/65 hover:bg-ink/8'
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="card p-6">
        {tab === 'hero' && <HeroForm form={form} setForm={setForm} />}
        {tab === 'about' && <AboutForm form={form} setForm={setForm} />}
        {tab === 'why_choose_us' && <WhyForm form={form} setForm={setForm} />}
        {tab === 'reviews' && <SimpleCopyForm form={form} setForm={setForm} />}
        {tab === 'gallery' && <SimpleCopyForm form={form} setForm={setForm} />}
        {tab === 'location' && <LocationForm form={form} setForm={setForm} />}
        {tab === 'footer' && <FooterForm form={form} setForm={setForm} />}

        <div className="mt-6 flex justify-end border-t border-ink/8 pt-5">
          <Button icon={<Save className="h-4 w-4" />} loading={busy} onClick={save}>
            Save & Publish
          </Button>
        </div>
      </div>
    </div>
  )
}

function ImagePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const upload = async (file: File) => {
    setUploading(true)
    try {
      onChange(await db.uploadImage(file, 'content'))
    } finally {
      setUploading(false)
    }
  }
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-4">
        <img src={value || '/images/hero.jpg'} alt="" className="h-20 w-32 rounded-xl object-cover ring-1 ring-ink/10" />
        <div className="flex-1 space-y-2">
          <label className="btn-outline btn-sm w-fit cursor-pointer">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="field text-xs" placeholder="/images/hero.jpg" />
        </div>
      </div>
    </div>
  )
}

function HeroForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Eyebrow" className="sm:col-span-2" value={form.eyebrow ?? ''} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} />
      <Input label="Title" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Input label="Primary button" value={form.primary_button ?? ''} onChange={(e) => setForm({ ...form, primary_button: e.target.value })} />
      <Textarea label="Description" className="sm:col-span-2" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <Input label="Secondary button" value={form.secondary_button ?? ''} onChange={(e) => setForm({ ...form, secondary_button: e.target.value })} />
      <ImagePicker label="Hero image" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
    </div>
  )
}

function AboutForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const highlights = form.highlights ?? []
  const setHighlight = (i: number, field: string, val: string) => {
    const next = [...highlights]
    next[i] = { ...next[i], [field]: val }
    setForm({ ...form, highlights: next })
  }
  return (
    <div className="space-y-4">
      <Input label="Title" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Textarea label="Short description" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <Textarea label="Full story" value={form.story ?? ''} onChange={(e) => setForm({ ...form, story: e.target.value })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePicker label="Image" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
        <Input label="Button text" value={form.button_text ?? ''} onChange={(e) => setForm({ ...form, button_text: e.target.value })} />
      </div>
      <div>
        <span className="label">Highlights</span>
        <div className="grid gap-3 sm:grid-cols-3">
          {highlights.map((h: any, i: number) => (
            <div key={i} className="rounded-xl bg-cream p-3 space-y-2">
              <input value={h.title} onChange={(e) => setHighlight(i, 'title', e.target.value)} className="field text-sm" placeholder="Title" />
              <input value={h.description} onChange={(e) => setHighlight(i, 'description', e.target.value)} className="field text-xs" placeholder="Description" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ICON_OPTIONS = ['UtensilsCrossed', 'Flame', 'PiggyBank', 'HeartHandshake', 'Sparkles']

function WhyForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const cards = form.cards ?? []
  const setCard = (i: number, field: string, val: string) => {
    const next = [...cards]
    next[i] = { ...next[i], [field]: val }
    setForm({ ...form, cards: next })
  }
  return (
    <div className="space-y-4">
      <Input label="Title" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Textarea label="Description" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c: any, i: number) => (
          <div key={i} className="space-y-2 rounded-xl bg-cream p-3">
            <input value={c.title} onChange={(e) => setCard(i, 'title', e.target.value)} className="field text-sm" placeholder="Card title" />
            <input value={c.description} onChange={(e) => setCard(i, 'description', e.target.value)} className="field text-xs" placeholder="Card description" />
            <select value={c.icon} onChange={(e) => setCard(i, 'icon', e.target.value)} className="field text-xs">
              {ICON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

function SimpleCopyForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  return (
    <div className="space-y-4">
      <Input label="Title" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Textarea label="Description" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    </div>
  )
}

function LocationForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Title" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Input label="Phone" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <Input label="Address" className="sm:col-span-2" value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <Input label="Email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Input label="Opening hours" value={form.opening_hours ?? ''} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} />
      <Input label="Map embed URL" className="sm:col-span-2" value={form.map_embed_url ?? ''} onChange={(e) => setForm({ ...form, map_embed_url: e.target.value })} hint="OpenStreetMap or Google Maps embed URL." />
      <Textarea label="Description" className="sm:col-span-2" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    </div>
  )
}

function FooterForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Tagline" value={form.tagline ?? ''} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
      <Input label="Facebook URL" value={form.facebook ?? ''} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
      <Input label="Instagram URL" value={form.instagram ?? ''} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
      <Input label="TikTok URL" value={form.tiktok ?? ''} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} />
      <Textarea label="Blurb" className="sm:col-span-2" value={form.blurb ?? ''} onChange={(e) => setForm({ ...form, blurb: e.target.value })} />
    </div>
  )
}
