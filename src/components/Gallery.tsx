"use client";

import { useState } from "react";
import { ChevronIcon, ImagePlaceholder } from "./icons";

/* eslint-disable @next/next/no-img-element */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-[16/10] overflow-hidden rounded-2xl">
        <ImagePlaceholder />
      </div>
    );
  }

  const go = (d: number) => setIndex((i) => (i + d + images.length) % images.length);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-warm">
        <img src={images[index]} alt={`${title}, фото ${index + 1}`} className="h-full w-full object-cover" />
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Предыдущее фото"
              className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-soft hover:bg-white">
              <ChevronIcon dir="left" className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Следующее фото"
              className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-soft hover:bg-white">
              <ChevronIcon className="h-5 w-5" />
            </button>
            <div className="absolute right-3 bottom-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white">
              {index + 1} / {images.length}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button key={src} type="button" onClick={() => setIndex(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition ${i === index ? "ring-accent" : "ring-transparent opacity-70 hover:opacity-100"}`}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
