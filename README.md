# elite-engineer

> The operating system for AI-assisted software engineering in TypeScript, React, and Next.js.

**elite-engineer** is a portable ruleset for tools like Cursor, Claude Code, Claude.ai, and any assistant that supports custom instructions or system prompts.

It is designed to push models away from default AI output:

- boolean state machines instead of impossible-state-proof unions
- `useEffect` used as an event system
- shallow folder structures and pass-through layers
- unsafe TypeScript with `any`, `as`, and runtime trust
- visually flat, generic UI with weak hierarchy and no motion discipline

and toward code that is:

- typed honestly
- architected in vertical slices
- grounded in named sources
- visually deliberate
- performance-aware
- reviewable by strong engineers without immediate cleanup

[![Stars](https://img.shields.io/github/stars/Kerim-Sabic/elite-engineer?style=social)](https://github.com/Kerim-Sabic/elite-engineer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## What This Repository Is

This repository is not an app, library, or framework. It is a **skill/instruction system** you attach to an AI coding tool so the model generates better code and makes better engineering decisions.

The standard is intentionally opinionated. It does not try to represent every valid style. It encodes a specific point of view:

- Linus Torvalds on taste and removing special cases
- John Ousterhout on deep modules and complexity management
- Dan Abramov on effects as synchronization
- Rich Hickey on simple vs easy
- Fred Brooks on essential complexity
- Sandi Metz and Kent C. Dodds on resisting premature abstraction
- Tanner Linsley on server state
- Eric Evans and Jimmy Bogard on domain boundaries and vertical slices

If you want AI output that feels closer to Linear, Stripe, Vercel, Radix, or a disciplined product engineering team, this repo is aimed at that use case.

---

## What You Get

`elite-engineer` changes both **what the model writes** and **how it thinks before writing**.

### Engineering behavior

- models essential complexity before coding
- prefers deep modules over shallow wrappers
- treats architecture as a first-class concern
- defaults to vertical slices over horizontal layers
- avoids accidental complexity and weak abstractions

### TypeScript behavior

- uses branded types at identity boundaries
- uses discriminated unions for async and UI state
- parses with Zod at boundaries instead of trusting input
- uses `as const satisfies` for strong inference
- treats `any`, `as`, `!`, and `@ts-ignore` as last-resort smells

### React / Next.js behavior

- uses `useEffect` only for external synchronization
- distinguishes server state from client state
- defaults to Server Components and pushes `'use client'` to leaves
- encourages deep custom hooks and colocated feature logic
- uses optimistic updates, Suspense, and proper async boundaries

### UI behavior

- applies a real type scale
- uses OKLCH and semantic tokens
- respects spacing systems and motion roles
- avoids generic "AI slop" interfaces
- favors design systems that can scale

### Review behavior

- recognizes common AI anti-patterns immediately
- recommends specific replacements, not vague style advice
- pushes toward code that is easier to maintain six months later

---

## Before And After

The repo includes concrete before/after examples showing the kind of transformation this standard is meant to produce.

### Default AI output

```typescript
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [data, setData] = useState(null);

useEffect(() => {
  setIsLoading(true);
  fetch(`/api/users/${userId}`)
    .then((res) => res.json())
    .then((value) => {
      setData(value);
      setIsLoading(false);
    })
    .catch(() => {
      setIsError(true);
      setIsLoading(false);
    });
}, [userId]);
```

### With `elite-engineer`

```typescript
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
      if (!res.ok) throw new Error(`Failed to fetch user ${id}`);
      return UserSchema.parse(await res.json());
    },
  });
}

const { data: user } = useSuspenseQuery(userOptions(userId));
```

More examples:

- [examples/before-after-data-fetching.tsx](examples/before-after-data-fetching.tsx)
- [examples/before-after-typescript.tsx](examples/before-after-typescript.tsx)
- [examples/before-after-components.tsx](examples/before-after-components.tsx)

---

## Choose The Right File

This repo contains the same standard in a few different packaging formats.

| File | Use it for |
| --- | --- |
| [`SKILL.md`](SKILL.md) | Canonical readable version of the skill |
| [`elite-engineer.skill`](elite-engineer.skill) | Packaged skill file for Claude.ai |
| [`codex-skill/elite-engineer`](codex-skill/elite-engineer) | Codex-ready skill folder |
| [`.cursorrules`](.cursorrules) | Cursor rules file |
| [`.claude/CLAUDE.md`](.claude/CLAUDE.md) | Claude Code project instructions |
| [`references/`](references) | Deep-dive documents for specific domains |
| [`examples/`](examples) | Before/after examples you can inspect or show to a model |
| [`docs/codex.md`](docs/codex.md) | Step-by-step Codex install and usage tutorial |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution standards and source requirements |

If you only read one file, read `SKILL.md`.

---

## Installation

Pick the integration that matches your AI tool. You usually need **one** entrypoint, not all of them.

### Cursor

Copy `.cursorrules` into the root of the project where you want the rules applied.

```bash
cp /path/to/elite-engineer/.cursorrules /path/to/your-project/.cursorrules
```

### Claude Code

Copy `.claude/CLAUDE.md` into the target project's `.claude/` directory.

```bash
mkdir -p /path/to/your-project/.claude
cp /path/to/elite-engineer/.claude/CLAUDE.md /path/to/your-project/.claude/CLAUDE.md
```

### Claude.ai

Use the packaged `elite-engineer.skill` file through Claude.ai's skill flow.

### Codex

Use the packaged Codex skill folder at [`codex-skill/elite-engineer`](codex-skill/elite-engineer).

There are two install paths:

- download `elite-engineer-codex-skill.zip` from Releases and extract it into `~/.codex/skills/`
- install directly from the repo path `codex-skill/elite-engineer` with Codex's skill installer

Full tutorial: [`docs/codex.md`](docs/codex.md)

### ChatGPT or any tool with custom instructions

Paste the contents of `SKILL.md` into the tool's system prompt, custom instructions, or shared project instructions.

### Team setup

If multiple engineers are using the same AI stack, keep the repo as a shared reference and standardize on one of these entrypoints:

- `.cursorrules` for Cursor teams
- `.claude/CLAUDE.md` for Claude Code projects
- `SKILL.md` for platform-agnostic internal prompts

---

## How To Use It Well

Installing the rules is only part of the value. The better results come from pairing the skill with the right task framing.

### Good use cases

- generate a new feature in TypeScript / React / Next.js
- refactor a legacy component into a clearer architecture
- review a pull request for AI anti-patterns
- create design-system primitives and variants
- improve perceived performance and loading states
- model a domain before writing UI

### Best prompting pattern

Ask the model to do the task **and** to follow the standard explicitly.

Example prompts:

```text
Build this dashboard using the elite-engineer standard. Use vertical slices, Zod at boundaries, TanStack Query for server state, and avoid useEffect for derived state.
```

```text
Refactor this component using elite-engineer rules. Split out deep hooks, replace boolean async state with a discriminated union, and push client-only logic to leaf components.
```

```text
Review this diff against the elite-engineer anti-pattern blacklist and call out anything that would not survive a strong team review.
```

### For non-trivial tasks

Have the model read the relevant reference file before it starts coding.

| Task type | Read first |
| --- | --- |
| Architecture, modules, folder structure | [`references/architecture.md`](references/architecture.md) |
| TypeScript modeling and validation | [`references/typescript-patterns.md`](references/typescript-patterns.md) |
| React hooks, Next.js boundaries, async UI | [`references/react-nextjs-patterns.md`](references/react-nextjs-patterns.md) |
| Typography, color, layout, motion | [`references/visual-standard.md`](references/visual-standard.md) |
| Tokens, CVA, Tailwind, component APIs | [`references/design-system.md`](references/design-system.md) |
| Refactoring and code review | [`references/anti-patterns.md`](references/anti-patterns.md) |

For bigger tasks, start with architecture and then pull in the domain-specific references.

---

## Repository Structure

```text
.
|-- .claude/
|   `-- CLAUDE.md
|-- codex-skill/
|   `-- elite-engineer/
|       |-- SKILL.md
|       |-- agents/
|       |   `-- openai.yaml
|       `-- references/
|-- docs/
|   `-- codex.md
|-- examples/
|   |-- before-after-components.tsx
|   |-- before-after-data-fetching.tsx
|   `-- before-after-typescript.tsx
|-- references/
|   |-- anti-patterns.md
|   |-- architecture.md
|   |-- design-system.md
|   |-- react-nextjs-patterns.md
|   |-- typescript-patterns.md
|   `-- visual-standard.md
|-- .cursorrules
|-- CONTRIBUTING.md
|-- elite-engineer.skill
|-- LICENSE
|-- README.md
|-- scripts/
|   `-- build-codex-skill.ps1
`-- SKILL.md
```

### File roles

- `SKILL.md` is the primary readable version of the standard.
- `codex-skill/elite-engineer` is the Codex-installable distribution of the skill.
- `references/*.md` contain the deeper explanations, examples, and decision trees.
- `.cursorrules` and `.claude/CLAUDE.md` are delivery formats for specific tools.
- `elite-engineer.skill` is the packaged artifact for Claude.ai.
- `docs/codex.md` explains how to install and use the Codex version.
- `scripts/build-codex-skill.ps1` produces the zip artifact for GitHub Releases.
- `examples/*.tsx` show what changes in practice.

---

## What The Standard Enforces

At a high level, the skill is organized around a few major pillars.

### 1. The Standard

Seek the formulation where special cases disappear. Favor representations that make misuse difficult and correctness natural.

### 2. Before The First Line

Before coding, clarify:

- what complexity is essential
- where the boundaries are
- what the pit of success looks like
- whether the solution is simple, not just easy
- whether abstraction has actually been earned

### 3. Architecture Laws

- deep modules over shallow wrappers
- vertical slices over horizontal technical layers
- inward-pointing dependencies
- explicit server/client boundaries
- fewer pass-through abstractions

### 4. TypeScript At Full Power

- branded types for identity safety
- discriminated unions for impossible states
- Zod at all external data boundaries
- strong inference instead of annotation theater
- no fake safety via unchecked casts

### 5. React And Next.js Mastery

- effects for synchronization only
- clear distinction between server state and local UI state
- Server Components by default
- deep hooks that hide complexity behind small interfaces
- optimistic updates and Suspense-aware async flows

### 6. Code Craft

- naming that reads like prose
- guard clauses and flattened control flow
- table-driven logic where condition chains are brittle
- short functions with bounded complexity
- comments that explain why, not what

### 7. Visual Standard

- modular type scales
- OKLCH and semantic color systems
- spacing systems with real hierarchy
- purposeful animation
- stronger defaults for product UI

### 8. Anti-Pattern Blacklist

The repo names common AI failures directly and gives exact replacements, including:

- `useEffect` as event handler
- state synchronization traps
- loading booleans
- premature abstraction
- type theater
- mega-components
- dependency-array suppression

---

## Why The Repo Is Structured This Way

The project separates **portable instructions** from **deep references**.

That split matters because most tools want a concise rules file, while real engineering work often needs deeper explanation and examples.

- The rules files are what you install into the assistant.
- The reference files are what the assistant should consult before larger tasks.
- The examples make the expected output concrete instead of rhetorical.

This keeps the installation artifacts small enough to use, without flattening the entire engineering standard into a vague checklist.

---

## Sources And Influences

This repository is intentionally source-grounded. It is not a collection of floating "best practices."

Named sources include:

- Linus Torvalds
- John Ousterhout
- Dan Abramov
- Rich Hickey
- John Carmack
- Fred Brooks
- Sandi Metz
- Kent C. Dodds
- Tanner Linsley
- Eric Evans
- Jimmy Bogard
- Brad Abrams
- Rico Mariani

Production codebases and systems studied include:

- Linear
- Stripe
- Vercel
- Radix UI
- tRPC
- Zod
- TanStack Query
- GitHub Primer
- Adobe Spectrum
- Radix Colors

The goal is not to imitate any single company. The goal is to distill recurring patterns from teams and engineers with unusually high standards.

---

## Contributing

Contributions are welcome, but the bar is intentional.

Every addition should satisfy all three:

1. It traces to a named source.
2. It is actionable enough to change the model's output.
3. If it identifies an anti-pattern, it also provides the replacement.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full rules.

Useful contribution areas:

- stronger before/after examples
- better source citations
- new anti-patterns with concrete fixes
- clearer decision trees
- stack adaptations for ecosystems beyond TypeScript / React / Next.js

---

## FAQ

### Is this only useful for AI?

No. It is written for AI-assisted workflows, but it is also a readable engineering standard for humans. The references and examples stand on their own.

### Is it only for frontend work?

The center of gravity is TypeScript, React, Next.js, and product UI. Some principles are general software design guidance, but the examples and rules are strongest in those domains.

### Does this replace engineering judgment?

No. It raises the floor and makes better default decisions more likely. Strong engineering still requires context, tradeoff analysis, and judgment.

### Is this too opinionated for some teams?

Yes, sometimes. That is part of the point. A useful standard needs sharp edges. Teams can fork or adapt it to match their own taste and stack.

---

## Star History

If this repo materially improves the quality of your AI-assisted coding workflow, star it so other engineers can find it.

[![Star History Chart](https://api.star-history.com/svg?repos=Kerim-Sabic/elite-engineer&type=Date)](https://star-history.com/#Kerim-Sabic/elite-engineer&Date)

---

## License

MIT. Use it, adapt it, fork it, and share it with your team.
