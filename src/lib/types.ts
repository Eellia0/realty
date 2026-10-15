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
  /** Посёлок и регион, например «Эсентепе, Кирения (Гирне)». */
  place: string;
  status: string;
};

/** Видимая область карты: [[юг, запад], [север, восток]]. */
export type MapBounds = [[number, number], [number, number]];
