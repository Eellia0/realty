export type MapPoint = {
  id: number;
  lat: number;
  lng: number;
  price: number;
  dealType: string;
  title: string;
  address: string;
  cover: string | null;
  /** Подписи для компактной карточки рядом с картой. */
  typeLabel: string;
  meta: string;
  sea: string | null;
  seaView: boolean;
  installment: boolean;
  /** Посёлок и регион, например «Эсентепе, Кирения (Гирне)». */
  place: string;
  status: string;
  /** Адрес страницы объекта, например /property/12-penthaus-… */
  href: string;
};

/** Видимая область карты: [[юг, запад], [север, восток]]. */
export type MapBounds = [[number, number], [number, number]];
