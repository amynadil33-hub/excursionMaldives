import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ className, href = '/', size = 48 }: { className?: string; href?: string; size?: number }) {
  return (
    <Link href={href} className={cn('flex shrink-0 items-center gap-2', className)} aria-label="Excursion Maldives home">
      <Image src="/images/logo.png" alt="" width={size} height={size} className="rounded-md" priority />
      <span className="flex flex-col leading-none">
        <span className="font-heading text-base font-extrabold tracking-tight text-primary">EXCURSION</span>
        <span className="font-heading text-[0.65rem] font-bold tracking-[0.3em] text-foreground">MALDIVES</span>
      </span>
    </Link>
  )
}
