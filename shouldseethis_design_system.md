# ShouldSeeThis.com — Visual Design System Bible

> Visual reference extracted from https://shouldseethis.com (homepage, /websites/, /hall-of-fame/)
> Extracted: 2026-04-04 | For design inspiration only — no content or copy extracted.

---

## 1. Typography

### Font Families

| Role | Font Family | Source |
|------|-------------|--------|
| Primary / Everything | **Inter** | Google Fonts / System stack |

> The entire site runs on **Inter** — a precision-engineered sans-serif. No serifs, no display fonts, no mixing. The weight and transform do all the heavy lifting.

---

### Font Weights

| Weight | Numeric | Usage |
|--------|---------|-------|
| Regular | `400` | Body copy, descriptions |
| Medium | `500` | Secondary labels |
| Semi-bold | `600` | Card subtitles, secondary CTAs |
| Bold | `700` | Nav links, secondary headings |
| **Black** | `900` | Hero titles, section headers, badges, buttons — used *aggressively* everywhere |

---

### Font Sizes

| Element | Size (px) | Tailwind Class | Weight | Transform |
|---------|-----------|----------------|--------|-----------|
| **H1 — Hero** | `60–72px` | `text-6xl` / `text-7xl` | 900 (Black) | `UPPERCASE` |
| **H2 — Section Header** | `36px` | `text-4xl` | 900 (Black) | `UPPERCASE` |
| **H3 — Card Title** | `20–24px` | `text-xl` / `text-2xl` | 900 (Black) | `UPPERCASE` |
| **Body** | `16–18px` | `text-base` / `text-lg` | 500 (Medium) | Normal |
| **Small / Helper** | `14px` | `text-sm` | 600 | `UPPERCASE` |
| **Labels / Meta** | `12px` | `text-xs` | 700–900 | `UPPERCASE` |
| **Badges / Tags** | `10–12px` | `text-xs` | 900 (Black) | `UPPERCASE` |

---

### Line Heights

| Context | Value | Notes |
|---------|-------|-------|
| Hero headings | `1.0–1.1` | Extremely tight — creates visual impact |
| Section headings | `1.1–1.2` | Tight |
| Body text | `1.5–1.6` | Standard readable |
| Card titles | `1.2` | Slightly tight |

---

### Letter Spacing

| Class | Value | Usage |
|-------|-------|-------|
| `tracking-tight` | `-0.025em` | Hero headings — pulls letters together for density |
| `tracking-normal` | `0em` | Body text |
| `tracking-wide` | `0.025em` | Section sub-labels |
| `tracking-wider` | `0.05em` | Nav links, badges, buttons |
| `tracking-widest` | `0.1em` | Some badge micro-labels |

---

### Text Transforms

- `uppercase` is applied to: **all headings, all badges, all nav items, all buttons, all labels**
- `capitalize` / `lowercase` — not used
- Body paragraphs retain normal casing

---

## 2. Colors

### Full Color Palette

| Hex | Tailwind Name | Purpose |
|-----|---------------|---------|
| `#000000` | `black` | **Primary text**, borders, shadows, button BG |
| `#ffffff` | `white` | Inverted text, card backgrounds, section BG |
| `#facc15` | `yellow-400` | **Hero background** (homepage accent band), primary CTA hover |
| `#fef08a` | `yellow-200` | Light yellow accent, hover tint |
| `#f1f5f9` | `slate-100` | General page background (light gray sections) |
| `#e2e8f0` | `slate-200` | Dividers, card borders (subtle) |
| `#94a3b8` | `slate-400` | Muted text, secondary metadata |
| `#64748b` | `slate-500` | Placeholder text, secondary descriptions |
| `#1e293b` | `slate-800` | Dark section text |
| `#0f172a` | `slate-900` | Near-black, nav background (dark variant) |

---

### Category Accent Colors

| Category | Hex | Tailwind |
|----------|-----|---------|
| **Fun** | `#22c55e` | `green-500` |
| **Interesting** | `#3b82f6` | `blue-500` |
| **Useful** | `#a855f7` | `purple-500` |
| **Weird** | `#ec4899` | `pink-500` |
| **Useless** | `#f97316` | `orange-500` |
| **Art** | `#ef4444` | `red-500` |
| **Tools** | `#06b6d4` | `cyan-500` |

---

### Color Usage Map

| Element | Color |
|---------|-------|
| Page background | `#ffffff` or `#f1f5f9` |
| Hero band background | `#facc15` (Yellow) |
| Navbar background | `#000000` (Black) |
| Navbar text | `#ffffff` |
| Navbar hover | `#facc15` (Yellow) |
| Card background | `#ffffff` |
| Card border | `#000000` |
| Card shadow | `#000000` (hard offset shadow) |
| Primary heading | `#000000` |
| Body text | `#1e293b` |
| Muted / secondary text | `#64748b` |
| Badge background | Category accent color |
| Badge text | `#000000` or `#ffffff` (high contrast) |
| Primary button BG | `#000000` |
| Primary button text | `#ffffff` |
| Primary button hover BG | `#facc15` |
| Primary button hover text | `#000000` |
| Input border | `#000000` |
| Input focus | `#facc15` + hard shadow |

---

## 3. Spacing & Layout

### Page Container

| Property | Value |
|----------|-------|
| Max-width | `1280px` (`max-w-7xl`) |
| Horizontal padding | `px-4` (16px) to `px-8` (32px) |
| Center alignment | `mx-auto` |

---

### Section Spacing

| Context | Padding | Pixels |
|---------|---------|--------|
| Hero section | `py-20` to `py-32` | `80–128px` |
| General sections | `py-16` | `64px` |
| Compact sections | `py-10` | `40px` |
| Section bottom margin | `mb-12` to `mb-16` | `48–64px` |

---

### Card Spacing

| Property | Value |
|----------|-------|
| Card internal padding | `p-6` (24px) |
| Card image area padding | `0` (flush) |
| Card title margin-top | `mt-4` (16px) |
| Card gap in grid | `gap-6` (24px) |

---

### Navigation Spacing

| Property | Value |
|----------|-------|
| Nav height | `~72–80px` |
| Nav item padding | `px-4 py-2` (16px × 8px) |
| Logo margin | `mr-8` |

---

### Grid System

| Context | Columns | Gap |
|---------|---------|-----|
| Cards — default | `3 cols` | `gap-6` (24px) |
| Cards — wide screens | `4–5 cols` | `gap-6` |
| Cards — mobile | `1 col` → `2 col` | `gap-4` |
| Featured row | `2 col` (large + small) | `gap-8` |

---

### Border Radius

| Element | Value | Notes |
|---------|-------|-------|
| **Cards** | `rounded-none` (`0px`) | Sharp corners — brutalist |
| **Buttons (primary)** | `rounded-none` (`0px`) | Same — no softness |
| **Badges / Tags** | `rounded-full` (`9999px`) | Pill shape — contrast with sharp cards |
| **Inputs** | `rounded-none` or `rounded-sm` (`2px`) | Mostly sharp |
| **Images in cards** | `rounded-none` | Flush with card edges |
| **Avatar / icons** | `rounded-full` | Only for circular avatars |

---

## 4. Components

### Navigation Bar

| Property | Value |
|----------|-------|
| Position | Sticky top |
| Background | `#000000` (solid black) |
| Height | `~72px` |
| Logo style | Bold wordmark, `font-black`, `text-xl`, white text, possible yellow accent dot |
| Nav items | `text-sm`, `font-black`, `uppercase`, `tracking-wider`, white |
| Item hover | Text color → `#facc15` (yellow), transition `200ms ease` |
| Active state | `#facc15` text + bottom yellow underline `2px` |
| Nav shadow | `border-b-4 border-black` or `box-shadow: 0 4px 0 0 #000` |
| Mobile | Hamburger menu, full-width dropdown with black BG |

---

### Cards (Website Cards)

| Property | Value |
|----------|-------|
| Background | `#ffffff` |
| Border | `border-4 border-black` (4px solid black) |
| Border radius | `none` (0px) |
| Box shadow | `6px 6px 0 0 #000` (Hard offset — neo-brutalist) |
| Image position | Top, full-width, aspect-ratio locked |
| Title font | `text-xl font-black uppercase` |
| Title color | `#000000` |
| Description | `text-sm` `text-slate-600` normal case |
| Footer | Badges + vote button row |
| **Hover behavior** | `transform: translate(-2px, -4px)` + shadow grows to `8px 8px 0 0 #000` |
| Hover transition | `200ms ease-in-out` |
| Hover optional | Slight `rotate(1deg)` (`rotate-1`) for playful tilt |

---

### Badges / Tags

| Property | Value |
|----------|-------|
| Shape | Pill → `border-radius: 9999px` |
| Padding | `px-3 py-1` (12px × 4px) |
| Font size | `text-xs` (12px) |
| Font weight | `font-black` (900) |
| Text transform | `UPPERCASE` |
| Letter spacing | `tracking-wider` |
| Background | Category accent color (see Color section) |
| Text color | `#000000` (or `#ffffff` on dark badge BG for contrast) |
| Border | `border-2 border-black` |

---

### Buttons

#### Primary Button (Submit / CTA)

| Property | Value |
|----------|-------|
| Background | `#000000` |
| Text color | `#ffffff` |
| Font | `font-black`, `uppercase`, `tracking-wider` |
| Padding | `px-8 py-4` (32px × 16px) |
| Height | `~56px` |
| Border radius | `rounded-none` (0px) |
| Border | `border-4 border-black` |
| Shadow | `4px 4px 0 0 #000` |
| Hover BG | `#facc15` |
| Hover text | `#000000` |
| Hover shadow | Shadow grows or disappears (element "presses in") |
| Transition | `200ms ease` |

#### Secondary / Voting Button

| Property | Value |
|----------|-------|
| Background | `#facc15` |
| Text color | `#000000` |
| Font | `font-bold`, `uppercase` |
| Border | `border-2 border-black` |
| Shadow | `2px 2px 0 0 #000` |
| Hover | BG darkens, shadow collapses (pressed effect) |

---

### Search / Input Fields

| Property | Value |
|----------|-------|
| Height | `56px` (`h-14`) |
| Border | `border-4 border-black` |
| Border radius | `rounded-none` (0px) |
| Background | `#ffffff` |
| Shadow | `4px 4px 0 0 #000` (normal state) |
| Focus shadow | `6px 6px 0 0 #facc15` (yellow) |
| Focus border | `border-black` stays |
| Font size | `text-base` (16px) |
| Font weight | `font-bold` |
| Placeholder | `font-medium`, `text-slate-400`, uppercase style |
| Padding | `px-5` (20px) |
| Transition | `200ms ease` |

---

### Section Headers

| Property | Value |
|----------|-------|
| Font size | `text-4xl` (36px) |
| Font weight | `font-black` (900) |
| Text transform | `UPPERCASE` |
| Color | `#000000` |
| Decorative element | Yellow underline bar `h-2 w-full bg-yellow-400` below title |
| Sub-heading | `text-lg font-medium text-slate-500` |
| Margin bottom | `mb-12` (48px) before content |
| Alignment | Left-aligned (not centered) |

---

## 5. Motion & Interactions

### Transition Defaults

| Property | Duration | Easing |
|----------|----------|--------|
| All interactive | `200ms` | `ease-in-out` |
| Color changes (nav, text) | `150ms` | `ease` |
| Transform (cards hover) | `200ms` | `ease-out` |

---

### Hover Effects by Element

| Element | Hover Transform |
|---------|----------------|
| **Cards** | `translate(-2px, -4px)` + shadow expands: `8px 8px 0 #000` |
| **Cards (playful)** | + slight `rotate(1deg)` |
| **Buttons** | Shadow collapses to `2px 2px` (pressed feel) |
| **Nav links** | Text color → `#facc15`, no transform |
| **Badges** | Slight scale `scale(1.05)` |
| **Search input** | Shadow shifts to yellow tint |

---

### Keyframe Animations

| Animation | Description |
|-----------|-------------|
| Entry fade-in | Cards animate in on page load with `opacity: 0 → 1` + `translateY(10px → 0)` |
| Stagger delay | Each card delayed by `50–100ms` for cascade effect |
| No looping animations | Site is not over-animated — restraint is part of the aesthetic |

---

## 6. Overall Aesthetic Keywords

### 5 Core Aesthetic Keywords

1. **Neo-Brutalist** — Raw black borders, hard offset shadows, no softness
2. **Bold** — Font-weight 900 used aggressively, nothing is shy
3. **Playful** — Bright yellow pops, card tilts, not corporate
4. **High-Contrast** — Black/white/yellow only — no mid-range grays for accent
5. **Editorial** — Typography-first design, layout driven by type scale not decoration

---

### What Makes It Unique vs. Generic Sites

| Aspect | Generic Site | ShouldSeeThis |
|--------|-------------|--------------|
| Shadow | `box-shadow: rgba soft` | `6px 6px 0 #000` — hard, flat, physical |
| Border radius | `8–16px rounded` | `0px` on cards, `full` on badges — intentional contrast |
| Primary accent | Blue or gradient | Yellow `#facc15` — bold and unexpected |
| Typography | Mixed weights, varied fonts | Single font, weight-only variation |
| Hover | Opacity or glow | Physical translate + shadow change = feels real |
| Color palette | Complex, many hues | Restricted: black + white + yellow + category colors |
| Button style | Gradient or flat | Bordered, shadowed, "physical" object |
| Grid | Even, symmetric | Intentionally raw and direct |

---

## Quick Reference Cheat Sheet

```css
/* Core Design Tokens */

/* Typography */
--font-family: 'Inter', system-ui, sans-serif;
--font-weight-body: 500;
--font-weight-label: 700;
--font-weight-heading: 900;
--text-transform-ui: uppercase;
--letter-spacing-ui: 0.05em;

/* Colors */
--color-black: #000000;
--color-white: #ffffff;
--color-yellow: #facc15;
--color-yellow-light: #fef08a;
--color-bg: #f1f5f9;
--color-text-muted: #64748b;
--color-text-primary: #0f172a;

/* Category Colors */
--color-fun: #22c55e;
--color-interesting: #3b82f6;
--color-useful: #a855f7;
--color-weird: #ec4899;
--color-useless: #f97316;
--color-art: #ef4444;

/* Brutalist Shadow (core signature) */
--shadow-card: 6px 6px 0 0 #000000;
--shadow-card-hover: 8px 8px 0 0 #000000;
--shadow-button: 4px 4px 0 0 #000000;
--shadow-button-hover: 2px 2px 0 0 #000000;
--shadow-input-focus: 6px 6px 0 0 #facc15;

/* Borders */
--border-heavy: 4px solid #000000;
--border-medium: 2px solid #000000;

/* Layout */
--container-max: 1280px;
--border-radius-card: 0px;
--border-radius-badge: 9999px;
--border-radius-button: 0px;

/* Spacing */
--section-padding: 64px 0;
--card-padding: 24px;
--grid-gap: 24px;

/* Motion */
--transition-default: all 200ms ease-in-out;
--hover-lift: translate(-2px, -4px);
```

---

*This file is a visual design system reference only. No content, copy, or concepts from the site are replicated here.*
