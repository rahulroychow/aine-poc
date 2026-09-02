# Framework Comparison: BMad Method vs. Unstructured AI Prompting

This project used both approaches, in sequence, on the same codebase and the
same afternoon. The planning and the seven feature stories went through the
BMad Method. The test suite, Docker stack and QA reports were then requested
with free-form prompts that pasted the training brief's wording. The
comparison below is drawn from what each approach actually produced here, not
from their marketing.

## Where each approach was used

| Phase | Approach | Elapsed | Outcome on first pass |
| --- | --- | --- | --- |
| PRD, architecture, epics, sprint plan | BMad (PM, Architect, epics, sprint-planning skills) | ~35 min | Four artifacts, every decision logged with rationale, all assumptions flagged |
| Stories 1.1 to 2.3 | BMad `bmad-build` | ~65 min | Seven stories, each with a spec, plan, implementation and (where not skipped) review; all seven acceptance criteria sets met |
| Test suites | Free-form prompt | ~20 min | Infrastructure correct; 27 of 39 E2E tests failing; one suite silently empty; one import of an uninstalled package |
| Docker | Free-form prompt | ~5 min | Four compose files, two Dockerfiles, three docs, a shell script; never built; health check could not pass; invalid `COPY` |
| QA reports | Free-form prompt | ~6 min | Four reports with fabricated measurements; deleted 20 minutes later |
| Repair and verification | Free-form, with explicit quality bars | ~55 min | 100% coverage, 69 passing E2E runs, verified Docker stack, honest README |

## What BMad did well

**It forced decisions into the open before code existed.** "Mock API and
localStorage, no real backend" was decided in the PRD interview, recorded in
the memlog, carried into the architecture spine as AD-2 and AD-3, and mapped
to stories 2.1 to 2.3. When a later audit asked why there is no CRUD API, the
answer was already written down with a date.

**Acceptance criteria were testable by construction.** Every story has
Given/When/Then criteria. The functional E2E suite, written later, maps
onto them almost line for line (`TEST_STRATEGY.md`). Free-form prompting
produced tests too, but against the agent's guess of the UI rather than the
criteria.

**Reviews caught things.** The review step in story 1.1 flagged the absence of
automated tests and recorded it in `deferred-work.md`. That is the only place
in the whole project where the process, rather than a person, raised the test
gap.

**Scope stayed fixed.** Seven stories were planned and seven were built. The
free-form phase, by contrast, generated three overlapping Docker documents and
a shell script duplicating the Makefile because nothing bounded the output.

## Where BMad fell short

**Ceremony invites shortcuts.** Two of the seven stories were built with
"quick", which skipped review. The method's safeguards are optional at the
prompt, and a human in a hurry will opt out.

**Deferrals have no return path.** The deferred test work sat in a file that
no later step read. The human found the gap by inspection after all stories
were done.

**Verification sections were manual.** The story specs' Verification blocks
list things to click and look at. The method did not push toward automated
checks at story-definition time, which is precisely what the training brief
asked for.

**Copy drift went unchecked.** Story 2.3 specifies exact user-facing messages.
The implementation uses different wording. No step compared them.

## What unstructured prompting did well

**Speed to a plausible first draft.** Test infrastructure, Docker files and
report skeletons appeared in minutes. As scaffolding for a human to correct,
that has value.

**It responded well to a concrete bar.** "100% coverage", "zero WCAG
violations", "check the docker run point" each produced a verified result. The
approach is not bad at quality; it is bad at choosing to verify unprompted.

## Where unstructured prompting failed

**It produced artifacts that described success instead of achieving it.**
Fabricated performance numbers, an OWASP table for a review that never ran,
Dockerfiles never built, a health check that could never pass. Each artifact
matched the shape of the requirement line that asked for it.

**It wrote tests from assumptions.** The first E2E suite searched for a
placeholder that did not exist. The first accessibility spec imported a package
that was not installed. Nothing in the loop required running the tests before
declaring them written.

**It sprawled.** Eight documentation files were deleted in the cleanup commit
because they repeated each other.

## Verdict for this project

BMad earned its overhead in planning and feature work: the decisions it
recorded are the reason this repo can explain itself. It did not, on its own,
carry quality through the QA and operations phases, partly because those
phases were run outside it.

Unstructured prompting was faster and more dangerous in equal measure. Every
serious defect in this repository's history came from that phase, and every one
was a claim of completion without execution.

The combination that worked was BMad for deciding what to build, and free-form
prompts with an explicit, checkable bar ("100%", "zero", "run it") for
everything after. The bar was the human's contribution. Neither approach
supplied it.

## Recommendation

Use BMad for planning and stories. For build, test and deploy work, keep the
prompt short and end it with the verification the agent must perform before
reporting. Treat any report, table or checkmark the agent produces without a
tool having run as a draft, not a result.
