// Справочники. Ключи хранятся в БД, подписи показываются пользователю.

export const DEAL_TYPES: Record<string, string> = {
  SALE: "Продажа",
  // Чтобы включить аренду, раскомментируйте строку ниже. Подробнее в README.
  // RENT: "Аренда",
};

export const PROPERTY_TYPES: Record<string, string> = {
  APARTMENT: "Апартаменты",
  GARDEN_APARTMENT: "Апартаменты с садом",
  PENTHOUSE: "Пентхаус",
  LOFT: "Лофт",
  TOWNHOUSE: "Таунхаус",
  BUNGALOW: "Бунгало",
  VILLA: "Вилла",
  LAND: "Земельный участок",
  COMMERCIAL: "Коммерческая",
};

/** Типы, для которых этаж в здании имеет смысл. */
export const TYPES_WITH_FLOOR = ["APARTMENT", "GARDEN_APARTMENT", "PENTHOUSE", "LOFT", "COMMERCIAL"];
/** Типы, для которых важна площадь участка. */
export const TYPES_WITH_PLOT = ["VILLA", "TOWNHOUSE", "BUNGALOW", "LAND"];

export const REGIONS: Record<string, string> = {
  GIRNE: "Кирения (Гирне)",
  ISKELE: "Искеле",
  GAZIMAGUSA: "Фамагуста (Газимагуса)",
  LEFKOSA: "Никосия (Лефкоша)",
  GUZELYURT: "Гюзельюрт",
  LEFKE: "Лефке",
};

export const PROPERTY_STATUSES: Record<string, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликован",
  RESERVED: "Забронирован",
  SOLD: "Продан",
};

/** Статусы, которые видны в каталоге и на карте. */
export const CATALOG_STATUSES: string[] = ["PUBLISHED", "RESERVED"];

export const COMPLETION: Record<string, string> = {
  READY: "Готовый объект",
  UNDER_CONSTRUCTION: "Строится",
  OFF_PLAN: "На этапе котлована",
};

export const FINISHING: Record<string, string> = {
  WHITE_BOX: "Без отделки (white box)",
  STANDARD: "Чистовая отделка от застройщика",
  RENOVATED: "С ремонтом",
  DESIGNER: "Дизайнерский ремонт",
  NEEDS_RENOVATION: "Требует ремонта",
};

export const FURNISHING: Record<string, string> = {
  UNFURNISHED: "Без мебели",
  PARTIAL: "Частично меблирован",
  FURNISHED: "С мебелью",
};

export const TITLE_DEEDS: Record<string, string> = {
  TURKISH: "Турецкий титул",
  EQUIVALENT: "Эквивалентный (обменный) титул",
  ALLOCATION: "Аллокационный титул",
  CONTRACT: "Договор с застройщиком",
};

export const FEATURES: Record<string, string> = {
  POOL_SHARED: "Общий бассейн",
  POOL_PRIVATE: "Частный бассейн",
  GARDEN: "Сад",
  TERRACE: "Терраса",
  ROOF_TERRACE: "Терраса на крыше",
  PARKING: "Парковка",
  ELEVATOR: "Лифт",
  AIR_CONDITIONING: "Кондиционеры",
  CENTRAL_HEATING: "Отопление",
  SOLAR_HEATER: "Солнечный водонагреватель",
  GYM: "Спортзал",
  SPA: "Спа и сауна",
  SECURITY: "Охрана",
  GATED: "Закрытая территория",
  BEACH_ACCESS: "Собственный пляж",
};

export const SEA_DISTANCE_OPTIONS = [
  { value: "200", label: "Первая линия (до 200 м)" },
  { value: "500", label: "До 500 м" },
  { value: "1000", label: "До 1 км" },
  { value: "2000", label: "До 2 км" },
  { value: "5000", label: "До 5 км" },
];

export const BEDROOM_OPTIONS = [
  { value: "0", label: "Студия" },
  { value: "1", label: "1+1" },
  { value: "2", label: "2+1" },
  { value: "3", label: "3+1" },
  { value: "4", label: "4+1 и больше" },
];

export const LEAD_STATUSES: Record<string, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Закрыта",
};

export function labelOf(map: Record<string, string>, key: string | null | undefined) {
  return (key && map[key]) || key || "";
}

export function isKeyOf(map: Record<string, string>, key: unknown): key is string {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(map, key);
}
