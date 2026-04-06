// Lightweight stand-in for the Leaflet-based WindMap.
// Leaflet does not work in JSDOM, so we replace it with a testable div that
// exposes the same callback contract: onTurbineClick and onMapClick.
// Tests that care about map state read data attributes from data-testid="wind-map".
export default function WindMap({ turbines, selectedId, mode, onMapClick, onTurbineClick }) {
  return (
    <div data-testid="wind-map" data-mode={mode}>
      {turbines.map((t, i) => (
        <button
          key={t.id}
          data-testid="turbine-marker"
          data-turbine-id={t.id}
          aria-label={`Turbine ${i + 1}`}
          aria-pressed={t.id === selectedId}
          onClick={() => onTurbineClick(t.id)}
        >
          T{i + 1}
        </button>
      ))}
      {/* A stable click target for "tap the map" interactions */}
      <button data-testid="map-surface" aria-label="Map surface" onClick={() => onMapClick(55.5, 7.9)}>
        Map
      </button>
    </div>
  );
}
