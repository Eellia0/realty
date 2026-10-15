"use client";

// Загрузчик JavaScript API Яндекс Карт 2.1. Скрипт подключается один раз на страницу.
// Ключ берётся из NEXT_PUBLIC_YANDEX_MAPS_API_KEY. Он виден в браузере, поэтому
// в кабинете разработчика Яндекса его нужно ограничить по HTTP Referer своим доменом.

/* eslint-disable @typescript-eslint/no-explicit-any */
export type YMaps = any;

declare global {
  interface Window {
    ymaps?: YMaps;
  }
}

let loading: Promise<YMaps> | null = null;

export function loadYmaps(): Promise<YMaps> {
  if (window.ymaps?.Map) return Promise.resolve(window.ymaps);
  loading ??= new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${key ? `&apikey=${encodeURIComponent(key)}` : ""}`;
    script.async = true;
    script.onload = () => window.ymaps!.ready(() => resolve(window.ymaps), reject);
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Не удалось загрузить Яндекс Карты"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Высота метки-цены вместе с хвостиком: на столько балун поднимается над точкой. */
const MARKER_HEIGHT = 44;
const ARROW = 8;

type Layouts = {
  price: YMaps;
  priceActive: YMaps;
  cluster: YMaps;
  clusterActive: YMaps;
  balloon: YMaps;
  balloonContent: YMaps;
  pin: YMaps;
};
let layouts: Layouts | null = null;

/**
 * Собственные макеты меток, кластеров и балуна в стиле сайта. Создаются один раз.
 * HTML в properties.balloonHtml собирается нами и заранее экранируется, поэтому вставляется через |raw.
 */
export function getLayouts(ymaps: YMaps): Layouts {
  if (layouts) return layouts;
  const f = ymaps.templateLayoutFactory;

  const price = f.createClass('<div class="ym-price">{{ properties.iconContent }}</div>');
  const priceActive = f.createClass('<div class="ym-price ym-price--active">{{ properties.iconContent }}</div>');
  const cluster = f.createClass('<div class="ym-cluster">{{ properties.geoObjects.length }}</div>');
  const clusterActive = f.createClass('<div class="ym-cluster ym-cluster--active">{{ properties.geoObjects.length }}</div>');
  const pin = f.createClass('<div class="ym-pin"><span></span></div>');
  const balloonContent = f.createClass("{{ properties.balloonHtml|raw }}");

  const balloon = f.createClass(
    '<div class="ym-balloon">' +
      '<button type="button" class="ym-balloon__close" aria-label="Закрыть">×</button>' +
      "$[[options.contentLayout observeSize minWidth=264 maxWidth=264]]" +
      '<div class="ym-balloon__arrow"></div>' +
      "</div>",
    {
      build(this: YMaps) {
        balloon.superclass.build.call(this);
        this._el = this.getParentElement().querySelector(".ym-balloon");
        this._close = (e: Event) => {
          e.preventDefault();
          this.events.fire("userclose");
        };
        this._el.querySelector(".ym-balloon__close").addEventListener("click", this._close);
        this.applyElementOffset();
      },
      clear(this: YMaps) {
        this._el?.querySelector(".ym-balloon__close")?.removeEventListener("click", this._close);
        balloon.superclass.clear.call(this);
      },
      onSublayoutSizeChange(this: YMaps, ...args: unknown[]) {
        balloon.superclass.onSublayoutSizeChange.apply(this, args);
        if (!this._el) return;
        this.applyElementOffset();
        this.events.fire("shapechange");
      },
      applyElementOffset(this: YMaps) {
        this._el.style.left = `${-this._el.offsetWidth / 2}px`;
        this._el.style.top = `${-(this._el.offsetHeight + ARROW + MARKER_HEIGHT)}px`;
      },
      getShape(this: YMaps) {
        if (!this._el) return balloon.superclass.getShape.call(this);
        const { offsetLeft: l, offsetTop: t, offsetWidth: w, offsetHeight: h } = this._el;
        return new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([[l, t], [l + w, t + h + ARROW]]));
      },
    },
  );

  layouts = { price, priceActive, cluster, clusterActive, balloon, balloonContent, pin };
  return layouts;
}

/** Опции меток-цен и кластеров для ObjectManager. */
export function priceMarkerOptions(ymaps: YMaps) {
  const l = getLayouts(ymaps);
  return {
    objects: {
      iconLayout: l.price,
      // Область клика: пилюля над точкой.
      iconShape: { type: "Rectangle", coordinates: [[-42, -MARKER_HEIGHT], [42, 0]] },
      balloonLayout: l.balloon,
      balloonContentLayout: l.balloonContent,
      balloonPanelMaxMapArea: 0,
      hideIconOnBalloonOpen: false,
    },
    clusters: {
      clusterIconLayout: l.cluster,
      clusterIconShape: { type: "Circle", coordinates: [0, 0], radius: 24 },
      clusterBalloonPanelMaxMapArea: 0,
    },
  };
}

/**
 * Элементы управления карты: компактные кнопки «+» и «−» без ползунка,
 * переключатель слоёв и полноэкранный режим. Зум колёсиком мыши включён по умолчанию.
 */
export function addControls(map: YMaps) {
  map.controls.add("zoomControl", { size: "small", position: { left: 12, top: 12 } });
  map.controls.add("typeSelector", { size: "small", position: { right: 52, top: 12 } });
  map.controls.add("fullscreenControl", { position: { right: 12, top: 12 } });
}

/** Границы Северного Кипра: подсказка геокодеру, где искать адрес в первую очередь. */
const NORTH_CYPRUS_BOUNDS = [
  [34.95, 32.6],
  [35.72, 34.6],
];

export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const ymaps = await loadYmaps();
  const res = await ymaps.geocode(query, { results: 1, boundedBy: NORTH_CYPRUS_BOUNDS });
  const obj = res.geoObjects.get(0);
  if (!obj) return null;
  const [lat, lng] = obj.geometry.getCoordinates();
  return { lat, lng, label: obj.getAddressLine?.() ?? obj.properties.get("text") ?? query };
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
