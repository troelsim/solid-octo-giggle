// Turbine packing — pure functional core.
//
// Given a polygon of {lat, lng} vertices and a center-to-center spacing in
// metres, returns hex-packed turbine positions that lie inside the polygon.
// The algorithm:
//   1. Project lat/lng → local east/north metres using an equirectangular
//      approximation around the polygon centroid. Accurate to ~0.1% for
//      polygons up to tens of km — far better than wind-farm placement needs.
//   2. Build an axis-aligned hex (equilateral triangular) lattice anchored
//      at the centroid of the polygon:
//        dx = spacing
//        dy = spacing * √3 / 2
//        odd rows are offset by spacing/2
//   3. Keep lattice points whose projected coordinate lies inside the polygon
//      (ray-cast point-in-polygon).
//   4. Unproject back to lat/lng.
//
// Deterministic given the same polygon/spacing so tests can assert on exact
// counts and positions.

const METRES_PER_DEG_LAT = 111320;

function mPerDegLng(latRef) {
  return METRES_PER_DEG_LAT * Math.cos((latRef * Math.PI) / 180);
}

function project(polygon, latRef, lngRef) {
  const mxLng = mPerDegLng(latRef);
  return polygon.map(({ lat, lng }) => ({
    x: (lng - lngRef) * mxLng,
    y: (lat - latRef) * METRES_PER_DEG_LAT,
  }));
}

function unproject(x, y, latRef, lngRef) {
  return {
    lat: latRef + y / METRES_PER_DEG_LAT,
    lng: lngRef + x / mPerDegLng(latRef),
  };
}

// Ray-casting point-in-polygon in the projected plane.
function pointInPolygon(px, py, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].x, yi = ring[i].y;
    const xj = ring[j].x, yj = ring[j].y;
    const intersect =
      (yi > py) !== (yj > py) &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Pack a polygon with hex-lattice turbine positions.
 *
 * @param {Array<{lat:number, lng:number}>} polygon  At least 3 vertices.
 * @param {number} spacing  Center-to-center spacing in metres. Must be > 0.
 * @returns {Array<{lat:number, lng:number}>}  Positions inside the polygon.
 *   Empty if fewer than 3 vertices or spacing is non-finite/≤0.
 */
export function packPolygon(polygon, spacing) {
  if (!Array.isArray(polygon) || polygon.length < 3) return [];
  if (!Number.isFinite(spacing) || spacing <= 0) return [];

  const latRef = polygon.reduce((a, p) => a + p.lat, 0) / polygon.length;
  const lngRef = polygon.reduce((a, p) => a + p.lng, 0) / polygon.length;

  const projected = project(polygon, latRef, lngRef);
  const xs = projected.map(p => p.x);
  const ys = projected.map(p => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);

  const dx = spacing;
  const dy = spacing * Math.sqrt(3) / 2;

  // Lattice is anchored at projected origin (0, 0) which equals the polygon
  // centroid, so symmetric shapes get a visually-centred packing.  Widen the
  // row/col range by one on each side to catch points at the boundary.
  const rowStart = Math.floor(yMin / dy) - 1;
  const rowEnd   = Math.ceil(yMax / dy) + 1;
  const colStart = Math.floor(xMin / dx) - 1;
  const colEnd   = Math.ceil(xMax / dx) + 1;

  const results = [];
  for (let r = rowStart; r <= rowEnd; r++) {
    const y = r * dy;
    const offsetX = r % 2 === 0 ? 0 : dx / 2;
    for (let c = colStart; c <= colEnd; c++) {
      const x = c * dx + offsetX;
      if (pointInPolygon(x, y, projected)) {
        results.push(unproject(x, y, latRef, lngRef));
      }
    }
  }
  return results;
}

/**
 * Great-circle approximation suitable for sub-100-km distances used here.
 * Returns metres.  Exported for tests.
 */
export function distanceMetres(a, b) {
  const latRef = (a.lat + b.lat) / 2;
  const dLat = (a.lat - b.lat) * METRES_PER_DEG_LAT;
  const dLng = (a.lng - b.lng) * mPerDegLng(latRef);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}
