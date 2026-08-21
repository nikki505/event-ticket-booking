# 1. Problem, Stakeholders, Scope and Success Criteria

**Project:** Event Ticket Booking System
**Unit:** IFN636 Software Life Cycle Management — Assessment 1

---

## 1.1 Problem statement

Small and mid-sized event organisers — university clubs, community groups, independent
promoters — sell tickets through ad-hoc channels: social media posts, spreadsheets, and
manual bank transfers. Three failures recur:

1. **Overselling.** Capacity is tracked by hand, so an event can accept more bookings than
   the venue holds. Correcting this after the fact costs refunds and reputation.
2. **No single source of truth.** The organiser cannot answer "how many seats are left?"
   without reconciling several documents.
3. **No self-service for attendees.** Every booking and every cancellation requires the
   organiser to intervene manually.

The Event Ticket Booking System addresses these by providing one authoritative record of
events and bookings, with capacity enforced by the system rather than by a person, and
self-service booking and cancellation for attendees.

### Why this problem suits the assessment

The problem is small enough to specify completely, but contains one genuinely non-trivial
correctness requirement: capacity must never be exceeded, even when two attendees book the
last seat at the same moment. That gives the design and the test plan something real to
reason about, instead of being pure CRUD. The assessment rewards reasoning and traceability
rather than feature count, so a narrow problem with one hard invariant is a better fit than
a broad problem with none.

---

## 1.2 Stakeholders

| Stakeholder | Interest in the system | How the design serves it |
|---|---|---|
| **Event Organiser** (primary user) | Publish events, know remaining capacity, see who is coming | Event CRUD, live remaining-seat count, attendee list per event |
| **Attendee** (primary user) | Find events, book quickly, cancel without asking anyone | Public event browsing, self-service booking and cancellation |
| **Venue operator** (secondary, external) | Accurate headcount for safety and staffing | Capacity enforced server-side; attendee list visible to the organiser |
| **Unit tutor / marker** (assessment) | Verify traceability and understanding | Requirement IDs carried through backlog, design, Figma frames and commits |

Only the two primary users transact with the system. The venue operator consumes its output
and has no login — a deliberate scope decision recorded as **D-002** in the decision log.

---

## 1.3 User roles

The brief requires at least two roles. This system defines exactly two.

| Role | Can do | Cannot do |
|---|---|---|
| **Organiser** | Create, update and cancel *their own* events; view bookings and the attendee list for their own events | Book tickets; view or modify another organiser's events |
| **Attendee** | Browse published upcoming events; book tickets; view and cancel *their own* bookings | Create or modify any event; view another attendee's bookings |

Role is chosen at registration and stored on the user record.

**Two layers of authorisation.** Role alone is not sufficient:

- **Role check** — is this user an Organiser at all?
- **Ownership check** — is this *their* event? An organiser may only touch events where
  `event.organiserId == user.id`; an attendee may only touch bookings where
  `booking.attendeeId == user.id`.

Both are enforced **server-side in the route handler**, and ownership is read from the
session token, never from the request body. The UI hides what a role cannot do, but hiding
a button is a usability measure, not a security control — the server assumes the client may
be bypassed entirely.

---

## 1.4 End-to-end workflows

Two complete workflows are in scope. **W1 is the workflow deployed to EC2 and demonstrated.**

### W1 — Publish and book (primary)

Organiser registers or logs in → creates an event with capacity and price → the event
appears in the public listing → attendee registers or logs in → opens the event → selects a
quantity → books → receives a unique booking reference → the event's remaining-seat count
decreases → the booking appears in the organiser's attendee list for that event.

### W2 — Cancel and release

Attendee opens "My Bookings" → cancels a booking → the booking moves to `CANCELLED` → the
seats return to the event's available capacity → the organiser's attendee list and
remaining-seat count both reflect the change.

W2 was chosen as the second workflow deliberately: it exercises the same capacity invariant
as W1 but in the opposite direction, so an error in capacity accounting must show up in one
of the two. A second workflow that touched unrelated data would not have this property.

---

## 1.5 In scope

- Email and password registration and login, with a role chosen at registration
- Role-based **and** ownership-based authorisation on every protected route
- Event lifecycle: create, list, view, update, cancel
- Booking lifecycle: create, list own, cancel
- Server-enforced capacity with no overbooking, safe under concurrent requests
- Server-side input validation returning field-level error messages to the UI
- Persistent storage that survives an application restart
- Manual deployment of W1 to a public EC2 URL, with a written runbook

This satisfies the minimum application scope in the brief: separated authenticated roles,
persistent data, well beyond three meaningful data operations, input validation, and one
deployed workflow reachable through EC2.

---

## 1.6 Out of scope

Each exclusion is a decision, not an oversight.

| Excluded | Why |
|---|---|
| **Payment processing** | Handling real card data is inappropriate in a student project and would dominate the effort. Events carry a `price` field that is displayed and stored, but no money moves. |
| **Email / SMS notification** | Requires an external provider and credentials in the deployment. The booking reference is shown on screen instead. |
| **Seat-level selection** (choosing seat 4B) | Turns a capacity counter into a seat-map allocation problem — a substantially harder design for no additional marks. |
| **Refunds** | Follows from payments being out of scope. |
| **Password reset by email** | Same external dependency as notifications. |
| **CI/CD pipeline** | Explicitly out of scope per the brief. Deployment is manual and documented. |
| **Multi-organiser teams** | One event has exactly one owning organiser. Team permissions would require another entity and a full permissions model. |

---

## 1.7 Assumptions

| # | Assumption | If it proves false |
|---|---|---|
| A1 | Attendees have an email address and can self-register | An organiser-side booking entry flow would be needed |
| A2 | Events are single-session with one date and time — not recurring or multi-day | The Event model needs a Session sub-entity |
| A3 | A booking holds 1–10 tickets; no bulk or group flow is required | Add a group-booking approval workflow |
| A4 | Capacity is a single undifferentiated pool — no ticket tiers such as VIP or general | Add a TicketType entity between Event and Booking |
| A5 | Demonstration load is a handful of concurrent users, not a ticket rush | Would need request queueing rather than a conditional update |
| A6 | A single EC2 instance is sufficient; no load balancing or high availability | Would need a load balancer and multiple instances |

A4 and A5 are the two most likely to be challenged during the demonstration, so both are
answered directly in the design: A4 by keeping capacity a scalar on the Event so a tier
model can be inserted later without reworking bookings, and A5 by using a conditional atomic
update for the seat decrement rather than a read-then-write.

---

## 1.8 Measurable success criteria

Each is written to be objectively pass/fail at demonstration time rather than a matter of
opinion.

| # | Criterion | Measurement method | Target |
|---|---|---|---|
| SC1 | Both end-to-end workflows complete on the deployed URL | Walk W1 and W2 against the EC2 public URL | 2 of 2 complete |
| SC2 | Overbooking is impossible | Set capacity to 2; attempt to book 3. Then book 2 and attempt 1 more | Rejected with a clear message, 100% of attempts |
| SC3 | Cancellation returns capacity exactly | Book 3 of 10 (7 remain), then cancel that booking | Remaining returns to 10 — not 9, not 11 |
| SC4 | Cross-role access is refused | Attendee calls an organiser-only route; organiser attempts to book | HTTP 403, 100% of attempts |
| SC5 | Cross-ownership access is refused | Organiser A requests organiser B's event for edit | HTTP 403, 100% of attempts |
| SC6 | Invalid input is rejected server-side with a usable message | Run the 10-case validation table in the test plan | 10 of 10 rejected, each naming the offending field |
| SC7 | Data survives restart | Restart the app process on EC2, re-query a booking | Booking present and unchanged |
| SC8 | No secrets in version control | Scan history; confirm `.env` is git-ignored | 0 secrets committed |
| SC9 | Every requirement is traceable | Traceability matrix complete for R1–R14 and N1–N6 | 0 empty cells |

SC2, SC3 and SC5 are the criteria most likely to fail in a naive implementation, which is
why each has an explicit test rather than being folded into "it works".

---

## 1.9 Requirements register

Requirement IDs are the spine of traceability. Every backlog item, design element, Figma
frame and commit message references one of these IDs.

### Functional requirements

| ID | Requirement | Role | Workflow | Priority |
|---|---|---|---|---|
| R1 | A visitor can register with email, password and a chosen role | Both | W1 | Must |
| R2 | A registered user can log in and receive a session token | Both | W1 | Must |
| R3 | Protected routes reject requests with no valid session | Both | W1, W2 | Must |
| R4 | Organiser-only routes reject Attendee sessions | Organiser | W1 | Must |
| R5 | An organiser can create an event with title, description, venue, date/time, capacity and price | Organiser | W1 | Must |
| R6 | An organiser can list and open their own events with remaining-seat counts | Organiser | W1 | Must |
| R7 | An organiser can update an event they own | Organiser | W1 | Should |
| R8 | An organiser can cancel an event they own | Organiser | — | Should |
| R9 | Any visitor can browse published, upcoming events | Attendee | W1 | Must |
| R10 | An attendee can book 1–10 tickets and receives a unique booking reference | Attendee | W1 | Must |
| R11 | The system rejects any booking that exceeds remaining capacity | Attendee | W1 | Must |
| R12 | An attendee can list their own bookings | Attendee | W2 | Must |
| R13 | An attendee can cancel their own booking, releasing the seats | Attendee | W2 | Must |
| R14 | An organiser can view the booking and attendee list for an event they own | Organiser | W2 | Should |

### Non-functional requirements

| ID | Requirement | Verification |
|---|---|---|
| N1 | All input is validated server-side; the server is authoritative even if the client is bypassed | Call the API directly with invalid payloads |
| N2 | Passwords are stored as salted hashes, never plaintext | Inspect a user record in the database |
| N3 | No credentials, keys or tokens are committed to the repository | `.env.example` committed, `.env` ignored, history scanned |
| N4 | Data persists across application restarts | SC7 |
| N5 | W1 is reachable at a public EC2 URL during the marking window | Open the URL from an external network |
| N6 | Inbound access to the instance is limited to the ports actually required | Review the security group rules |

---

## 1.10 Validation rules

Consolidated here because they are referenced by acceptance criteria throughout the backlog
and by SC6. Every rule is enforced **server-side**; the client mirrors them only to give
faster feedback.

| Field | Rule | Error message |
|---|---|---|
| `email` | Required, valid format, unique across users | "Enter a valid email address" / "That email is already registered" |
| `password` | Required, minimum 8 characters | "Password must be at least 8 characters" |
| `role` | Required, one of `ORGANISER` or `ATTENDEE` | "Select a role" |
| `title` | Required, 3–120 characters | "Title must be between 3 and 120 characters" |
| `venue` | Required, 3–160 characters | "Venue is required" |
| `startsAt` | Required, valid date, must be in the future | "Event date must be in the future" |
| `capacity` | Required, integer, 1–10000 | "Capacity must be a whole number of at least 1" |
| `price` | Required, number, 0 or greater, max 2 decimal places | "Price cannot be negative" |
| `quantity` (booking) | Required, integer, 1–10 | "You can book between 1 and 10 tickets" |
| `quantity` vs capacity | Must not exceed remaining seats | "Only N seats remain for this event" |

The last rule is the only one that cannot be checked from the request alone — it depends on
current database state, and is therefore enforced inside the atomic seat-decrement rather
than in the validation layer. This distinction is developed in the design document.
