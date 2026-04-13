import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Prevent webpack from resolving Leaflet's default marker images
delete L.Icon.Default.prototype._getIconUrl;

const LAYERS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
};

// Build the three SVG blade lines for a turbine icon.
// Tips are at 0°, 120°, 240° clockwise from north.
function bladesSVG(c, bladeLen, color, strokeWidth) {
  const tips = [
    [c, c - bladeLen],
    [c + bladeLen * 0.866, c + bladeLen * 0.5],
    [c - bladeLen * 0.866, c + bladeLen * 0.5],
  ];
  return tips
    .map(([tx, ty]) =>
      `<line x1="${c}" y1="${c}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`)
    .join('');
}

function makeTurbineIcon(label, selected, moveTarget) {
  const color = moveTarget
    ? 'var(--color-accent-amber, #e09020)'
    : selected
    ? 'var(--color-primary-light, #2aaa78)'
    : '#f2ede6';
  const bgOpacity = selected ? 0.82 : 0.62;
  const bgColor = moveTarget
    ? `rgba(40,28,8,${bgOpacity})`
    : selected
    ? `rgba(8,28,20,${bgOpacity})`
    : `rgba(17,20,16,${bgOpacity})`;
  const size = selected ? 44 : 36;
  const c = size / 2;
  const hubR = selected ? 4 : 3;
  const bladeLen = Math.round(c * 0.72);
  const blades = bladesSVG(c, bladeLen, color, selected ? 2.5 : 2);
  const ring = selected
    ? `<circle cx="${c}" cy="${c}" r="${c - 1.5}" fill="none" stroke="${color}" stroke-width="1" opacity="0.35" ${moveTarget ? 'stroke-dasharray="3 2"' : ''}/>`
    : '';
  const bgCircle = `<circle cx="${c}" cy="${c}" r="${c - 1}" fill="${bgColor}"/>`;

  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size + 14}px">
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="overflow:visible">
        ${bgCircle}${ring}${blades}
        <circle cx="${c}" cy="${c}" r="${hubR}" fill="${color}"/>
      </svg>
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);font-size:10px;font-weight:700;color:${color};white-space:nowrap;font-family:system-ui,sans-serif;text-shadow:0 0 4px #111410,0 0 4px #111410">${label}</div>
    </div>`,
    iconSize: [size, size + 14],
    iconAnchor: [c, c],
  });
}

// Ghost icon shown at the cursor/touch position during add/move mode.
// No label; always uses the selected-size and primary-light colour at reduced opacity.
function makeCursorPreviewIcon() {
  const size = 44;
  const c = size / 2;
  const color = 'var(--color-primary-light, #2aaa78)';
  const bgColor = 'rgba(8,28,20,0.62)';
  const hubR = 4;
  const blades = bladesSVG(c, Math.round(c * 0.72), color, 2.5);
  return L.divIcon({
    className: '',
    html: `<div style="opacity:0.65;width:${size}px;height:${size}px">
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="overflow:visible">
        <circle cx="${c}" cy="${c}" r="${c - 1}" fill="${bgColor}"/>
        <circle cx="${c}" cy="${c}" r="${c - 1.5}" fill="none" stroke="${color}" stroke-width="1" opacity="0.45" stroke-dasharray="3 2"/>
        ${blades}
        <circle cx="${c}" cy="${c}" r="${hubR}" fill="${color}"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [c, c],
  });
}

export default function WindMap({ turbines, selectedId, mode, onMapClick, onTurbineClick, fleet, showSpacingRing, spacingRingDiameters, center, zoom, onViewChange, onSelectedTurbineMove }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const ringsRef = useRef({});
  const tileLayerRef = useRef(null);
  const cbRef = useRef({ onMapClick, onTurbineClick, onViewChange });
  const previewCfgRef = useRef(null);
  const cursorMarkerRef = useRef(null);
  const cursorRingRef = useRef(null);
  const satInitRef = useRef(false);
  const initialCenter = useRef(center ?? [55.5, 7.9]);
  const initialZoom = useRef(zoom ?? 10);
  const [satellite, setSatellite] = useState(false);

  // Always keep callbacks and preview config fresh without re-running effects
  useEffect(() => {
    cbRef.current = { onMapClick, onTurbineClick, onViewChange, selectedId, turbines, onSelectedTurbineMove };
    previewCfgRef.current = mode !== 'view' ? {
      mode, turbines, selectedId, fleet, showSpacingRing, spacingRingDiameters,
    } : null;
  });

  // In add/move mode, disable Leaflet map panning so that any touch gesture is
  // unambiguously a placement gesture rather than a pan.  Pinch-to-zoom is
  // controlled by a separate handler and remains available.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (mode === 'view') {
      map.dragging.enable();
    } else {
      map.dragging.disable();
    }
  }, [mode]);

  // Init map once — guard prevents StrictMode double-initialisation
  useEffect(() => {
    if (mapRef.current) return;
    const mapContainer = containerRef.current;
    const map = L.map(mapContainer, {
      center: initialCenter.current,
      zoom: initialZoom.current,
      zoomControl: false,
    });

    // Keep pinch gestures on the map from triggering browser/page zoom.
    const blockBrowserZoom = e => {
      if (e.ctrlKey || e.type.startsWith('gesture')) e.preventDefault();
    };
    mapContainer.addEventListener('wheel', blockBrowserZoom, { passive: false });
    mapContainer.addEventListener('gesturestart', blockBrowserZoom);
    mapContainer.addEventListener('gesturechange', blockBrowserZoom);
    mapContainer.addEventListener('gestureend', blockBrowserZoom);
    L.control.zoom({ position: 'topright' }).addTo(map);
    tileLayerRef.current = L.tileLayer(LAYERS.osm.url, {
      attribution: LAYERS.osm.attribution,
      maxZoom: 19,
    }).addTo(map);
    map.on('click', e => {
      const { clientX: x, clientY: y } = e.originalEvent;
      cbRef.current.onMapClick(e.latlng.lat, e.latlng.lng, { x, y });
    });
    map.on('moveend', () => {
      const c = map.getCenter();
      cbRef.current.onViewChange?.([c.lat, c.lng], map.getZoom());
    });
    // Emit updated screen position for the selected turbine while the map pans/zooms,
    // so the desktop turbine popover tracks the marker smoothly.
    map.on('move', () => {
      const { selectedId, turbines: ts, onSelectedTurbineMove } = cbRef.current;
      if (!selectedId || !onSelectedTurbineMove) return;
      const t = (ts || []).find(t => t.id === selectedId);
      if (!t) return;
      const containerRect = mapRef.current.getContainer().getBoundingClientRect();
      const pt = mapRef.current.latLngToContainerPoint([t.lat, t.lng]);
      onSelectedTurbineMove({ x: containerRect.left + pt.x, y: containerRect.top + pt.y });
    });

    // Shared helper: move the ghost-turbine preview and its spacing ring to latlng.
    function showPreview(latlng) {
      const cfg = previewCfgRef.current;
      if (!cfg) return;

      // Resolve the spec for ring radius (move → selected turbine's spec; add → fleet defaults).
      let spec = cfg.fleet;
      if (cfg.mode === 'move') {
        const t = cfg.turbines.find(t => t.id === cfg.selectedId);
        if (t) spec = t.custom ?? cfg.fleet;
      }
      const ringRadius = (cfg.spacingRingDiameters ?? 2) * (spec?.rotorDiameter ?? 150);

      // Update or create the preview marker.
      if (cursorMarkerRef.current) {
        cursorMarkerRef.current.setLatLng(latlng).setOpacity(1);
      } else {
        cursorMarkerRef.current = L.marker(latlng, {
          icon: makeCursorPreviewIcon(),
          interactive: false,
          zIndexOffset: 3000,
        }).addTo(map);
      }

      // Update or create the preview ring.
      if (cursorRingRef.current) {
        cursorRingRef.current.setLatLng(latlng).setRadius(ringRadius);
        cursorRingRef.current.setStyle({ opacity: 1 });
      } else {
        cursorRingRef.current = L.circle(latlng, {
          radius: ringRadius,
          color: 'rgba(42, 170, 120, 0.75)',
          fill: false,
          weight: 2,
          dashArray: '5 6',
          interactive: false,
        }).addTo(map);
      }
    }

    // Shared helper: fade out the preview without removing it from the map.
    function hidePreview() {
      if (cursorMarkerRef.current) cursorMarkerRef.current.setOpacity(0);
      if (cursorRingRef.current) cursorRingRef.current.setStyle({ opacity: 0 });
    }

    // Desktop: ghost turbine + spacing ring follow the mouse in add/move mode.
    map.on('mousemove', e => {
      if (!previewCfgRef.current) return;
      showPreview(e.latlng);
    });

    // Hide preview when the cursor leaves the map area.
    map.on('mouseout', hidePreview);

    // Mobile touch drag: show the ghost while the finger moves, then confirm
    // placement on release.  Map dragging is disabled while in add/move mode
    // (see the mode-sync useEffect above), so any touch gesture here is
    // unambiguously a placement gesture.
    //
    // Movements below Leaflet's tap tolerance (15 px) are treated as taps and
    // handled by the map 'click' event instead, preventing double-firing.
    let touchStartPos = null;
    let touchDragging = false;

    const onTouchStart = (e) => {
      touchDragging = false;
      touchStartPos = e.touches.length === 1
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : null; // multi-touch (pinch) — reset so drag state is clean afterwards
    };

    const onTouchMove = (e) => {
      // Suppress browser scroll/overscroll in add/move mode (non-passive listener).
      // Multi-touch left unblocked so pinch-to-zoom remains available.
      if (previewCfgRef.current && e.touches.length === 1) e.preventDefault();

      if (!previewCfgRef.current || e.touches.length !== 1 || !touchStartPos) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPos.x;
      const dy = touch.clientY - touchStartPos.y;
      // Only engage drag-preview once the finger has moved beyond Leaflet's tap
      // tolerance so that a plain tap still falls through to map 'click'.
      if (!touchDragging && Math.sqrt(dx * dx + dy * dy) < 15) return;
      touchDragging = true;
      const rect = mapContainer.getBoundingClientRect();
      const latlng = map.containerPointToLatLng([
        touch.clientX - rect.left,
        touch.clientY - rect.top,
      ]);
      showPreview(latlng);
    };

    const onTouchEnd = (e) => {
      // Only handle touch-end if a drag was in progress; plain taps are handled
      // by Leaflet's map 'click' event so we must not duplicate the call.
      if (!previewCfgRef.current || !touchDragging) return;
      touchDragging = false;
      hidePreview();
      const touch = e.changedTouches[0];
      const rect = mapContainer.getBoundingClientRect();
      const latlng = map.containerPointToLatLng([
        touch.clientX - rect.left,
        touch.clientY - rect.top,
      ]);
      cbRef.current.onMapClick(latlng.lat, latlng.lng, { x: touch.clientX, y: touch.clientY });
    };

    mapContainer.addEventListener('touchstart', onTouchStart, { passive: true });
    // Non-passive so we can call preventDefault() to suppress browser scroll
    // and iOS overscroll while the user is dragging to place a turbine.
    mapContainer.addEventListener('touchmove', onTouchMove, { passive: false });
    mapContainer.addEventListener('touchend', onTouchEnd, { passive: true });

    // Middle-mouse-button panning — allows panning even when Leaflet's default
    // left-button dragging is disabled (add/move mode).  On desktop left-click
    // is reserved for turbine placement; middle-click-drag still pans the map.
    let midPanStart = null;

    const onMidDown = (e) => {
      if (e.button !== 1) return;
      e.preventDefault();
      midPanStart = { x: e.clientX, y: e.clientY };
    };

    const onMidMove = (e) => {
      if (!midPanStart) return;
      const dx = e.clientX - midPanStart.x;
      const dy = e.clientY - midPanStart.y;
      midPanStart = { x: e.clientX, y: e.clientY };
      map.panBy([-dx, -dy], { animate: false });
    };

    const onMidUp = (e) => {
      if (e.button !== 1) return;
      midPanStart = null;
    };

    mapContainer.addEventListener('mousedown', onMidDown);
    document.addEventListener('mousemove', onMidMove);
    document.addEventListener('mouseup', onMidUp);

    mapRef.current = map;
    return () => {
      if (cursorMarkerRef.current) { cursorMarkerRef.current.remove(); cursorMarkerRef.current = null; }
      if (cursorRingRef.current) { cursorRingRef.current.remove(); cursorRingRef.current = null; }
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
      Object.values(ringsRef.current).forEach(r => r.remove());
      ringsRef.current = {};
      mapContainer.removeEventListener('wheel', blockBrowserZoom);
      mapContainer.removeEventListener('gesturestart', blockBrowserZoom);
      mapContainer.removeEventListener('gesturechange', blockBrowserZoom);
      mapContainer.removeEventListener('gestureend', blockBrowserZoom);
      mapContainer.removeEventListener('touchstart', onTouchStart);
      mapContainer.removeEventListener('touchmove', onTouchMove);
      mapContainer.removeEventListener('touchend', onTouchEnd);
      mapContainer.removeEventListener('mousedown', onMidDown);
      document.removeEventListener('mousemove', onMidMove);
      document.removeEventListener('mouseup', onMidUp);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Satellite layer toggle (skip on initial mount via ref)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !satInitRef.current) {
      satInitRef.current = true;
      return;
    }
    if (tileLayerRef.current) tileLayerRef.current.remove();
    const cfg = satellite ? LAYERS.satellite : LAYERS.osm;
    tileLayerRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: 19 }).addTo(map);
    tileLayerRef.current.bringToBack();
  }, [satellite]);

  // Fly to new center/zoom when props change externally (e.g., after geolocation).
  // Compares against the map's current position so user-initiated pans (which
  // echo back through onViewChange) are ignored.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    if (
      Math.abs(c.lat - center[0]) < 0.001 &&
      Math.abs(c.lng - center[1]) < 0.001 &&
      map.getZoom() === zoom
    ) return;
    map.setView(center, zoom);
  }, [center, zoom]);

  // Sync turbine markers and spacing rings
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const liveIds = new Set(turbines.map(t => t.id));

    // Remove markers for deleted turbines
    for (const id of Object.keys(markersRef.current)) {
      if (!liveIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    }

    // Remove rings for deleted turbines
    for (const id of Object.keys(ringsRef.current)) {
      if (!liveIds.has(id)) {
        ringsRef.current[id].remove();
        delete ringsRef.current[id];
      }
    }

    turbines.forEach((t, i) => {
      const sel = t.id === selectedId;
      const moving = mode === 'move' && sel;
      const label = t.name ? t.name.slice(0, 7) : `T${i + 1}`;
      const icon = makeTurbineIcon(label, sel, moving);
      const zOff = sel ? 1000 : 0;

      if (markersRef.current[t.id]) {
        markersRef.current[t.id]
          .setLatLng([t.lat, t.lng])
          .setIcon(icon)
          .setZIndexOffset(zOff)
          // Fade the original turbine badge while its ghost is following the cursor/finger.
          .setOpacity(moving ? 0.3 : 1);
      } else {
        const m = L.marker([t.lat, t.lng], { icon, zIndexOffset: zOff }).addTo(map);
        m.on('click', e => {
          L.DomEvent.stopPropagation(e);
          const { clientX: x, clientY: y } = e.originalEvent;
          cbRef.current.onTurbineClick(t.id, { x, y });
        });
        if (moving) m.setOpacity(0.3);
        markersRef.current[t.id] = m;
      }

      // Spacing ring: radius = N × rotor diameter (in metres)
      const spec = t.custom ?? fleet;
      const ringRadius = (spacingRingDiameters ?? 2) * (spec?.rotorDiameter ?? 150);

      if (showSpacingRing) {
        if (ringsRef.current[t.id]) {
          ringsRef.current[t.id].setLatLng([t.lat, t.lng]).setRadius(ringRadius);
        } else {
          ringsRef.current[t.id] = L.circle([t.lat, t.lng], {
            radius: ringRadius,
            color: 'rgba(17, 20, 16, 0.75)',
            fill: false,
            weight: 2,
            dashArray: '5 7',
          }).addTo(map);
        }
      } else if (ringsRef.current[t.id]) {
        ringsRef.current[t.id].remove();
        delete ringsRef.current[t.id];
      }
    });

    // Remove cursor preview when returning to view mode (mode exits add/move).
    if (mode === 'view') {
      if (cursorMarkerRef.current) {
        cursorMarkerRef.current.remove();
        cursorMarkerRef.current = null;
      }
      if (cursorRingRef.current) {
        cursorRingRef.current.remove();
        cursorRingRef.current = null;
      }
    }
  }, [turbines, selectedId, mode, showSpacingRing, spacingRingDiameters, fleet]);

  return (
    <div className="wind-map-wrapper">
      <div ref={containerRef} className={`wind-map${mode !== 'view' ? ' wind-map--action' : ''}`} />
      <button
        className="layer-btn"
        onClick={() => setSatellite(s => !s)}
        title={satellite ? 'Switch to street map' : 'Switch to satellite'}
      >
        {satellite ? 'Map' : 'Satellite'}
      </button>
    </div>
  );
}
