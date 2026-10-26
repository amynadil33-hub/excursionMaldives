import Link from 'next/link'
import { Waves } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string
  body?: string
  action?: { href: string; label: string }
  className?: string
}) {
  const configured = isSupabaseConfigured()
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-3xl border border-dashed border-primary/30 bg-secondary/60 px-6 py-14 text-center', className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-background text-primary">
        <Waves className="size-6" aria-hidden />
      </span>
      <h3 className="text-lg font-bold text-balance">{configured ? title : 'Connect the database to go live'}</h3>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
        {configured
          ? body
          : 'Add your Supabase project keys in Settings → Vars, then run the SQL in supabase/migrations and supabase/seed.sql. Listings will appear here automatically.'}
      </p>
      {configured && action && (
        <Link href={action.href} className={cn(buttonVariants(), 'mt-2 h-10 rounded-full px-5')}>
          {action.label}
        </Link>
      )}
    </div>
  )
}
