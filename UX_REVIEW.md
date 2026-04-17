# UX Review — Wind Farm Designer (PadSketch)

_Date: 2026-04-17_

## How to use this document

- Pain points are ordered by severity (`P0` first).
- Improvement ideas are grouped by effort level.
- Use this as a backlog: one improvement per PR, smallest effort first.

---

## First impression

On load at 393×852 the user sees a near-fullscreen dark map, a header bar, and a bottom panel. The primary CTA — the green "+" button — pops clearly against the dark header. The bottom panel shows "Fleet defaults" and three spec inputs (Hub height, Rotor dia., Power).

**Critical:** Map tiles fail to load (9 console errors), leaving a completely black canvas with no loading indicator or error message. First-time users cannot tell whether the app is broken or loading.

---

## What works well

- Green add-mode banner ("Tap or drag to place a turbine") is excellent contextual guidance — visible when needed, gone when not.
- "Custom" badge + "Reset to fleet / Set as fleet defaults" is clean progressive disclosure.
- Delete confirmation popover prevents accidental deletion.
- Bottom panel respects `safe-area-inset-bottom` — correct iOS home indicator handling.
- Satellite toggle is well-placed and clearly labelled.
- Dark green-on-near-black palette is cohesive; design token usage is consistent throughout.

---

## Pain points

### P0 — Fix immediately

| # | Issue | Detail |
|---|---|---|
| 1 | **Black map on load** | Tile loading fails silently (9 console errors). No spinner, no error state. Looks like a broken app. |
| 2 | **No onboarding** | No explanation of hub height, rotor diameter, spacing rings, or the three interaction modes. A new user has no context. |

### P1 — High friction

| # | Issue | Detail |
|---|---|---|
| 3 | **Spacing ring button is cryptic** | Dashed-circle icon with no text label. Purpose ("exclusion zone / spacing constraint") is invisible without a tooltip, which is unavailable on touch. |
| 4 | **Sticky add mode is surprising** | After placing a turbine the banner remains and "Cancel" stays visible — non-standard; users who tap Cancel may not realise their turbine was already saved. |
| 5 | **Export modal has no Copy button** | CSV textarea is read-only. On mobile, selecting all text requires a long-press context menu; a single button would eliminate this. |
| 6 | **Turbine name field looks like static text** | `border: 1px solid transparent` when unfocused — field appears non-editable until tapped. |

### P2 — Low friction / polish

| # | Issue | Detail |
|---|---|---|
| 7 | **SpecField silently rejects bad input** | Entering 0 or a negative value does nothing — the field reverts with no feedback. Users may think the input is broken. |
| 8 | **Export button is nearly invisible on load** | Disabled state (`opacity: 0.45`) on an already-muted `rgba(242,237,230,0.5)` base makes it almost indistinguishable from the background. |
| 9 | **"Fleet defaults" concept unexplained** | The relationship between fleet defaults and per-turbine overrides is not described anywhere in the UI. |
| 10 | **Import format is buried** | The required CSV structure is revealed only inside the textarea placeholder; wrong input fails silently. |
| 11 | **Touch targets below minimum** | Export / Import text buttons are ~32 px tall — below the 44 px WCAG minimum. |

---

## Interaction flows

### Placing turbines
1. Tap "+" → green banner appears, "+" becomes "Cancel"
2. Tap map → turbine placed; bottom panel switches to single-turbine editor
3. Mode stays sticky — tap map again to place another immediately
4. Tap "Cancel" or Escape to return to view mode

### Selecting / editing a turbine
- Tap placed marker → bottom panel shows that turbine's editor
- Spec changes create a "custom" badge with secondary actions ("Reset to fleet" / "Set as fleet defaults")

### Moving a turbine
- Tap "Move" → bottom panel hides (gives full map access) → banner appears → tap/drag new location

### Import / Export
- Full-screen textarea modals; Export has a safety confirm-before-replace step on import

---

## Visual design notes

Typography is clear: bold uppercase small-caps for field names, regular weight for values. Contrast concern: the popover title text (10 px uppercase in muted colour) is at the edge of legibility for average-vision users. The "+" primary action is top-right — the hardest zone for one-handed thumb use on mobile.

---

## Improvement ideas

### Quick wins (low effort, high impact)

1. **Fix map tiles / add a loading state** — show a spinner until tiles arrive; show an inline error banner if they fail
2. **Label the spacing ring button** — add "Spacing" text beneath the icon, or a long-press tooltip
3. **Add a Copy button to the Export modal** — one `navigator.clipboard.writeText()` call removes mobile friction
4. **Faint border on turbine name field at rest** — signals editability without disrupting the visual language
5. **Toast or field shake on invalid spec input** — brief red flash instead of silent rejection

### Medium effort

6. **Move "+" to bottom-right as a FAB** — much more ergonomic in the natural one-handed thumb zone; frees header space
7. **First-run onboarding card** — a dismissible overlay on first load explaining the three modes and the spacing ring concept
8. **Inline explanation for "Fleet defaults"** — a "?" icon next to the label opening a one-sentence tooltip
9. **Drag-to-expand bottom panel** — a handle revealing turbine coordinates, total farm capacity, and turbine count without a full modal
10. **Improve import UX** — add a "Download template CSV" link or replace the raw textarea with structured lat / lng / name fields

### Larger ideas

11. **Wind rose / direction overlay** — prevailing wind direction on the map would make spacing decisions meaningful
12. **Wake effect visualisation** — downstream wake cones from each turbine; ties spacing rings to actual aerodynamic reasoning
13. **Undo / redo (Cmd+Z)** — accidental placements are common in sticky add mode; this is an expected affordance
14. **Total farm summary in header** — turbine count, total rated power (MW), estimated land area
15. **Turbine list panel** — scrollable list of placed turbines by name for selection and navigation in larger farms
