'use client'

import { useId, useTransition } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { addListingImage, removeListingImage } from '@/app/actions/vendor'
import { useImageUpload } from '@/components/portal/image-upload'
import type { ExperienceImage } from '@/lib/types'

export function GalleryManager({ listingId, folder, images }: { listingId: string; folder: string; images: ExperienceImage[] }) {
  const id = useId()
  const [pending, startTransition] = useTransition()
  const { upload, uploading, error } = useImageUpload('experiences', folder)
  const busy = uploading || pending

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => (
          <li key={img.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            <Image src={img.url || '/placeholder.svg'} alt={img.alt ?? ''} fill sizes="240px" className="object-cover" />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                startTransition(async () => {
                  const res = await removeListingImage(listingId, img.id)
                  if (res.error) toast.error(res.error)
                })
              }
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/90 text-destructive shadow"
              aria-label="Remove photo"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
        {images.length < 12 && (
          <li>
            <label
              htmlFor={id}
              className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-secondary/60 text-sm text-muted-foreground hover:bg-secondary"
            >
              {busy ? <Loader2 className="size-6 animate-spin text-primary" aria-label="Uploading" /> : <ImagePlus className="size-6 text-primary" aria-hidden />}
              Add photo
            </label>
            <input
              id={id}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                const url = await upload(file)
                if (!url) return
                startTransition(async () => {
                  const res = await addListingImage(listingId, url)
                  if (res.error) toast.error(res.error)
                })
              }}
            />
          </li>
        )}
      </ul>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
