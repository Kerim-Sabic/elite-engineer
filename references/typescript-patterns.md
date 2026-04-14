# TypeScript Patterns Reference

## Table of Contents
1. [Branded Types](#branded-types)
2. [Discriminated Unions as State Machines](#discriminated-unions)
3. [Result Pattern](#result-pattern)
4. [Parse Don't Validate](#parse-dont-validate)
5. [Const Assertions + Satisfies](#const-assertions--satisfies)
6. [Template Literal Types](#template-literal-types)
7. [Generic Inference Patterns](#generic-inference-patterns)
8. [The queryOptions Pattern](#the-queryoptions-pattern)
9. [Conditional Types and Infer](#conditional-types-and-infer)
10. [TypeScript Sins — Complete Blacklist](#typescript-sins)

---

## Branded Types

TypeScript uses structural typing. Two types with the same shape are interchangeable.
This is dangerous for domain identifiers:

```typescript
type UserId = string;
type PostId = string;

function deleteUser(id: UserId) { /* ... */ }
const postId: PostId = "post_123";
deleteUser(postId); // ✅ Compiles! But this is a bug.
```

**The fix — branded types with zero runtime overhead:**

```typescript
// Generic brand utility
type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

// Domain-specific branded types
type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;
type Email = Brand<string, 'Email'>;

// Constructor functions — the ONLY way to create branded values
function UserId(id: string): UserId { return id as UserId; }
function PostId(id: string): PostId { return id as PostId; }
function Email(raw: string): Email {
  if (!raw.includes('@')) throw new Error('Invalid email');
  return raw as Email;
}

// Now type-safe:
function deleteUser(id: UserId) { /* ... */ }
const postId = PostId("post_123");
deleteUser(postId); // ❌ Compile error! PostId not assignable to UserId
deleteUser(UserId("user_456")); // ✅ Correct
```

The `__brand` property exists only at the type level — zero bytes in the runtime output.
Create branding functions at validation boundaries (API responses, form submissions, URL
params). Once branded, the type carries proof of validity through the entire call chain.

**When to use:** Any string/number that represents a domain identifier (user IDs, order
IDs, email addresses, currency amounts, timestamps-as-numbers). Especially at API
boundaries where mixing up parameters causes silent data corruption.

---

## Discriminated Unions

The boolean trap:

```typescript
// ❌ IMPOSSIBLE STATES ARE REPRESENTABLE
interface AsyncState {
  isLoading: boolean;
  isError: boolean;
  data: User | null;
  error: Error | null;
}
// Can be loading AND have an error AND have data simultaneously.
// 2^4 = 16 possible states, but only 4 are valid.
```

**The fix — discriminated unions:**

```typescript
// ✅ IMPOSSIBLE STATES ARE STRUCTURALLY EXCLUDED
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// TypeScript narrows automatically:
function render(state: AsyncState<User>) {
  switch (state.status) {
    case 'idle':    return <Empty />;
    case 'loading': return <Skeleton />;
    case 'success': return <UserCard user={state.data} />;   // data is User, not null
    case 'error':   return <ErrorMsg error={state.error} />; // error is Error, not null
  }
}
```

**Exhaustiveness checking — catch missing cases at compile time:**

```typescript
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${x}`);
}

// In switch statements:
default: return assertNever(state); // Compile error if a case is missing
```

**Complex state machines — no library needed:**

```typescript
type OrderState =
  | { status: 'draft'; items: CartItem[] }
  | { status: 'submitted'; items: CartItem[]; submittedAt: Date }
  | { status: 'paid'; items: CartItem[]; submittedAt: Date; paymentId: string }
  | { status: 'shipped'; items: CartItem[]; submittedAt: Date; paymentId: string; trackingId: string }
  | { status: 'cancelled'; reason: string };

// Each transition is a function that takes the valid input state and returns the next:
function submitOrder(order: Extract<OrderState, { status: 'draft' }>): Extract<OrderState, { status: 'submitted' }> {
  return { ...order, status: 'submitted', submittedAt: new Date() };
}
// Cannot call submitOrder on a 'shipped' order — compile error.
```

---

## Result Pattern

Exceptions are invisible in TypeScript — the type system doesn't track them. Expected
failures (validation errors, not-found, permission denied) should be in the return type:

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Helper constructors
const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Usage:
async function getUser(id: UserId): Promise<Result<User, 'not_found' | 'forbidden'>> {
  const response = await fetch(`/api/users/${id}`);
  if (response.status === 404) return Err('not_found');
  if (response.status === 403) return Err('forbidden');
  return Ok(await response.json());
}

// Caller MUST handle both cases — TypeScript enforces it:
const result = await getUser(userId);
if (!result.ok) {
  // result.error is typed as 'not_found' | 'forbidden'
  switch (result.error) {
    case 'not_found': return redirect('/404');
    case 'forbidden': return redirect('/login');
  }
}
// result.value is typed as User here
```

**When to use:** Expected business failures. API calls that can return known error states.
Validation functions.

**When NOT to use:** Unexpected errors (bugs, network failures) — let those throw and
catch at error boundaries. Simple functions where null/undefined is sufficient.

---

## Parse Don't Validate

Alexis King's principle: validation checks data and returns a boolean — proof of validity
is immediately discarded. Parsing consumes less-structured input and produces
more-structured output.

```typescript
// ❌ VALIDATE — proof is discarded
function isValidUser(data: unknown): boolean {
  return typeof data === 'object' && data !== null && 'name' in data;
}
if (isValidUser(input)) {
  // input is still `unknown` — validation proved nothing to the compiler
}

// ✅ PARSE — proof is encoded in the return type
const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'viewer']),
});
type User = z.infer<typeof UserSchema>;

const user = UserSchema.parse(untrustedInput);
// user is typed as { name: string; email: string; role: 'admin' | 'user' | 'viewer' }
// Invalid data throws ZodError with structured error messages
```

**The Zod integration pattern:**

```typescript
// 1. Define schema (single source of truth)
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private']),
});

// 2. Derive the type (never manually write this interface)
type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// 3. Use in Server Action
export async function createProject(formData: FormData) {
  const input = CreateProjectSchema.parse(Object.fromEntries(formData));
  // input is fully typed — proceed with confidence
}

// 4. Use in form for client-side validation
const form = useForm<CreateProjectInput>({
  resolver: zodResolver(CreateProjectSchema),
});
```

Validate at the boundary where untrusted data enters (API routes, form submissions,
webhook handlers, URL params). Use precise types everywhere downstream. Never re-validate.

---

## Const Assertions + Satisfies

**`as const`** prevents literal type widening:
```typescript
const routes = { home: '/home', about: '/about' }; // type: { home: string; about: string }
const routes = { home: '/home', about: '/about' } as const;
// type: { readonly home: '/home'; readonly about: '/about' }
```

**`satisfies`** validates structure without widening:
```typescript
const config = { port: 3000, host: 'localhost' } satisfies ServerConfig;
// Type is still { port: 3000; host: 'localhost' } (literals preserved)
// BUT TypeScript verifies it matches ServerConfig shape
```

**Combined — the power move:**
```typescript
const ROUTES = {
  home: { path: '/', label: 'Home' },
  dashboard: { path: '/dashboard', label: 'Dashboard' },
  settings: { path: '/settings', label: 'Settings' },
} as const satisfies Record<string, { path: string; label: string }>;

// ROUTES.home.path is '/' (literal type), not string
// AND the shape is validated — add a route missing 'label' and get a compile error
type RouteKey = keyof typeof ROUTES; // 'home' | 'dashboard' | 'settings'
type RoutePath = (typeof ROUTES)[RouteKey]['path']; // '/' | '/dashboard' | '/settings'
```

**When to use:** Configuration objects, route maps, feature flags, enum-like objects,
theme definitions. Any const object that should be both structurally validated AND
preserve literal types for downstream inference.

---

## Template Literal Types

Build type-safe string patterns:

```typescript
type EventName = `on${Capitalize<string>}`; // "onClick", "onFocus", etc.

// Type-safe CSS custom properties:
type CSSVar = `--${string}`;
function setCSSVar(el: HTMLElement, name: CSSVar, value: string) {
  el.style.setProperty(name, value);
}
setCSSVar(el, '--color-primary', '#000'); // ✅
setCSSVar(el, 'color-primary', '#000');   // ❌ Missing --

// Type-safe route params:
type Route = '/users/:id' | '/posts/:postId/comments/:commentId';
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type UserRouteParams = ExtractParams<'/users/:id'>; // "id"
```

**When appropriate:** Route params, event systems, CSS variable naming, API endpoint
builders. **When over-engineering:** Simple string unions work fine for small, known sets.
Don't use template literals just because you can.

---

## Generic Inference Patterns

How TanStack Query achieves zero-annotation type inference:

```typescript
// The return type of queryFn AUTOMATICALLY becomes the type of `data`
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: async () => {
    const res = await fetch(`/api/users/${userId}`);
    return res.json() as Promise<User>; // This type flows through
  },
});
// data is User | undefined — no annotation needed at the call site
```

**Generic constraint propagation:**
```typescript
function createStore<T extends Record<string, unknown>>(initial: T) {
  let state = initial;
  return {
    get<K extends keyof T>(key: K): T[K] { return state[key]; },
    set<K extends keyof T>(key: K, value: T[K]) { state[key] = value; },
  };
}
const store = createStore({ count: 0, name: 'hello' });
store.get('count'); // number (not unknown)
store.set('count', 'string'); // ❌ Compile error — 'string' not assignable to number
```

---

## The queryOptions Pattern

TanStack Query v5's helper preserves the relationship between queryKey and queryFn return
type across extraction boundaries:

```typescript
// Define query options as a factory function
function userOptions(id: string) {
  return queryOptions({
    queryKey: ['users', id] as const,
    queryFn: () => fetchUser(id),
    staleTime: 5 * 60 * 1000,
  });
}

// Use anywhere — type inference is preserved
const { data } = useQuery(userOptions(userId));       // data: User | undefined
const { data } = useSuspenseQuery(userOptions(userId)); // data: User (no undefined)
await queryClient.prefetchQuery(userOptions(userId));    // prefetch with same config
queryClient.invalidateQueries({ queryKey: userOptions(userId).queryKey }); // type-safe key
```

Without `queryOptions`, extracting query config into a variable loses the type connection
between queryKey and the return type. The helper was necessary because TypeScript cannot
otherwise infer generic parameters from an extracted object.

---

## Conditional Types and Infer

**When genuinely necessary:**

```typescript
// Extract the resolved type from a Promise
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;
type X = Awaited<Promise<Promise<string>>>; // string

// Extract props type from a React component
type PropsOf<T> = T extends React.ComponentType<infer P> ? P : never;

// Extract return type of a function
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;
```

**When they obscure rather than clarify:** If you need nested conditional types 3+ levels
deep, the type is too complex. Simplify the runtime code instead — complex types usually
indicate complex architecture. Types should describe structure, not implement algorithms.

---

## TypeScript Sins

### `any` — The Type System Off Switch

Every `any` is infectious. Assigning an `any` to a typed variable doesn't error — the
infection spreads silently through the codebase.

```typescript
// ❌ any makes everything downstream unsafe
function parseData(raw: any) { return raw.data.items; } // No errors, no safety

// ✅ unknown forces explicit narrowing
function parseData(raw: unknown): Item[] {
  const parsed = DataSchema.parse(raw); // Zod validates at runtime
  return parsed.data.items;             // Fully typed from here
}
```

**Legitimate `any`:** Generic constraints where `unknown` is too restrictive:
`T extends (...args: any[]) => infer R`. This is the ONLY acceptable use.

### `as` — The Trust-Me Operator

Type assertions tell TypeScript "I know better" — preventing it from catching mismatches.

```typescript
// ❌ Silent failure — TypeScript trusts you
const user = response.data as User; // What if response.data is null?

// ✅ Runtime validation
const user = UserSchema.parse(response.data); // Throws if invalid

// ✅ Type guard
function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'id' in data;
}
```

**Exception:** `as const` is safe — it narrows types, not widens them.

### `!` — The Non-Null Lie

```typescript
// ❌ Will crash if element doesn't exist
const el = document.getElementById('root')!;

// ✅ Handle the null case
const el = document.getElementById('root');
if (!el) throw new Error('Root element not found');
// el is now HTMLElement (narrowed)
```

### `@ts-ignore` / `@ts-expect-error`

`@ts-ignore` suppresses ALL errors on the next line — including real bugs.

```typescript
// ❌ Hides ALL errors, including future regressions
// @ts-ignore
const result = brokenFunction(wrongArgs);

// ✅ If you absolutely must, use @ts-expect-error with explanation
// @ts-expect-error — Third-party types are wrong, filed issue #1234
const result = thirdPartyFunction(correctArgs);
```

`@ts-expect-error` will ERROR if the underlying issue is fixed (the expected error
disappears), so it self-cleans. `@ts-ignore` silently persists forever.
