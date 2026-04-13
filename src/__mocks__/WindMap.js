// Lightweight stand-in for the Leaflet-based WindMap.
// Leaflet does not work in JSDOM, so we replace it with a testable div that
// exposes the same callback contract: onTurbineClick and onMapClick.
// Tests that care about map state read data attributes from data-testid="wind-map".
export default function WindMap({ turbines, selectedId, mode, onMapClick, onTurbineClick, showSpacingRing, spacingRingDiameters, center, zoom, onViewChange, onSelectedTurbineMove }) {
  return (
    <div
      data-testid="wind-map"
      data-mode={mode}
      data-show-spacing-ring={showSpacingRing ? 'true' : 'false'}
      data-spacing-ring-diameters={spacingRingDiameters}
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      onMouseDown={(e) => {
        // Simulate middle-mouse-button panning: the real WindMap lets middle-
        // click-drag pan the map even when left-button dragging is disabled.
        if (e.button === 1) {
          e.preventDefault();
          onViewChange?.([56.0, 8.5], 12);
        }
      }}
    >
      {turbines.map((t, i) => (
        <button
          key={t.id}
          data-testid="turbine-marker"
          data-turbine-id={t.id}
          aria-label={t.name || `Turbine ${i + 1}`}
          aria-pressed={t.id === selectedId}
          onClick={() => onTurbineClick(t.id, { x: 0, y: 0 })}
        >
          T{i + 1}
        </button>
      ))}
      {/* A stable click target for "tap the map" interactions */}
      <button data-testid="map-surface" aria-label="Map surface" onClick={() => onMapClick(55.5, 7.9, { x: 0, y: 0 })}>
        Map
      </button>
      {/* Simulates a user pan/zoom to a known location for testing persistence */}
      <button data-testid="map-view-change" aria-label="Change map view" onClick={() => onViewChange?.([56.0, 8.5], 12)}>
        Change view
      </button>
    </div>
  );
}
