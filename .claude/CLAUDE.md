# Elite Engineer — Cursor Rules
# The operating system for elite software engineering in TypeScript, React, and Next.js.
# Every principle traces to a named source. Every directive is actionable.

## THE STANDARD

Code exhibits **taste** — Torvalds' term for finding the formulation where special cases
disappear. Seek representations where edge cases become impossible, the type system proves
correctness, and the API guides users into the pit of success.

Five commitments:
1. **Carmack's vigilance** — Make state visible. Prefer straightline execution. Distrust abstraction that hides what's happening.
2. **Hickey's discipline** — Simple ≠ easy. Simple means "one fold" (does one thing). Easy means "nearby" (familiar). Choose simple.
3. **Brooks' realism** — Most complexity is essential (domain-inherent), not accidental (tool-introduced). Model the domain correctly first.
4. **Metz's patience** — "Duplication is far cheaper than the wrong abstraction." Start with Shameless Green. Abstract only with 3+ concrete instances.
5. **Ousterhout's strategy** — Tactical programmers optimize for the next feature. Strategic programmers optimize for great design. Invest 10-20% in design improvements.

## BEFORE THE FIRST LINE

Answer before writing code:
1. What is the **essential complexity**? (Brooks) — What's inherent to the domain?
2. Where are the **boundaries**? (Evans) — Use domain vocabulary for all names.
3. What is the **pit of success**? (Mariani) — Make correct usage easier than incorrect.
4. Is this the **simplest** solution? (Hickey) — Fewest moving parts, fewest ways to misuse.
5. Should I **abstract**? (Metz) — Only with 3+ instances. Otherwise, duplicate.

## ARCHITECTURE LAWS

### Deep Modules Win (Ousterhout)
A module's value = functionality provided minus interface complexity. `useAuth()` returning
`{ user, login, logout, isLoading }` while hiding token management is deep. A hook
requiring callers to manage tokens and headers is shallow.

### Define Errors Out of Existence (Ousterhout)
`deleteItem(id)` succeeds whether the item exists or not — postcondition satisfied either way.

### Dependency Rule (Martin, adapted)
Domain → Application → Presentation → Infrastructure. Dependencies point inward only.
Don't over-apply: skip repository interfaces with no alternative implementation.

### Vertical Slices (Bogard)
Organize by feature, not technical concern. Minimize coupling between slices, maximize within.

### Directory Structure
```
src/
├── app/                    # Next.js routing ONLY — keep thin
│   ├── (public)/
│   ├── (auth)/
│   └── layout.tsx
├── features/               # Vertical slices (primary organization)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── dashboard/
│   └── checkout/
├── shared/                 # Cross-feature (only when used by 3+ features)
│   ├── components/ui/      # Design system primitives
│   ├── hooks/
│   └── utils/
├── core/                   # Providers, config, middleware
└── lib/                    # API clients, constants
```

### Server/Client Boundary
Everything is a Server Component by default. Add `'use client'` ONLY for:
- useState, useReducer, useEffect, useRef (with mutations)
- Event handlers (onClick, onChange, onSubmit)
- Browser APIs (window, document, localStorage)
- Third-party client libraries
- Real-time updates (WebSocket, SSE)

Push `'use client'` to leaf components. Pass Server Components as children through Client Components.

## TYPESCRIPT AT FULL POWER

### Branded Types — Zero runtime, prevents ID confusion
```typescript
type Brand<T, B extends string> = T & { readonly __brand: B };
type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;
function UserId(id: string): UserId { return id as UserId; }
// getUser(postId) → compile error
```

### Discriminated Unions — Impossible states unrepresentable
```typescript
// ❌ NEVER: { isLoading: boolean; data: T | null; error: Error | null }
// ✅ ALWAYS:
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

### Parse, Don't Validate — Zod at boundaries
```typescript
const UserSchema = z.object({ name: z.string(), email: z.string().email() });
type User = z.infer<typeof UserSchema>;
const user = UserSchema.parse(untrustedData); // Runtime validated, fully typed
```

### `as const satisfies` — Literal types + structural validation
```typescript
const ROUTES = {
  home: { path: '/', label: 'Home' },
  about: { path: '/about', label: 'About' },
} as const satisfies Record<string, { path: string; label: string }>;
```

### TypeScript Sins Blacklist
| Sin | Alternative |
|-----|-------------|
| `any` | `unknown` + type narrowing |
| `as` assertions | Type guards, `satisfies`, Zod |
| `!` non-null | Optional chaining `?.`, null checks |
| `@ts-ignore` | Fix the error. `@ts-expect-error` with explanation as last resort |

## REACT & NEXT.JS MASTERY

### Effects Are Synchronization, Not Lifecycle (Abramov)
1. **Events → event handlers.** Never useEffect to respond to user actions.
2. **Derived state → compute during render.** `const fullName = first + ' ' + last`. Never useEffect + useState for derived values.
3. **External system sync → useEffect.** WebSockets, DOM measurements, subscriptions.

### Server State ≠ Client State (Linsley)
Server state: remote, async, shared, stale → TanStack Query / SWR.
Client state: local, sync, owned → useState, URL params, Zustand.

### Hook Architecture
- Deep modules: `useAuth()` hides complexity, returns simple interface
- Naming: `use[Entity]` for data, `use[Behavior]` for utility, `use[Domain]` for complex state
- Compose hooks from smaller hooks, not configuration objects

### Optimistic Updates — Mandatory for Mutations
Save previous → update UI immediately → send request → on error rollback → on settle invalidate.
No loading spinners for user-initiated actions that can be optimistic.

### AHA Programming (Dodds/Metz)
Don't abstract before 2-3 concrete instances. Prefer duplication over the wrong abstraction.

### URL as Source of Truth (Florence)
Search params, pagination, sort, tabs — anything shareable lives in the URL.

## CODE CRAFT

### Naming
- Hooks: `useUser`, `useDebounce`, `useCheckout`
- Booleans: `is`/`has`/`should`/`can` prefix
- Events: `onSubmit` (props), `handleSubmit` (handlers)
- Types: `UserProfile` not `IData`

### Structure
- Guard clauses at top (early returns flatten nesting)
- Max cyclomatic complexity: 10 per function
- Max nesting depth: 3 levels
- Max function length: 50 lines
- Table-driven logic replaces switch chains: `Record<UnionType, Value>`

### Comments
- "Why" comments earn their place (rationale, constraints, workarounds)
- "What" comments are code smells — rename or extract instead
- JSDoc for public APIs, `@deprecated`, `@example`, `@throws`

### File Order (newspaper metaphor)
Top: exports, interfaces, component function. Middle: handlers, logic. Bottom: helpers, constants.

## THE VISUAL STANDARD

### Typography
- Major Third scale (1.25×) for product UIs: 10.24 → 12.8 → **16** → 20 → 25 → 31.25 → 39 → 49px
- Minimum 16px body. Line height 1.5×. Max 2-3 typefaces. `clamp()` for fluid sizing.

### Color — OKLCH
Perceptually uniform. `oklch(lightness chroma hue)`. Three-tier tokens:
Primitive (`blue-500`) → Semantic (`color-interactive`) → Component (`button-primary-bg`).

Dark mode: elevated surfaces get lighter, desaturate colors, shadows → luminance hierarchy.

### Spacing — 8pt Grid
8, 16, 24, 32, 40, 48, 56, 64px. 4px half-step for fine adjustments.
Internal spacing ≤ external spacing (Gestalt proximity).

### Motion — Three Categories
- Feedback (100-200ms): hover, press, toggle
- Transition (200-500ms): page change, modal, layout shift
- Ambient (1000ms+): skeleton pulse, loading

Springs over eased curves for interactive elements. CSS `transform`/`opacity` for 80% of motion.
Every animation must serve: feedback, orientation, state change, or attention. Otherwise delete it.
Always respect `prefers-reduced-motion`.

### Perceived Performance
- Skeleton screens > spinners (20-30% perceived faster)
- Optimistic updates for mutations (no visible loading)
- Prefetch on hover

## DESIGN SYSTEM

### CVA for Variants
```typescript
const buttonVariants = cva("inline-flex items-center rounded-md font-medium transition-colors", {
  variants: {
    variant: { default: "bg-primary text-white hover:bg-primary/90", ghost: "hover:bg-accent" },
    size: { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" },
  },
  defaultVariants: { variant: "default", size: "md" },
});
```

### Composition: `asChild` over `as` prop
```tsx
<Button asChild><Link href="/pricing">Pricing</Link></Button>
```

### Tailwind v4 Tokens
```css
@theme {
  --color-primary-500: oklch(59% 0.24 265);
  --color-surface: oklch(98% 0.005 240);
}
```

## PERFORMANCE MANDATES

- **INP ≤ 200ms.** No sync operations >50ms in event handlers.
- **useTransition** for non-urgent updates. **useDeferredValue** for received values.
- **Suspense boundaries** at data fetch points — breaks hydration into smaller tasks.
- **No barrel file re-exports** at feature boundaries. Direct imports only.
- **Render budget: 16.67ms/frame.** Find the one big rock, not micro-optimizations.

## ANTI-PATTERN BLACKLIST

| Pattern | Fix |
|---------|-----|
| useEffect as event handler | Put logic in the event handler |
| State sync (useEffect + useState for derived) | Compute during render |
| Loading boolean | Discriminated union with `status` |
| Type theater (types without runtime validation) | Zod at boundaries |
| Premature abstraction | Rule of Three — wait for 3 instances |
| Mega-component (500+ lines) | Decompose: hooks + utils + presentational |
| Dependency array suppression | Fix the dependency or remove the effect |
| Prop drilling through 3+ layers | Context or composition |
| `any`, `as`, `!`, `@ts-ignore` | See TypeScript Sins above |
| Animation as decoration | Must serve feedback/orientation/state/attention |
| Loading spinner >3s | Skeleton screen or streaming |
| ARIA on divs instead of semantic HTML | Use `<button>`, `<nav>`, `<dialog>` first |

## RESOLVED TENSIONS

1. **Deep modules vs small functions?** → Deep modules win for hooks/modules. Internal utilities can be small.
2. **TS strictness vs ergonomics?** → Strictest at boundaries, relaxed in implementation. Always `strict: true`.
3. **Abstraction vs colocation?** → Colocation by default. Extract at 3+ uses or when the name communicates something new.
4. **Server vs Client Components?** → Server default. Client for state, effects, events, browser APIs.
5. **Animation vs performance?** → CSS for 80%. JS libs only for gesture/physics/layout. Budget ≤50KB.

## THE FINAL CHECK

- [ ] Zero `any`, `as` (except `as const`), `!`, `@ts-ignore`
- [ ] Discriminated unions for async state. Branded types at ID boundaries.
- [ ] No useEffect for events or derived state
- [ ] Every function ≤50 lines, ≤10 complexity, ≤3 nesting
- [ ] 8pt grid spacing. OKLCH tokens. Animations serve function.
- [ ] INP-safe. No barrel imports. Suspense at fetch points.
- [ ] Does each routine turn out to be pretty much what you expected?
