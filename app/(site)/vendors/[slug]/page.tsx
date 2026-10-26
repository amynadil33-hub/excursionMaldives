import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MapPin, BadgeCheck } from 'lucide-react'
import { getVendorBySlug, getVendorExperiences } from '@/lib/queries'
import { getWishedIds } from '@/app/actions/wishlist'
import { ExperienceGrid } from '@/components/experience/experience-card'
import { EmptyState } from '@/components/site/empty-state'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const v = await getVendorBySlug(slug)
  return { title: v?.business_name ?? 'Operator', description: v?.tagline ?? undefined }
}

export default async function VendorStorefront({ params }: Props) {
  const { slug } = await params
  const vendor = await getVendorBySlug(slug)
  if (!vendor) notFound()
  const [experiences, wished] = await Promise.all([getVendorExperiences(vendor.id), getWishedIds()])

  return (
    <>
      <section className="relative h-56 bg-secondary md:h-72">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={vendor.cover_url ?? '/images/islandhop.png'} alt="" className="size-full object-cover" />
      </section>
      <div className="container-page flex flex-col gap-10 pb-16">
        <header className="-mt-12 flex flex-col gap-4 md:flex-row md:items-end">
          <span className="relative flex size-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-background bg-primary text-3xl font-extrabold text-primary-foreground shadow-lg">
            {vendor.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vendor.logo_url} alt="" className="size-full object-cover" />
            ) : (
              vendor.business_name.charAt(0)
            )}
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-3xl font-extrabold">
              {vendor.business_name}
              <BadgeCheck className="size-6 text-primary" aria-label="Verified operator" />
            </h1>
            {vendor.tagline && <p className="text-muted-foreground">{vendor.tagline}</p>}
            {vendor.island && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden /> {vendor.island}
              </p>
            )}
          </div>
        </header>
        {vendor.description && <p className="max-w-3xl whitespace-pre-line leading-relaxed">{vendor.description}</p>}
        <section className="flex flex-col gap-5">
          <h2 className="text-2xl font-extrabold">Experiences by {vendor.business_name}</h2>
          {experiences.length > 0 ? <ExperienceGrid experiences={experiences} wishedIds={wished} /> : <EmptyState title="No live trips yet" />}
        </section>
      </div>
    </>
  )
}
