import { useState, useEffect, useRef } from 'react';
import { StoredLayoutSchema } from '../domain/schemas';

export const STORAGE_KEY = 'wind-farm-layout';
export const FLEET_DEFAULTS = { hubHeight: 120, rotorDiameter: 150, ratedPower: 5.0 };
export const MAP_VIEW_DEFAULT = { center: [55.5, 7.9], zoom: 10 };

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const result = StoredLayoutSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Persists turbines and fleet specs to localStorage.
 * Reads saved state on mount; writes on every change.
 * Returns state + setters identical in shape to useState pairs.
 */
export function useLayoutStorage() {
  const isFirstVisit = useRef(!localStorage.getItem(STORAGE_KEY));
  const [turbines, setTurbines] = useState(() => loadSaved()?.turbines ?? []);
  const [fleet, setFleet] = useState(() => loadSaved()?.fleet ?? FLEET_DEFAULTS);
  const [mapView, setMapView] = useState(() => loadSaved()?.mapView ?? MAP_VIEW_DEFAULT);

  // On first visit (no saved layout), try to center the map on the user's
  // current location via the browser Geolocation API.
  useEffect(() => {
    if (!isFirstVisit.current) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapView({
          center: [pos.coords.latitude, pos.coords.longitude],
          zoom: MAP_VIEW_DEFAULT.zoom,
        });
      },
      () => {} // Permission denied or unavailable — keep default
    );
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ turbines, fleet, mapView }));
    } catch {
      // Storage unavailable or full — silently ignore.
    }
  }, [turbines, fleet, mapView]);

  return { turbines, setTurbines, fleet, setFleet, mapView, setMapView };
}
