'use client'

import { useActionState, useState } from 'react'
import { Star } from 'lucide-react'
import { submitReview, type FormState } from '@/app/actions/public'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function ReviewForm({ experienceId, slug }: { experienceId: string; slug: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitReview, {})
  const [rating, setRating] = useState(5)
  if (state.ok) return <p className="rounded-2xl bg-secondary p-4 font-semibold text-primary">{state.message}</p>

  return (
    <form action={action} className="flex flex-col gap-4 rounded-3xl border p-5">
      <h3 className="text-lg font-bold">Write a review</h3>
      <input type="hidden" name="experience_id" value={experienceId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={n === rating}>
              <Star className={n <= rating ? 'size-7 fill-accent text-accent' : 'size-7 text-border'} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="r-title">Title</Label>
        <Input id="r-title" name="title" maxLength={120} placeholder="Best day of our honeymoon" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="r-body">Your experience</Label>
        <Textarea id="r-body" name="body" required minLength={10} maxLength={2000} rows={4} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start rounded-full">
        {pending ? 'Posting…' : 'Post review'}
      </Button>
    </form>
  )
}
