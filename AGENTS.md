<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project planning & tracking

All roadmap/milestone/phase/checklist/decision tracking for this project lives in **`.planning/`**, in Markdown — see [.planning/README.md](.planning/README.md) for what each file is for. `docs/` stays reserved for the spec (requirements, user histories, system design, UI spec) and the original client-facing planning artifacts (`sprint-roadmap*.xlsx`); it is not where progress gets tracked.

This is a standing rule, not a one-off request:

- Before starting non-trivial work, check [.planning/TODO.md](.planning/TODO.md) and [.planning/EPICS.md](.planning/EPICS.md) for current state instead of assuming.
- When an HU/task/sprint changes status, update the relevant file(s) — [.planning/TODO.md](.planning/TODO.md), [.planning/EPICS.md](.planning/EPICS.md), [.planning/ROADMAP.md](.planning/ROADMAP.md), [.planning/PHASES.md](.planning/PHASES.md), [.planning/MILESTONES.md](.planning/MILESTONES.md) — **in the same session as the work itself**, not deferred to "later."
- Any non-trivial decision (architecture choice, scope cut, rejected approach, plan changed mid-flight) gets a dated entry in [.planning/LOG.md](.planning/LOG.md), including the reasoning and what was rejected — not just the outcome.
- Don't let this file (`docs/requeriments.md`, `docs/User_Histories.md`) or the sprint spreadsheets become the place progress is tracked again — if you're about to note "done" or "in progress" anywhere, it belongs in `.planning/`.
