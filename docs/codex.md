# Using elite-engineer In Codex

This repository now includes a Codex-ready skill folder at [`codex-skill/elite-engineer`](../codex-skill/elite-engineer).

If you want the fastest path, download the latest `elite-engineer-codex-skill.zip` asset from GitHub Releases and install that.

## Option 1: Install From Releases

### Windows

1. Download `elite-engineer-codex-skill.zip` from the latest release.
2. Extract the zip.
3. Copy the extracted `elite-engineer` folder into `%USERPROFILE%\.codex\skills\`.
4. Restart Codex.

Final path should look like:

```text
%USERPROFILE%\.codex\skills\elite-engineer\SKILL.md
%USERPROFILE%\.codex\skills\elite-engineer\agents\openai.yaml
%USERPROFILE%\.codex\skills\elite-engineer\references\architecture.md
```

### macOS / Linux

1. Download `elite-engineer-codex-skill.zip` from the latest release.
2. Extract the zip.
3. Copy the extracted `elite-engineer` folder into `~/.codex/skills/`.
4. Restart Codex.

Final path should look like:

```text
~/.codex/skills/elite-engineer/SKILL.md
~/.codex/skills/elite-engineer/agents/openai.yaml
~/.codex/skills/elite-engineer/references/architecture.md
```

## Option 2: Install Directly From GitHub In Codex

If Codex has the built-in skill installer available, ask it:

```text
Install the skill from GitHub repo Kerim-Sabic/elite-engineer path codex-skill/elite-engineer
```

After the install completes, restart Codex so it picks up the new skill.

## How To Use The Skill

The skill can trigger automatically for relevant TypeScript, React, Next.js, UI, refactor, and review work, but explicit invocation is the safer pattern.

Use prompts like:

```text
Use $elite-engineer to build this feature.
```

```text
Use $elite-engineer and refactor this component into a vertical slice with deep hooks and Zod at the boundary.
```

```text
Use $elite-engineer to review this diff for AI anti-patterns.
```

## Best Workflow In Codex

1. Ask Codex to use `$elite-engineer`.
2. For non-trivial work, tell it to read the relevant reference file first.
3. Keep prompts concrete about boundaries, state handling, and UI expectations.

Example:

```text
Use $elite-engineer. Read references/react-nextjs-patterns.md and references/typescript-patterns.md first, then refactor this settings page to remove useEffect-driven derived state, replace boolean async state with a discriminated union, and keep the client boundary at the leaves.
```

## Which Files Matter

- `SKILL.md`: main behavior and trigger description
- `agents/openai.yaml`: Codex UI metadata
- `references/*.md`: deeper guidance the skill points to when the task needs it

## Updating The Release Zip

From the repository root, run:

```powershell
./scripts/build-codex-skill.ps1
```

This creates:

```text
dist/elite-engineer-codex-skill.zip
```

That zip is the file to upload to GitHub Releases.
