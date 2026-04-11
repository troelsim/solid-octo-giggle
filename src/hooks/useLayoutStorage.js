import { useState, useEffect } from 'react';
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
  const [turbines, setTurbines] = useState(() => loadSaved()?.turbines ?? []);
  const [fleet, setFleet] = useState(() => loadSaved()?.fleet ?? FLEET_DEFAULTS);
  const [mapView, setMapView] = useState(() => loadSaved()?.mapView ?? MAP_VIEW_DEFAULT);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ turbines, fleet, mapView }));
    } catch {
      // Storage unavailable or full — silently ignore.
    }
  }, [turbines, fleet, mapView]);

  return { turbines, setTurbines, fleet, setFleet, mapView, setMapView };
}
