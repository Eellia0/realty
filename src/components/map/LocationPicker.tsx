"use client";

import { useEffect, useRef, useState } from "react";
import { MAP_CENTER, MAP_ZOOM } from "@/lib/site";
import { addControls, getLayouts, loadYmaps, type YMaps } from "./ymaps";
import { MapError } from "./MapError";

export type LatLng = { lat: number; lng: number };

/** Выбор точного положения объекта: клик по карте ставит метку, метку можно перетащить. */
export default function LocationPicker({ value, onChange }: { value: LatLng | null; onChange: (v: LatLng) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMaps>(null);
  const placemarkRef = useRef<YMaps>(null);
  const ymapsRef = useRef<YMaps>(null);
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let destroyed = false;
    loadYmaps()
      .then((ymaps) => {
        if (destroyed || !containerRef.current) return;
        const map = new ymaps.Map(
          containerRef.current,
          { center: MAP_CENTER, zoom: MAP_ZOOM, controls: [] },
          { suppressMapOpenBlock: true },
        );
        addControls(map);
        map.events.add("click", (e: YMaps) => {
          const [lat, lng] = e.get("coords");
          onChangeRef.current({ lat, lng });
        });
        ymapsRef.current = ymaps;
        mapRef.current = map;
        setReady(true);
      })
      .catch(() => !destroyed && setError(true));
    return () => {
      destroyed = true;
      mapRef.current?.destroy();
      mapRef.current = null;
      placemarkRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps = ymapsRef.current;
    if (!ready || !map) return;
    if (!value) {
      if (placemarkRef.current) map.geoObjects.remove(placemarkRef.current);
      placemarkRef.current = null;
      return;
    }
    const coords = [value.lat, value.lng];
    if (placemarkRef.current) {
      placemarkRef.current.geometry.setCoordinates(coords);
    } else {
      const pm = new ymaps.Placemark(coords, {}, {
        draggable: true,
        iconLayout: getLayouts(ymaps).pin,
        iconShape: { type: "Circle", coordinates: [0, -22], radius: 18 },
      });
      pm.events.add("dragend", () => {
        const [lat, lng] = pm.geometry.getCoordinates();
        onChangeRef.current({ lat, lng });
      });
      map.geoObjects.add(pm);
      placemarkRef.current = pm;
    }
    // Центрируем, только если метка ушла за пределы видимой области.
    const [[s, w], [n, e]] = map.getBounds();
    if (value.lat < s || value.lat > n || value.lng < w || value.lng > e || map.getZoom() < 14) {
      map.setCenter(coords, Math.max(map.getZoom(), 16));
    }
  }, [ready, value]);

  if (error) return <MapError />;
  return <div ref={containerRef} className="isolate h-full w-full" />;
}
