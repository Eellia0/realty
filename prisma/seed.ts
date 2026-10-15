// Демо-объекты на Северном Кипре. Добавляются, только если в базе ещё нет объектов.
// Администратор здесь не создаётся: для этого есть команда npm run admin -- create.
import { PrismaClient, type Prisma } from "@prisma/client";

const db = new PrismaClient();

type Demo = Omit<Prisma.PropertyCreateInput, "status" | "dealType">;

const demo: Demo[] = [
  {
    title: "Пентхаус 2+1 с террасой на крыше в Long Beach",
    propertyType: "PENTHOUSE", price: 189000, area: 98, bedrooms: 2, bathrooms: 2, floor: 5, floorsTotal: 6, yearBuilt: 2024,
    completion: "READY", finishing: "STANDARD", furnishing: "FURNISHED", titleDeed: "TURKISH", seaDistance: 250, seaView: true,
    features: ["POOL_SHARED", "ROOF_TERRACE", "ELEVATOR", "AIR_CONDITIONING", "GYM", "SPA", "SECURITY", "PARKING"],
    region: "ISKELE", district: "Long Beach", address: "Комплекс у набережной Long Beach", lat: 35.3075, lng: 33.9525,
    description: "Пентхаус в комплексе с бассейнами и спа в 250 метрах от песчаного пляжа. Собственная терраса на крыше с джакузи и видом на море. Продаётся с мебелью и техникой.",
  },
  {
    title: "Апартаменты 1+1 у моря в Алсанджаке",
    propertyType: "APARTMENT", price: 112000, area: 62, bedrooms: 1, bathrooms: 1, floor: 2, floorsTotal: 4, yearBuilt: 2022,
    completion: "READY", finishing: "RENOVATED", furnishing: "FURNISHED", titleDeed: "EQUIVALENT", seaDistance: 600, seaView: true,
    features: ["POOL_SHARED", "AIR_CONDITIONING", "PARKING", "SOLAR_HEATER"],
    region: "GIRNE", district: "Алсанджак", address: "Алсанджак, рядом с прибрежной дорогой", lat: 35.3405, lng: 33.2015,
    description: "Светлая квартира с балконом и видом на море и горы. Рядом рестораны, супермаркеты и набережная. Хороший вариант для жизни или сдачи в аренду.",
  },
  {
    title: "Вилла 4+1 с частным бассейном в Чаталкёе",
    propertyType: "VILLA", price: 495000, area: 260, plotArea: 700, bedrooms: 4, bathrooms: 4, floorsTotal: 2, yearBuilt: 2021,
    completion: "READY", finishing: "DESIGNER", furnishing: "PARTIAL", titleDeed: "TURKISH", seaDistance: 900, seaView: true,
    features: ["POOL_PRIVATE", "GARDEN", "TERRACE", "PARKING", "AIR_CONDITIONING", "CENTRAL_HEATING", "SOLAR_HEATER"],
    region: "GIRNE", district: "Чаталкёй", address: "Чаталкёй, тихая улица у подножия гор", lat: 35.3225, lng: 33.3785,
    description: "Современная вилла с панорамным остеклением, частным бассейном и ухоженным садом. Отопление в полах, дизайнерский ремонт. Десять минут до Кирении.",
  },
  {
    title: "Таунхаус 3+1 в закрытом комплексе в Эсентепе",
    propertyType: "TOWNHOUSE", price: 235000, area: 145, plotArea: 220, bedrooms: 3, bathrooms: 2, floorsTotal: 2, yearBuilt: 2023,
    completion: "READY", finishing: "STANDARD", furnishing: "UNFURNISHED", titleDeed: "CONTRACT", seaDistance: 400, seaView: true,
    features: ["POOL_SHARED", "GARDEN", "TERRACE", "GATED", "SECURITY", "BEACH_ACCESS"],
    region: "GIRNE", district: "Эсентепе", address: "Эсентепе, комплекс с выходом к морю", lat: 35.3395, lng: 33.5795,
    description: "Таунхаус на два уровня с собственным садом. Комплекс с бассейном, охраной и спуском к бухте. Рядом поле для гольфа.",
  },
  {
    title: "Апартаменты с садом 2+1 в Лапте",
    propertyType: "GARDEN_APARTMENT", price: 139000, area: 85, bedrooms: 2, bathrooms: 2, floor: 0, floorsTotal: 3, yearBuilt: 2020,
    completion: "READY", finishing: "RENOVATED", furnishing: "FURNISHED", titleDeed: "TURKISH", seaDistance: 1200, seaView: false,
    features: ["POOL_SHARED", "GARDEN", "PARKING", "AIR_CONDITIONING"],
    region: "GIRNE", district: "Лапта", address: "Лапта, жилой квартал у гор", lat: 35.3335, lng: 33.1665,
    description: "Квартира на первом этаже с собственным садом и выходом к общему бассейну. Свежий ремонт, тихий район с видом на горы.",
  },
  {
    title: "Бунгало 2+1 у пляжа в Татлысу",
    propertyType: "BUNGALOW", price: 168000, area: 90, plotArea: 300, bedrooms: 2, bathrooms: 1, floorsTotal: 1, yearBuilt: 2019,
    completion: "READY", finishing: "RENOVATED", furnishing: "PARTIAL", titleDeed: "EQUIVALENT", seaDistance: 150, seaView: true,
    features: ["GARDEN", "TERRACE", "PARKING", "SOLAR_HEATER", "BEACH_ACCESS"],
    region: "GIRNE", district: "Татлысу", address: "Татлысу, первая линия", lat: 35.3795, lng: 33.7505,
    description: "Одноэтажный дом в ста пятидесяти метрах от моря. Терраса с видом на воду, небольшой сад и парковка. Спокойное место вдали от туристических улиц.",
  },
  {
    title: "Новостройка: лофт 1+1 в Фамагусте",
    propertyType: "LOFT", price: 98000, area: 70, bedrooms: 1, bathrooms: 1, floor: 3, floorsTotal: 8,
    completion: "UNDER_CONSTRUCTION", completionDate: "IV кв. 2027", finishing: "STANDARD", furnishing: "UNFURNISHED",
    titleDeed: "CONTRACT", seaDistance: 1800, seaView: false,
    features: ["POOL_SHARED", "GYM", "ELEVATOR", "PARKING", "SECURITY"],
    region: "GAZIMAGUSA", district: "Газимагуса", address: "Газимагуса, новый район у университета", lat: 35.1285, lng: 33.9205,
    description: "Лофт с высокими потолками в строящемся комплексе. Рассрочка от застройщика до сдачи дома. Рядом университет и старый город.",
  },
  {
    title: "Участок под виллу с видом на море в Багчели",
    propertyType: "LAND", price: 85000, area: 1000, seaDistance: 1500, seaView: true,
    completion: "READY", titleDeed: "TURKISH", features: [],
    region: "GIRNE", district: "Багчели", address: "Багчели, склон с видом на побережье", lat: 35.3505, lng: 33.6935,
    description: "Ровный участок с разрешением на строительство виллы. Электричество и вода по границе. Панорамный вид на море и горы.",
  },
  {
    title: "Студия на этапе котлована в Боазе",
    propertyType: "APARTMENT", price: 79000, area: 45, bedrooms: 0, bathrooms: 1, floor: 1, floorsTotal: 5,
    completion: "OFF_PLAN", completionDate: "II кв. 2028", finishing: "STANDARD", furnishing: "UNFURNISHED",
    titleDeed: "CONTRACT", seaDistance: 350, seaView: true,
    features: ["POOL_SHARED", "SPA", "GYM", "ELEVATOR"],
    region: "ISKELE", district: "Боаз", address: "Боаз, проект у набережной", lat: 35.2965, lng: 33.9405,
    description: "Студия в проекте курортного комплекса. Цена на старте продаж, беспроцентная рассрочка. До набережной Боаза пять минут пешком.",
  },
  {
    title: "Офис в центре Никосии",
    propertyType: "COMMERCIAL", price: 145000, area: 110, bathrooms: 1, floor: 1, floorsTotal: 4, yearBuilt: 2015,
    completion: "READY", finishing: "RENOVATED", furnishing: "UNFURNISHED", titleDeed: "TURKISH",
    features: ["ELEVATOR", "AIR_CONDITIONING", "PARKING"],
    region: "LEFKOSA", district: "Кёшключифтлик", address: "Деловой квартал Никосии", lat: 35.1925, lng: 33.3615,
    description: "Офисное помещение с ремонтом в деловом районе. Подходит под представительство, клинику или студию.",
  },
];

async function main() {
  if ((await db.property.count()) > 0) {
    console.log("Объекты уже есть, демо-данные не добавлены.");
    return;
  }
  for (const data of demo) {
    await db.property.create({ data: { ...data, status: "PUBLISHED", dealType: "SALE" } });
  }
  console.log(`Добавлено демо-объектов: ${demo.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
