# 5. GenAI Use Declaration and Evidence Log

**Student:** Nikhittha Mukkala (N12202665)
**Project:** Event Ticket Booking System
**Unit:** IFN636 Software Life Cycle Management — Assessment 1

---

## 5.1 Declaration

Generative AI **was used** in the preparation of this assessment. This log records where,
for what purpose, and what was verified or changed afterwards.

> **This log must be kept honest and complete.** It is worth marks in its own right, and an
> inaccurate declaration is a far more serious problem than a generous one. Add a row every
> time AI is used, including for work that was later discarded.

---

## 5.2 Tool

| Tool | Version / model | Access |
|---|---|---|
| Claude (Anthropic) | Claude Opus, via Claude Code | Interactive session |

---

## 5.3 Evidence log

| # | Date | Artefact | What AI was asked for | What was accepted | What was changed or rejected | Verification |
|---|---|---|---|---|---|---|
| 1 | 2026-08-21 | `docs/01-problem-and-requirements.md` | Draft problem statement, stakeholders, roles, scope, assumptions, success criteria and requirements register for an event ticket booking system | Structure and initial wording; requirement IDs R1–R14, N1–N6 | *[record any edits made]* | Checked each requirement is testable and maps to a workflow |
| 2 | 2026-08-21 | `docs/02-product-backlog.md` | Draft epics, user stories, acceptance criteria, tasks and story-point estimates | Story breakdown and Given/When/Then acceptance criteria | *[record any edits]* | Checked every story references a requirement ID |
| 3 | 2026-08-21 | `docs/03-iteration-plan.md` | Draft two time-boxed iterations with dependencies and a risk register | Iteration split, dependency chains, risks RSK-01…RSK-07 | Review-outcome sections deliberately left blank — to be completed from what actually happens | Dependencies checked against the story list |
| 4 | 2026-08-21 | `docs/04-decision-log.md` | Draft decision entries D-001…D-008 | Decision structure and rationale | *[confirm each decision is one the student agrees with — a decision log recording decisions the author does not understand or endorse is worthless]* | Each decision cross-checked against the artefacts it claims to affect |
| 5 | 2026-08-21 | `docs/06-system-design.md` | Produce SysML views (requirement, block definition, internal block), use case diagram, behavioural views for W1 and W2, state machines, data model, API surface and deployment view | Diagram structure and the accompanying rationale; derived requirement R11.1; decision D-009 | *[record any edits]* | Checked each diagram against the requirements register; confirmed API table covers every requirement |
| 6 | 2026-08-21 | Jira board (SCRUM-1 … SCRUM-21) | Create 5 epics and 16 stories with acceptance criteria, story points, requirement labels, and two sprints | Issue structure, estimates, sprint split | Sprint dates are provisional and need aligning to the real tutorial schedule | Verified via the Jira API that 21 issues were created with no errors and correct parent links |
| 7 | 2026-08-21 | `docs/diagrams/event-ticket-booking.drawio` | Generate draw.io source for the SysML and UML views | Generated XML | *[record any edits]* | Opened in draw.io and confirmed all pages render |
| 8 | 2026-08-21 | `design/figma-plugin/` | Write a Figma plugin that generates the design system, wireframes and hi-fi screens with prototype links | Plugin source, screen content, state coverage | *[record any edits made in Figma after generation]* | Executed against a stubbed Plugin API (`test-harness.js`): 3 pages, 25 frames, 9 components, 11 prototype links, all checks passed |
| 9 | | | | | | |

---

## 5.4 What was *not* AI-generated

*[Complete this honestly. Examples of what belongs here: the choice of project domain; any
requirement added or removed after review; the reflection in §6; screenshots and evidence;
review outcomes recorded after each iteration.]*

---

## 5.5 Verification statement

Every AI-assisted artefact in this submission was reviewed before inclusion. Specifically:

- Requirements were checked to be individually testable
- Acceptance criteria were checked to be objectively pass/fail
- Every backlog item was checked to reference a requirement ID
- *[Add: code was read and understood; tests were run and observed to pass]*

**Understanding statement.** The demonstration in Week 7 requires implementing a live change
across all affected artefacts. Any part of this project that cannot be explained and modified
on request should be revisited before then. Sections of this log that record heavy AI
assistance are the ones to review first — particularly D-004 (why `seatsRemaining` is stored
rather than computed) and US-10 (why the seat decrement must be a single conditional atomic
update rather than a read-then-write).
