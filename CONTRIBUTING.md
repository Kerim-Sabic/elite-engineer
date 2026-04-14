# Contributing to Elite Engineer

Thank you for considering a contribution. This skill is meant to be a living standard — it gets better as more engineers challenge and refine it.

## Contribution Rules

Every addition must meet three criteria:

### 1. Named Source
Every principle must trace to a **specific, named source** — a person, paper, talk, or production codebase. "Best practice" is not a source. "Dan Abramov's 'A Complete Guide to useEffect'" is.

### 2. Actionable
Every directive must be specific enough that Claude (or any AI coding assistant) produces **concretely different code** because of it. "Write clean code" is aspirational. "Guard clauses at the top, max 3 nesting levels, max 50 lines per function" is actionable.

### 3. Anti-Patterns Include the Fix
Every anti-pattern must include the **exact replacement pattern** with a code example. Naming the problem without solving it helps no one.

## What We're Looking For

**Great contributions:**
- A new anti-pattern with before/after code and a named source
- A correction to an existing pattern (with evidence)
- A new tension that should be resolved (with your proposed resolution)
- Adaptation for a new stack (Python/FastAPI, Swift/SwiftUI, Rust, Go)
- Better code examples that demonstrate a principle more clearly
- New production codebases to study (with specific architectural insights)

**Not looking for:**
- Opinion without sources
- Framework-specific advice that doesn't generalize
- "It depends" without a decision tree
- Aspirational advice without actionable directives

## How to Contribute

### For small changes (typos, better examples, corrections)
1. Fork the repo
2. Make your change
3. Open a PR with a brief explanation

### For new patterns or principles
1. Open an **Issue** first describing the pattern and its source
2. Include a code example (before/after if applicable)
3. Wait for discussion before writing a PR
4. If approved, write the PR following the existing format

### For new stack adaptations
1. Open an Issue proposing the stack
2. Create a new directory: `stacks/python/`, `stacks/swift/`, etc.
3. Follow the same structure: main file + references
4. Cross-reference the original TypeScript/React principles where they apply

## File Structure

When editing existing content:
- **SKILL.md** — Summaries only. Points to reference files.
- **references/*.md** — Full details, code examples, decision trees.
- **.cursorrules** — Flat single-file version. Must be updated when SKILL.md or references change.
- **.claude/CLAUDE.md** — Same as .cursorrules.

When adding content, decide: does it belong in the summary (SKILL.md) or in a reference file? If it needs a code example longer than 5 lines, it goes in a reference.

## Style

- Imperative form ("Use branded types" not "You should use branded types")
- Explain **why**, not just **what** — the reasoning matters more than the rule
- Name the source inline: "(Ousterhout)" not "according to research"
- Code examples should be real-world, not toy (`UserProfile` not `Foo`)
- TypeScript/React examples by default. Note when a principle is language-agnostic.

## Code of Conduct

Be constructive. Disagree with evidence. The goal is to produce the best possible engineering standard, not to win arguments. If Torvalds and Ousterhout disagree on something, we resolve the tension — we don't pick sides based on popularity.

---

Thank you for helping make AI-generated code indistinguishable from the world's best engineering.
