import { useState, useEffect } from 'react';

export const STORAGE_KEY = 'wind-farm-layout';
export const FLEET_DEFAULTS = { hubHeight: 120, rotorDiameter: 150, ratedPower: 5.0 };

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ turbines, fleet }));
    } catch {
      // Storage unavailable or full — silently ignore.
    }
  }, [turbines, fleet]);

  return { turbines, setTurbines, fleet, setFleet };
}
