import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { BlogForm } from '@/components/admin/forms'
import { saveBlogPost } from '@/app/actions/admin'
import { requireAdmin } from '@/lib/auth'

export default async function NewBlogPost() {
  await requireAdmin()
  return (
    <>
      <PortalHeader title="New post" />
      <Panel>
        <BlogForm action={saveBlogPost.bind(null, null)} />
      </Panel>
    </>
  )
}
