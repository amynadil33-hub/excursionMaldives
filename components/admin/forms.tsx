'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FormMessage, SubmitButton, selectClass } from '@/components/portal/form-bits'
import { ImageUploadField } from '@/components/portal/image-upload'
import type { FormState } from '@/app/actions/public'
import type { Banner, BlogPost, Category, Destination, HomeContent, Promotion } from '@/lib/types'

type Action = (state: FormState, fd: FormData) => Promise<FormState>

function useForm(action: Action, resetOnSuccess: boolean) {
  const [state, formAction] = useActionState(action, {})
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (resetOnSuccess && state.ok) ref.current?.reset()
  }, [state, resetOnSuccess])
  return { state, formAction, ref }
}

function ActiveCheckbox({ defaultChecked = true, label = 'Active' }: { defaultChecked?: boolean; label?: string }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" name="is_active" defaultChecked={defaultChecked} className="size-4 accent-[var(--primary)]" />
      {label}
    </label>
  )
}

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function TaxonomyForm({
  kind,
  item,
  action,
}: {
  kind: 'category' | 'destination'
  item?: Category | Destination | null
  action: Action
}) {
  const { state, formAction, ref } = useForm(action, !item)
  const p = item?.id ?? 'new'
  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor={`${p}-name`}>
          <Input id={`${p}-name`} name="name" required defaultValue={item?.name} className="h-11" />
        </Field>
        <Field label="Slug" htmlFor={`${p}-slug`} hint="Leave blank to generate from the name.">
          <Input id={`${p}-slug`} name="slug" defaultValue={item?.slug} className="h-11" />
        </Field>
        {kind === 'destination' && (
          <Field label="Atoll" htmlFor={`${p}-atoll`}>
            <Input id={`${p}-atoll`} name="atoll" defaultValue={(item as Destination | undefined)?.atoll ?? ''} className="h-11" />
          </Field>
        )}
        <Field label="Sort order" htmlFor={`${p}-sort`}>
          <Input id={`${p}-sort`} name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} className="h-11" />
        </Field>
      </div>
      <Field label="Description" htmlFor={`${p}-desc`}>
        <Textarea id={`${p}-desc`} name="description" rows={2} defaultValue={item?.description ?? ''} />
      </Field>
      <ImageUploadField name="image_url" label="Image" bucket="cms" folder={kind} defaultValue={item?.image_url} aspect="aspect-[3/1]" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActiveCheckbox defaultChecked={item?.is_active ?? true} />
        <SubmitButton>{item ? 'Save' : `Add ${kind}`}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  )
}

export function PromotionForm({ promo, action }: { promo?: Promotion | null; action: Action }) {
  const { state, formAction, ref } = useForm(action, !promo)
  const p = promo?.id ?? 'new'
  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Code" htmlFor={`${p}-code`}>
          <Input id={`${p}-code`} name="code" required defaultValue={promo?.code} className="h-11 uppercase" />
        </Field>
        <Field label="Type" htmlFor={`${p}-type`}>
          <select id={`${p}-type`} name="discount_type" defaultValue={promo?.discount_type ?? 'percent'} className={selectClass}>
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed USD off</option>
          </select>
        </Field>
        <Field label="Value" htmlFor={`${p}-value`}>
          <Input id={`${p}-value`} name="value" type="number" step="0.01" min="0.01" required defaultValue={promo?.value} className="h-11" />
        </Field>
        <Field label="Minimum spend (USD)" htmlFor={`${p}-min`}>
          <Input id={`${p}-min`} name="min_subtotal" type="number" step="0.01" min="0" defaultValue={promo?.min_subtotal ?? 0} className="h-11" />
        </Field>
        <Field label="Max uses" htmlFor={`${p}-max`} hint="Blank for unlimited.">
          <Input id={`${p}-max`} name="max_uses" type="number" min="1" defaultValue={promo?.max_uses ?? ''} className="h-11" />
        </Field>
        <Field label="Description" htmlFor={`${p}-desc`}>
          <Input id={`${p}-desc`} name="description" defaultValue={promo?.description ?? ''} className="h-11" />
        </Field>
        <Field label="Starts" htmlFor={`${p}-start`}>
          <Input id={`${p}-start`} name="starts_at" type="datetime-local" defaultValue={toLocalInput(promo?.starts_at ?? null)} className="h-11" />
        </Field>
        <Field label="Ends" htmlFor={`${p}-end`}>
          <Input id={`${p}-end`} name="ends_at" type="datetime-local" defaultValue={toLocalInput(promo?.ends_at ?? null)} className="h-11" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActiveCheckbox defaultChecked={promo?.is_active ?? true} />
        <SubmitButton>{promo ? 'Save promotion' : 'Create promotion'}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  )
}

export function BannerForm({ banner, action }: { banner?: Banner | null; action: Action }) {
  const { state, formAction, ref } = useForm(action, !banner)
  const p = banner?.id ?? 'new'
  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor={`${p}-title`}>
          <Input id={`${p}-title`} name="title" required defaultValue={banner?.title} className="h-11" />
        </Field>
        <Field label="Placement" htmlFor={`${p}-place`}>
          <select id={`${p}-place`} name="placement" defaultValue={banner?.placement ?? 'home'} className={selectClass}>
            <option value="home">Homepage</option>
            <option value="deals">Deals page</option>
            <option value="explore">Explore page</option>
          </select>
        </Field>
        <Field label="Subtitle" htmlFor={`${p}-sub`} className="sm:col-span-2">
          <Input id={`${p}-sub`} name="subtitle" defaultValue={banner?.subtitle ?? ''} className="h-11" />
        </Field>
        <Field label="Button label" htmlFor={`${p}-cta`}>
          <Input id={`${p}-cta`} name="cta_label" defaultValue={banner?.cta_label ?? ''} className="h-11" />
        </Field>
        <Field label="Button link" htmlFor={`${p}-href`} hint="e.g. /deals or https://…">
          <Input id={`${p}-href`} name="cta_href" defaultValue={banner?.cta_href ?? ''} className="h-11" />
        </Field>
        <Field label="Sort order" htmlFor={`${p}-sort`}>
          <Input id={`${p}-sort`} name="sort_order" type="number" defaultValue={banner?.sort_order ?? 0} className="h-11" />
        </Field>
      </div>
      <ImageUploadField name="image_url" label="Banner image" bucket="cms" folder="banners" defaultValue={banner?.image_url} aspect="aspect-[3/1]" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActiveCheckbox defaultChecked={banner?.is_active ?? true} />
        <SubmitButton>{banner ? 'Save banner' : 'Add banner'}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  )
}

export function BlogForm({ post, action }: { post?: BlogPost | null; action: Action }) {
  const [state, formAction] = useActionState(action, {})
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor="title" className="sm:col-span-2">
          <Input id="title" name="title" required defaultValue={post?.title} className="h-11" />
        </Field>
        <Field label="Slug" htmlFor="slug" hint="Leave blank to generate from the title.">
          <Input id="slug" name="slug" defaultValue={post?.slug} className="h-11" />
        </Field>
        <Field label="Author" htmlFor="author">
          <Input id="author" name="author" defaultValue={post?.author ?? 'Excursion Maldives'} className="h-11" />
        </Field>
      </div>
      <Field label="Excerpt" htmlFor="excerpt">
        <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={post?.excerpt ?? ''} />
      </Field>
      <Field label="Content" htmlFor="content" hint="Separate paragraphs with a blank line. Start a line with ## for a subheading.">
        <Textarea id="content" name="content" rows={16} defaultValue={post?.content ?? ''} className="font-mono text-sm" />
      </Field>
      <ImageUploadField name="cover_image" label="Cover image" bucket="cms" folder="blog" defaultValue={post?.cover_image} />
      <div className="flex flex-wrap items-center justify-end gap-3">
        <SubmitButton name="status" value="draft" variant="outline">
          Save draft
        </SubmitButton>
        <SubmitButton name="status" value="published">
          {post?.status === 'published' ? 'Update post' : 'Publish'}
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  )
}

export function HomeContentForm({ content, action }: { content: HomeContent; action: Action }) {
  const [state, formAction] = useActionState(action, {})
  const trust = [0, 1, 2].map((i) => content.trust_points[i] ?? { title: '', body: '' })
  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Hero</h2>
        <Field label="Eyebrow" htmlFor="hero_eyebrow">
          <Input id="hero_eyebrow" name="hero_eyebrow" defaultValue={content.hero.eyebrow} className="h-11" />
        </Field>
        <Field label="Headline" htmlFor="hero_title">
          <Input id="hero_title" name="hero_title" required defaultValue={content.hero.title} className="h-11" />
        </Field>
        <Field label="Subheadline" htmlFor="hero_subtitle">
          <Textarea id="hero_subtitle" name="hero_subtitle" rows={2} defaultValue={content.hero.subtitle} />
        </Field>
        <ImageUploadField name="hero_image" label="Hero photo" bucket="cms" folder="home" defaultValue={content.hero.image_url} aspect="aspect-[21/9]" />
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="text-lg font-bold sm:col-span-2">Section headings</h2>
        <Field label="Featured title" htmlFor="featured_title">
          <Input id="featured_title" name="featured_title" defaultValue={content.featured_title} className="h-11" />
        </Field>
        <Field label="Featured subtitle" htmlFor="featured_subtitle">
          <Input id="featured_subtitle" name="featured_subtitle" defaultValue={content.featured_subtitle} className="h-11" />
        </Field>
        <Field label="Categories title" htmlFor="categories_title">
          <Input id="categories_title" name="categories_title" defaultValue={content.categories_title} className="h-11" />
        </Field>
        <Field label="Destinations title" htmlFor="destinations_title">
          <Input id="destinations_title" name="destinations_title" defaultValue={content.destinations_title} className="h-11" />
        </Field>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Private trips promo</h2>
        <Field label="Title" htmlFor="private_title">
          <Input id="private_title" name="private_title" defaultValue={content.private_title} className="h-11" />
        </Field>
        <Field label="Text" htmlFor="private_subtitle">
          <Textarea id="private_subtitle" name="private_subtitle" rows={2} defaultValue={content.private_subtitle} />
        </Field>
        <ImageUploadField name="private_image" label="Photo" bucket="cms" folder="home" defaultValue={content.private_image} aspect="aspect-[3/1]" />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Trust points</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {trust.map((t, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
              <Field label={`Point ${i + 1} title`} htmlFor={`trust_${i}_title`}>
                <Input id={`trust_${i}_title`} name={`trust_${i}_title`} defaultValue={t.title} className="h-11" />
              </Field>
              <Field label="Text" htmlFor={`trust_${i}_body`}>
                <Textarea id={`trust_${i}_body`} name={`trust_${i}_body`} rows={3} defaultValue={t.body} />
              </Field>
            </div>
          ))}
        </div>
      </section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <FormMessage state={state} />
        <SubmitButton>Publish homepage</SubmitButton>
      </div>
    </form>
  )
}

export function KeyValueForm({
  fields,
  values,
  action,
  submitLabel = 'Save',
  folder = 'pages',
}: {
  fields: { name: string; label: string; type?: 'text' | 'textarea' | 'image' | 'number'; hint?: string }[]
  values: Record<string, unknown>
  action: Action
  submitLabel?: string
  folder?: string
}) {
  const [state, formAction] = useActionState(action, {})
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {fields.map((f) => {
        const v = values[f.name] == null ? '' : String(values[f.name])
        if (f.type === 'image')
          return <ImageUploadField key={f.name} name={f.name} label={f.label} bucket="cms" folder={folder} defaultValue={v} aspect="aspect-[3/1]" />
        return (
          <Field key={f.name} label={f.label} htmlFor={f.name} hint={f.hint}>
            {f.type === 'textarea' ? (
              <Textarea id={f.name} name={f.name} rows={5} defaultValue={v} />
            ) : (
              <Input id={f.name} name={f.name} type={f.type === 'number' ? 'number' : 'text'} step="0.01" defaultValue={v} className="h-11" />
            )}
          </Field>
        )
      })}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <FormMessage state={state} />
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  )
}
