"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { destroyOtherSessions, hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import {
  COMPLETION, DEAL_TYPES, FEATURES, FINISHING, FURNISHING, LEAD_STATUSES, PROPERTY_STATUSES, PROPERTY_TYPES,
  REGIONS, TITLE_DEEDS, isKeyOf,
} from "@/lib/constants";
import { consume, waitMessage } from "@/lib/rate-limit";
import { verifyTotp } from "@/lib/totp";
import { UPLOAD_URL_RE, deleteUploadFiles } from "@/lib/uploads";
import { videoEmbed } from "@/lib/video";
import { Prisma } from "@prisma/client";

// ---------- Объекты ----------

export type SaveState = { errors?: string[] } | undefined;

const toNumber = (v: unknown) => {
  if (v === "" || v == null) return undefined;
  return Number(String(v).replace(/\s/g, "").replace(",", "."));
};
const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

const requiredNumber = (msg: string) =>
  z.preprocess(toNumber, z.number({ required_error: msg, invalid_type_error: msg }));
const optionalNumber = (msg: string) => z.preprocess(toNumber, z.number({ invalid_type_error: msg }).optional());
const optionalInt = (msg: string) => z.preprocess(toNumber, z.number({ invalid_type_error: msg }).int(msg).optional());

const oneOf = (map: Record<string, string>, msg: string) => z.string().refine((v) => isKeyOf(map, v), msg);
const optionalOneOf = (map: Record<string, string>, msg: string) =>
  z.preprocess(emptyToUndef, oneOf(map, msg).optional());

const propertySchema = z.object({
  title: z.string().trim().min(3, "Заголовок слишком короткий").max(200),
  description: z.string().trim().max(10000),
  dealType: oneOf(DEAL_TYPES, "Неизвестный тип сделки"),
  propertyType: oneOf(PROPERTY_TYPES, "Выберите тип объекта"),
  status: oneOf(PROPERTY_STATUSES, "Неизвестный статус"),
  price: requiredNumber("Укажите цену").pipe(z.number().positive("Цена должна быть больше нуля").max(1e10)),
  area: requiredNumber("Укажите площадь").pipe(z.number().positive("Площадь должна быть больше нуля").max(1e6)),
  plotArea: optionalNumber("Площадь участка: число"),
  bedrooms: optionalInt("Спальни: целое число").pipe(z.number().min(0).max(50).optional()),
  bathrooms: optionalInt("Санузлы: целое число").pipe(z.number().min(0).max(50).optional()),
  floor: optionalInt("Этаж: целое число").pipe(z.number().min(-5).max(200).optional()),
  floorsTotal: optionalInt("Этажность: целое число").pipe(z.number().min(1).max(200).optional()),
  yearBuilt: optionalInt("Год постройки: целое число").pipe(z.number().min(1800).max(2100).optional()),
  completion: oneOf(COMPLETION, "Укажите стадию строительства"),
  completionDate: z.string().trim().max(50),
  finishing: optionalOneOf(FINISHING, "Неизвестный тип отделки"),
  furnishing: optionalOneOf(FURNISHING, "Неизвестный вариант мебели"),
  titleDeed: optionalOneOf(TITLE_DEEDS, "Неизвестный тип титула"),
  seaDistance: optionalInt("Расстояние до моря: целое число метров").pipe(z.number().min(0).max(200000).optional()),
  seaView: z.boolean(),
  features: z.array(oneOf(FEATURES, "Неизвестное удобство")).max(50),
  region: oneOf(REGIONS, "Выберите регион"),
  district: z.string().trim().max(100),
  address: z.string().trim().min(3, "Укажите адрес").max(300),
  lat: requiredNumber("Отметьте объект на карте").pipe(z.number().min(-90).max(90)),
  lng: requiredNumber("Отметьте объект на карте").pipe(z.number().min(-180).max(180)),
  images: z.array(z.string().regex(UPLOAD_URL_RE, "Некорректная ссылка на фото")).max(40, "Не больше 40 фотографий"),
  plans: z.array(z.string().regex(UPLOAD_URL_RE, "Некорректная ссылка на планировку")).max(20, "Не больше 20 планировок"),
  installment: z.boolean(),
  installmentDownPercent: optionalInt("Первый взнос: целое число процентов").pipe(
    z.number().min(0, "Первый взнос: от 0 до 100%").max(100, "Первый взнос: от 0 до 100%").optional(),
  ),
  installmentMonths: optionalInt("Срок рассрочки: целое число месяцев").pipe(
    z.number().min(1, "Срок рассрочки: от 1 месяца").max(360, "Срок рассрочки: до 360 месяцев").optional(),
  ),
  installmentRate: optionalNumber("Ставка рассрочки: число").pipe(
    z.number().min(0, "Ставка не может быть отрицательной").max(50, "Ставка: не больше 50% годовых").optional(),
  ),
  installmentNote: z.string().trim().max(300, "Условия рассрочки: не больше 300 символов"),
  nearby: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Места рядом: укажите название").max(60, "Места рядом: название до 60 символов"),
        distance: z.number().int().min(0).max(200000, "Места рядом: расстояние до 200 км"),
      }),
    )
    .max(12, "Не больше 12 мест рядом"),
  titleEn: z.string().trim().max(200, "Заголовок по-английски: не больше 200 символов"),
  descriptionEn: z.string().trim().max(10000),
  districtEn: z.string().trim().max(100),
  addressEn: z.string().trim().max(300),
  installmentNoteEn: z.string().trim().max(300),
  videoUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || videoEmbed(v) !== null, "Ссылка на видео: подходят YouTube, RuTube и VK Видео"),
}).superRefine((d, ctx) => {
  if (d.installment && d.installmentDownPercent == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Рассрочка: укажите первый взнос в процентах" });
  }
  if (d.installment && d.installmentMonths == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Рассрочка: укажите срок в месяцах" });
  }
});

const TEXT_FIELDS = [
  "title", "description", "dealType", "propertyType", "status", "price", "area", "plotArea", "bedrooms", "bathrooms",
  "floor", "floorsTotal", "yearBuilt", "completion", "completionDate", "finishing", "furnishing", "titleDeed",
  "seaDistance", "region", "district", "address", "lat", "lng",
  "installmentDownPercent", "installmentMonths", "installmentRate", "installmentNote", "videoUrl",
  "titleEn", "descriptionEn", "districtEn", "addressEn", "installmentNoteEn",
];

function parseJson(v: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(String(v ?? "[]"));
  } catch {
    return [];
  }
}

export async function saveProperty(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireAdmin();

  const id = Number(fd.get("id")) || null;
  const raw = Object.fromEntries(TEXT_FIELDS.map((k) => [k, fd.get(k) ?? ""]));
  const parsed = propertySchema.safeParse({
    ...raw,
    seaView: fd.get("seaView") === "on",
    installment: fd.get("installment") === "on",
    features: fd.getAll("features").map(String),
    images: parseJson(fd.get("images")),
    plans: parseJson(fd.get("plans")),
    nearby: parseJson(fd.get("nearby")),
  });
  if (!parsed.success) {
    return { errors: [...new Set(parsed.error.issues.map((i) => i.message))] };
  }

  const { images, plans, nearby, ...d } = parsed.data;
  const fields = {
    ...d,
    // Без галочки «рассрочка» её параметры не хранятся.
    installmentDownPercent: d.installment ? (d.installmentDownPercent ?? null) : null,
    installmentMonths: d.installment ? (d.installmentMonths ?? null) : null,
    installmentRate: d.installment ? (d.installmentRate ?? null) : null,
    installmentNote: d.installment ? d.installmentNote || null : null,
    nearby: nearby.length ? nearby : Prisma.DbNull,
    videoUrl: d.videoUrl || null,
    // Английские тексты необязательны: пустое поле хранится как null.
    titleEn: d.titleEn || null,
    descriptionEn: d.descriptionEn || null,
    districtEn: d.districtEn || null,
    addressEn: d.addressEn || null,
    installmentNoteEn: d.installment ? d.installmentNoteEn || null : null,
    district: d.district || null,
    completionDate: d.completion === "READY" ? null : d.completionDate || null,
    plotArea: d.plotArea ?? null,
    bedrooms: d.bedrooms ?? null,
    bathrooms: d.bathrooms ?? null,
    floor: d.floor ?? null,
    floorsTotal: d.floorsTotal ?? null,
    yearBuilt: d.yearBuilt ?? null,
    finishing: d.finishing ?? null,
    furnishing: d.furnishing ?? null,
    titleDeed: d.titleDeed ?? null,
    seaDistance: d.seaDistance ?? null,
  };
  const imageRows = [
    ...images.map((url, position) => ({ url, position, kind: "PHOTO" })),
    ...plans.map((url, position) => ({ url, position, kind: "PLAN" })),
  ];

  if (id) {
    const before = await db.propertyImage.findMany({ where: { propertyId: id }, select: { url: true } });
    await db.$transaction([
      db.property.update({ where: { id }, data: fields }),
      db.propertyImage.deleteMany({ where: { propertyId: id } }),
      db.propertyImage.createMany({ data: imageRows.map((r) => ({ ...r, propertyId: id })) }),
    ]);
    // Фото и планировки, которые убрали из объекта, удаляем с диска.
    const keep = new Set([...images, ...plans]);
    await deleteUploadFiles(before.map((i) => i.url).filter((u) => !keep.has(u)));
  } else {
    await db.property.create({ data: { ...fields, images: { create: imageRows } } });
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function deleteProperty(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (Number.isInteger(id) && id > 0) {
    const images = await db.propertyImage.findMany({ where: { propertyId: id }, select: { url: true } });
    await db.property.deleteMany({ where: { id } });
    await deleteUploadFiles(images.map((i) => i.url));
  }
  revalidatePath("/", "layout");
}

export async function setLeadStatus(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const status = fd.get("status");
  if (!Number.isInteger(id) || id <= 0 || !isKeyOf(LEAD_STATUSES, status)) return;
  await db.lead.updateMany({ where: { id }, data: { status } });
  revalidatePath("/admin/leads");
}

// ---------- Безопасность администратора ----------

export type SecurityState = { error?: string; ok?: string } | undefined;

/** Подтверждает подключение приложения-аутентификатора и включает 2FA. */
export async function confirmTotp(_prev: SecurityState, fd: FormData): Promise<SecurityState> {
  const admin = await requireAdmin({ allowWithoutTotp: true });
  const limit = await consume(`totp-setup:${admin.id}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return { error: waitMessage(limit.retryAfterSec) };

  const user = await db.user.findUniqueOrThrow({ where: { id: admin.id } });
  if (user.totpEnabled) redirect("/admin");
  if (!user.totpPending) return { error: "Ключ не найден, обновите страницу" };

  const step = verifyTotp(decrypt(user.totpPending), String(fd.get("code") ?? ""));
  if (step === null) return { error: "Код не подошёл. Проверьте время на телефоне и введите свежий код." };

  await db.user.update({
    where: { id: user.id },
    data: { totpEnabled: true, totpSecret: user.totpPending, totpPending: null, totpLastStep: step },
  });
  // Сессии, открытые только по паролю, больше не действительны.
  await destroyOtherSessions(user.id);
  redirect("/admin");
}

const passwordSchema = z
  .string()
  .min(12, "Новый пароль должен быть не короче 12 символов")
  .max(200)
  .refine((p) => /[a-zа-я]/i.test(p) && /\d/.test(p), "Пароль должен содержать буквы и цифры");

export async function changeAdminPassword(_prev: SecurityState, fd: FormData): Promise<SecurityState> {
  const admin = await requireAdmin();
  const limit = await consume(`password-change:${admin.id}`, 5, 15 * 60 * 1000);
  if (!limit.ok) return { error: waitMessage(limit.retryAfterSec) };

  const user = await db.user.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await verifyPassword(String(fd.get("current") ?? ""), user.passwordHash))) {
    return { error: "Текущий пароль неверный" };
  }
  const step = user.totpSecret ? verifyTotp(decrypt(user.totpSecret), String(fd.get("code") ?? "")) : null;
  if (step === null || (user.totpLastStep != null && step <= user.totpLastStep)) {
    return { error: "Неверный или уже использованный код из приложения" };
  }
  const next = passwordSchema.safeParse(fd.get("password"));
  if (!next.success) return { error: next.error.issues[0].message };
  if (next.data !== fd.get("confirm")) return { error: "Пароли не совпадают" };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next.data), totpLastStep: step },
  });
  await destroyOtherSessions(user.id);
  return { ok: "Пароль изменён. Все остальные сеансы завершены." };
}

export async function logoutEverywhere() {
  const admin = await requireAdmin();
  await destroyOtherSessions(admin.id);
  revalidatePath("/admin/security");
}
