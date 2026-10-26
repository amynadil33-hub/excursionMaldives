import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { BlogForm } from '@/components/admin/forms'
import { buttonVariants } from '@/components/ui/button'
import { saveBlogPost } from '@/app/actions/admin'
import { adminDb } from '@/lib/admin'
import type { BlogPost } from '@/lib/types'

export default async function EditBlogPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await adminDb()
  const { data: post } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle<BlogPost>()
  if (!post) notFound()
  return (
    <>
      <PortalHeader
        title={post.title}
        actions={
          post.status === 'published' && (
            <Link href={`/blog/${post.slug}`} className={buttonVariants({ variant: 'outline', className: 'rounded-full' })}>
              View post
            </Link>
          )
        }
      />
      <Panel>
        <BlogForm post={post} action={saveBlogPost.bind(null, post.id)} />
      </Panel>
    </>
  )
}
