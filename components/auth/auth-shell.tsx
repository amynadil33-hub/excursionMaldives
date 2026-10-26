import Image from 'next/image'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="container-page grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
      <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[2rem] lg:block">
        <Image src="/images/sandbank.jpg" alt="A white sandbank surrounded by turquoise lagoon" fill sizes="50vw" className="object-cover" priority />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-3xl font-extrabold">{title}</h1>
          {subtitle && <p className="leading-relaxed text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
