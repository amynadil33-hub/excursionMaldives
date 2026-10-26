import { cn } from '@/lib/utils'

const TONES: Record<string, string> = {
  paid: 'bg-palm/15 text-palm',
  confirmed: 'bg-palm/15 text-palm',
  approved: 'bg-palm/15 text-palm',
  published: 'bg-palm/15 text-palm',
  completed: 'bg-palm/15 text-palm',
  active: 'bg-palm/15 text-palm',
  pending_payment: 'bg-accent/20 text-accent-foreground',
  pending: 'bg-accent/20 text-accent-foreground',
  requested: 'bg-accent/20 text-accent-foreground',
  processing: 'bg-primary/15 text-primary',
  draft: 'bg-muted text-muted-foreground',
  archived: 'bg-muted text-muted-foreground',
  hidden: 'bg-muted text-muted-foreground',
  inactive: 'bg-muted text-muted-foreground',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize', TONES[status] ?? 'bg-destructive/10 text-destructive', className)}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
