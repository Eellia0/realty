import { PROPERTY_STATUSES, labelOf } from "@/lib/constants";

const STYLES: Record<string, string> = {
  DRAFT: "bg-warm text-muted",
  PUBLISHED: "bg-accent-soft text-accent-dark",
  RESERVED: "bg-amber-100 text-amber-800",
  SOLD: "bg-danger-soft text-danger",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STYLES[status] ?? "bg-warm text-muted"}`}>{labelOf(PROPERTY_STATUSES, status)}</span>;
}
