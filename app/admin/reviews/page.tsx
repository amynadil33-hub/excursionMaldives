import { Star } from 'lucide-react'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { ActionButton } from '@/components/admin/controls'
import { deleteRow, setReviewStatus } from '@/app/actions/admin'
import { adminDb, one } from '@/lib/admin'
import { formatDate } from '@/lib/format'

export default async function AdminReviews() {
  const supabase = await adminDb()
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, author_name, rating, title, body, status, created_at, experience:experiences(title)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <>
      <PortalHeader title="Reviews" description="Hide reviews that break the guidelines. Ratings update automatically." />
      <Panel>
        {reviews?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-0.5 text-accent" aria-label={`${r.rating} out of 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`size-4 ${i < r.rating ? 'fill-current' : 'opacity-30'}`} aria-hidden />
                      ))}
                    </span>
                    <span className="font-semibold">{r.title ?? 'Untitled'}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.body && <p className="mt-1 text-sm leading-relaxed">{r.body}</p>}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.author_name} on {one(r.experience)?.title} · {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {r.status === 'published' ? (
                    <ActionButton action={setReviewStatus.bind(null, r.id, 'hidden')}>Hide</ActionButton>
                  ) : (
                    <ActionButton action={setReviewStatus.bind(null, r.id, 'published')}>Publish</ActionButton>
                  )}
                  <ActionButton action={deleteRow.bind(null, 'reviews', r.id)} confirmText="Delete this review permanently?" variant="ghost">
                    Delete
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        )}
      </Panel>
    </>
  )
}
