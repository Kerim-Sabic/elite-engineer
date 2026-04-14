---
name: elite-engineer
description: >
  The operating system for elite software engineering in TypeScript, React, and Next.js.
  Enforces the cognitive models, architecture laws, type-level patterns, component design,
  visual standards, and performance mandates that separate exceptional software from the
  ordinary — grounded in named sources (Torvalds, Ousterhout, Abramov, Hickey, Carmack,
  Brooks, Metz). Use this skill for ANY code generation, UI creation, component design,
  application architecture, TypeScript work, React/Next.js development, or frontend
  engineering task. Also trigger for design system construction, performance optimization,
  refactoring, code review, or when the user wants production-grade, visually polished,
  architecturally sound output. If the task involves writing code or building interfaces,
  this skill applies — even for small components, utilities, or quick scripts.
---

# Elite Engineer

This skill encodes the taste, architecture, and craft that produce code and interfaces
indistinguishable from the world's best engineering teams (Linear, Stripe, Vercel, Apple).
Every principle traces to a named source. Every directive is actionable.

## Reference Files

Read the relevant reference file BEFORE writing code for that domain:

| When working on...              | Read                                      |
|---------------------------------|-------------------------------------------|
| Architecture, folders, modules  | `references/architecture.md`              |
| TypeScript types, patterns      | `references/typescript-patterns.md`       |
| React components, hooks, RSC    | `references/react-nextjs-patterns.md`     |
| UI, colors, typography, motion  | `references/visual-standard.md`           |
| Design tokens, CVA, Tailwind    | `references/design-system.md`             |
| Code review, refactoring        | `references/anti-patterns.md`             |

For any non-trivial task, read at least the architecture reference. For UI work, also
read the visual standard and design system references. For TypeScript-heavy work, read
the TypeScript patterns reference.

---

## I. THE STANDARD

Code produced with this skill exhibits **taste** — Linus Torvalds' term for finding the
formulation where special cases disappear and the complex becomes simple. His linked list
example: the naive approach uses an `if` to handle the head node; the elegant approach
uses an indirect pointer, making head and interior nodes uniform. The `if` vanishes — not
through refactoring, but through a superior conceptual model.

Apply this principle to every design decision: seek the representation where edge cases
become impossible, where the type system proves correctness, where the API guides users
into the pit of success.

**Five commitments that govern every line:**

1. **Carmack's vigilance** — Make state visible. Prefer straightline execution. Distrust
   abstraction that hides what's happening. Most bugs exist because execution state isn't
   what you think it is.

2. **Hickey's discipline** — Simple ≠ easy. Simple means "one fold" (does one thing).
   Easy means "nearby" (familiar). Choosing easy over simple accumulates complexity that
   eventually kills velocity.

3. **Brooks' realism** — Most complexity is essential (inherent to the domain), not
   accidental (introduced by tools). No framework eliminates essential complexity. Model
   the domain correctly first.

4. **Metz's patience** — "Duplication is far cheaper than the wrong abstraction." Start
   with Shameless Green. Abstract only when a new requirement forces you to and you have
   3+ concrete instances.

5. **Ousterhout's strategy** — Tactical programmers optimize for the next feature.
   Strategic programmers optimize for great design. Invest 10-20% of development time in
   design improvements. Complexity is incremental death by a thousand cuts.

---

## II. BEFORE THE FIRST LINE

Before writing any code, answer these questions:

1. **What is the essential complexity?** What problems are inherent to this domain that
   no framework can remove? (Brooks)

2. **Where are the boundaries?** What are the bounded contexts? What does each term mean
   in each context? Use the domain's vocabulary for file names, component names, hook
   names, and type names. (Evans — ubiquitous language)

3. **What is the pit of success?** How do we make the correct path require less effort
   than the incorrect path? (Mariani/Abrams — e.g., React's hooks rules prevent
   conditional hook calls; TypeScript strict mode makes unsafe patterns require explicit
   opt-in with `as`; Zod's `z.infer` is easier than maintaining separate interfaces)

4. **Is this the simplest solution?** Not the easiest — the simplest. Fewest moving
   parts, fewest concepts to understand, fewest ways to misuse. (Hickey)

5. **Should I abstract?** Only if you have 3+ concrete instances showing what varies.
   Otherwise, duplicate. The wrong abstraction is more expensive than duplication. (Metz)

---

## III. ARCHITECTURE LAWS (Summary)

Read `references/architecture.md` for full details, examples, and the directory tree.

**Deep modules win.** A module's value = functionality provided minus interface complexity.
`useAuth()` returning `{ user, login, logout, isLoading }` while hiding token management,
refresh, storage, and errors is deep. (Ousterhout)

**Define errors out of existence.** Redesign interfaces so error conditions cannot occur.
`deleteItem(id)` succeeds whether the item exists or not — the postcondition is satisfied
either way. (Ousterhout)

**Dependency Rule.** Source code dependencies point inward only: Domain → Application →
Presentation → Infrastructure. Where Clean Architecture is misapplied in frontend: adding
repository interfaces for every API call with no alternative implementation. Creating
pass-through layers. Treating Redux as the "core" layer. (Martin, adapted)

**Vertical slices over horizontal layers.** Organize by feature/business capability, not
technical concern. `features/auth/`, `features/checkout/`, `features/dashboard/`. Move
to `shared/` only when genuinely reused across 3+ features. (Bogard)

**Server/client boundary.** Everything is a Server Component by default. `'use client'`
is a precision scalpel: push it to the leaf level. Props crossing the boundary must be
serializable. Client Components CAN render Server Components passed as children.

---

## IV. TYPESCRIPT AT FULL POWER (Summary)

Read `references/typescript-patterns.md` for all patterns with code examples.

**Branded types** prevent ID confusion at zero runtime cost. `UserId` and `PostId` are
structurally identical strings but compile-error when swapped.

**Discriminated unions** make impossible states unrepresentable. Never use
`{ loading: boolean; data: T | null; error: Error | null }`. Use
`{ status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error }`.

**Parse, don't validate.** Zod schemas at boundaries produce typed output. Downstream
code receives precise types, never re-validates.

**`as const satisfies`** — literal types + structural validation. One expression, no
annotation, maximum inference.

**TypeScript sins blacklist:** `any` (use `unknown`), `as` assertions (use type guards),
`!` non-null (use optional chaining), `@ts-ignore` (fix the error or use `@ts-expect-error`
with explanation).

---

## V. REACT & NEXT.JS MASTERY (Summary)

Read `references/react-nextjs-patterns.md` for decision trees and full examples.

**Effects are synchronization, not lifecycle.** Events → event handlers. Derived state →
compute during render. Only external system sync → useEffect. (Abramov)

**Server state ≠ client state.** Server state is persisted remotely, async, shared, and
goes stale. Use TanStack Query or SWR. Client state is synchronous and local — useState
or URL params. (Linsley)

**Compound components** (Radix pattern) — root provides Context, children consume it.
Maximum rendering flexibility, impossible to misuse.

**Optimistic updates are mandatory for mutations.** Save previous → update UI → send
request → on error rollback → on settle invalidate. No loading spinners for user-initiated
actions that can be optimistic.

**AHA Programming** — Avoid Hasty Abstractions. Don't abstract before 2-3 concrete use
cases. Prefer duplication over the wrong abstraction. (Dodds/Metz)

---

## VI. CODE CRAFT

**Reads like prose.** Descriptive names + TypeScript types should read almost as English.
`getActiveUsers(users: User[]): User[]` with `users.filter(isRecentlyActive)` tells the
story without comments.

**Newspaper metaphor.** Most important at top, details below. Props interface and component
function first. Event handlers middle. Sub-components and constants bottom.

**Naming conventions:**
- Hooks: `use[Entity]` for data, `use[Behavior]` for utility, `use[Domain]` for complex state
- Booleans: `is`/`has`/`should`/`can` prefix — `isLoading`, `hasPermission`, `canDelete`
- Events: `on[Event]` for props, `handle[Event]` for handlers
- Types: Describe the concept (`UserProfile`), not the structure (`IData`)

**Guard clauses flatten complexity.** Early returns eliminate nesting. Maximum cyclomatic
complexity: 10 per function. Maximum nesting: 3 levels. Maximum function length: 50 lines.

**Table-driven logic** replaces switch/if chains. `Record<UnionType, Value>` drops
cyclomatic complexity to 1 with exhaustive TypeScript coverage.

**Comment philosophy.** "Why" comments earn their place (rationale, constraints,
workarounds). "What" comments are code smells — rename or extract instead. JSDoc for
public APIs, business rules, `@deprecated`, `@example`, `@throws`.

---

## VII. THE VISUAL STANDARD (Summary)

Read `references/visual-standard.md` for complete specifications and values.

**Typography:** Use a modular type scale. Major Third (1.25×) for product UIs. Minimum
16px body text. Line height 1.5× baseline. Maximum 2-3 typefaces. `clamp()` for fluid
sizing.

**Color:** OKLCH for perceptual uniformity — two colors at the same L value appear equally
bright (HSL fails this). Three-tier tokens: Primitive → Semantic → Component. Dark mode
is NOT inverted light mode: elevated surfaces get lighter, desaturate colors, shadows
become luminance hierarchy.

**Spacing:** 8-point grid (8, 16, 24, 32, 40, 48, 56, 64px). 4px half-step for fine
adjustments. Internal spacing ≤ external spacing (Gestalt proximity).

**Motion:** Three categories — Transitions (300-500ms), Feedback (150-300ms), Ambient
(continuous). Springs over eased curves for interactive elements. Every animation must
serve a functional purpose: feedback, orientation, state change, or attention direction.
Animation without purpose is decoration — eliminate it.

**Perceived performance:** Skeleton screens for content loading (20-30% perceived faster
than spinners). Optimistic updates for mutations. Prefetch on hover.

---

## VIII. DESIGN SYSTEM CONSTRUCTION (Summary)

Read `references/design-system.md` for token naming, CVA patterns, and Tailwind integration.

**Token naming** follows Primer's three tiers: Base (raw values, never used directly) →
Functional (purpose-driven, respect color modes) → Component (scoped to specific components).

**Radix Colors** 12-step scale: Steps 1-2 backgrounds, 3-5 interactive states, 6-8
borders, 9-10 solid fills, 11-12 text.

**Tailwind v4 `@theme`** — define tokens as CSS custom properties, get utility classes
automatically. One source of truth. Runtime theming via class switching.

**CVA (Class Variance Authority)** — type-safe variant APIs. `VariantProps<typeof variants>`
auto-generates TypeScript types. Combined with Radix primitives + `cn()` (clsx +
tailwind-merge) + `asChild`.

**Composition over polymorphism.** Prefer `asChild` (Radix/shadcn) over `as` prop.

---

## IX. PERFORMANCE MANDATES

**INP ≤ 200ms.** No synchronous operations >50ms in event handlers. Profile first.

**Concurrent features are mandatory.** `useTransition` for non-urgent state updates.
`useDeferredValue` when you receive a value you don't control. `<Suspense>` boundaries
break hydration into smaller tasks. Wrap `hydrateRoot` in `startTransition()`.

**No barrel file re-exports** at feature boundaries. Use direct imports. A single barrel
can add 100KB+ to bundles.

**Render budget: 16.67ms per frame.** One spike to 33ms is perceivable stutter. Find the
one big rock — the single largest offender — rather than micro-optimizing everywhere.

**Always respect `prefers-reduced-motion`.** Test on low-end devices.

---

## X. ANTI-PATTERN BLACKLIST (Summary)

Read `references/anti-patterns.md` for the complete blacklist with code examples.

**Top AI-generated failures:**
- `useEffect` as event handler — put event logic in the handler, not an effect
- State synchronization trap — derive state during render, never `useEffect` + `useState`
- Loading boolean — use discriminated unions with `status` field
- Type theater — types without runtime validation at boundaries
- Premature abstraction — wait for 3 instances
- Mega-component (500+ lines) — decompose into hooks, utils, presentational components
- Dependency array suppression — fix the dependency, don't disable the lint rule

**Architecture anti-patterns:** Distributed monolith, lasagna architecture (too many
pass-through layers), leaky abstraction, second system syndrome.

**UI anti-patterns:** Animation as decoration, consistency theater, loading spinner for
>3s waits, accessibility theater (bad ARIA worse than no ARIA).

---

## XI. RESOLVED TENSIONS

These five conflicts surface repeatedly. The resolutions are decisive, not "it depends":

1. **Deep modules vs small functions (for React hooks)?** → Deep modules win. Custom hooks
   are the quintessential deep module. Pure utility functions within can be small.

2. **TypeScript strictness vs ergonomics?** → Strictest at boundaries (API inputs, shared
   interfaces). Relaxed in implementation (local variables with obvious types). Always
   `strict: true`. If type gymnastics are harder to read than the code they protect, the
   types have become theater.

3. **Component abstraction vs colocation?** → Colocation wins by default. Extract when
   used in 3+ places, represents a domain concept, or the extraction's name communicates
   something the code alone doesn't.

4. **Server vs Client Components?** → Server by default. Client for: event handlers,
   state, effects, browser APIs, real-time updates, third-party client libs.

5. **Animation delight vs performance budget?** → CSS for 80% of motion. JS libraries only
   for gesture/physics/layout animation. Total animation library budget: ≤50KB. Must pass:
   functional purpose, CSS-only possible?, 60fps on low-end phone, reduced-motion support.

---

## XII. THE FINAL TEST

Run this checklist before submitting any code:

- [ ] **Architecture:** Dependencies point inward. No circular imports. Features are
      vertically sliced. Server/client boundary is minimal and pushed to leaves.
- [ ] **TypeScript honesty:** Zero `any`, zero `as` (except `as const`), zero `!`, zero
      `@ts-ignore`. Branded types at ID boundaries. Discriminated unions for async state.
      Zod at external data boundaries.
- [ ] **React correctness:** No `useEffect` for events or derived state. No boolean state
      machines. Custom hooks are deep modules. Server Components by default.
- [ ] **Code craft:** Every function ≤50 lines, ≤10 cyclomatic complexity, ≤3 nesting
      levels. Names reveal intent. Guard clauses at the top. No "what" comments.
- [ ] **Visual standard:** Type scale applied. 8pt grid spacing. OKLCH color tokens with
      semantic naming. Dark mode designed (not inverted). Animations serve function.
- [ ] **Performance:** INP-safe (no >50ms sync in handlers). No barrel imports. Suspense
      boundaries at data fetch points. `prefers-reduced-motion` respected.
- [ ] **Anti-patterns:** None from the blacklist present.
- [ ] **The taste test:** Does each routine turn out to be pretty much what you expected?
      Would an engineer who has read Ousterhout, worked at Linear, and built a design
      system from scratch look at this and feel something? Not just "good code" — the
      feeling of seeing their own standards reflected back.
