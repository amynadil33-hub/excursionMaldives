'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function Gallery({ images, title }: { images: { url: string; alt: string | null }[]; title: string }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  if (images.length === 0) return null
  const show = (i: number) => {
    setIndex(i)
    setOpen(true)
  }
  const tiles = images.slice(0, 5)

  return (
    <>
      <div className="relative grid h-72 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl md:h-[460px]">
        {tiles.map((img, i) => (
          <button
            key={img.url + i}
            type="button"
            onClick={() => show(i)}
            className={i === 0 ? 'col-span-4 row-span-2 md:col-span-2' : 'hidden md:block'}
            aria-label={`Open photo ${i + 1} of ${images.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt ?? title} className="size-full object-cover transition hover:brightness-90" />
          </button>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => show(0)} className="absolute bottom-4 right-4 rounded-full shadow">
          <Images className="size-4" aria-hidden /> {images.length} photos
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-0 bg-foreground p-2 sm:max-w-4xl">
          <DialogTitle className="sr-only">{title} photos</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[index].url} alt={images[index].alt ?? title} className="max-h-[75vh] w-full rounded-lg object-contain" />
          <div className="flex items-center justify-between px-2 pb-1 text-background">
            <Button variant="ghost" size="icon" className="text-background hover:bg-background/10 hover:text-background" onClick={() => setIndex((index - 1 + images.length) % images.length)} aria-label="Previous photo">
              <ChevronLeft />
            </Button>
            <span className="text-sm tabular-nums">
              {index + 1} / {images.length}
            </span>
            <Button variant="ghost" size="icon" className="text-background hover:bg-background/10 hover:text-background" onClick={() => setIndex((index + 1) % images.length)} aria-label="Next photo">
              <ChevronRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
