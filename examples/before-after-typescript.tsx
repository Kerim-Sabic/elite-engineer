// ============================================================
// BEFORE: TypeScript used at 20% of its capability
// Problems: any, as, boolean flags, no runtime validation,
// IDs are interchangeable strings
// ============================================================

interface ApiResponse {
  user: any;
  permissions: any[];
}

interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  data: any;
  error: any;
}

// These are all just strings — nothing prevents mixing them up
function transferOwnership(fromUserId: string, toUserId: string, projectId: string) {
  // What if someone calls transferOwnership(projectId, fromUserId, toUserId)?
  // No compile error. Silent data corruption.
  return fetch('/api/transfer', {
    method: 'POST',
    body: JSON.stringify({ fromUserId, toUserId, projectId }),
  });
}

async function fetchUserData(userId: string) {
  const res = await fetch(`/api/users/${userId}`);
  const data = (await res.json()) as ApiResponse; // ← "trust me" — no runtime check
  return data.user; // any — type safety ends here
}

const config = {
  apiUrl: 'https://api.example.com',
  retries: 3,
  timeout: 5000,
};
// config.apiUrl is string (not the literal). config.retries is number (not 3).
// Can accidentally assign config.retries = "hello" later.


// ============================================================
// AFTER: TypeScript at full power
// Branded types, discriminated unions, Zod, as const satisfies,
// Result type for expected failures
// ============================================================

import { z } from 'zod';

// --- Branded types prevent ID confusion at zero runtime cost ---
type Brand<T, B extends string> = T & { readonly __brand: B };
type UserId = Brand<string, 'UserId'>;
type ProjectId = Brand<string, 'ProjectId'>;

function UserId(id: string): UserId { return id as UserId; }
function ProjectId(id: string): ProjectId { return id as ProjectId; }

// Now the compiler prevents parameter swapping:
function transferOwnership(from: UserId, to: UserId, project: ProjectId) {
  return fetch('/api/transfer', {
    method: 'POST',
    body: JSON.stringify({ fromUserId: from, toUserId: to, projectId: project }),
  });
}
// transferOwnership(projectId, fromUserId, toUserId) → COMPILE ERROR

// --- Discriminated union for form state ---
type FormState<T> =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// TypeScript narrows automatically in switch/case.
// Impossible to be "submitting" AND "success" simultaneously.

// --- Zod schema: parse at the boundary, trust downstream ---
const UserSchema = z.object({
  id: z.string().transform(UserId),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
});
type User = z.infer<typeof UserSchema>;

const ApiResponseSchema = z.object({
  user: UserSchema,
  permissions: z.array(z.string()),
});

async function fetchUserData(userId: UserId): Promise<User> {
  const res = await fetch(`/api/users/${userId}`);
  const data = ApiResponseSchema.parse(await res.json()); // Runtime validated
  return data.user; // Fully typed User, not any
}

// --- Result type for expected failures ---
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

const Ok = <T,>(value: T): Result<T, never> => ({ ok: true, value });
const Err = <E,>(error: E): Result<never, E> => ({ ok: false, error });

async function getUser(id: UserId): Promise<Result<User, 'not_found' | 'forbidden'>> {
  const res = await fetch(`/api/users/${id}`);
  if (res.status === 404) return Err('not_found');
  if (res.status === 403) return Err('forbidden');
  return Ok(UserSchema.parse(await res.json()));
}
// Caller MUST handle both ok and error cases — TypeScript enforces it.

// --- as const satisfies: literal types + structural validation ---
const CONFIG = {
  apiUrl: 'https://api.example.com',
  retries: 3,
  timeout: 5000,
} as const satisfies Record<string, string | number>;

// CONFIG.apiUrl is 'https://api.example.com' (literal), not string
// CONFIG.retries is 3 (literal), not number
// AND the shape is validated — add a boolean and get a compile error

// --- Exhaustive switch with never ---
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

function renderFormState<T>(state: FormState<T>) {
  switch (state.status) {
    case 'idle':       return <IdleView />;
    case 'submitting': return <Spinner />;
    case 'success':    return <SuccessView data={state.data} />;
    case 'error':      return <ErrorView error={state.error} />;
    default:           return assertNever(state); // Compile error if case missing
  }
}
