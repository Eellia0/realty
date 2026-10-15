"use client";

import { useState } from "react";
import { thumbUrl } from "@/lib/images";

/* eslint-disable @next/next/no-img-element */
export function ImageUploader({
  value,
  onChange,
  coverLabel = true,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  /** Подписывать первое изображение как обложку. Для планировок не нужно. */
  coverLabel?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading(true);
    setError(null);
    const urls: string[] = [];
    const errors: string[] = [];
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = (await res.json()) as { url?: string; error?: string };
        if (data.url) urls.push(data.url);
        else errors.push(`${file.name}: ${data.error ?? "ошибка загрузки"}`);
      } catch {
        errors.push(`${file.name}: ошибка сети`);
      }
    }
    onChange([...value, ...urls]);
    if (errors.length) setError(errors.join("; "));
    setUploading(false);
  }

  function move(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center text-sm transition ${
          dragOver ? "border-accent bg-accent-soft" : "border-line bg-bg hover:bg-warm"
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="font-semibold">{uploading ? "Загружаем…" : "Перетащите фото сюда или нажмите, чтобы выбрать"}</span>
        <span className="mt-1 text-muted">JPG, PNG или WEBP, до 20 МБ. Фото сжимаются автоматически.{coverLabel ? " Первое фото станет обложкой." : ""}</span>
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((url, i) => (
            <li key={url} className="relative overflow-hidden rounded-xl bg-warm ring-1 ring-line">
              <img src={thumbUrl(url)} alt="" className="aspect-[4/3] w-full object-cover" />
              {coverLabel && i === 0 && <span className="badge absolute top-2 left-2 bg-accent text-white">Обложка</span>}
              <div className="flex items-center justify-between gap-1 bg-surface p-1.5">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn btn-secondary px-2.5 py-1" aria-label="Сдвинуть влево">←</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="btn btn-secondary px-2.5 py-1" aria-label="Сдвинуть вправо">→</button>
                </div>
                <button type="button" onClick={() => onChange(value.filter((u) => u !== url))} className="btn btn-danger px-2.5 py-1">
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
