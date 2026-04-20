// Turbine packing — pure functional core.
//
// Given a polygon of {lat, lng} vertices and a center-to-center spacing in
// metres, returns hex-packed turbine positions that lie inside the polygon.
// The algorithm:
//   1. Project lat/lng → local east/north metres using an equirectangular
//      approximation around the polygon centroid. Accurate to ~0.1% for
//      polygons up to tens of km — far better than wind-farm placement needs.
//   2. Build a hex (equilateral triangular) lattice anchored at the centroid
//      of the polygon:
//        dx = spacing
//        dy = spacing * √3 / 2
//        odd rows are offset by spacing/2
//   3. Search for the best lattice orientation: sweep rotation angles in
//      [0°, 60°) (the hex lattice has 60° rotational symmetry) and keep the
//      one that yields the most interior points.  Essential for long thin
//      shapes — a 50 m-wide, 2 km-long polygon at 45° rotation packs into
//      a single line of turbines along its length.
//   4. Keep lattice points whose projected coordinate lies inside the polygon
//      (ray-cast point-in-polygon).
//   5. Unproject back to lat/lng.
//
// Deterministic given the same polygon/spacing so tests can assert on exact
// counts and positions.  Ties in interior-point count resolve to the lowest
// angle in the sweep.

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

// Pack at a single lattice orientation.  `projected` is the polygon in local
// metres.  Returns interior lattice points in the same projected frame.
// The lattice is rotated by `angleRad`; equivalently we rotate the polygon by
// -angleRad, pack axis-aligned, and rotate the hits back.
function packAtAngle(projected, spacing, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // Rotate polygon by -angleRad into the lattice frame.
  const rotated = projected.map(p => ({
    x:  p.x * cos + p.y * sin,
    y: -p.x * sin + p.y * cos,
  }));

  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const p of rotated) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }

  const dx = spacing;
  const dy = spacing * Math.sqrt(3) / 2;

  // Lattice anchored at the rotated origin (== polygon centroid).  Widen the
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
      if (pointInPolygon(x, y, rotated)) {
        // Rotate back to the original projected frame.
        results.push({ x: x * cos - y * sin, y: x * sin + y * cos });
      }
    }
  }
  return results;
}

// Number of orientations to try when searching for the best lattice angle.
// The hex lattice has 60° rotational symmetry so angles sweep [0°, 60°).
// 60 steps = 1° granularity: fine enough that a 1000 m-long strip cannot
// drift more than ~17 m across the lattice, which is well within typical
// polygon widths that matter for placement.
const ORIENTATION_STEPS = 60;

/**
 * Pack a polygon with hex-lattice turbine positions.
 *
 * Searches lattice orientations in [0°, 60°) and returns the packing that
 * fits the most turbines.  This matters most for long thin shapes, which
 * without rotation search often contain zero or one lattice point.
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

  let best = [];
  for (let i = 0; i < ORIENTATION_STEPS; i++) {
    const angleRad = (i / ORIENTATION_STEPS) * (Math.PI / 3);
    const candidate = packAtAngle(projected, spacing, angleRad);
    if (candidate.length > best.length) best = candidate;
  }

  return best.map(({ x, y }) => unproject(x, y, latRef, lngRef));
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
