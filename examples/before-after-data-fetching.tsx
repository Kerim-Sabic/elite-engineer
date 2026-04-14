// ============================================================
// BEFORE: What AI produces by default
// Problems: useEffect as fetcher, boolean state machine,
// no type safety, no caching, race conditions
// ============================================================

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        setUser(data); // ← No runtime validation. data could be anything.
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsError(true);
        setIsLoading(false);
      });
  }, [userId]);

  // isLoading=true AND isError=true AND user is set? All possible. All meaningless.
  if (isLoading) return <div className="spinner" />;
  if (isError) return <div>Error: {error?.message}</div>;
  if (!user) return null;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}


// ============================================================
// AFTER: With elite-engineer rules applied
// Branded types, Zod parsing, TanStack Query, Suspense,
// zero impossible states, cached, deduplicated
// ============================================================

import { z } from 'zod';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// --- Domain types with branding ---
type Brand<T, B extends string> = T & { readonly __brand: B };
type UserId = Brand<string, 'UserId'>;
function UserId(id: string): UserId { return id as UserId; }

// --- Schema: single source of truth for type + validation ---
const UserSchema = z.object({
  id: z.string().transform(UserId),
  name: z.string().min(1),
  email: z.string().email(),
});
type User = z.infer<typeof UserSchema>;

// --- Query options: reusable, type-safe, composable ---
function userOptions(id: UserId) {
  return queryOptions({
    queryKey: ['users', id] as const,
    queryFn: async () => {
      const res = await fetch(`/api/users/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch user ${id}`);
      return UserSchema.parse(await res.json()); // Runtime validated
    },
    staleTime: 5 * 60 * 1000,
  });
}

// --- Component: zero loading/error handling, Suspense does it ---
function UserProfileContent({ userId }: { userId: UserId }) {
  const { data: user } = useSuspenseQuery(userOptions(userId));
  // user is User — guaranteed by Zod + Suspense. Never null, never loading.
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// --- Page: error boundary + suspense at the boundary ---
function UserProfilePage({ userId }: { userId: string }) {
  return (
    <ErrorBoundary fallback={<UserProfileError />}>
      <Suspense fallback={<UserProfileSkeleton />}>
        <UserProfileContent userId={UserId(userId)} />
      </Suspense>
    </ErrorBoundary>
  );
}

function UserProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="mt-2 h-5 w-64 rounded bg-gray-200" />
    </div>
  );
}

function UserProfileError() {
  return (
    <div role="alert">
      <h2>Unable to load profile</h2>
      <p>Please try again in a moment.</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
}
