"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/actions/favorites";
import { HeartIcon } from "./icons";

export function FavoriteButton({
  propertyId,
  initial,
  variant = "icon",
}: {
  propertyId: number;
  initial: boolean;
  variant?: "icon" | "full";
}) {
  const [fav, setFav] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    startTransition(async () => {
      try {
        setFav(await toggleFavorite(propertyId));
        router.refresh();
      } catch {
        setFav(!next);
      }
    });
  }

  const label = fav ? "Убрать из избранного" : "Добавить в избранное";

  if (variant === "full") {
    return (
      <button type="button" onClick={onClick} disabled={pending} className="btn btn-secondary w-full" aria-pressed={fav}>
        <HeartIcon filled={fav} className={`h-5 w-5 ${fav ? "text-danger" : ""}`} />
        {fav ? "В избранном" : "В избранное"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={label}
      title={label}
      aria-pressed={fav}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur transition hover:scale-105"
    >
      <HeartIcon filled={fav} className={`h-5 w-5 ${fav ? "text-danger" : "text-ink"}`} />
    </button>
  );
}
