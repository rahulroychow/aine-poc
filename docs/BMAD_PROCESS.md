# How BMad Guided the Implementation

A narrative of the workflow this repository went through, with pointers to the
artifacts each step produced. Companion to `AI_INTEGRATION_LOG.md`, which
covers the AI-specific lessons, and `FRAMEWORK_COMPARISON.md`, which weighs
the method against the alternative.

## Sequence

```
bmad-help
  └─ bmad-agent-pm (John) ─── bmad-prd ──────────────► prd.md, .memlog.md
       └─ bmad-architecture (fast, spine) ───────────► ARCHITECTURE-SPINE.md, .memlog.md
            └─ bmad-create-epics-and-stories ────────► epics.md
                 └─ bmad-sprint-planning ────────────► sprint-status.yaml
                      └─ bmad-build × 7 stories ─────► spec-*.md, deferred-work.md, source
```

All planning artifacts are in `_bmad-output/planning-artifacts/`; the story
specs and sprint tracking are in `_bmad-output/implementation-artifacts/`.

## Step 1: Project brief and PRD

The training brief's PRD text was handed to the PM persona. The interview
asked about sketches, project stakes, platform, users and stack. The answers
fixed the scope that everything downstream inherited:

- Learning project; low stakes; clean foundation over completeness.
- Responsive single-codebase web app.
- React, mock API, localStorage as the database. **No real backend in v1.**
- Professional tone, minimal interface.
- Create, view, complete, delete. No auth, sync, priorities or dates.

Each of these is a dated entry in the PRD memlog. The PRD itself records
assumptions (Vite, plain CSS or shadcn, static hosting) and open questions
(undo on delete, ordering) for the architect to resolve.

## Step 2: Architecture

The Architect persona ran in "fast, spine" mode, producing only the invariants
that keep independently built pieces consistent. Seven architecture decisions
came out, two of them from direct human constraints:

| AD | Decision | Origin |
| --- | --- | --- |
| AD-1 | Component-driven React, unidirectional flow, component state only | Human: "just use react state, no redux" |
| AD-2 | localStorage is the single source of truth | PRD |
| AD-3 | Async CRUD API layer between components and storage | PRD's "mock API" |
| AD-4 | Schema: `{id, description, completed, createdAt}` under key `aine-todos` | Architect |
| AD-5 | Tailwind, breakpoints at 640 and 1024 px, 48 px tap targets | Human: "tailwind only no shadcn" |
| AD-6 | Quota exceeded: shed oldest and retry; corrupt data: reset | Architect |
| AD-7 | Components: App, TodoList, TodoItem, TodoForm | Architect |

AD-3 is why `src/api/todoApi.js` exists as an async seam even though nothing
is on the other side of it yet. AD-4 is the exact shape the app writes today.

## Step 3: Epics and stories

Requirements were extracted into five FRs, four NFRs and seven ARs, then
grouped into two epics:

- **Epic 1: Todo List Interface and Core CRUD** (stories 1.1 to 1.4)
- **Epic 2: Persistent Todo Storage** (stories 2.1 to 2.3)

Every story has Given/When/Then acceptance criteria. A coverage map ties each
FR to its epic. The human's involvement was approving each proposed epic and
story ("C" to continue, "looks good").

The sprint-planning skill then ran its readiness gate and generated
`sprint-status.yaml`.

## Step 4: Build

`bmad-build` was invoked once per story (stories 1.2 to 1.4 were batched, and
epic 2 ran in one-shot mode). For each story it wrote a spec with an intent,
boundaries, an I/O and edge-case matrix, a code map, tasks with acceptance
mapping and a verification section, then implemented it. Each story landed as
its own commit (`e6168cf` through `5cddbfb`).

The story 1.1 review flagged four items and deferred them to
`deferred-work.md`, the first being the absence of an automated test
framework. Later stories were run with "quick", which skipped their reviews.

## Where the implementation deviated from the brief, and why

**No server-side CRUD API.** The training brief's Step 2 describes a backend
with CRUD endpoints and integration tests per endpoint. The BMad PRD interview
decided on 2026-09-01 that v1 would use a mock API and localStorage with no
real backend, and the architecture spine encoded that as AD-2 and AD-3. The
implementation follows the BMad artifacts. The Express service exists for
orchestration (health endpoints, Docker health checks) and reserves the
`/api/todos` route, whose response states that persistence is client-side. The
API seam in `src/api/todoApi.js` is where a real client slots in without
changing any call site. This is a documented scope decision, not an omission.

**Tests were written after the stories, not inside them.** The brief asks for
unit, integration and E2E scenarios as part of story definition. The story
specs' verification sections are manual. Automated tests were added after all
seven stories were committed, once the human noticed. The retrospective mapping
of stories to tests is in `TEST_STRATEGY.md`, and the gap is discussed in both
companion documents.

**Recovery message wording.** Story 2.3 specifies exact user-facing strings.
The implementation's alerts say the same thing in different words. Behaviour
matches; copy was never reconciled.

## What BMad contributed that would otherwise be missing

- A dated record of every scoping decision and who made it.
- Acceptance criteria that the later E2E suite could be mapped onto without
  reinterpretation.
- An architecture that the code still matches: state in App, presentational
  children, one API seam, one storage key, one schema.
- A review trail that caught the missing-tests gap on day one, even though it
  was not acted on until later.

## Status

All seven stories are implemented, tested and shipped. `sprint-status.yaml`
reflects this.
