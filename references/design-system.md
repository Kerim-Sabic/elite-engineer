# Design System Construction Reference

## Table of Contents
1. [Token Naming — Primer's Three Tiers](#token-naming)
2. [Radix Colors — The 12-Step Scale](#radix-colors)
3. [Tailwind v4 + Design Tokens](#tailwind-v4--design-tokens)
4. [CVA — Class Variance Authority](#cva)
5. [Component Primitives Checklist](#component-primitives)
6. [Composition Patterns](#composition-patterns)
7. [Accessibility Built In](#accessibility)

---

## Token Naming

Follow GitHub Primer's three-tier system:

### Tier 1 — Base tokens (raw values)
```css
/* Named by color + scale. Never used directly in component styles. */
--base-color-green-0: oklch(97% 0.02 145);
--base-color-green-1: oklch(94% 0.05 145);
--base-color-green-5: oklch(55% 0.20 145);
--base-color-green-9: oklch(20% 0.08 145);
--base-size-4: 4px;
--base-size-8: 8px;
--base-size-16: 16px;
```

### Tier 2 — Functional/semantic tokens (purpose-driven)
```css
/* Named by PURPOSE, not color. These change per theme/mode.
   Property prefixes use camelCase matching CSS: bgColor, fgColor, borderColor */

/* Backgrounds */
--bgColor-default: var(--base-color-gray-0);
--bgColor-muted: var(--base-color-gray-1);
--bgColor-emphasis: var(--base-color-gray-9);
--bgColor-accent-muted: var(--base-color-blue-1);

/* Foreground / text */
--fgColor-default: var(--base-color-gray-9);
--fgColor-muted: var(--base-color-gray-5);
--fgColor-onEmphasis: white;
--fgColor-accent: var(--base-color-blue-5);
--fgColor-danger: var(--base-color-red-5);
--fgColor-success: var(--base-color-green-5);
--fgColor-attention: var(--base-color-yellow-5);

/* Borders */
--borderColor-default: var(--base-color-gray-2);
--borderColor-muted: var(--base-color-gray-1);
--borderColor-emphasis: var(--base-color-gray-5);
```

### Tier 3 — Component tokens (scoped to specific components)
```css
/* Named: component-variant-property-state */
--button-primary-bgColor-rest: var(--bgColor-accent-emphasis);
--button-primary-bgColor-hover: var(--base-color-blue-6);
--button-primary-bgColor-active: var(--base-color-blue-7);
--button-primary-bgColor-disabled: var(--base-color-gray-3);
--button-primary-fgColor-rest: var(--fgColor-onEmphasis);

--control-borderColor-rest: var(--borderColor-default);
--control-borderColor-focus: var(--base-color-blue-5);
--control-borderColor-emphasis: var(--borderColor-emphasis);

--input-bgColor-rest: var(--bgColor-default);
--input-bgColor-disabled: var(--bgColor-muted);
```

### Semantic Roles
Use consistent role names across the system:
- `default` — neutral/base state
- `accent` / `primary` — brand/interactive color
- `danger` — destructive actions (red)
- `success` — positive outcomes (green)
- `attention` / `warning` — caution (yellow/amber)
- `done` — completed states (purple)
- `muted` — reduced emphasis
- `emphasis` — increased emphasis

---

## Radix Colors

Radix generates color scales with **12 steps**, each with a predefined purpose:

| Step | Use Case | Example |
|------|----------|---------|
| 1 | App background | Page background, canvas |
| 2 | Subtle background | Card background, sidebar |
| 3 | Component background (normal) | Button default, input background |
| 4 | Component background (hover) | Button hover |
| 5 | Component background (active) | Button active/pressed |
| 6 | Subtle border | Separator, divider |
| 7 | Border (default) | Input border, card border |
| 8 | Border (hover/focus) | Input focus ring |
| 9 | Solid fill (default) | Primary button, badge background |
| 10 | Solid fill (hover) | Primary button hover |
| 11 | Low-contrast text | Secondary text, labels |
| 12 | High-contrast text | Primary text, headings |

**Key properties:**
- Steps 9-10 are the highest chroma — they "pop" for interactive elements
- Steps 11-12 pass APCA Lc 60+ against step 1-2 backgrounds
- Dark mode scales are designed independently (not inverted), preserving the same
  semantic purpose at each step
- Every scale has an "alpha" variant for overlaying on variable backgrounds

```css
/* Using Radix Colors */
--bg-surface: var(--gray-1);
--bg-card: var(--gray-2);
--bg-interactive: var(--blue-3);
--bg-interactive-hover: var(--blue-4);
--border-subtle: var(--gray-6);
--border-default: var(--gray-7);
--text-primary: var(--gray-12);
--text-secondary: var(--gray-11);
--accent-solid: var(--blue-9);
--accent-solid-hover: var(--blue-10);
```

---

## Tailwind v4 + Design Tokens

Tailwind CSS v4 introduces `@theme` for native CSS variable integration:

```css
/* app.css — single source of truth for design tokens */
@import "tailwindcss";

@theme {
  /* Colors — OKLCH for perceptual uniformity */
  --color-surface: oklch(98% 0.005 240);
  --color-surface-raised: oklch(100% 0 0);
  --color-primary-500: oklch(59% 0.24 265);
  --color-primary-600: oklch(52% 0.24 265);
  --color-danger-500: oklch(55% 0.22 25);
  --color-text: oklch(20% 0.005 240);
  --color-text-muted: oklch(55% 0.01 240);
  --color-border: oklch(90% 0.01 240);

  /* Typography */
  --font-sans: "Inter", "Geist", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* Spacing (8pt grid) */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px oklch(0% 0 0 / 0.1);
}
```

**How this works:** `--color-primary-500` automatically generates:
- `bg-primary-500`, `text-primary-500`, `border-primary-500`, etc.
- Also available as `var(--color-primary-500)` in custom CSS

**Dark mode with class switching:**
```css
.dark {
  --color-surface: oklch(15% 0.005 240);
  --color-surface-raised: oklch(20% 0.005 240);
  --color-text: oklch(93% 0.005 240);
  --color-text-muted: oklch(65% 0.01 240);
  --color-border: oklch(28% 0.01 240);
}
```

Same utility classes (`bg-surface`, `text-text`), different values per theme. Zero
JavaScript. Zero rebuilds.

---

## CVA

Class Variance Authority provides type-safe, variant-based component styling:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base classes — always applied
  "inline-flex items-center justify-center rounded-md font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700",
        secondary: "bg-surface-raised border border-border text-text hover:bg-surface",
        destructive: "bg-danger-500 text-white hover:bg-danger-600",
        ghost: "text-text hover:bg-surface",
        link: "text-primary-500 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-10 px-4 text-sm gap-2",
        lg: "h-12 px-6 text-base gap-2.5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// Auto-generate TypeScript types from the variant definition
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

// The component
function Button({ variant, size, loading, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
```

### The `cn()` utility (clsx + tailwind-merge)

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Why twMerge: it resolves Tailwind conflicts correctly
cn('px-4 py-2', 'px-6') // → 'py-2 px-6' (not 'px-4 py-2 px-6')
```

---

## Component Primitives

### Button Checklist

Every Button component handles these states:
- [x] Default (rest)
- [x] Hover (`hover:`)
- [x] Active/Pressed (`active:`)
- [x] Focus Visible (`focus-visible:` — ring, not outline on click)
- [x] Disabled (`disabled:` — reduced opacity, no pointer events)
- [x] Loading (spinner, disabled, aria-busy)
- [x] Variants (primary, secondary, destructive, ghost, link)
- [x] Sizes (sm, md, lg, icon)
- [x] Icon support (leading icon, trailing icon, icon-only)
- [x] `asChild` support (render as Link or custom element)

### Input Checklist

- [x] Default, Hover, Focus, Disabled, Error, Read-only states
- [x] Label (always present — use `aria-label` if visually hidden)
- [x] Helper text / description
- [x] Error message (associated via `aria-describedby`)
- [x] Prefix/suffix slots (icons, currency symbols)
- [x] Clearable (optional clear button)

### Dialog/Modal Checklist

- [x] Focus trap (tab doesn't escape to page behind)
- [x] Scroll lock (page doesn't scroll behind modal)
- [x] Escape key closes
- [x] Click outside closes (with `onInteractOutside` override)
- [x] Return focus to trigger on close
- [x] `aria-labelledby` points to title
- [x] `aria-describedby` points to description
- [x] AnimatePresence for entry/exit animation

---

## Composition Patterns

### `asChild` (Radix/shadcn pattern) — Preferred

```tsx
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

function Button({ asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp {...props} />;
}

// Usage — Button styling applied to Link, not a nested <button>
<Button asChild>
  <Link href="/pricing">Pricing</Link>
</Button>
```

### Why `asChild` over `as` prop

The `as` prop creates complex TypeScript generics (`<T extends ElementType>`) that:
- Slow down the TypeScript compiler
- Produce confusing error messages
- Can't chain (what does `as="button" as="a"` mean?)
- Create ambiguous prop types (which props are valid?)

`asChild` with `Slot` merges behavior onto consumer elements. No generics, no ambiguity,
and the consumer controls the rendered element completely.

---

## Accessibility

### First Rule of ARIA

"No ARIA is better than bad ARIA." — W3C

Use semantic HTML first: `<button>`, `<a>`, `<nav>`, `<main>`, `<dialog>`, `<form>`,
`<label>`, `<input>`, `<select>`. These have built-in accessibility. Adding ARIA to
non-semantic elements (div, span) requires reimplementing keyboard handling, focus
management, screen reader announcements, and every interaction pattern.

### When ARIA IS needed

- Custom components with no native equivalent (tabs, combobox, tree view)
- Dynamic content changes (`aria-live` regions for toast notifications)
- Relationships between elements (`aria-describedby`, `aria-labelledby`)
- State that CSS can't communicate (`aria-expanded`, `aria-selected`)

### Keyboard Navigation Requirements

Every interactive element must be:
- Focusable (in tab order or reachable via arrow keys within a group)
- Operable with keyboard (Enter/Space to activate, Escape to dismiss)
- Visually indicated when focused (`focus-visible:` ring, not just outline)

### Color Contrast

- Normal text: **4.5:1** minimum (WCAG AA)
- Large text (≥18px bold or ≥24px): **3:1** minimum
- Interactive component boundaries: **3:1** minimum
- Use OKLCH lightness difference to calculate contrast quickly

### Testing

Test with a real screen reader (VoiceOver on Mac, NVDA on Windows) at least once per
major feature. Automated tools (axe, Lighthouse) catch ~30% of accessibility issues.
Manual testing catches the rest.
