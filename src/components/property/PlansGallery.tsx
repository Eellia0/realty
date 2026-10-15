"use client";

import { useCallback, useEffect, useState } from "react";
import { thumbUrl } from "@/lib/images";
import { ChevronIcon, CloseIcon } from "../icons";

/* eslint-disable @next/next/no-img-element */
/** Планировки: плитка превью, по клику — просмотр на весь экран со стрелками. */
export function PlansGallery({ plans, title }: { plans: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const go = useCallback((d: number) => setOpen((i) => (i == null ? i : (i + d + plans.length) % plans.length)), [plans.length]);

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, go]);

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">Планировки</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {plans.map((src, i) => (
          <li key={src}>
            <button type="button" onClick={() => setOpen(i)}
              className="group block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-line transition hover:shadow-soft hover:ring-accent/40">
              <img src={thumbUrl(src)} alt={`Планировка ${i + 1}`} loading="lazy" className="h-full w-full object-contain transition group-hover:scale-[1.03]" />
            </button>
          </li>
        ))}
      </ul>

      {open != null && (
        <div role="dialog" aria-modal="true" aria-label={`Планировка ${open + 1} из ${plans.length}`}
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm" onClick={close}>
          <img src={plans[open]} alt={`${title}, планировка ${open + 1}`} onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-xl bg-white object-contain p-3 shadow-2xl" />
          <button type="button" onClick={close} aria-label="Закрыть"
            className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <CloseIcon className="h-6 w-6" />
          </button>
          {plans.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Предыдущая"
                className="absolute top-1/2 left-4 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
                <ChevronIcon dir="left" className="h-6 w-6" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Следующая"
                className="absolute top-1/2 right-4 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
                <ChevronIcon className="h-6 w-6" />
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm text-white">
                {open + 1} / {plans.length}
              </span>
            </>
          )}
        </div>
      )}
    </section>
  );
}
