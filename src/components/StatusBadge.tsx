import { PROPERTY_STATUSES, labelOf } from "@/lib/constants";

const STYLES: Record<string, string> = {
  DRAFT: "bg-warm text-muted",
  PUBLISHED: "bg-accent-soft text-accent-dark",
  RESERVED: "bg-amber-100 text-amber-800",
  SOLD: "bg-danger-soft text-danger",
};

/** Метка статуса объекта. label — подпись на языке страницы; без неё — русская (для админки). */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <span className={`badge ${STYLES[status] ?? "bg-warm text-muted"}`}>{label ?? labelOf(PROPERTY_STATUSES, status)}</span>;
}
