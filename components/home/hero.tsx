import Image from 'next/image'
import type { HomeHero } from '@/lib/types'
import { SearchBar } from '@/components/site/search-bar'

export function Hero({ hero, destinations }: { hero: HomeHero; destinations: { slug: string; name: string }[] }) {
  const isLocal = hero.image_url.startsWith('/')
  return (
    <section className="relative isolate">
      <div className="relative min-h-[620px] overflow-hidden md:min-h-[680px]">
        {isLocal ? (
          <Image src={hero.image_url} alt="Aerial view of a Maldives sandbank and turquoise lagoon" fill priority sizes="100vw" className="-z-10 object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.image_url} alt="Maldives lagoon" className="absolute inset-0 -z-10 size-full object-cover" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-foreground/55 via-foreground/20 to-transparent" aria-hidden />
        <div className="container-page flex flex-col items-start gap-5 pb-40 pt-20 text-primary-foreground md:pt-28">
          <span className="animate-rise rounded-full bg-background/20 px-4 py-1.5 text-sm font-semibold backdrop-blur">{hero.eyebrow}</span>
          <h1 className="animate-rise max-w-3xl text-4xl font-extrabold leading-[1.05] text-balance [animation-delay:80ms] sm:text-5xl md:text-7xl">
            {hero.title}
          </h1>
          <p className="animate-rise max-w-xl text-lg leading-relaxed text-primary-foreground/95 text-pretty [animation-delay:160ms]">{hero.subtitle}</p>
        </div>
      </div>
      <div className="container-page relative -mt-28 md:-mt-24">
        <SearchBar destinations={destinations} className="animate-rise [animation-delay:240ms]" />
      </div>
    </section>
  )
}
