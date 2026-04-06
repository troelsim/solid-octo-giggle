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

  // Blade tips at 0°, 120°, 240° clockwise from north
  const tips = [
    [c, c - bladeLen],
    [c + bladeLen * 0.866, c + bladeLen * 0.5],
    [c - bladeLen * 0.866, c + bladeLen * 0.5],
  ];
  const blades = tips
    .map(
      ([tx, ty]) =>
        `<line x1="${c}" y1="${c}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${color}" stroke-width="${selected ? 2.5 : 2}" stroke-linecap="round"/>`
    )
    .join('');
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

export default function WindMap({ turbines, selectedId, mode, onMapClick, onTurbineClick, fleet, showSpacingRing, spacingRingDiameters, center, zoom, onViewChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const ringsRef = useRef({});
  const tileLayerRef = useRef(null);
  const cbRef = useRef({ onMapClick, onTurbineClick, onViewChange });
  const satInitRef = useRef(false);
  const [satellite, setSatellite] = useState(false);

  // Always keep callbacks fresh without re-running effects
  useEffect(() => {
    cbRef.current = { onMapClick, onTurbineClick, onViewChange };
  });

  // Init map once — guard prevents StrictMode double-initialisation
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: center ?? [55.5, 7.9],
      zoom: zoom ?? 10,
      zoomControl: false,
    });
    L.control.zoom({ position: 'topright' }).addTo(map);
    tileLayerRef.current = L.tileLayer(LAYERS.osm.url, {
      attribution: LAYERS.osm.attribution,
      maxZoom: 19,
    }).addTo(map);
    map.on('click', e => cbRef.current.onMapClick(e.latlng.lat, e.latlng.lng));
    map.on('moveend', () => {
      const c = map.getCenter();
      cbRef.current.onViewChange?.([c.lat, c.lng], map.getZoom());
    });
    mapRef.current = map;
    return () => {
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
      Object.values(ringsRef.current).forEach(r => r.remove());
      ringsRef.current = {};
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
        markersRef.current[t.id].setLatLng([t.lat, t.lng]).setIcon(icon).setZIndexOffset(zOff);
      } else {
        const m = L.marker([t.lat, t.lng], { icon, zIndexOffset: zOff }).addTo(map);
        m.on('click', e => {
          L.DomEvent.stopPropagation(e);
          cbRef.current.onTurbineClick(t.id);
        });
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
