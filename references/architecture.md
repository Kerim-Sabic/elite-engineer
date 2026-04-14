# Architecture Reference

## Table of Contents
1. [Deep Modules](#deep-modules)
2. [Directory Structure](#directory-structure)
3. [Module Boundary Rules](#module-boundary-rules)
4. [Server/Client Boundary Decision Tree](#serverclient-boundary)
5. [Vertical Slicing](#vertical-slicing)
6. [Data Flow](#data-flow)
7. [The Dependency Rule in Frontend](#the-dependency-rule)
8. [End-to-End Type Safety](#end-to-end-type-safety)

---

## Deep Modules

Ousterhout's central insight: a module's value equals **functionality provided minus
interface complexity**. Visualize modules as rectangles — width is interface, height is
implementation depth.

```
DEEP MODULE              SHALLOW MODULE
┌────────────┐           ┌────────────────────┐
│ interface  │ (small)   │    interface       │ (large)
├────────────┤           ├────────────────────┤
│            │           │  implementation    │ (small)
│ implement. │ (large)   └────────────────────┘
│            │
└────────────┘
```

**Deep module example — custom hook:**
```typescript
// Interface: 4 items. Implementation: 80+ lines hidden.
function useAuth(): {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
} {
  // Hides: JWT storage, token refresh, error handling,
  // redirect logic, cookie management, session persistence
}
```

**Shallow module example — unnecessary wrapper:**
```typescript
// Interface nearly as complex as implementation — adds nothing.
function useUserName(userId: string) {
  const { data } = useQuery({ queryKey: ['user', userId], queryFn: () => fetchUser(userId) });
  return data?.name;
}
```

**The tension with Clean Code's "small functions" — resolved:**
Custom hooks and modules should be deep (simple interface, rich implementation). Pure
utility functions extracted WITHIN a hook can be small — they are implementation details,
not modules. The module boundary is what matters, not internal function length.

## Define Errors Out of Existence

Redesign interfaces so error conditions cannot occur:

```typescript
// ❌ Caller must handle "not found" error
function removeItem(list: Item[], id: string): Item[] {
  const index = list.findIndex(item => item.id === id);
  if (index === -1) throw new Error('Item not found');
  return list.filter((_, i) => i !== index);
}

// ✅ Postcondition (item not in list) is satisfied either way
function removeItem(list: Item[], id: string): Item[] {
  return list.filter(item => item.id !== id);
}
```

This applies to UI: a "delete" mutation should not show an error if the item was already
deleted. The user's intent (item gone) is satisfied.

---

## Directory Structure

The battle-tested structure for Next.js App Router at scale:

```
src/
├── app/                          # Routing layer ONLY — keep thin
│   ├── (public)/                 # Public route group
│   │   ├── page.tsx              # Landing page (orchestrates features/)
│   │   └── about/page.tsx
│   ├── (auth)/                   # Authenticated route group
│   │   ├── layout.tsx            # Auth check wrapper
│   │   ├── dashboard/page.tsx
│   │   └── settings/page.tsx
│   ├── api/                      # Route handlers
│   │   └── webhooks/route.ts
│   ├── layout.tsx                # Root layout (providers, fonts, metadata)
│   ├── loading.tsx               # Root loading UI
│   ├── error.tsx                 # Root error boundary
│   └── not-found.tsx
│
├── features/                     # VERTICAL SLICES — primary organization
│   ├── auth/                     # Everything auth needs, co-located
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   └── user-avatar.tsx
│   │   ├── hooks/
│   │   │   └── use-auth.ts
│   │   ├── services/
│   │   │   └── auth-service.ts
│   │   ├── types.ts              # Feature-specific types
│   │   └── index.ts              # Public API (explicit exports only)
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   └── checkout/
│
├── shared/                       # Cross-feature code (moved here ONLY when
│   │                             # genuinely used by 3+ features)
│   ├── components/
│   │   └── ui/                   # Design system primitives
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── dialog.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   ├── use-debounce.ts
│   │   └── use-media-query.ts
│   └── utils/
│       ├── cn.ts                 # clsx + tailwind-merge
│       └── format.ts
│
├── core/                         # App infrastructure
│   ├── providers/                # React context providers
│   ├── config/                   # Environment, feature flags
│   └── middleware.ts
│
├── lib/                          # Low-level utilities, API clients
│   ├── api-client.ts
│   ├── validations/              # Zod schemas shared across features
│   └── constants.ts
│
└── types/                        # Global type declarations
    └── global.d.ts
```

**Invariants this structure enforces:**
- `app/` pages import from `features/`, never contain business logic
- `features/X` never imports from `features/Y` — cross-feature communication goes
  through `shared/` or events
- `shared/` has no domain-specific logic — only generic, reusable utilities
- `core/` and `lib/` have zero React component dependencies
- Feature `index.ts` files export ONLY the public API — never barrel re-export everything

---

## Module Boundary Rules

1. **Features are independent.** `features/auth` must NOT import from `features/checkout`.
   If both need something, it goes in `shared/`.

2. **Shared is generic.** Nothing in `shared/` references a specific feature domain.
   `Button` yes. `CheckoutButton` no — that belongs in `features/checkout/components/`.

3. **App is thin.** Route files (`page.tsx`, `layout.tsx`) orchestrate features. They
   import feature components and compose them. They contain zero business logic.

4. **Lib is framework-agnostic.** `lib/api-client.ts` works without React. Pure functions,
   pure types. Can be tested without rendering components.

---

## Server/Client Boundary

**Decision flowchart:**

```
START: Does this component need...
  │
  ├─ useState, useReducer, useEffect, useRef (with mutations)?
  │   └─→ CLIENT COMPONENT
  │
  ├─ Event handlers (onClick, onChange, onSubmit)?
  │   └─→ CLIENT COMPONENT
  │
  ├─ Browser APIs (window, document, localStorage, IntersectionObserver)?
  │   └─→ CLIENT COMPONENT
  │
  ├─ Third-party library that uses any of the above?
  │   └─→ CLIENT COMPONENT
  │
  ├─ Real-time updates (WebSocket, SSE)?
  │   └─→ CLIENT COMPONENT
  │
  └─ None of the above?
      └─→ SERVER COMPONENT (default)
```

**Key patterns:**

1. **Push `'use client'` to leaves.** Don't mark a layout as client because it contains
   one dropdown. Extract the dropdown as a client component.

2. **The donut pattern.** Server Component wraps Client Component children:
   ```tsx
   // layout.tsx (Server Component)
   export default function Layout({ children }) {
     const user = await getUser(); // Server-side data fetch
     return (
       <div>
         <Sidebar user={user} />        {/* Server: static nav */}
         <InteractiveHeader user={user} /> {/* Client: dropdown, search */}
         {children}
       </div>
     );
   }
   ```

3. **Pass Server Components as children through Client Components:**
   ```tsx
   // client-wrapper.tsx
   'use client';
   export function ClientWrapper({ children }: { children: React.ReactNode }) {
     const [isOpen, setIsOpen] = useState(false);
     return <div>{isOpen && children}</div>; // children can be Server Components
   }
   ```

4. **Serialization boundary.** Props from Server → Client must be JSON-serializable.
   No functions (except Server Actions), no Dates (serialize to ISO string), no classes.

---

## Vertical Slicing

Jimmy Bogard's principle: "Minimize coupling between slices, maximize coupling within a
slice." Couple along the axis of change.

**When adding a "campaign analytics" feature**, you should touch:
- `features/campaigns/components/analytics-chart.tsx` (new)
- `features/campaigns/hooks/use-campaign-analytics.ts` (new)
- `features/campaigns/types.ts` (update)
- `features/campaigns/services/campaign-service.ts` (update)
- `app/(auth)/campaigns/[id]/analytics/page.tsx` (new route, thin)

You should NOT touch `features/auth/` or `features/settings/` or create a new
`features/analytics/` unless analytics is a genuinely independent domain.

---

## Data Flow

Data flows in ONE direction: Server → Client → User → Server.

```
Server Component (fetches data)
  └─→ passes serializable props to Client Component
        └─→ renders UI, handles interactions
              └─→ calls Server Action or API route
                    └─→ revalidates server data (revalidatePath/revalidateTag)
```

Never: Client Component fetches data → passes it UP to a parent → parent re-renders
children with it. This creates unnecessary round-trips and hydration mismatches.

---

## The Dependency Rule

```
┌─────────────────────────────────────────┐
│            Domain Layer                  │ ← Pure TS types, entities, validation
│         (types.ts, schemas/)             │    Zero framework deps
├─────────────────────────────────────────┤
│          Application Layer               │ ← Business workflows as functions
│    (services/, use cases)                │    Framework-agnostic
├─────────────────────────────────────────┤
│         Presentation Layer               │ ← React components, hooks
│    (components/, hooks/)                 │    Imports from Domain + Application
├─────────────────────────────────────────┤
│        Infrastructure Layer              │ ← API clients, storage, SDKs
│    (lib/, external services)             │    Implements interfaces from above
└─────────────────────────────────────────┘
```

Dependencies point INWARD (up in this diagram). Domain never imports from Presentation.
Presentation never imports from Infrastructure directly — it goes through Application
services.

**Where this is commonly OVER-applied in frontend:**
- Creating `IUserRepository` interface + `UserRepositoryImpl` class when there's only one
  implementation and no tests mock it. YAGNI.
- Adding a "use case" layer for CRUD operations that just pass through to the API client.
  A thin service function is sufficient.
- Treating state management (Redux, Zustand) as a "core" layer when it's a framework detail.

---

## End-to-End Type Safety

**tRPC pattern:** `export type AppRouter = typeof appRouter` creates a type-level
representation of the entire API. The client infers inputs/outputs via TypeScript generics.
No codegen, no schema files. Change a backend function signature → frontend shows compile
errors immediately.

**Without tRPC** (REST APIs): Use Zod schemas shared between client and server:
```typescript
// shared/validations/user.ts
export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Server: validates with CreateUserSchema.parse(body)
// Client: uses CreateUserInput type for form state
// Single source of truth for both sides
```

**Linear's sync engine architecture** (transferable principles):
- Local-first: Store data in IndexedDB, sync via WebSockets. Reads/writes are instant.
- Optimistic by default: UI updates immediately, server sync is background.
- Surgical re-renders: Only components observing changed data re-render.
- Three-tier bootstrap: Essential (blocking) → Important (non-blocking) → Large (on-demand).
