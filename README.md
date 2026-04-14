# elite-engineer

> The operating system for AI-assisted software engineering in TypeScript, React & Next.js.

**One file that makes Claude / Cursor / Copilot produce code that looks like it came from the team at Linear.**

Every principle traces to a named source — Torvalds, Ousterhout, Abramov, Hickey, Carmack, Brooks, Metz. No vibes. No "best practices." Decisive answers to the questions that actually matter.

[![Stars](https://img.shields.io/github/stars/Kerim-Sabic/elite-engineer?style=social)](https://github.com/Kerim-Sabic/elite-engineer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Before & After

<details>
<summary><strong>❌ What AI produces by default</strong></summary>

```typescript
// useEffect as event handler, boolean state machine, no type safety
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [data, setData] = useState(null);

useEffect(() => {
  setIsLoading(true);
  fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(data => { setData(data); setIsLoading(false); })
    .catch(err => { setIsError(true); setIsLoading(false); });
}, [userId]);
```
</details>

<details open>
<summary><strong>✅ What AI produces with elite-engineer</strong></summary>

```typescript
// Discriminated union state, TanStack Query, Zod validation at boundary
const UserSchema = z.object({
  id: z.string().transform(UserId),
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;

function userOptions(id: UserId) {
  return queryOptions({
    queryKey: ['users', id] as const,
    queryFn: async () => {
      const res = await fetch(`/api/users/${id}`);
      return UserSchema.parse(await res.json());
    },
  });
}

// In component — one line, fully typed, cached, deduplicated
const { data: user } = useSuspenseQuery(userOptions(userId));
```
</details>

---

## What's Inside

| Section | What it enforces |
|---------|-----------------|
| **The Standard** | Torvalds' "taste" — find the formulation where special cases disappear |
| **Before the First Line** | Cognitive protocol: essential complexity, pit of success, domain modeling |
| **Architecture Laws** | Deep modules, vertical slices, server/client boundary decision tree |
| **TypeScript at Full Power** | Branded types, discriminated unions, Result\<T,E\>, Zod parsing, sins blacklist |
| **React & Next.js Mastery** | Effects as sync, RSC mental model, hook architecture, optimistic updates |
| **Code Craft** | Naming, guard clauses, table-driven logic, comment philosophy |
| **The Visual Standard** | Type scales, OKLCH color science, 8pt grid, spring animations |
| **Design System** | Primer tokens, Radix Colors, Tailwind v4 @theme, CVA variants |
| **Performance** | INP < 200ms, concurrent features, barrel file ban, render budget |
| **Anti-Pattern Blacklist** | 18 named patterns with exact replacements |

---

## Install

### Claude Code
```bash
# Copy to your project
cp CLAUDE.md .claude/CLAUDE.md
```

### Cursor
```bash
# Copy to your project root
cp .cursorrules .cursorrules
```

### Claude.ai (as a Skill)
Download `elite-engineer.skill` from [Releases](https://github.com/Kerim-Sabic/elite-engineer/releases) and install it in Claude.ai.

### Any AI tool
Copy the contents of `SKILL.md` into your system prompt or custom instructions.

---

## The Sources

This isn't opinion. Every principle traces to specific work:

- **Linus Torvalds** — "Good taste" (TED 2016) — finding representations where edge cases disappear
- **John Ousterhout** — *A Philosophy of Software Design* — deep modules, define errors out of existence
- **Dan Abramov** — "A Complete Guide to useEffect" — effects as synchronization, not lifecycle
- **Rich Hickey** — "Simple Made Easy" (Strange Loop 2011) — simple ≠ easy
- **John Carmack** — Straightline code, visible state, distrust of abstraction
- **Fred Brooks** — *No Silver Bullet* — essential vs accidental complexity
- **Sandi Metz** — *99 Bottles of OOP* — "duplication is far cheaper than the wrong abstraction"
- **Kent C. Dodds** — AHA Programming — avoid hasty abstractions
- **Tanner Linsley** — Server state vs client state, stale-while-revalidate
- **Eric Evans** — *Domain-Driven Design* — bounded contexts, ubiquitous language
- **Jimmy Bogard** — Vertical slice architecture
- **Brad Abrams / Rico Mariani** — Pit of success philosophy

Production codebases studied: **Linear**, **Stripe**, **Vercel** (Next.js, SWR, AI SDK), **Radix UI**, **tRPC**, **Zod**, **TanStack Query**.

Design systems studied: **GitHub Primer**, **Adobe Spectrum**, **Radix Colors**, **Vercel Geist**.

---

## Philosophy

Most AI coding rules are lists of "do this, don't do that." They produce marginally better code.

This is different. It encodes **how elite engineers think** — the cognitive models they use before touching a keyboard. The questions they ask. The tensions they've resolved. The taste they've developed.

The goal isn't to follow rules. It's to develop taste.

> *"I want you to understand that sometimes you can see a problem in a different way and rewrite it so that a special case goes away and becomes the normal case, and that's good code."*
> — Linus Torvalds

---

## Contributing

Found a principle that should be here? A better source? An anti-pattern we missed?

1. Every addition must trace to a **named source** (person, paper, talk, codebase)
2. Every directive must be **actionable** (not aspirational)
3. Every anti-pattern must include the **exact replacement**

Open a PR or issue. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Star History

If this changes how you write code, star the repo. It helps others find it.

[![Star History Chart](https://api.star-history.com/svg?repos=Kerim-Sabic/elite-engineer&type=Date)](https://star-history.com/#Kerim-Sabic/elite-engineer&Date)

---

## License

MIT — use it everywhere, share it with your team, fork it for your stack.
