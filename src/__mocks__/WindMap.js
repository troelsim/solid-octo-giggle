// Lightweight stand-in for the Leaflet-based WindMap.
// Leaflet does not work in JSDOM, so we replace it with a testable div that
// exposes the same callback contract: onTurbineClick and onMapClick.
// Tests that care about map state read data attributes from data-testid="wind-map".
//
// Clicking on `data-testid="map-surface"` fires onMapClick at the coordinates
// stored on the host's `data-click-lat` / `data-click-lng` attributes.  The
// driver's clickMapAt(lat, lng) sets those before dispatching the click, so
// multiple vertices can be placed at distinct lat/lngs.  If unset, a default
// pair (55.5, 7.9) is used, preserving behaviour for existing tests.
import { useRef } from 'react';

export default function WindMap({ turbines, selectedId, mode, onMapClick, onTurbineClick, showSpacingRing, spacingRingDiameters, polygonDraft, center, zoom, onViewChange, onSelectedTurbineMove }) {
  const hostRef = useRef(null);

  function fireMapClick() {
    const host = hostRef.current;
    const lat = parseFloat(host?.dataset.clickLat ?? '55.5');
    const lng = parseFloat(host?.dataset.clickLng ?? '7.9');
    onMapClick(lat, lng, { x: 0, y: 0 });
  }

  const draft = polygonDraft ?? [];

  return (
    <div
      ref={hostRef}
      data-testid="wind-map"
      data-mode={mode}
      data-show-spacing-ring={showSpacingRing ? 'true' : 'false'}
      data-spacing-ring-diameters={spacingRingDiameters}
      data-polygon-vertex-count={draft.length}
      data-polygon-vertices={JSON.stringify(draft)}
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
      {/* A stable click target for "tap the map" interactions.  Reads the
          target lat/lng from the host div's dataset, so the driver can
          place vertices / turbines at specific coordinates. */}
      <button data-testid="map-surface" aria-label="Map surface" onClick={fireMapClick}>
        Map
      </button>
      {/* Simulates a user pan/zoom to a known location for testing persistence */}
      <button data-testid="map-view-change" aria-label="Change map view" onClick={() => onViewChange?.([56.0, 8.5], 12)}>
        Change view
      </button>
    </div>
  );
}
