import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getBlogPost } from '@/lib/queries'
import { formatDate } from '@/lib/format'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
  return { title: post?.title ?? 'Article', description: post?.excerpt ?? undefined }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()
  const paragraphs = (post.content ?? '').split(/\n{2,}/).filter(Boolean)

  return (
    <article className="container-page flex max-w-3xl flex-col gap-6 py-10">
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All articles
      </Link>
      <header className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {post.author}
          {post.published_at ? ` · ${formatDate(post.published_at)}` : ''}
        </p>
        <h1 className="text-balance text-4xl font-extrabold md:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="text-pretty text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>}
      </header>
      {post.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image} alt="" className="aspect-[16/9] w-full rounded-3xl object-cover" />
      )}
      <div className="flex flex-col gap-5 text-lg leading-relaxed">
        {paragraphs.map((p, i) =>
          p.startsWith('## ') ? (
            <h2 key={i} className="pt-2 text-2xl font-extrabold">
              {p.slice(3)}
            </h2>
          ) : (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ),
        )}
      </div>
    </article>
  )
}
