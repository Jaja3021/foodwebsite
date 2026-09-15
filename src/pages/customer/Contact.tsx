import { useState } from 'react'
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { contentService } from '../../services/content'
import { notificationService } from '../../services/notifications'
import { Button, Input, Textarea } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { isValidEmail } from '../../utils/format'

export default function Contact() {
  const { data } = useLiveQuery(async () => contentService.getSection<any>('location'), ['website_content'])
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'Please enter your name.'
    if (!isValidEmail(form.email)) next.email = 'Please enter a valid email address.'
    if (form.message.trim().length < 10) next.message = 'Please write at least 10 characters.'
    setErrors(next)
    if (Object.keys(next).length) return

    setSending(true)
    try {
      await notificationService.create({
        type: 'review',
        title: 'New contact message',
        message: `${form.name} (${form.email}): ${form.message.slice(0, 140)}`,
      })
      toast.success('Thanks for reaching out! The team will reply shortly.')
      setForm({ name: '', email: '', message: '' })
    } catch {
      toast.error('We could not send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <header className="bg-ink px-5 py-14 text-center sm:px-8 md:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold">Contact</p>
        <h1 className="font-display text-4xl font-extrabold text-cream md:text-6xl">Find Us</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-cream/65">
          Questions, catering, or feedback — we would love to hear from you.
        </p>
      </header>

      <section className="section bg-offwhite">
        <div className="container-th grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <Info icon={<MapPin className="h-5 w-5" />} title="Address" value={data?.address ?? ''} />
            <Info icon={<Phone className="h-5 w-5" />} title="Phone" value={data?.phone ?? ''} href={`tel:${data?.phone}`} />
            <Info icon={<Mail className="h-5 w-5" />} title="Email" value={data?.email ?? ''} href={`mailto:${data?.email}`} />
            <Info icon={<Clock className="h-5 w-5" />} title="Opening Hours" value={data?.opening_hours ?? ''} />

            <div className="overflow-hidden rounded-3xl shadow-lift ring-1 ring-ink/10">
              <iframe
                title="Tapa Hey location map"
                src={data?.map_embed_url}
                className="h-[280px] w-full border-0"
                loading="lazy"
              />
            </div>
          </div>

          <form onSubmit={submit} className="card h-fit space-y-4 p-7">
            <h2 className="font-display text-2xl font-bold text-ink">Send us a message</h2>
            <Input
              label="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              placeholder="Juan Dela Cruz"
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              placeholder="juan@example.com"
              required
            />
            <Textarea
              label="Message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              error={errors.message}
              placeholder="How can we help?"
              required
            />
            <Button type="submit" className="w-full" loading={sending} icon={<Send className="h-4 w-4" />}>
              Send Message
            </Button>
          </form>
        </div>
      </section>
    </>
  )
}

function Info({ icon, title, value, href }: { icon: React.ReactNode; title: string; value: string; href?: string }) {
  return (
    <div className="card flex gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-golddark">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-body/45">{title}</p>
        {href ? (
          <a href={href} className="mt-1 block text-sm font-medium text-body/80 transition hover:text-warm">
            {value}
          </a>
        ) : (
          <p className="mt-1 text-sm font-medium leading-relaxed text-body/80">{value}</p>
        )}
      </div>
    </div>
  )
}
