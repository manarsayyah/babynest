"use client"

import * as React from "react"
import { cn } from "cn"

export type ProductGalleryProps = {
  images: string[]
  alt: string
}

/** Main image + thumbnail rail. Thumbnails sit left of the image on desktop, below it on mobile. */
function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [selected, setSelected] = React.useState(0)
  const activeImage = images[selected] ?? images[0]

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setSelected(index)}
            aria-label={`View image ${index + 1} of ${alt}`}
            aria-pressed={selected === index}
            className={cn(
              "size-16 shrink-0 overflow-hidden rounded-xl ring-1 transition-all lg:size-20",
              selected === index
                ? "ring-2 ring-primary"
                : "ring-foreground/10 hover:ring-foreground/30"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={alt}
          className="aspect-square w-full object-cover"
        />
      </div>
    </div>
  )
}

export { ProductGallery }
