"use client";

import dynamic from "next/dynamic";

// Leaflet работает только в браузере, поэтому карты подгружаются без SSR.
const Loading = () => <div className="h-full w-full animate-pulse bg-warm" />;

export const PropertiesMap = dynamic(() => import("./PropertiesMap"), { ssr: false, loading: Loading });
export const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false, loading: Loading });
