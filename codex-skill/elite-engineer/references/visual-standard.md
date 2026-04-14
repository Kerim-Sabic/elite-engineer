# Visual Standard Reference

## Table of Contents
1. [Typography System](#typography-system)
2. [Color Science — OKLCH](#color-science)
3. [Spacing System](#spacing-system)
4. [Motion Design](#motion-design)
5. [Loading & Perceived Performance](#loading--perceived-performance)
6. [Empty States](#empty-states)
7. [Error States](#error-states)
8. [Optical Alignment](#optical-alignment)

---

## Typography System

### Type Scale

Use a **modular type scale** — mathematically related sizes that create visual rhythm.

**Product UIs — Major Third (1.25×):**
```css
--font-size-xs:   0.64rem;   /* 10.24px — captions, badges */
--font-size-sm:   0.8rem;    /* 12.8px  — secondary text */
--font-size-base: 1rem;      /* 16px    — body text (never smaller) */
--font-size-md:   1.25rem;   /* 20px    — subheadings */
--font-size-lg:   1.563rem;  /* 25px    — section headings */
--font-size-xl:   1.953rem;  /* 31.25px — page headings */
--font-size-2xl:  2.441rem;  /* 39.06px — hero headings */
--font-size-3xl:  3.052rem;  /* 48.83px — display */
```

**Marketing / landing pages — Perfect Fourth (1.333×):**
```css
--font-size-base: 1rem;      /* 16px */
--font-size-md:   1.333rem;  /* 21.33px */
--font-size-lg:   1.777rem;  /* 28.43px */
--font-size-xl:   2.369rem;  /* 37.9px */
--font-size-2xl:  3.157rem;  /* 50.52px */
```

### Line Height & Spacing

| Context | Line Height | Letter Spacing |
|---------|------------|----------------|
| Body text (14-18px) | 1.5 - 1.6 | 0 to +0.01em |
| Subheadings (20-28px) | 1.3 - 1.4 | -0.01em |
| Headings (32px+) | 1.1 - 1.25 | -0.02 to -0.03em |
| Small/caption text | 1.4 - 1.5 | +0.02 to +0.04em |

As text gets larger, line-height and letter-spacing decrease. Large text with generous
line-height looks disconnected. Small text with tight letter-spacing looks cramped.

### Fluid Typography

Use `clamp()` for responsive sizing without breakpoints:

```css
/* Scales from 16px (320px viewport) to 20px (1200px viewport) */
font-size: clamp(1rem, 0.909rem + 0.45vw, 1.25rem);

/* Hero heading: 32px → 64px */
font-size: clamp(2rem, 1rem + 3.636vw, 4rem);
```

### Font Pairing

- **2 typefaces maximum** for most applications. 3 is the ceiling.
- Pair by **contrast**: one geometric sans (Inter, Geist) + one humanist sans (Source Sans)
  or one sans + one serif. Two similar fonts fight each other.
- Use **weight contrast** within a single family when possible (simpler, fewer HTTP requests).

### Minimum Standards
- Body text: **≥16px** (prevents mobile pinch-to-zoom trigger)
- Measure (line length): **45-75 characters** per line. 65 is ideal.
- Paragraph spacing: **0.75em - 1em** between paragraphs

---

## Color Science

### Why OKLCH

HSL is not perceptually uniform. At HSL(60°, 100%, 50%) (yellow) vs HSL(240°, 100%, 50%)
(blue), both claim 50% lightness, but yellow appears far brighter to the human eye. This
makes systematic color palette generation unreliable.

**OKLCH** (Björn Ottosson, 2020) fixes this: two colors at the same L value appear equally
bright. This enables:
- Predictable contrast calculations
- Generate accessible color ramps by adjusting L alone
- Consistent hover/disabled states: reduce chroma, keep lightness
- Wide-gamut P3 support for modern displays

```css
/* oklch(lightness chroma hue) */
/* L: 0-1 (0=black, 1=white), C: 0-0.37, H: 0-360 */
--color-primary:       oklch(59% 0.24 265);
--color-primary-hover: oklch(52% 0.24 265);  /* Darken: reduce L */
--color-primary-muted: oklch(59% 0.10 265);  /* Desaturate: reduce C */
```

### Token Architecture — Three Tiers

**Tier 1 — Primitive tokens** (raw values, never used directly in components):
```css
--primitive-blue-100: oklch(97% 0.02 240);
--primitive-blue-200: oklch(93% 0.04 240);
--primitive-blue-500: oklch(59% 0.24 240);
--primitive-blue-900: oklch(25% 0.10 240);
--primitive-gray-50:  oklch(98% 0.005 240);
--primitive-gray-900: oklch(20% 0.005 240);
```

**Tier 2 — Semantic tokens** (purpose-driven, change per theme):
```css
/* Light mode */
--color-surface:          var(--primitive-gray-50);
--color-surface-raised:   white;
--color-text-primary:     var(--primitive-gray-900);
--color-text-secondary:   var(--primitive-gray-500);
--color-interactive:      var(--primitive-blue-500);
--color-interactive-hover: var(--primitive-blue-600);
--color-danger:           var(--primitive-red-500);
--color-success:          var(--primitive-green-500);
--color-border:           var(--primitive-gray-200);
--color-border-muted:     var(--primitive-gray-100);

/* Dark mode — same names, different values */
.dark {
  --color-surface:        var(--primitive-gray-900);
  --color-surface-raised: var(--primitive-gray-800);
  --color-text-primary:   var(--primitive-gray-50);
  /* ... */
}
```

**Tier 3 — Component tokens** (scoped to specific components):
```css
--button-primary-bg:       var(--color-interactive);
--button-primary-bg-hover: var(--color-interactive-hover);
--button-primary-text:     white;
--input-border:            var(--color-border);
--input-border-focus:      var(--color-interactive);
```

### Dark Mode — Design, Don't Invert

1. **Elevated surfaces get lighter.** Step 1 surface: `oklch(15% ...)`. Step 2: `oklch(20% ...)`.
   Step 3: `oklch(25% ...)`. This replaces shadows (which don't work on dark backgrounds).

2. **Desaturate colors.** Colors designed for white backgrounds look garish on dark.
   Increase lightness 10-20%, reduce chroma slightly.

3. **Adjust text contrast.** Don't use pure white (#fff) text on dark — it causes
   halation (glowing effect). Use oklch(93% 0 0) or similar slightly off-white.

4. **Shadows → luminance.** Drop shadows are invisible on dark backgrounds. Use subtle
   border + luminance difference for elevation.

---

## Spacing System

### 8-Point Grid

All spacing values are multiples of 8px:

```css
--space-1:  0.25rem;  /* 4px  — fine adjustments only */
--space-2:  0.5rem;   /* 8px  — tight padding, icon gaps */
--space-3:  0.75rem;  /* 12px — compact padding */
--space-4:  1rem;     /* 16px — default padding, small gaps */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px — comfortable padding, section gaps */
--space-8:  2rem;     /* 32px — large padding */
--space-10: 2.5rem;   /* 40px — section separation */
--space-12: 3rem;     /* 48px — major section separation */
--space-16: 4rem;     /* 64px — page section separation */
```

### Why 8px
- Scales cleanly for retina (@2x = 16px, @3x = 24px — always whole pixels)
- Most screen sizes are divisible by 8
- Increments are visually distinct enough to enforce consistency
- 4px half-step available for fine adjustments (icon spacing, small text)

### Gestalt Proximity Rule

**Internal spacing ≤ External spacing.** Elements within a group should be closer together
than the distance between groups. This communicates hierarchy through spatial relationships.

```
┌──────────────────┐  ← 16px padding (internal)
│  Card Title      │
│  8px gap         │  ← elements within card are close
│  Card Body       │
│  8px gap         │
│  Card Footer     │
└──────────────────┘
        24px gap       ← between cards is LARGER
┌──────────────────┐
│  Next Card       │
└──────────────────┘
```

---

## Motion Design

### Three Categories

| Category | Duration | Purpose | Examples |
|----------|----------|---------|----------|
| **Feedback** | 100-200ms | Confirm user action | Hover, press, toggle, checkbox |
| **Transition** | 200-500ms | Spatial orientation | Page change, modal open, layout shift |
| **Ambient** | 1000ms+ / loop | System state | Skeleton pulse, gradient shift, loading |

### Springs Over Eased Curves

Spring animations are superior because they:
- Incorporate initial velocity from gestures (drag → release feels physical)
- Are interruptible (change target mid-animation without restart)
- Settle naturally (no explicit duration — physics determines endpoint)

```tsx
// Framer Motion spring examples
const springSnappy = { type: "spring", stiffness: 500, damping: 30 };    // Buttons, toggles
const springGentle = { type: "spring", stiffness: 200, damping: 20 };    // Modals, sheets
const springBouncy = { type: "spring", stiffness: 300, damping: 10 };    // Playful (sparingly)

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={springGentle}
/>
```

### CSS-First Animation

80% of UI motion should be CSS transitions on `transform` and `opacity` — compositor
thread, zero JavaScript, zero library cost:

```css
.button {
  transition: transform 150ms ease, opacity 150ms ease, background-color 150ms ease;
}
.button:hover { background-color: var(--button-primary-bg-hover); }
.button:active { transform: scale(0.97); }

/* Page transitions via View Transitions API */
::view-transition-old(root) { animation: fade-out 200ms ease; }
::view-transition-new(root) { animation: fade-in 200ms ease; }
```

### When to use JS animation libraries (Framer Motion, Motion One):
- Layout animations (elements smoothly moving when list order changes)
- Gesture-driven animations (drag, pinch, swipe)
- Shared layout transitions (element morphing between pages)
- Complex orchestrated sequences (staggered list entries)
- Spring-based interactions

### Reduced Motion

**Always respect `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Or in Framer Motion:
```tsx
const { prefersReducedMotion } = useReducedMotion();
<motion.div animate={{ x: 100 }} transition={prefersReducedMotion ? { duration: 0 } : spring} />
```

### The Animation Test
Every animation must pass ALL four:
1. Does it serve a **functional purpose**? (feedback, orientation, state change, attention)
2. Can it be **CSS-only**?
3. Does it run at **60fps on a low-end phone**?
4. Does it respect **`prefers-reduced-motion`**?

If it fails any test, remove it.

---

## Loading & Perceived Performance

### Skeleton Screens > Spinners

Skeletons are perceived as **20-30% faster** than spinners for identical wait times.
Users feel the page is already loading (progressive) vs. waiting for something to happen
(indeterminate).

**Use skeletons for:**
- Content-heavy loading (feeds, dashboards, data tables)
- Predictable layouts (you know the shape of what will appear)
- Waits > 300ms

**Use spinners for:**
- Brief system actions (<1 second)
- Indeterminate actions where layout is unknown
- Actions within buttons (`<Button loading>Saving...</Button>`)

### Optimistic Updates

For any mutation (create, update, delete) where the outcome is predictable with >95%
confidence, update the UI immediately. Show spinners only for actions that genuinely
require server confirmation before the user can proceed (payments, irreversible deletes).

### Prefetching

- **On hover**: Pre-connect or prefetch navigation targets when the user hovers a link.
  The subsequent click loads instantly.
- **Route prefetching**: Next.js `<Link>` prefetches by default in production.
  Use `prefetch={false}` only for rarely-visited routes.
- **Query prefetching**: `queryClient.prefetchQuery(options)` in route loaders or
  on hover handlers.

---

## Empty States

Every empty state must include:

1. **An illustration or icon** — visual communication of the empty context
2. **A headline** — what this area will contain (not "No data found")
3. **A description** — why it's empty and what the user can do
4. **A primary action** — the CTA to populate this area

```
┌─────────────────────────────────────┐
│                                     │
│         [illustration/icon]         │
│                                     │
│       No campaigns yet              │
│                                     │
│  Create your first campaign to      │
│  start reaching your audience.      │
│                                     │
│     [ + Create Campaign ]           │
│                                     │
└─────────────────────────────────────┘
```

Never show: "No data", "0 results", a blank white space, or a table with headers and no rows.

---

## Error States

Information hierarchy for error states:

1. **What happened** — clear, non-technical description
2. **Why it happened** — brief, honest explanation (if known)
3. **What to do next** — primary recovery action
4. **Escape hatch** — secondary action (go back, contact support)

```
┌─────────────────────────────────────┐
│  ⚠️ Unable to load your projects    │  ← What happened
│                                     │
│  Our servers are experiencing       │  ← Why
│  high traffic. This usually         │
│  resolves within a few minutes.     │
│                                     │
│  [ Try Again ]  [ Go to Dashboard ] │  ← What to do + escape hatch
└─────────────────────────────────────┘
```

Never show: raw error codes, stack traces, "Something went wrong" with no action, or
blame the user.

---

## Optical Alignment

**Mathematical center ≠ visual center.** A play-button triangle in a circle appears
off-center when mathematically centered because visual weight concentrates on the left
side. Nudge right 3-5px.

**Icons in buttons** need asymmetric padding. A leading icon needs less left padding
and more right padding than a trailing icon.

**Text vertically centered in a container** appears low because descenders (g, p, y)
pull the visual center down. Nudge text up 1-2px for optical centering.

**Same-size geometric shapes appear different sizes.** A circle must be slightly larger
than a square to appear the same size. Apple's icon keyline grid compensates with
different bounding boxes for each shape category.

**General rule:** Shift in the opposite direction of visual weight. Design for how humans
perceive, not how pixels measure. When something "looks wrong" despite being
mathematically correct, trust the eye and adjust.
