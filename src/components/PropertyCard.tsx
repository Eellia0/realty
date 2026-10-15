import Link from "next/link";
import { propertyMeta, seaDistanceLabel } from "@/lib/format";
import { getMoney } from "@/lib/currency";
import { COMPLETION, PROPERTY_TYPES, REGIONS, labelOf } from "@/lib/constants";
import type { PropertyWithCover } from "@/lib/properties";
import { FavoriteButton } from "./FavoriteButton";
import { ImagePlaceholder, PinIcon, WaveIcon } from "./icons";
import { StatusBadge } from "./StatusBadge";
import { thumbUrl } from "@/lib/images";
import { propertyPath } from "@/lib/slug";

export async function PropertyCard({ p, isFavorite }: { p: PropertyWithCover; isFavorite: boolean }) {
  const money = await getMoney();
  const cover = p.images[0] ? thumbUrl(p.images[0].url) : null;
  const sea = seaDistanceLabel(p.seaDistance);
  return (
    <article className="group card relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={propertyPath(p)} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-warm">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <ImagePlaceholder />
          )}
          <span className="badge absolute bottom-3 left-3 bg-ink/75 text-white backdrop-blur">
            {labelOf(PROPERTY_TYPES, p.propertyType)}
          </span>
        </div>
        <div className="space-y-2 p-4">
          <div className="text-xl font-extrabold text-accent-dark">{money.format(p.price, p.dealType)}</div>
          <div className="text-sm text-muted">{propertyMeta(p)}</div>
          <h3 className="line-clamp-1 font-semibold">{p.title}</h3>
          <div className="flex items-center gap-1 text-sm text-muted">
            <PinIcon className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">
              {[p.district, labelOf(REGIONS, p.region)].filter(Boolean).join(", ")}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {p.installment && <span className="chip bg-sun-soft text-[#9a6413]">Рассрочка</span>}
            {sea && (
              <span className="chip bg-sea-soft text-sea">
                <WaveIcon className="h-3.5 w-3.5" />
                {sea}
              </span>
            )}
            {p.seaView && <span className="chip bg-sea-soft text-sea">Вид на море</span>}
            {p.completion !== "READY" && (
              <span className="chip bg-sun-soft text-[#9a6413]">
                {labelOf(COMPLETION, p.completion)}
                {p.completionDate ? `, ${p.completionDate}` : ""}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="absolute top-3 right-3">
        <FavoriteButton propertyId={p.id} initial={isFavorite} />
      </div>
      {p.status !== "PUBLISHED" && (
        <div className="absolute top-3 left-3">
          <StatusBadge status={p.status} />
        </div>
      )}
    </article>
  );
}
