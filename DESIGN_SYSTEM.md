# Design System

This document is the source of truth for the design language of this SaaS product. It is intended for both human developers and AI agents building new features.

---

## Stack

- **React 19** (functional components, hooks only)
- **Vanilla CSS** with CSS custom properties (no preprocessor, no Tailwind, no CSS-in-JS)
- **Create React App** toolchain

---

## File Structure

```
src/
├── styles/
│   ├── tokens.css        ← All design tokens (single source of truth)
│   └── base.css          ← Reset + global body/html styles
├── components/
│   ├── Button/
│   │   ├── Button.js
│   │   └── Button.css
│   └── Card/
│       ├── Card.js
│       └── Card.css
├── data/                 ← Static data, separate from components
├── index.css             ← Imports tokens.css and base.css (entry point for globals)
└── App.css               ← App-level layout only (blobs, container, page structure)
```

**Rules:**
- Global tokens live only in `src/styles/tokens.css`. Never hardcode a color, font size, radius, shadow, or spacing value outside of this file.
- Each component owns its own CSS file, imported in its JS file.
- `index.css` is for globals only. Do not add component styles there.
- `App.css` is for page-level layout. Feature/component styles belong in component files.

---

## Design Tokens

All tokens are CSS custom properties defined in `src/styles/tokens.css` and available globally.

### Colors

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#111410` | Page background |
| `--color-text` | `#f2ede6` | Primary text |
| `--color-muted` | `rgba(242, 237, 230, 0.5)` | Secondary/placeholder text |
| `--color-primary` | `#1e7d5a` | Brand primary (green) |
| `--color-primary-light` | `#2aaa78` | Lighter primary, accent highlights |
| `--color-accent-red` | `#c8312a` | Destructive actions, alerts |
| `--color-accent-amber` | `#e09020` | Warnings, gradient accents |
| `--color-surface` | `rgba(255, 255, 255, 0.06)` | Card/panel backgrounds (glassmorphism) |
| `--color-surface-border` | `rgba(255, 255, 255, 0.12)` | Card/panel borders |

**Dark theme only.** When adding a light theme, introduce `[data-theme="light"]` overrides in `tokens.css` rather than creating new tokens.

### Spacing

Based on a **4px base unit**. Use these tokens for all margin, padding, and gap values.

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-7` | `28px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |

### Typography

| Token | Value | Approx px |
|---|---|---|
| `--font-sans` | System UI stack | — |
| `--font-mono` | Monospace stack | — |
| `--text-xs` | `0.75rem` | 12px |
| `--text-sm` | `0.85rem` | 13.6px |
| `--text-base` | `1rem` | 16px |
| `--text-md` | `1.05rem` | 16.8px |
| `--text-lg` | `1.2rem` | 19.2px |
| `--text-xl` | `1.3rem` | 20.8px |
| `--text-2xl` | `2.4rem` | 38.4px |
| `--text-3xl` | `3rem` | 48px |
| `--weight-normal` | `400` | — |
| `--weight-bold` | `700` | — |
| `--weight-extrabold` | `800` | — |

**Line heights** are set per context (not tokenized) — use `1.5`–`1.65` for body text, `1` for large display headings.

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Chips, tags, small inputs |
| `--radius-md` | `16px` | Buttons, inputs |
| `--radius-lg` | `24px` | Cards, modals, panels |
| `--radius-full` | `9999px` | Pills, avatars |

### Shadows

Shadows are tinted with the primary green to maintain visual coherence.

| Token | Value | Usage |
|---|---|---|
| `--shadow-primary` | `0 4px 24px rgba(30, 125, 90, 0.35)` | Default button |
| `--shadow-primary-hover` | `0 8px 32px rgba(30, 125, 90, 0.45)` | Button hover |
| `--shadow-primary-active` | `0 2px 12px rgba(30, 125, 90, 0.25)` | Button pressed |

When adding new shadow tokens (e.g., for destructive buttons), follow the same pattern: tint with the relevant accent color.

### Transitions

| Token | Value | Usage |
|---|---|---|
| `--transition-fast` | `0.15s ease` | Hover effects, scale |
| `--transition-base` | `0.18s ease` | Fade in/out, card animations |

### Breakpoints

Not tokenized (CSS custom properties can't be used in `@media` queries). Use these values directly:

| Name | Value | Usage |
|---|---|---|
| `sm` | `520px` | Tablet and up |

---

## Components

### Button

**File:** `src/components/Button/Button.js`

```jsx
import Button from './components/Button/Button';

<Button onClick={fn}>Label</Button>
<Button variant="primary" onClick={fn}>Label</Button>
```

**Props:**
- `variant` — `"primary"` (default). Add new variants by adding `.btn-[variant]` rules in `Button.css`.
- `onClick` — click handler
- `className` — merged with internal classes
- All native `<button>` attributes are forwarded via `...props`

**Adding a new variant** (e.g. destructive):
1. Add `.btn-destructive { ... }` in `Button.css` using `--color-accent-red`.
2. Use `<Button variant="destructive">`.

---

### Card

**File:** `src/components/Card/Card.js`

```jsx
import Card from './components/Card/Card';

<Card>Content</Card>
<Card className="my-extra-class">Content</Card>
```

**Props:**
- `className` — merged with `.card`
- All native `<div>` attributes are forwarded via `...props`

The card uses the glassmorphism surface style (`--color-surface`, `--color-surface-border`, `backdrop-filter: blur`). It handles its own padding at both mobile and tablet breakpoints.

---

## Visual Language

### Glassmorphism Surface

All card/panel surfaces use a semi-transparent frosted glass style:

```css
background: var(--color-surface);           /* rgba white ~6% */
border: 1px solid var(--color-surface-border); /* rgba white ~12% */
border-radius: var(--radius-lg);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
```

### Background Blobs

The page background uses three radial color blobs (fixed position, blurred) to create ambient depth. They are decorative only (`pointer-events: none`, `z-index: 0`). Blob colors map to `--color-primary`, `--color-accent-red`, and `--color-accent-amber`.

When building new pages, reuse this blob pattern by copying the three `.blob` divs into the page root. Do not componentize until there are 3+ pages using it.

### Brand Gradient

Used on the primary button and the divider element:

```css
/* Button */
background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 50%, var(--color-accent-amber) 100%);

/* Divider accent */
background: linear-gradient(90deg, var(--color-primary-light), var(--color-accent-amber));
```

### Typography Hierarchy

| Role | Token | Weight |
|---|---|---|
| Display heading | `--text-2xl` / `--text-3xl` | `--weight-extrabold` |
| Section heading | `--text-xl` | `--weight-bold` |
| Body / card content | `--text-md` | `--weight-normal` |
| Punchline / emphasis | `--text-lg` / `--text-xl` | `--weight-bold` |
| Label / caption | `--text-sm` | `--weight-normal` |
| Micro / counter | `--text-xs` | `--weight-normal` |

---

## Conventions for New Components

1. **One folder per component** — `src/components/ComponentName/ComponentName.js` + `ComponentName.css`.
2. **Reference tokens, never raw values** — every color, size, spacing, radius, shadow, and transition must come from `tokens.css`.
3. **Forward unknown props** — use `...props` spread on the root element so components stay composable.
4. **className merging** — accept a `className` prop and append it: `` className={`base-class ${className}`.trim()} ``.
5. **No inline styles** — use CSS classes. Inline styles bypass the token system.
6. **Mobile-first** — base styles target mobile; use `@media (min-width: 520px)` for desktop overrides.
7. **Don't pre-build** — only create a component when it's needed in at least one real feature. Document the intended API here first.

---

## Planned Components (not yet built)

Document here before building so the design intent is clear.

### Input

Intended API:
```jsx
<Input type="text" placeholder="Search…" value={v} onChange={fn} />
```
- Style: same surface as Card, border `--color-surface-border`, focused border `--color-primary-light`
- Radius: `--radius-md`

### Badge / Tag

Intended API:
```jsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
```
- Variants: `success` (primary green), `warning` (amber), `error` (red), `neutral` (muted)
- Radius: `--radius-full`
- Font size: `--text-xs`, weight: `--weight-bold`

### Modal / Dialog

Intended API:
```jsx
<Modal open={isOpen} onClose={fn} title="Confirm">
  <p>Content</p>
</Modal>
```
- Uses glassmorphism Card as inner surface
- Backdrop: `rgba(0, 0, 0, 0.6)` with `backdrop-filter: blur(4px)`
- Animation: fade + scale in, same timing as card (`--transition-base`)

### Toast / Notification

Intended API:
```jsx
toast.success('Saved!');
toast.error('Something went wrong.');
```
- Fixed position, bottom-right, `z-index: 100`
- Auto-dismiss after 4s
- Variants mirror Badge variants

---

## Adding a New Page

1. Create `src/pages/PageName/PageName.js` and `PageName.css`.
2. Use the blob background pattern from `App.js`.
3. Use `.container` layout from `App.css` or extract it to a shared `Layout` component once 3+ pages exist.
4. Reference tokens throughout; never hardcode values.
