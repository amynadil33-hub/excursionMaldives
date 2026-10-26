import type { Metadata } from 'next'
import { Mail, MapPin, Phone } from 'lucide-react'
import { getCmsSection } from '@/lib/queries'
import { PageHero } from '@/components/site/section-heading'
import { ContactForm } from '@/components/site/contact-form'

export const metadata: Metadata = { title: 'Contact us', description: 'Get in touch with the Excursion Maldives team in Malé.' }

const DEFAULT_CONTACT = { email: 'hello@excursionmaldives.com', phone: '+960 300 0000', address: 'Boduthakurufaanu Magu, Malé 20026, Maldives', whatsapp: '+960 700 0000' }

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const [{ type }, info] = await Promise.all([searchParams, getCmsSection('contact', DEFAULT_CONTACT)])
  const isPrivate = type === 'private_trip'
  return (
    <>
      <PageHero
        title={isPrivate ? 'Request a private trip' : 'Talk to us'}
        subtitle={isPrivate ? 'Share your dates, group size and wishes. We will match you with the right host.' : 'Questions about a booking, a trip or listing your business? We are here.'}
        image="/images/male.png"
      />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <ContactForm kind={isPrivate ? 'private_trip' : 'contact'} />
        <aside className="flex flex-col gap-4">
          {[
            { icon: Mail, label: 'Email', value: info.email, href: `mailto:${info.email}` },
            { icon: Phone, label: 'Phone / WhatsApp', value: `${info.phone} · ${info.whatsapp}`, href: `tel:${info.phone.replace(/\s/g, '')}` },
            { icon: MapPin, label: 'Office', value: info.address },
          ].map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex gap-3 rounded-2xl bg-secondary p-5">
              <Icon className="size-5 shrink-0 text-primary" aria-hidden />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                {href ? (
                  <a href={href} className="font-semibold hover:text-primary">
                    {value}
                  </a>
                ) : (
                  <span className="font-semibold">{value}</span>
                )}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </>
  )
}
