"use client";

import { useEffect, useRef, useState } from "react";
import { MAP_CENTER, MAP_ZOOM } from "@/lib/site";
import type { MapBounds, MapPoint } from "@/lib/types";
import { addControls, escapeHtml, getLayouts, loadYmaps, priceMarkerOptions, type YMaps } from "./ymaps";
import { MapError } from "./MapError";

/** Карточка во всплывающем окне метки: без фото, в стиле сайта. Все значения экранируются. */
function balloonHtml(p: MapPoint) {
  const chips = [
    p.sea ? `<span class="ym-chip ym-chip--sea">≈ ${escapeHtml(p.sea)}</span>` : "",
    p.seaView ? `<span class="ym-chip ym-chip--sea">Вид на море</span>` : "",
    p.installment ? `<span class="ym-chip ym-chip--sun">Рассрочка</span>` : "",
    p.status === "RESERVED" ? `<span class="ym-chip ym-chip--sun">Забронирован</span>` : "",
  ].join("");
  return `
    <div class="ym-card">
      <div class="ym-card__head">
        <div class="ym-card__type">${escapeHtml(p.typeLabel)}</div>
        <div class="ym-card__place">${escapeHtml(p.place)}</div>
      </div>
      <div class="ym-card__body">
        <div class="ym-card__price">${escapeHtml(p.priceText)}</div>
        <div class="ym-card__title">${escapeHtml(p.title)}</div>
        <div class="ym-card__meta">${escapeHtml(p.meta)}</div>
        ${chips ? `<div class="ym-card__chips">${chips}</div>` : ""}
        <a class="ym-card__btn" href="${escapeHtml(p.href)}">Подробнее →</a>
      </div>
    </div>`;
}

type Props = {
  points: MapPoint[];
  /** Масштаб, если на карте один объект. */
  zoom?: number;
  /** Вызывается при каждом сдвиге или масштабировании карты. */
  onBoundsChange?: (bounds: MapBounds) => void;
  /** Объект, метку которого нужно выделить. */
  highlightId?: number | null;
};

/** Карта объектов на Яндекс Картах: метки с ценой, кластеры, карточка во всплывающем окне, зум колёсиком. */
export default function PropertiesMap({ points, zoom = 15, onBoundsChange, highlightId = null }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMaps>(null);
  const managerRef = useRef<YMaps>(null);
  const ymapsRef = useRef<YMaps>(null);
  const pointsRef = useRef(points);
  const onBoundsRef = useRef(onBoundsChange);
  const highlightedRef = useRef<number | null>(null);
  const highlightedClusterRef = useRef<string | null>(null);
  const renderRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  // Перерисовываем метки только при реальной смене набора объектов, а не при каждом рендере.
  const signature = points.map((p) => `${p.id}:${p.lat}:${p.lng}:${p.price}`).join("|");

  useEffect(() => {
    pointsRef.current = points;
    onBoundsRef.current = onBoundsChange;
  });

  useEffect(() => {
    let destroyed = false;
    loadYmaps()
      .then((ymaps) => {
        if (destroyed || !containerRef.current) return;
        // Если объект один (страница объекта), карта сразу создаётся с центром на нём.
        const initial = pointsRef.current;
        const single = initial.length === 1;
        const map = new ymaps.Map(
          containerRef.current,
          {
            center: single ? [initial[0].lat, initial[0].lng] : MAP_CENTER,
            zoom: single ? zoom : MAP_ZOOM,
            controls: [],
          },
          { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true },
        );
        addControls(map);
        const opts = priceMarkerOptions(ymaps);
        const manager = new ymaps.ObjectManager({ clusterize: true, gridSize: 72 });
        manager.objects.options.set(opts.objects);
        manager.clusters.options.set(opts.clusters);
        map.geoObjects.add(manager);
        map.events.add("boundschange", () => onBoundsRef.current?.(map.getBounds()));
        ymapsRef.current = ymaps;
        mapRef.current = map;
        managerRef.current = manager;
        setReady(true);
      })
      .catch(() => !destroyed && setError(true));
    return () => {
      destroyed = true;
      mapRef.current?.destroy();
      mapRef.current = null;
      managerRef.current = null;
    };
  }, []);

  // Сначала ставим карту в нужное место и масштаб, и только потом добавляем метки.
  // Если добавить метки, а затем резко сменить масштаб, карта иногда не перерисовывает их
  // до следующего действия пользователя (метка «появляется только после скролла»).
  useEffect(() => {
    const map = mapRef.current;
    const manager = managerRef.current;
    const ymaps = ymapsRef.current;
    if (!ready || !map || !manager || !ymaps) return;
    const pts = pointsRef.current;
    const run = ++renderRef.current;

    manager.removeAll();
    highlightedRef.current = null;
    highlightedClusterRef.current = null;

    const addObjects = () => {
      if (run !== renderRef.current) return; // пока ждали, набор объектов уже сменился
      manager.add({
        type: "FeatureCollection",
        features: pts.map((p) => ({
          type: "Feature",
          id: p.id,
          geometry: { type: "Point", coordinates: [p.lat, p.lng] },
          properties: { iconContent: p.priceShort, hintContent: p.title, balloonHtml: balloonHtml(p) },
        })),
      });
      onBoundsRef.current?.(map.getBounds());
    };

    if (pts.length === 1) {
      map.setCenter([pts[0].lat, pts[0].lng], zoom);
      addObjects();
    } else if (pts.length > 1) {
      const bounds = ymaps.util.bounds.fromPoints(pts.map((p) => [p.lat, p.lng]));
      map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 }).then(() => {
        if (map.getZoom() > 14) map.setZoom(14);
        addObjects();
      }, addObjects);
    } else {
      addObjects();
    }
  }, [ready, signature, zoom]);

  // Подсветка метки при наведении на карточку в списке.
  // Если объект спрятан в кластере, подсвечивается кластер, в котором он лежит.
  useEffect(() => {
    const map = mapRef.current;
    const manager = managerRef.current;
    const ymaps = ymapsRef.current;
    if (!ready || !map || !manager || !ymaps) return;
    const l = getLayouts(ymaps);

    const apply = () => {
      const prev = highlightedRef.current;
      if (prev != null && manager.objects.getById(prev)) {
        manager.objects.setObjectOptions(prev, { iconLayout: l.price, zIndex: 0 });
      }
      const prevCluster = highlightedClusterRef.current;
      if (prevCluster != null && manager.clusters.getById(prevCluster)) {
        manager.clusters.setClusterOptions(prevCluster, { clusterIconLayout: l.cluster, zIndex: 0 });
      }
      highlightedRef.current = null;
      highlightedClusterRef.current = null;

      if (highlightId == null || !manager.objects.getById(highlightId)) return;
      const state = manager.getObjectState(highlightId);
      if (state.isClustered && state.cluster) {
        manager.clusters.setClusterOptions(state.cluster.id, { clusterIconLayout: l.clusterActive, zIndex: 1000 });
        highlightedClusterRef.current = state.cluster.id;
      } else {
        manager.objects.setObjectOptions(highlightId, { iconLayout: l.priceActive, zIndex: 1000 });
        highlightedRef.current = highlightId;
      }
    };

    apply();
    // После зума кластеры пересобираются, поэтому подсветку применяем заново.
    map.events.add("boundschange", apply);
    return () => map.events.remove("boundschange", apply);
  }, [ready, highlightId, signature]);

  if (error) return <MapError />;
  return <div ref={containerRef} className="isolate h-full w-full" />;
}
