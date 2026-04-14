# React & Next.js Patterns Reference

## Table of Contents
1. [Effects Are Synchronization](#effects-are-synchronization)
2. [Four Resilient Component Principles](#four-resilient-component-principles)
3. [Server State vs Client State](#server-state-vs-client-state)
4. [Component Decision Trees](#component-decision-trees)
5. [Hook Architecture](#hook-architecture)
6. [Compound Components](#compound-components)
7. [Server Components — The New Model](#server-components)
8. [Optimistic Updates](#optimistic-updates)
9. [URL as Source of Truth](#url-as-source-of-truth)
10. [Context — When and When Not](#context)

---

## Effects Are Synchronization

Dan Abramov's definitive insight: useEffect is not a lifecycle method. It is a
synchronization mechanism. Each render has its own everything — props, state, event
handlers, effects — captured by closures.

**Three rules — no exceptions:**

### Rule 1: Events → Event Handlers

```typescript
// ❌ useEffect as event handler — the #1 AI-generated React bug
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Runs on EVERY query change, including programmatic changes
    // Creates race conditions, unnecessary requests, stale closures
    fetch(`/api/search?q=${query}`).then(r => r.json()).then(setResults);
  }, [query]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}

// ✅ Event handler — runs only when the user acts
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  async function handleSearch(newQuery: string) {
    setQuery(newQuery);
    const data = await fetch(`/api/search?q=${newQuery}`).then(r => r.json());
    setResults(data);
  }

  return <input value={query} onChange={e => handleSearch(e.target.value)} />;
}

// ✅✅ Even better — use TanStack Query for server state
function SearchPage() {
  const [query, setQuery] = useState('');
  const { data: results } = useQuery({
    queryKey: ['search', query],
    queryFn: () => fetch(`/api/search?q=${query}`).then(r => r.json()),
    enabled: query.length > 0,
  });
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### Rule 2: Derived State → Compute During Render

```typescript
// ❌ State synchronization trap — never do this
function UserList({ users }: { users: User[] }) {
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setFilteredUsers(users.filter(u => u.name.includes(search)));
  }, [users, search]); // Extra render, stale state window, unnecessary complexity

  return /* ... */;
}

// ✅ Derive during render — zero extra state, zero effects
function UserList({ users }: { users: User[] }) {
  const [search, setSearch] = useState('');
  const filteredUsers = users.filter(u => u.name.includes(search));
  // If filtering is expensive, wrap with useMemo — but ONLY if profiling shows it matters
  return /* ... */;
}
```

### Rule 3: External System Sync → useEffect

Legitimate useEffect uses:
- WebSocket connections: `useEffect(() => { const ws = new WebSocket(url); return () => ws.close(); }, [url])`
- DOM measurements: `useEffect(() => { const rect = ref.current.getBoundingClientRect(); }, [])`
- Third-party library integration: `useEffect(() => { const chart = new Chart(ref.current, config); return () => chart.destroy(); }, [config])`
- Browser API subscriptions: `useEffect(() => { const handler = () => {...}; window.addEventListener('resize', handler); return () => window.removeEventListener('resize', handler); }, [])`

---

## Four Resilient Component Principles

From Dan Abramov's "Writing Resilient Components":

### 1. Don't Stop the Data Flow
Props and state change. Derived values must update when their sources update. Don't copy
props into state (creating a "stale snapshot" that ignores future prop changes).

```typescript
// ❌ Stops the data flow — ignores prop changes after mount
function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState(`Hello, ${name}`);
  return <h1>{greeting}</h1>; // If name changes, greeting is stale
}

// ✅ Derived value — always in sync
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}
```

### 2. Always Be Ready to Render
Don't introduce timing assumptions. A component should produce correct output for any
combination of current props and state at any time.

### 3. No Component Is a Singleton
Design as if your component could be rendered multiple times simultaneously. Don't use
module-level variables for component state.

### 4. Keep Local State Isolated
Test: "If I render this component twice, should interacting with one copy affect the
other?" If no, it's local state. If yes, it should be lifted or shared via context/URL.

---

## Server State vs Client State

Tanner Linsley's foundational distinction:

| Property | Server State | Client State |
|----------|-------------|--------------|
| Persisted | Remotely (DB, API) | Locally (memory, URL) |
| Access | Async (network) | Sync (immediate) |
| Ownership | Shared (other users/tabs can modify) | Exclusive (this tab owns it) |
| Staleness | Goes stale (background changes) | Always current |

**Server state** needs: caching, deduplication, background refetching, optimistic updates,
pagination, retry logic. Use TanStack Query or SWR.

**Client state** needs: simple updates, maybe persistence. Use `useState`, `useReducer`,
URL params, or Zustand for complex cases.

**The mistake:** Treating server state like client state means manually handling all
caching, loading, error, dedup, and staleness logic in every component. TanStack Query
and SWR solve this at the library level.

**Stale-while-revalidate:** Return cached data immediately → refetch in background →
swap fresh data when it arrives. Users see content instantly. If data hasn't changed,
the update is invisible.

---

## Component Decision Trees

### Should this be a Server or Client Component?

```
Does it need interactivity (state, effects, event handlers, browser APIs)?
├─ YES → Client Component ('use client')
│   └─ Push 'use client' to the LEAF level — only the interactive part
└─ NO → Server Component (default)
    └─ Can it fetch data directly (async/await)?
        ├─ YES → Fetch in the component. No useEffect needed.
        └─ NO → Receive data as props from a parent Server Component.
```

### Should this state live in URL, component, context, or store?

```
Is this state shareable via URL (filters, pagination, sort, selected tab)?
├─ YES → URL (searchParams, pathname)
│
Is it used by only this component?
├─ YES → useState / useReducer (local state)
│
Is it used by a few nearby components in the same subtree?
├─ YES → Lift state to nearest common parent, pass as props
│
Is it used by many components across the tree?
├─ YES → Context (if infrequently updated) or Store (if frequently updated)
│
Is it server data?
└─ YES → TanStack Query / SWR (query cache IS the store)
```

### Should this be a hook, a utility, or a component?

```
Does it use React primitives (useState, useEffect, useContext, refs)?
├─ YES → Custom Hook (use[Name])
│
Is it a pure function with no React dependencies?
├─ YES → Utility function (in utils/ or lib/)
│
Does it render UI?
├─ YES → Component
│
Does it orchestrate multiple hooks?
└─ YES → Custom Hook (composition)
```

---

## Hook Architecture

### Naming convention
- `use[Entity]` — data hooks: `useUser`, `useProjects`, `useNotifications`
- `use[Behavior]` — utility hooks: `useDebounce`, `useMediaQuery`, `useLocalStorage`
- `use[Domain]` — complex orchestration: `useCheckout`, `useEditor`, `useOnboarding`

### Structure of a well-designed hook

```typescript
// ✅ GOOD — deep module: simple interface, rich implementation
export function useCheckout(cartId: string) {
  // --- Internal state (not exposed) ---
  const [step, setStep] = useState<CheckoutStep>({ status: 'cart' });
  const queryClient = useQueryClient();

  // --- Server state ---
  const { data: cart } = useSuspenseQuery(cartOptions(cartId));

  // --- Derived values (computed during render) ---
  const total = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const canSubmit = step.status === 'payment' && total > 0;

  // --- Actions (stable references via useCallback only when passed as props) ---
  async function submitOrder() {
    if (!canSubmit) return;
    setStep({ status: 'submitting' });
    const result = await createOrder(cart);
    if (result.ok) {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setStep({ status: 'confirmed', orderId: result.value.id });
    } else {
      setStep({ status: 'error', error: result.error });
    }
  }

  // --- Public interface (minimal, intentional) ---
  return { cart, total, step, canSubmit, submitOrder } as const;
}
```

```typescript
// ❌ BAD — shallow module: exposes internals, caller must orchestrate
export function useCheckout(cartId: string) {
  const [step, setStep] = useState('cart');
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Exposes setStep, setError, setIsSubmitting — caller must manage transitions
  return { step, setStep, error, setError, isSubmitting, setIsSubmitting };
}
```

### Composition over configuration

```typescript
// Build complex hooks from simpler ones
function useProjectDashboard(projectId: string) {
  const project = useProject(projectId);          // Data
  const members = useProjectMembers(projectId);   // Data
  const permissions = usePermissions(projectId);   // Logic
  const analytics = useProjectAnalytics(projectId); // Data

  const canManage = permissions.role === 'admin' || permissions.role === 'owner';

  return { project, members, analytics, canManage } as const;
}
```

---

## Compound Components

The Radix UI pattern: root provides Context, children consume it. This creates coordinated
systems with maximum rendering flexibility.

```tsx
// Implementation sketch
const DialogContext = createContext<DialogState | null>(null);

function Root({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

function Trigger({ children }: { children: React.ReactNode }) {
  const { setOpen } = useContext(DialogContext)!;
  return <button onClick={() => setOpen(true)}>{children}</button>;
}

// Usage — impossible to misuse, maximally flexible
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Body</Dialog.Description>
      <Dialog.Close>X</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

Key principles:
- Each component renders exactly one DOM element
- Zero styles shipped — consumer applies styling
- State communicated via `data-state` attributes for CSS targeting
- `asChild` merges behavior onto consumer elements without DOM nesting

---

## Server Components

### What Server Components can do that Client Components cannot:
- `async/await` in the component body (direct data fetching)
- Access server-only APIs (database, file system, secrets)
- Ship zero JavaScript to the browser (their output is serialized HTML/RSC payload)
- Run expensive computations without affecting bundle size

### What Client Components can do that Server Components cannot:
- Use state (useState, useReducer)
- Use effects (useEffect, useLayoutEffect)
- Use browser APIs (window, document, IntersectionObserver)
- Handle user events (onClick, onChange)
- Use refs for DOM manipulation

### The RSC mental model:
Server Components never re-render. Their output is immutable — computed once per request.
Client Components re-render normally. The `'use client'` directive marks a **boundary**,
not a single component — everything imported by a client component is also client.

### The children slot pattern:
```tsx
// Server Component can pass Server Components through Client Component slots
// layout.tsx (Server)
import { ClientSidebar } from './sidebar';
import { ServerContent } from './content';

export default function Layout() {
  return (
    <ClientSidebar>
      <ServerContent /> {/* This stays a Server Component! */}
    </ClientSidebar>
  );
}
```

---

## Optimistic Updates

The pattern: predict the outcome → update UI immediately → send request → on success keep
→ on error rollback.

### With TanStack Query:
```typescript
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previous = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old) =>
      old.map(t => t.id === newTodo.id ? { ...t, ...newTodo } : t)
    );
    return { previous };
  },
  onError: (_err, _newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

### With React 19 useOptimistic:
```tsx
function TodoItem({ todo }: { todo: Todo }) {
  const [optimisticTodo, setOptimisticTodo] = useOptimistic(todo);

  async function handleToggle() {
    setOptimisticTodo({ ...todo, completed: !todo.completed });
    await toggleTodo(todo.id); // Server Action
  }

  return <Checkbox checked={optimisticTodo.completed} onChange={handleToggle} />;
}
```

---

## URL as Source of Truth

Ryan Florence/Remix philosophy: anything shareable or bookmarkable lives in the URL.

```typescript
// Search, filter, sort, pagination — all URL state
'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function useURLState<T extends string>(key: string, defaultValue: T) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const value = (searchParams.get(key) as T) ?? defaultValue;

  function setValue(newValue: T) {
    const params = new URLSearchParams(searchParams);
    if (newValue === defaultValue) params.delete(key);
    else params.set(key, newValue);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return [value, setValue] as const;
}

// Usage
const [sort, setSort] = useURLState('sort', 'newest');
const [page, setPage] = useURLState('page', '1');
```

Benefits: shareable URLs, browser back/forward works, server can pre-render with correct
state, no hydration mismatch.

---

## Context

### When Context is correct:
- Theme/appearance settings (infrequent updates)
- Locale/i18n (infrequent updates)
- Auth state (infrequent updates)
- Compound component coordination (Radix pattern)

### When Context becomes a performance problem:
Context triggers a re-render of EVERY consumer when the value changes. If Context holds
frequently-changing data (cursor position, scroll offset, rapid form input), every
consumer re-renders on every change.

### The fix when Context is too expensive:
1. **Split contexts** — separate rarely-changing data from frequently-changing data
2. **Memoize the value** — `useMemo` on the context value object
3. **Use an external store** — Zustand, Jotai, or `useSyncExternalStore` for high-frequency state
4. **Use the children pattern** — components that don't consume the context pass through unchanged

```tsx
// ❌ One big context — everything re-renders on any change
const AppContext = createContext({ user, theme, notifications, settings });

// ✅ Split — consumers only re-render when their specific context changes
const UserContext = createContext(user);
const ThemeContext = createContext(theme);
const NotificationContext = createContext(notifications);
```
