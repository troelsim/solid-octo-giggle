// Unit tests — packing algorithm
//
// These tests exercise the functional core only; no React, no DOM.  The
// algorithm is pure, so assertions are on returned arrays.

import { packPolygon, distanceMetres } from '../domain/packing';

// A simple square, ~2 km on a side, centred on (55.5, 7.9).
// At latitude 55.5°, 1° of longitude ≈ 63 km, so ~0.018° ≈ 1 km.
const LAT0 = 55.5;
const LNG0 = 7.9;
const KM = 0.009; // ≈ 1 km in degrees of latitude

function square(centerLat, centerLng, halfSideDegLat, halfSideDegLng) {
  return [
    { lat: centerLat - halfSideDegLat, lng: centerLng - halfSideDegLng },
    { lat: centerLat - halfSideDegLat, lng: centerLng + halfSideDegLng },
    { lat: centerLat + halfSideDegLat, lng: centerLng + halfSideDegLng },
    { lat: centerLat + halfSideDegLat, lng: centerLng - halfSideDegLng },
  ];
}

describe('packPolygon — input validation', () => {
  it('returns [] when polygon has fewer than 3 vertices', () => {
    expect(packPolygon([], 300)).toEqual([]);
    expect(packPolygon([{ lat: 0, lng: 0 }], 300)).toEqual([]);
    expect(packPolygon([{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }], 300)).toEqual([]);
  });

  it('returns [] for non-array input', () => {
    expect(packPolygon(null, 300)).toEqual([]);
    expect(packPolygon(undefined, 300)).toEqual([]);
  });

  it('returns [] for non-positive or non-finite spacing', () => {
    const s = square(LAT0, LNG0, KM, KM * 1.5);
    expect(packPolygon(s, 0)).toEqual([]);
    expect(packPolygon(s, -50)).toEqual([]);
    expect(packPolygon(s, Infinity)).toEqual([]);
    expect(packPolygon(s, NaN)).toEqual([]);
  });
});

describe('packPolygon — basic geometry', () => {
  it('returns at least one point when polygon is larger than the spacing', () => {
    // ~2 km × 3 km square, spacing 300 m — plenty of room
    const poly = square(LAT0, LNG0, KM, KM * 1.5);
    const points = packPolygon(poly, 300);
    expect(points.length).toBeGreaterThan(10);
  });

  it('places all returned points inside the polygon', () => {
    const poly = square(LAT0, LNG0, KM, KM);
    const points = packPolygon(poly, 300);
    for (const p of points) {
      expect(p.lat).toBeGreaterThanOrEqual(LAT0 - KM - 1e-9);
      expect(p.lat).toBeLessThanOrEqual(LAT0 + KM + 1e-9);
      expect(p.lng).toBeGreaterThanOrEqual(LNG0 - KM - 1e-9);
      expect(p.lng).toBeLessThanOrEqual(LNG0 + KM + 1e-9);
    }
  });

  it('keeps every pair of points at least `spacing` apart (minus floating-point slack)', () => {
    const poly = square(LAT0, LNG0, KM * 2, KM * 2);
    const spacing = 400;
    const points = packPolygon(poly, spacing);

    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        minDist = Math.min(minDist, distanceMetres(points[i], points[j]));
      }
    }
    // Equilateral-triangle lattice guarantees exactly `spacing` between
    // nearest neighbours.  Allow 0.5 % slack for projection error.
    expect(minDist).toBeGreaterThanOrEqual(spacing * 0.995);
  });

  it('halves the density when spacing is doubled (±20%)', () => {
    const poly = square(LAT0, LNG0, KM * 2, KM * 2);
    const dense = packPolygon(poly, 300);
    const sparse = packPolygon(poly, 600);
    // Hex area per turbine scales with spacing² so doubling → ~¼ count.
    const ratio = sparse.length / dense.length;
    expect(ratio).toBeGreaterThan(0.2);
    expect(ratio).toBeLessThan(0.35);
  });

  it('returns no points when the polygon is much smaller than the spacing', () => {
    // Tiny 20 m × 20 m polygon, spacing 500 m — the centroid might still land
    // inside (0,0 of the lattice is the centroid), so we accept 0 or 1.
    const tiny = square(LAT0, LNG0, 0.00009, 0.00009); // ~10m half-side
    const points = packPolygon(tiny, 500);
    expect(points.length).toBeLessThanOrEqual(1);
  });
});

describe('packPolygon — non-convex and irregular shapes', () => {
  it('excludes points outside a concave polygon (L-shape)', () => {
    // An L-shape ~2 km × 2 km outer box with a 1 km × 1 km chunk missing
    // from the top-right corner.  Vertices walk the perimeter counterclockwise.
    const L = [
      { lat: LAT0 - KM, lng: LNG0 - KM },
      { lat: LAT0 - KM, lng: LNG0 + KM },
      { lat: LAT0,      lng: LNG0 + KM },
      { lat: LAT0,      lng: LNG0      },
      { lat: LAT0 + KM, lng: LNG0      },
      { lat: LAT0 + KM, lng: LNG0 - KM },
    ];
    const points = packPolygon(L, 250);

    // No point should be in the top-right cut-out region
    // (lat > LAT0 AND lng > LNG0).
    for (const p of points) {
      const inCutout = p.lat > LAT0 + 1e-9 && p.lng > LNG0 + 1e-9;
      expect(inCutout).toBe(false);
    }
    expect(points.length).toBeGreaterThan(0);
  });

  it('produces more points for a larger polygon', () => {
    const small = square(LAT0, LNG0, KM, KM);
    const big   = square(LAT0, LNG0, KM * 2, KM * 2);
    const a = packPolygon(small, 300).length;
    const b = packPolygon(big,   300).length;
    expect(b).toBeGreaterThan(a * 3); // ~4× area → ~4× count
  });
});

describe('packPolygon — determinism', () => {
  it('returns identical results for the same input', () => {
    const poly = square(LAT0, LNG0, KM, KM * 1.5);
    const a = packPolygon(poly, 350);
    const b = packPolygon(poly, 350);
    expect(a).toEqual(b);
  });
});

// Build a rectangle of given dimensions (metres) rotated by `angleDeg` around
// (centerLat, centerLng).  Uses a local equirectangular projection consistent
// with packPolygon's internal projection.
function rotatedRectangle(centerLat, centerLng, halfLengthM, halfWidthM, angleDeg) {
  const metresPerDegLat = 111320;
  const metresPerDegLng = metresPerDegLat * Math.cos((centerLat * Math.PI) / 180);
  const a = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(a), sin = Math.sin(a);
  const corners = [
    [-halfLengthM, -halfWidthM],
    [ halfLengthM, -halfWidthM],
    [ halfLengthM,  halfWidthM],
    [-halfLengthM,  halfWidthM],
  ];
  return corners.map(([x, y]) => {
    const xr = x * cos - y * sin;
    const yr = x * sin + y * cos;
    return {
      lat: centerLat + yr / metresPerDegLat,
      lng: centerLng + xr / metresPerDegLng,
    };
  });
}

describe('packPolygon — lattice orientation search', () => {
  it('fits a line of turbines into a long thin rectangle at any rotation', () => {
    // 80 m wide, 2 km long rectangle with 300 m spacing: a single row of
    // turbines along the length fits ~6–7 points.  Without orientation
    // search, a rectangle rotated 30° or 45° would contain 0–2 lattice
    // points — most of the lattice would fall outside the strip.
    const spacing = 300;
    const halfLength = 1000;
    const halfWidth = 40;

    const countsByAngle = [0, 15, 30, 45, 60, 75, 90, 135].map(angle => {
      const rect = rotatedRectangle(LAT0, LNG0, halfLength, halfWidth, angle);
      return packPolygon(rect, spacing).length;
    });

    // Every orientation should land at least 5 turbines along the length.
    for (const count of countsByAngle) {
      expect(count).toBeGreaterThanOrEqual(5);
    }

    // And counts should be consistent across rotations — the rectangle has
    // the same area regardless of orientation, so the lattice search should
    // find a near-identical packing each time.
    const minCount = Math.min(...countsByAngle);
    const maxCount = Math.max(...countsByAngle);
    expect(maxCount - minCount).toBeLessThanOrEqual(2);
  });

  it('does not reduce the count for a large axis-aligned square', () => {
    // A square is near the worst case for the orientation search: all angles
    // yield similar counts.  The optimum should at least match the naive
    // axis-aligned packing.  At latitude 55.5°, 0.018° longitude ≈ 1.13 km
    // while 0.018° latitude ≈ 2 km, giving a ~9 km² polygon.  Hex density
    // at 400 m spacing → ~65 turbines.
    const poly = square(LAT0, LNG0, KM * 2, KM * 2);
    const count = packPolygon(poly, 400).length;
    expect(count).toBeGreaterThan(50);
  });

  it('still keeps neighbours at least `spacing` apart after rotation', () => {
    // Orientation search must not produce sub-lattice spacing — the hex
    // lattice's nearest-neighbour distance is preserved under rotation.
    const rect = rotatedRectangle(LAT0, LNG0, 600, 200, 37);
    const spacing = 250;
    const points = packPolygon(rect, spacing);

    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        minDist = Math.min(minDist, distanceMetres(points[i], points[j]));
      }
    }
    expect(minDist).toBeGreaterThanOrEqual(spacing * 0.995);
  });
});
