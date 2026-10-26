'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const MAX_BYTES = 10 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function useImageUpload(bucket: 'experiences' | 'vendors' | 'cms', folder: string) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File): Promise<string | null> {
    setError(null)
    if (!TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG or WebP image.')
      return null
    }
    if (file.size > MAX_BYTES) {
      setError('Images must be under 10 MB.')
      return null
    }
    setUploading(true)
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const path = `${folder}/${crypto.randomUUID()}.${ext}`
    const supabase = createClient()
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false })
    setUploading(false)
    if (upErr) {
      setError('Upload failed. Please try again.')
      return null
    }
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  return { upload, uploading, error }
}

export function ImageUploadField({
  name,
  label,
  bucket,
  folder,
  defaultValue,
  aspect = 'aspect-video',
}: {
  name: string
  label: string
  bucket: 'experiences' | 'vendors' | 'cms'
  folder: string
  defaultValue?: string | null
  aspect?: string
}) {
  const id = useId()
  const [url, setUrl] = useState(defaultValue ?? '')
  const { upload, uploading, error } = useImageUpload(bucket, folder)

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={url} />
      <label
        htmlFor={id}
        className={cn(
          'relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-secondary/60 text-sm text-muted-foreground transition-colors hover:bg-secondary',
          aspect,
        )}
      >
        {url ? (
          <Image src={url} alt="" fill sizes="400px" className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2">
            <ImagePlus className="size-6 text-primary" aria-hidden />
            Upload image
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-6 animate-spin text-primary" aria-label="Uploading" />
          </span>
        )}
      </label>
      <input
        id={id}
        type="file"
        accept={TYPES.join(',')}
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          const next = await upload(file)
          if (next) setUrl(next)
        }}
      />
      <div className="flex items-center justify-between gap-2">
        {error ? <p className="text-xs text-destructive">{error}</p> : <span />}
        {url && (
          <button type="button" onClick={() => setUrl('')} className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
