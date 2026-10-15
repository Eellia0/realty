import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { parseNearby } from "@/lib/places";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const p = await db.property.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } } } });
  if (!p) notFound();

  const { images, createdAt: _c, updatedAt: _u, ...rest } = p;
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-extrabold">Редактирование объекта</h1>
      <PropertyForm
        initial={{
          ...rest,
          district: p.district ?? "",
          completionDate: p.completionDate ?? "",
          finishing: p.finishing ?? "",
          furnishing: p.furnishing ?? "",
          titleDeed: p.titleDeed ?? "",
          images: images.filter((i) => i.kind === "PHOTO").map((i) => i.url),
          plans: images.filter((i) => i.kind === "PLAN").map((i) => i.url),
          installmentNote: p.installmentNote ?? "",
          nearby: parseNearby(p.nearby),
          videoUrl: p.videoUrl ?? "",
        }}
      />
    </div>
  );
}
