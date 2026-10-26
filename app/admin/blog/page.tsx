import Link from 'next/link'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { ActionButton } from '@/components/admin/controls'
import { buttonVariants } from '@/components/ui/button'
import { deleteRow } from '@/app/actions/admin'
import { adminDb } from '@/lib/admin'
import { formatDate } from '@/lib/format'

export default async function AdminBlog() {
  const supabase = await adminDb()
  const { data: posts } = await supabase.from('blog_posts').select('id, title, slug, status, published_at, created_at').order('created_at', { ascending: false })

  return (
    <>
      <PortalHeader
        title="Travel guides"
        description="Articles shown on the blog and homepage."
        actions={
          <Link href="/admin/blog/new" className={buttonVariants({ className: 'rounded-full' })}>
            New post
          </Link>
        }
      />
      <Panel>
        {posts?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {posts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <Link href={`/admin/blog/${p.id}`} className="min-w-0 flex-1 font-semibold hover:text-primary">
                  {p.title}
                </Link>
                <span className="text-sm text-muted-foreground">{formatDate(p.published_at ?? p.created_at)}</span>
                <StatusBadge status={p.status} />
                <ActionButton action={deleteRow.bind(null, 'blog_posts', p.id)} confirmText={`Delete "${p.title}"?`} variant="ghost">
                  Delete
                </ActionButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}
      </Panel>
    </>
  )
}
