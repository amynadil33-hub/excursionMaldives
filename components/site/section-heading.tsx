import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = 'View all',
}: {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-extrabold text-balance md:text-3xl">{title}</h2>
        <div className="wave-divider w-28" aria-hidden />
        {subtitle && <p className="max-w-xl text-muted-foreground text-pretty">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  )
}

export function PageHero({ title, subtitle, image }: { title: string; subtitle?: string; image?: string | null }) {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 size-full object-cover opacity-35" />
      )}
      <div className="container-page relative flex flex-col gap-3 py-16 md:py-20">
        <h1 className="max-w-3xl text-3xl font-extrabold text-balance md:text-5xl">{title}</h1>
        {subtitle && <p className="max-w-2xl text-lg leading-relaxed text-primary-foreground/90 text-pretty">{subtitle}</p>}
      </div>
    </section>
  )
}
