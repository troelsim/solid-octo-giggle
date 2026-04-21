# CSS Class Taxonomy

This codebase has exactly five kinds of CSS artefact. Every declaration you
write must fit into one of them. If it doesn't, stop and ask — don't invent a
sixth category.

## The five layers

| Layer | Lives in | Owns | Never touches |
|---|---|---|---|
| **1. Tokens** | `tokens.css` | colour values, spacing scale, radii, shadows, type scale, transitions | selectors, components |
| **2. Shape classes** | component CSS | geometry: `width`, `height`, `padding`, `border-radius`, `display`, `flex`, `gap`, `font-size`, `font-weight`, `line-height` | `background`, `color`, `border-color`, `box-shadow` |
| **3. Skin classes** | component CSS | visual identity: `background`, `color`, `border`, `box-shadow`, `text-decoration-color`, and the matching `:active`/`:hover`/`:disabled` states | `width`, `height`, `padding`, `border-radius`, typography |
| **4. Component classes** | component CSS | a named concrete thing (`.turbine-popover`, `.bottom-panel`). May set both shape and skin, but every value must come from tokens and the class must not be reused elsewhere as a mix-in. | raw colour literals, raw px outside the 4-px scale |
| **5. State modifiers** | component CSS, always `--suffix` | toggle a skin (active/on/danger/disabled). Attach to **skin** classes, not shape classes. | geometry |

## Decision rule

When adding a property to a class, ask: *does this property describe how big
the thing is, or how it looks?* Size → shape class. Look → skin class. If you
find yourself writing both in the same rule, split it unless the class is a
one-off component (layer 4).

## Composition in JSX

One shape + one skin + zero-or-one state:

```jsx
<button className="btn-icon-36 skin-brand-fill">+</button>
<button className={`btn-icon-36 skin-ghost${active ? ' skin-ghost--on' : ''}`}>⚙</button>
<button className="btn-pill-sm skin-danger">Delete</button>
```

Never compose two shape classes, and never compose two skin classes. If a
button needs to look different in two contexts, that's a new skin, not a
modifier stacked on another skin.

## Rules, in order of how much pain breaking them will cause

1. **No raw colour literals outside `tokens.css`.** No `#fff`, no `rgba(…)`,
   no hex. If you need a tinted brand colour, add a token.
2. **No `!important`.** If you feel you need it, the shape/skin split is
   being violated somewhere up the cascade. Fix the cascade, not the symptom.
3. **No px literals outside the 4-px `--space-*` scale**, except
   `border-width` (always 1px) and `border-radius` (use `--radius-*`).
4. **No shape class sets colour. No skin class sets size.** A skin must work
   on any shape; a shape must work with any skin.
5. **State modifiers (`--on`, `--danger`, `--active`) attach to skins only.**
   A shape doesn't have states.
6. **Component classes (layer 4) are not mix-ins.** If you want to reuse a
   component's visuals elsewhere, extract a skin first.

## Worked example: adding a mobile "exit" FAB

Wrong (the bug that prompted this doc):

```jsx
<button className="btn-add btn-add--exit">×</button>
```

`btn-add` is a shape-*and*-skin class; the `--exit` modifier fights its
background and loses half the time.

Right:

```jsx
<button className="btn-icon-fab skin-danger">×</button>
```

- `btn-icon-fab` is a shape class: 56px circle, centred content. Reusable.
- `skin-danger` is a skin class: red background, red-tinted active state.
  Reusable on any shape.
- No modifier, no fight.

If `skin-danger` doesn't exist yet, add it to a skin file — don't inline the
colour on the FAB.

## What not to do

- Don't add a modifier that re-declares `background`, `color`, or `border` of
  its base. That means the base was a skin in disguise; split it.
- Don't use `btn-icon` or `btn-text` as a "reset + layout" base that callers
  override. A shape class should stand on its own; if it starts with
  `border: none; background: transparent`, it's pretending to be a skin.
- Don't introduce a new shape without checking if an existing one fits. Five
  icon-button classes with the same 36×36 geometry is a smell, not a feature.
- Don't put `:hover`/`:active` on shape classes. States live on skins.

## Enforcement

- Stylelint will ban `!important`, raw hex, and non-token `rgba(` in component
  CSS (see `.stylelintrc` once added — tracked as step 2 of the migration).
- The Playwright screenshot suite is the regression gate: every new skin or
  skin-modifier needs a scenario in `e2e/screenshots.spec.js`.
- During migration, the old opinionated classes (`btn-add`, `btn-sm`,
  `btn-popover-confirm`, etc.) still exist. Treat them as deprecated: any PR
  that touches a call site must migrate it to the shape+skin pattern.
