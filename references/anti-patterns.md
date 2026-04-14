# Anti-Pattern Blacklist Reference

Every pattern here is named, diagnosed, and cured. Before finalizing any code, scan
this list. Each entry follows the format:
**Name** → What it looks like → Why it fails → Exact replacement.

## Table of Contents
1. [AI-Generated Code Failures](#ai-generated-code-failures)
2. [Architectural Anti-Patterns](#architectural-anti-patterns)
3. [UI/UX Anti-Patterns](#uiux-anti-patterns)

---

## AI-Generated Code Failures

### 1. useEffect as Event Handler

**What it looks like:**
```typescript
// ❌ Effect watches state to "respond" to user actions
const [submitted, setSubmitted] = useState(false);

useEffect(() => {
  if (submitted) {
    sendAnalytics('form_submit');
    redirect('/success');
  }
}, [submitted]);

function handleSubmit() { setSubmitted(true); }
```

**Why it fails:** The effect runs asynchronously after render, not in response to the
event. It also runs on re-mount in StrictMode. You lose the ability to know what the
user actually did — by the time the effect runs, the context is gone.

**Exact replacement:** Put event-specific logic in the event handler.
```typescript
// ✅
function handleSubmit() {
  sendAnalytics('form_submit');
  redirect('/success');
}
```

---

### 2. State Synchronization Trap

**What it looks like:**
```typescript
// ❌ Deriving state via useEffect + useState
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [fullName, setFullName] = useState('');

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

**Why it fails:** Extra render cycle, unnecessary state, window where `fullName` is stale.
Scales to create cascading effect chains that are impossible to debug.

**Exact replacement:** Compute during render.
```typescript
// ✅
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const fullName = `${firstName} ${lastName}`; // Derived value — always in sync
```

---

### 3. The Loading Boolean

**What it looks like:**
```typescript
// ❌ Boolean flags create impossible states
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [data, setData] = useState<User | null>(null);
const [error, setError] = useState<Error | null>(null);
// isLoading=true AND isError=true AND data is set? Possible. Meaningless.
```

**Why it fails:** 2^4 = 16 possible combinations but only 4 are valid. The type system
can't help you. Every consumer must add defensive checks.

**Exact replacement:** Discriminated union.
```typescript
// ✅
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

const [state, setState] = useState<State>({ status: 'idle' });
// Only valid combinations exist. TypeScript narrows in switch/case.
```

---

### 4. Prop Drilling Disguised as Architecture

**What it looks like:**
```typescript
// ❌ 8 props threaded through 3 layers
<Page user={user} theme={theme} locale={locale} permissions={permissions}
      onLogout={onLogout} onThemeChange={onThemeChange} ... />
  <Sidebar user={user} theme={theme} onLogout={onLogout} ... />
    <UserMenu user={user} onLogout={onLogout} ... />
```

**Why it fails:** Every intermediate component is coupled to props it doesn't use.
Refactoring any prop signature requires changing every file in the chain.

**Exact replacement:** Context for stable data, composition for rendering flexibility.
```typescript
// ✅ Context for cross-cutting concerns
const user = useAuth();      // From AuthContext
const theme = useTheme();    // From ThemeContext

// ✅ Composition — pass the ready-made component, not raw data
<Page sidebar={<Sidebar header={<UserMenu />} />} />
```

---

### 5. Type Theater

**What it looks like:**
```typescript
// ❌ TypeScript interface on API response without runtime validation
interface ApiResponse { user: User; permissions: string[] }
const data = await fetch('/api/me').then(r => r.json()) as ApiResponse;
// `as ApiResponse` is a lie — the runtime data could be anything
```

**Why it fails:** Types evaporate at compile time. The API can return anything. `as`
tells TypeScript to stop checking — the opposite of safety.

**Exact replacement:** Parse at the boundary with Zod.
```typescript
// ✅
const ApiResponseSchema = z.object({
  user: UserSchema,
  permissions: z.array(z.string()),
});
const data = ApiResponseSchema.parse(await fetch('/api/me').then(r => r.json()));
// Runtime validated. Type-safe from here forward.
```

---

### 6. Premature Abstraction

**What it looks like:**
```typescript
// ❌ Abstracted after the FIRST instance
function GenericDataDisplay<T>({ data, renderItem, onSort, onFilter, onPaginate, ... }: {
  data: T[];
  renderItem: (item: T) => ReactNode;
  onSort?: (key: keyof T) => void;
  // 15 more props for edge cases that might never come
}) { /* ... */ }
```

**Why it fails:** Sandi Metz: "Duplication is far cheaper than the wrong abstraction."
The wrong abstraction accumulates conditional logic with every new use case until it's
unreadable. The cost of undoing a bad abstraction exceeds the cost of the original
duplication many times over.

**Exact replacement:** The Rule of Three.
1. First instance: write the specific implementation
2. Second instance: duplicate (note the similarity)
3. Third instance: NOW abstract — you have 3 data points showing what actually varies

---

### 7. The Mega-Component

**What it looks like:** A single component file with 400-800 lines handling data fetching,
business logic, form validation, animations, and rendering in one function.

**Why it fails:** Impossible to test individual concerns. Changes to any part risk
breaking all other parts. Can't reuse any piece independently.

**Exact replacement:** Decompose along responsibility boundaries:
```
// ✅ Decomposed
features/checkout/
├── hooks/use-checkout.ts        ← Data fetching, state machine
├── components/checkout-form.tsx  ← Form UI + validation
├── components/order-summary.tsx  ← Display component
├── components/payment-step.tsx   ← Payment-specific UI
└── checkout-page.tsx             ← Thin orchestrator (imports above)
```

The page component becomes a ~30 line orchestrator that composes the pieces.

---

### 8. Fake Generality

**What it looks like:**
```typescript
// ❌ Configurable for use cases that don't exist
function Modal({
  animation = 'fade',
  animationDuration = 200,
  animationEasing = 'ease-out',
  backdropAnimation = 'fade',
  customAnimationKeyframes,
  portalTarget = document.body,
  customPortalTarget,
  focusTrapEnabled = true,
  focusTrapOptions = {},
  ...
```

**Why it fails:** Every config option is a maintenance commitment. Options that nobody
uses still have to work after every refactor. The API surface area grows but actual
usage doesn't — you're maintaining dead code paths.

**Exact replacement:** Solve the concrete problem. Add options when a real user needs
them, not speculatively.

---

### 9. Dependency Array Suppression

**What it looks like:**
```typescript
// ❌ Suppressing the lint rule
useEffect(() => {
  fetchData(userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**Why it fails:** The effect captures a stale `userId` from the first render. If the
user navigates to a different profile, the effect never re-runs — it shows stale data.

**Exact replacement:** Fix the dependency.
```typescript
// ✅ Include the dependency — the effect re-runs when userId changes
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅✅ Even better — use TanStack Query (no effect needed)
const { data } = useQuery({ queryKey: ['user', userId], queryFn: () => fetchData(userId) });
```

---

### 10. The Comment That Lies

**What it looks like:**
```typescript
// Increment the counter
counter -= 1; // Oops — comment says increment, code decrements

// Process user data
async function sendEmail(template: Template) { /* ... */ }
```

**Why it fails:** Comments that describe "what" the code does become stale as code changes.
Developers update code but forget to update comments, creating misleading documentation.

**Exact replacement:** Make the code self-documenting. Reserve comments for "why":
```typescript
// Retry 3x — payment gateway returns 503 during their deploy window (2-4am UTC)
const MAX_RETRIES = 3;

// Safari doesn't support ResizeObserver in iframes (WebKit bug #219665)
// Remove this workaround when Safari 18.2+ has >90% adoption
const observer = new MutationObserver(handleResize);
```

---

## Architectural Anti-Patterns

### Distributed Monolith

**What it looks like:** Multiple services that share a database, require synchronized
deployments, make synchronous calls to each other in chains, and can't be deployed
independently.

**Why it fails:** You get all the complexity of distributed systems (network failures,
partial outages, serialization) with none of the benefits (independent deployment,
scaling, team autonomy).

**Exact replacement:** Start with a well-structured monolith. Extract services only when
you have a specific operational reason (independent scaling, team autonomy, different
deployment cadence). Martin Fowler: "Don't even consider microservices unless you have a
system too complex to manage as a monolith."

### Lasagna Architecture

**What it looks like:** Repository → Service → Handler → Controller → Middleware → Router.
Six layers for a CRUD operation where each layer just calls the next.

**Why it fails:** Tracing a data flow requires 8 file hops. Most layers add no logic —
they're pass-throughs. Changes propagate through every layer. The architecture serves
the architect's desire for "proper" structure, not the user's need for working software.

**Exact replacement:** Layers must earn their existence by providing meaningful abstraction.
For simple CRUD: route handler → service function → database. Add layers only when a
layer genuinely encapsulates complexity that callers shouldn't know about.

### The Leaky Abstraction

Joel Spolsky's Law (2002): "All non-trivial abstractions, to some degree, are leaky."
TCP abstracts unreliable IP but leaks when packets drop. SQL abstracts relational algebra
but leaks in query performance. React abstracts the DOM but leaks at performance cliffs.

**The implication:** You must understand the layer below your abstraction. Using React
without understanding the DOM, or TypeScript without understanding JavaScript, means
you can't debug when the abstraction breaks.

### Second System Syndrome

Fred Brooks (1975): The second system an architect designs is the most dangerous.
Overconfidence from the first success leads to incorporating every deferred feature and
"doing it right this time."

**Modern equivalents:**
- "Let's rewrite the frontend in [new framework]" without addressing the actual problems
- Adding CQRS, event sourcing, and microservices to a CRUD app
- "Proper" architecture that takes 6 months to ship what the "hacky" version did in 2 weeks

**The fix:** Incremental improvement over rewrites. If you must rewrite, constrain scope
ruthlessly.

---

## UI/UX Anti-Patterns

### Animation as Decoration

**The test:** Remove the animation. Does the user lose any information about what happened,
where they are, or what changed? If the answer is no, the animation is decoration.

**Real cost:** An A/B test showed a 3D flip page transition with particle effects caused a
67% drop in mobile conversion — 2.3 seconds added per navigation. Users don't want to
watch your animations. They want to accomplish their task.

**The rule:** Every animation must serve one of exactly four purposes: feedback (confirming
action), orientation (showing spatial relationship), state change (indicating
loading/success/error), or attention (directing focus to something important).

### Consistency Theater

**What it looks like:** Using the same button style for "Save" and "Delete Permanently."
Applying the same spacing to a compact data table and a marketing hero section.

**Why it fails:** Consistency is a means to predictability, not an end in itself.
Destructive actions should feel different from constructive ones. Dense interfaces need
different spacing than spacious ones. Forcing visual uniformity across different contexts
confuses users about the significance of their actions.

**The fix:** Consistency WITHIN a context. Variation BETWEEN contexts that serve different
purposes.

### Loading Spinner Lie

**What it looks like:** An indeterminate spinner shown for >3 seconds.

**Why it fails:** After 3 seconds, users don't know if the operation is progressing, stuck,
or failed. Indeterminate spinners provide zero information. They feel broken.

**Exact replacement:**
- **<1 second:** No indicator needed (or subtle button loading state)
- **1-3 seconds:** Skeleton screen if layout is predictable, deterministic progress if measurable
- **>3 seconds:** Progress indicator with estimated time, or streaming/progressive rendering
- **Mutations:** Optimistic update (no visible loading at all)

### Accessibility Theater

**What it looks like:**
```html
<!-- ❌ ARIA on non-semantic elements — you're reimplementing the browser -->
<div role="button" aria-label="Submit" tabindex="0" onkeydown={handleKeyDown}>
  Submit
</div>
```

**Why it fails:** WebAIM found that pages using ARIA had 41% more accessibility errors on
average than pages without. `role="button"` on a div requires you to manually implement:
Enter key activation, Space key activation, focus management, click handler, and proper
announcements. A `<button>` gives you all of this for free.

**Exact replacement:**
```html
<!-- ✅ Semantic HTML — accessibility built in -->
<button type="submit">Submit</button>
```

First rule of ARIA: "No ARIA is better than bad ARIA." Use semantic HTML elements. Add
ARIA only when no native element provides the needed semantics (custom tabs, combobox,
tree view).
