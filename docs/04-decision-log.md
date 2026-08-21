# 4. Decision and Change Log

**Project:** Event Ticket Booking System

The brief asks for a log showing *what changed, why, what evidence was considered, and which
artefacts were affected*. Each entry below follows that structure.

Entries D-001 to D-008 were made during planning. Later entries are added as decisions
arise, including any change requested during the demonstration.

---

## D-001 — Domain: Event Ticket Booking System

| Field | Detail |
|---|---|
| **Date** | Week 3 |
| **Decision** | Build an Event Ticket Booking System (item 25 on the approved project list) |
| **Alternatives considered** | IT Support Ticket System; Fitness Class Booking; Equipment Rental |
| **Evidence considered** | All four have two natural roles and two clean workflows. Ticket booking has one property the others lack: a hard capacity invariant that must hold under concurrency, which gives the design and test plan a real problem to reason about. The brief states that marks reward reasoning and verification, not feature count. |
| **Rationale** | A narrow problem with one genuinely hard constraint scores better than a broad problem with none, and is far easier to change consistently during a live demonstration. |
| **Artefacts affected** | All — this is the root decision |

---

## D-002 — Exactly two roles, venue operator excluded

| Field | Detail |
|---|---|
| **Date** | Week 3 |
| **Decision** | Implement two roles, Organiser and Attendee. The venue operator is a stakeholder but not a system user. |
| **Alternatives considered** | Adding a third Venue role with read-only access; adding a platform Admin role |
| **Evidence considered** | The brief requires *at least* two roles. A third role adds a permissions dimension to every route and every test, without adding a workflow. |
| **Rationale** | Two roles satisfy the requirement and keep the authorisation matrix small enough to verify exhaustively. Every route can be tested against both roles and both ownership cases — twelve combinations rather than a number too large to enumerate. |
| **Artefacts affected** | Requirements §1.3; E1; all route guards |

---

## D-003 — Payments excluded, price retained

| Field | Detail |
|---|---|
| **Date** | Week 3 |
| **Decision** | Events carry a `price` that is stored and displayed, but no payment is processed |
| **Alternatives considered** | Integrating a payment sandbox; removing price entirely |
| **Evidence considered** | A payment sandbox still requires credentials in the deployment, which conflicts with the no-committed-secrets requirement and adds an external failure mode during the demonstration. Removing price entirely would make the events feel unrealistic and would drop a validation case (negative price). |
| **Rationale** | Keeping `price` as data preserves realism and gives one more meaningful validation rule, at no integration cost. |
| **Artefacts affected** | Requirements §1.6; Event schema; US-04 AC4 |

---

## D-004 — Store `seatsRemaining` rather than computing it

| Field | Detail |
|---|---|
| **Date** | Week 3 |
| **Decision** | Persist `seatsRemaining` on the Event record, maintained by atomic updates, instead of computing it by summing confirmed bookings on every read |
| **Alternatives considered** | Compute on read: `capacity − sum(confirmed bookings)` |
| **Evidence considered** | Computing on read is always correct by construction and cannot drift — a real advantage. But enforcing the capacity limit then requires reading all bookings, checking, and writing, with a window between the check and the write in which another request can slip through. That is precisely the failure mode in RSK-01. |
| **Rationale** | A stored counter can be decremented with a *single conditional atomic update* — "decrease by N only if at least N remain" — which is safe under concurrency without transactions or locks. Correctness under concurrency was judged more important than immunity from drift. |
| **Trade-off accepted** | The stored value can drift from reality if a bug updates one without the other. This is mitigated, not eliminated: US-13 AC4 displays a total that must equal `capacity − seatsRemaining`, making any drift visible. |
| **Artefacts affected** | Event schema; US-04, US-06, US-09, US-10, US-12, US-13; RSK-06 |

---

## D-005 — Cancellation is a soft delete

| Field | Detail |
|---|---|
| **Date** | Week 3 |
| **Decision** | Cancelling an event or a booking sets a `status` field; no record is ever deleted |
| **Alternatives considered** | Hard-deleting the record |
| **Evidence considered** | Deleting an event orphans every booking that references it, so attendees would see broken entries in "My Bookings". Deleting a booking loses the record that seats were once held, making the capacity arithmetic impossible to audit. |
| **Rationale** | Status transitions preserve history and make the capacity invariant auditable. It also gives the attendee list something honest to show (US-13 AC2). |
| **Artefacts affected** | Event and Booking schemas; US-07, US-12, US-13 |

---

## D-006 — Identical error message for unknown email and wrong password

| Field | Detail |
|---|---|
| **Date** | Week 3 |
| **Decision** | Failed login always returns "Email or password is incorrect" |
| **Alternatives considered** | Distinct messages, which are friendlier for genuine users |
| **Evidence considered** | Distinct messages let anyone test whether a given address is registered, by observing which message comes back. |
| **Rationale** | A small usability cost buys removal of an account-enumeration weakness. Recorded here because the vaguer message looks like an oversight unless the reasoning is written down. |
| **Artefacts affected** | US-02 AC2 |

---

## D-007 — Authorisation is enforced server-side; UI hiding is cosmetic

| Field | Detail |
|---|---|
| **Date** | Week 3 |
| **Decision** | Every protected route checks role and ownership on the server. Hiding controls in the UI is treated as usability only. |
| **Alternatives considered** | Relying on conditional rendering to keep roles apart |
| **Evidence considered** | Anything enforced only in the browser can be bypassed by calling the API directly, which is exactly how SC4 and SC5 are tested. |
| **Rationale** | The client is untrusted. Ownership is read from the session token, never from the request body, so a forged `organiserId` in a payload changes nothing. |
| **Artefacts affected** | US-03; every protected route; N1; SC4, SC5 |

---

## D-008 — Requirement IDs used verbatim across every artefact

| Field | Detail |
|---|---|
| **Date** | Week 3 |
| **Decision** | R1–R14 and N1–N6 are used as Jira labels, as commit-message prefixes, and as Figma frame name prefixes |
| **Alternatives considered** | Assembling the traceability matrix at the end by inspection |
| **Evidence considered** | The brief requires a matrix linking requirements → backlog → design → Figma → commits → deployment. Reconstructing those links after the fact is slow, error-prone, and produces a matrix that is not genuine evidence. It would also tempt history rewriting, which the brief forbids. |
| **Rationale** | Deciding the IDs before any work starts makes the matrix a by-product of working normally rather than a document written at the end. |
| **Artefacts affected** | All |

---

## Change log

Changes made *after* an artefact was first agreed, including any change requested during the
demonstration. Format matches the decision entries.

| ID | Date | What changed | Why | Evidence considered | Artefacts updated |
|---|---|---|---|---|---|
| *[fill as changes occur]* | | | | | |

> **Demonstration note.** The tutor may request a live change. When that happens, record it
> here as a `C-00n` entry and update *every* affected artefact — requirement, story and
> acceptance criteria, design diagram, Figma frame, code, test, and the traceability matrix.
> Consistency across artefacts is what is being assessed, more than the change itself.
