# Agent notes — Wind Farm Designer

## Leaflet layering

Leaflet's built-in panes have fixed z-indexes:

| Pane          | z-index |
|---------------|---------|
| `tilePane`    | 200     |
| `overlayPane` | 400     |
| `shadowPane`  | 500     |
| `markerPane`  | 600     |

`L.circle` (and other vector shapes) default to `overlayPane`, so they render **behind** markers automatically — no extra configuration needed.

## Updating Leaflet circles

`L.circle` supports live updates without recreate:

```js
circle.setLatLng([lat, lng]);
circle.setRadius(metres);
```

Use a `ref` object (`ringsRef`, `markersRef`, etc.) keyed by turbine `id` to track instances and diff against the live turbine list each render.

## Rotor diameter → metres

`L.circle` radius is in **metres**, which matches the rotor diameter values stored in the turbine spec directly. No projection math needed.

## Button visibility on dark backgrounds

`var(--color-surface-border)` (`rgba(255,255,255,0.12)`) and `var(--color-muted)` (50% opacity) are too faint for icon buttons that need to be discoverable when inactive. Use at least `rgba(255,255,255,0.25)` for borders and `rgba(242,237,230,0.75)` for icon color on dark surfaces.
