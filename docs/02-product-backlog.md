# 2. Prioritised Product Backlog

**Project:** Event Ticket Booking System

This backlog is the source of truth for the Jira board. Every story carries the requirement
ID it satisfies, so the traceability matrix can be assembled from real artefacts.

---

## 2.1 Estimation approach

Estimates use **story points** on a modified Fibonacci scale (1, 2, 3, 5, 8), sized relative
to a reference story rather than to hours.

**Reference story: US-03 "Create an event" = 3 points.** It requires one form, one endpoint,
validation, and a database write — the typical unit of work in this project.

| Points | Meaning | Rough calendar guide (solo, part-time) |
|---|---|---|
| 1 | Trivial, no new pattern, no validation | under 1 hour |
| 2 | Straightforward, follows an existing pattern | 1–2 hours |
| 3 | One form + one endpoint + validation | 2–4 hours |
| 5 | New pattern, or non-trivial logic or state | 4–8 hours |
| 8 | Involves a risk or an unknown; consider splitting | 1–2 days |

Story points are used rather than hours because the productivity of a solo developer new to
the stack is unknown at the start, and relative sizing stays valid even when the absolute
rate turns out to be wrong. Velocity from Iteration 1 is used to plan Iteration 2 — this is
recorded in the iteration plan.

**Priority** uses MoSCoW: **Must** items are required for W1 or W2 to work end-to-end;
**Should** items complete the role experience; **Could** items are explicitly deferred.

---

## 2.2 Epics

| Epic | Title | Requirements covered | Points | Priority |
|---|---|---|---|---|
| **E1** | Accounts and access control | R1, R2, R3, R4, N2 | 13 | Must |
| **E2** | Event management (Organiser) | R5, R6, R7, R8 | 13 | Must |
| **E3** | Discovery and booking (Attendee) | R9, R10, R11 | 16 | Must |
| **E4** | Booking management | R12, R13, R14 | 11 | Must |
| **E5** | Deployment, security hygiene and documentation | N3, N5, N6 | 10 | Must |
| | | **Total** | **63** | |

Epics are ordered by dependency, not by preference: nothing in E2 can be built before E1
provides an authenticated organiser, and E4 cannot be tested before E3 creates a booking.

---

## 2.3 Epic E1 — Accounts and access control

### US-01 — Register with a role
> **As a** visitor, **I want to** register with my email, a password and a role, **so that**
> I can use the system as either an organiser or an attendee.

**Requirements:** R1, N2 · **Points:** 5 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given valid details and an unused email, when I submit the registration form, then my account is created with the role I chose and I am taken to my role's home screen.
- **AC2** — Given an email that is already registered, when I submit, then I see "That email is already registered" against the email field and no second account is created.
- **AC3** — Given a password shorter than 8 characters, when I submit, then I see "Password must be at least 8 characters" and no account is created.
- **AC4** — Given any successful registration, when I inspect the stored user record, then the password appears only as a salted hash, never as plaintext.
- **AC5** — Given no role is selected, when I submit, then I see "Select a role" and no account is created.

**Tasks**
- T-01.1 Define the User schema with `email`, `passwordHash`, `role`, `createdAt` (1)
- T-01.2 Add a unique index on `email` so the database enforces AC2, not just the handler (1)
- T-01.3 Implement `POST /api/auth/register` with hashing (2)
- T-01.4 Add server-side validation and field-level error responses (1)
- T-01.5 Build the registration form with role selection and inline error display (2)

---

### US-02 — Log in and stay signed in
> **As a** registered user, **I want to** log in, **so that** I can reach the features for my role.

**Requirements:** R2, R3 · **Points:** 5 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given correct credentials, when I log in, then I receive a session token and land on my role's home screen.
- **AC2** — Given an incorrect password, when I log in, then I see "Email or password is incorrect" — the message does not reveal whether the email exists.
- **AC3** — Given no token or an expired token, when I request a protected route, then the response is HTTP 401 and I am returned to the login screen.
- **AC4** — Given I reload the page while logged in, when the app starts, then I remain logged in.

**Tasks**
- T-02.1 Implement `POST /api/auth/login` issuing a signed token (2)
- T-02.2 Write the authentication middleware that validates the token and attaches the user (2)
- T-02.3 Build the login form with error display (1)
- T-02.4 Persist the token client-side and restore the session on load (1)

**Design note.** AC2 requires an identical message for "no such email" and "wrong password".
Distinguishing them would let an attacker enumerate registered addresses.

---

### US-03 — Role-based route protection
> **As the** system, **I want to** refuse requests from the wrong role, **so that** an
> attendee cannot manage events and an organiser cannot book tickets.

**Requirements:** R4 · **Points:** 3 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given I am signed in as an Attendee, when I call any organiser-only route, then the response is HTTP 403.
- **AC2** — Given I am signed in as an Organiser, when I attempt to create a booking, then the response is HTTP 403.
- **AC3** — Given I am signed in as an Organiser, when I request an event owned by a different organiser, then the response is HTTP 403 — not 404 and not the event.
- **AC4** — Given any role, when I view the UI, then controls for actions my role cannot perform are not displayed.

**Tasks**
- T-03.1 Write `requireRole(...roles)` middleware (1)
- T-03.2 Write an ownership guard that compares the resource owner to the session user (2)
- T-03.3 Hide role-inappropriate navigation and controls in the UI (1)

**Design note.** AC4 is deliberately listed last. Hiding controls is usability; AC1–AC3 are
the actual security boundary and are enforced on the server.

---

## 2.4 Epic E2 — Event management (Organiser)

### US-04 — Create an event *(reference story, 3 points)*
> **As an** organiser, **I want to** publish an event with its capacity and price, **so that**
> attendees can find and book it.

**Requirements:** R5 · **Points:** 3 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given valid details, when I submit, then the event is created, owned by me, and appears in my event list and in the public listing.
- **AC2** — Given a start date in the past, when I submit, then I see "Event date must be in the future" and nothing is created.
- **AC3** — Given a capacity of 0, a negative number, or a fraction, when I submit, then I see "Capacity must be a whole number of at least 1".
- **AC4** — Given a negative price, when I submit, then I see "Price cannot be negative".
- **AC5** — Given a newly created event, when I view it, then remaining seats equals capacity.

**Tasks**
- T-04.1 Define the Event schema including `organiserId` and `seatsRemaining` (2)
- T-04.2 Implement `POST /api/events` with the ownership stamp taken from the token (2)
- T-04.3 Add the validation rules from the validation table (1)
- T-04.4 Build the event creation form with inline errors (2)

**Design note.** `seatsRemaining` is stored, not computed by summing bookings on each read.
The rationale and the trade-off are recorded as **D-004** in the decision log.

---

### US-05 — View my events
> **As an** organiser, **I want to** see the events I own with remaining seats, **so that** I
> know how each is selling.

**Requirements:** R6 · **Points:** 3 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given I own three events, when I open my event list, then exactly those three appear, each showing remaining seats out of capacity.
- **AC2** — Given another organiser owns events, when I open my list, then their events do not appear.
- **AC3** — Given I own no events, when I open my list, then I see an empty state explaining how to create my first event.

**Tasks**
- T-05.1 Implement `GET /api/events/mine` filtered by the session user (2)
- T-05.2 Build the organiser dashboard list with the remaining-seats indicator (2)
- T-05.3 Build the empty state (1)

---

### US-06 — Update an event
> **As an** organiser, **I want to** correct an event's details, **so that** attendees see
> accurate information.

**Requirements:** R7 · **Points:** 3 · **Priority:** Should

**Acceptance criteria**
- **AC1** — Given I own the event, when I change the venue and save, then the change is visible on the public listing.
- **AC2** — Given the event already has 8 bookings, when I try to reduce capacity to 5, then I see "Capacity cannot be lower than the 8 seats already booked".
- **AC3** — Given I do not own the event, when I attempt to update it, then the response is HTTP 403.
- **AC4** — Given I increase capacity from 10 to 20 with 8 booked, when I save, then remaining seats becomes 12.

**Tasks**
- T-06.1 Implement `PATCH /api/events/:id` with the ownership guard (2)
- T-06.2 Implement the capacity-change rule and recompute `seatsRemaining` (2)
- T-06.3 Build the edit form, pre-filled (1)

**Design note.** AC2 and AC4 are the subtle part of this story: changing capacity must adjust
`seatsRemaining` by the delta, not overwrite it, or existing bookings would be silently lost.

---

### US-07 — Cancel an event
> **As an** organiser, **I want to** cancel an event, **so that** it stops accepting bookings.

**Requirements:** R8 · **Points:** 3 · **Priority:** Should

**Acceptance criteria**
- **AC1** — Given I own the event, when I cancel it and confirm, then its status becomes `CANCELLED` and it disappears from the public listing.
- **AC2** — Given an event is cancelled, when an attendee attempts to book it, then the response is HTTP 409 with "This event has been cancelled".
- **AC3** — Given I click cancel, when the confirmation dialog appears, then the event is only cancelled if I confirm.
- **AC4** — Given the event is cancelled, when I open my event list, then it is still listed, marked `CANCELLED`.

**Tasks**
- T-07.1 Add a `status` field with values `PUBLISHED` and `CANCELLED` (1)
- T-07.2 Implement `POST /api/events/:id/cancel` with the ownership guard (2)
- T-07.3 Exclude cancelled events from the public listing query (1)
- T-07.4 Build the confirmation dialog (1)

**Design note.** Cancellation is a **soft delete** (a status change), not a row deletion.
Deleting the row would orphan every booking that referenced it. Recorded as **D-005**.

---

## 2.5 Epic E3 — Discovery and booking (Attendee)

### US-08 — Browse events
> **As an** attendee, **I want to** browse upcoming events, **so that** I can find one to attend.

**Requirements:** R9 · **Points:** 3 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given published future events exist, when I open the listing, then I see each with title, venue, date, price and remaining seats.
- **AC2** — Given an event is in the past or cancelled, when I open the listing, then it does not appear.
- **AC3** — Given an event has 0 seats remaining, when I open the listing, then it appears marked "Sold out" and its book button is disabled.
- **AC4** — Given no events match, when I open the listing, then I see an empty state rather than a blank page.

**Tasks**
- T-08.1 Implement `GET /api/events` filtered to published and future (2)
- T-08.2 Build the event listing grid (2)
- T-08.3 Build the sold-out and empty states (1)

---

### US-09 — Book tickets
> **As an** attendee, **I want to** book tickets for an event, **so that** my place is reserved.

**Requirements:** R10 · **Points:** 5 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given an event with seats available, when I book 2 tickets, then a booking is created with a unique reference and status `CONFIRMED`, and I see a success screen showing that reference.
- **AC2** — Given a successful booking of 2, when I return to the event, then remaining seats has decreased by exactly 2.
- **AC3** — Given I enter 0 or 11 as the quantity, when I submit, then I see "You can book between 1 and 10 tickets" and nothing is created.
- **AC4** — Given I am not logged in, when I attempt to book, then I am sent to login and returned to the event afterwards.
- **AC5** — Given two bookings exist, when I compare their references, then they differ.

**Tasks**
- T-09.1 Define the Booking schema with `reference`, `eventId`, `attendeeId`, `quantity`, `status` (2)
- T-09.2 Implement the booking reference generator and prove uniqueness (1)
- T-09.3 Implement `POST /api/bookings` (3)
- T-09.4 Build the booking form and success screen (2)
- T-09.5 Implement the post-login redirect back to the event (1)

---

### US-10 — Capacity is never exceeded
> **As the** system, **I want to** reject bookings beyond remaining capacity, **so that** the
> venue is never oversold.

**Requirements:** R11 · **Points:** 8 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given an event with 2 seats remaining, when I attempt to book 3, then the response is HTTP 409 "Only 2 seats remain for this event" and no booking is created.
- **AC2** — Given an event with 2 seats remaining, when I book exactly 2, then the booking succeeds and remaining seats becomes 0.
- **AC3** — Given an event with 0 seats remaining, when I attempt to book 1, then the response is HTTP 409 and no booking is created.
- **AC4** — Given two requests each booking the last seat arrive simultaneously, when both are processed, then exactly one succeeds and the other receives HTTP 409 — remaining seats never goes below 0.
- **AC5** — Given a rejected booking, when I query the database, then no partial or orphaned booking record exists.

**Tasks**
- T-10.1 Implement the seat decrement as a single conditional atomic update (3)
- T-10.2 Create the booking only after the decrement succeeds, and compensate if creation then fails (3)
- T-10.3 Write the concurrency test that fires two simultaneous last-seat bookings (2)
- T-10.4 Map the failure to HTTP 409 with a message naming the seats remaining (1)

**Why 8 points.** This is the only story sized 8, and the estimate reflects risk rather than
volume. The naive implementation — read `seatsRemaining`, compare, then write — passes AC1
through AC3 and fails AC4, and the failure is invisible in manual testing. AC4 is what forces
a conditional update, and T-10.3 is what proves it. This story was flagged as the primary
technical risk in the iteration plan (**RSK-01**).

---

## 2.6 Epic E4 — Booking management

### US-11 — View my bookings
> **As an** attendee, **I want to** see my bookings, **so that** I can check what I have booked.

**Requirements:** R12 · **Points:** 3 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given I have bookings, when I open "My Bookings", then I see each with its event, date, quantity, reference and status.
- **AC2** — Given another attendee has bookings, when I open my list, then theirs do not appear.
- **AC3** — Given I have cancelled a booking, when I open my list, then it appears marked `CANCELLED`, not hidden.
- **AC4** — Given I have no bookings, when I open the list, then I see an empty state linking to the event listing.

**Tasks**
- T-11.1 Implement `GET /api/bookings/mine` scoped to the session user (2)
- T-11.2 Build the bookings list with status badges (2)
- T-11.3 Build the empty state (1)

---

### US-12 — Cancel my booking
> **As an** attendee, **I want to** cancel a booking, **so that** I release my seats when my
> plans change.

**Requirements:** R13 · **Points:** 5 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given a confirmed booking for 3 seats, when I cancel it and confirm, then its status becomes `CANCELLED` and the event's remaining seats increases by exactly 3.
- **AC2** — Given a booking that is already cancelled, when I attempt to cancel it again, then the response is HTTP 409 and remaining seats does **not** increase a second time.
- **AC3** — Given a booking belonging to another attendee, when I attempt to cancel it, then the response is HTTP 403.
- **AC4** — Given I click cancel, when the confirmation dialog appears, then nothing changes unless I confirm.

**Tasks**
- T-12.1 Implement `POST /api/bookings/:id/cancel` with the ownership guard (2)
- T-12.2 Restore seats atomically, conditional on the booking still being `CONFIRMED` (3)
- T-12.3 Build the confirmation dialog and refresh the list (1)

**Design note.** AC2 is the mirror of the overbooking problem: a double cancellation would
inflate capacity and let the event oversell later. Guarding the status transition rather
than just the seat arithmetic is what prevents it.

---

### US-13 — View attendees for my event
> **As an** organiser, **I want to** see who has booked my event, **so that** I can plan for
> the actual headcount.

**Requirements:** R14 · **Points:** 3 · **Priority:** Should

**Acceptance criteria**
- **AC1** — Given my event has bookings, when I open its attendee list, then I see each attendee's email, quantity, reference and status.
- **AC2** — Given a booking was cancelled, when I open the list, then it appears marked `CANCELLED` and is excluded from the confirmed total.
- **AC3** — Given the event belongs to another organiser, when I request its attendee list, then the response is HTTP 403.
- **AC4** — Given bookings exist, when I view the list, then a confirmed-seat total is displayed and equals capacity minus remaining seats.

**Tasks**
- T-13.1 Implement `GET /api/events/:id/bookings` with the ownership guard (2)
- T-13.2 Build the attendee list view with totals (2)

**Design note.** AC4 is a deliberate cross-check: it surfaces any drift between the stored
`seatsRemaining` and the actual bookings, which is the known risk of the D-004 decision.

---

## 2.7 Epic E5 — Deployment, security hygiene and documentation

### US-14 — Configuration through environment variables
> **As the** developer, **I want** all configuration in environment variables, **so that** no
> secret is ever committed.

**Requirements:** N3 · **Points:** 2 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given the repository, when I search its full history, then no connection string, key or token appears.
- **AC2** — Given a fresh clone, when I copy `.env.example` to `.env` and fill it in, then the app starts.
- **AC3** — Given `.gitignore`, when I inspect it, then `.env` and `node_modules` are both listed.

**Tasks**
- T-14.1 Add `.gitignore` before the first commit (1)
- T-14.2 Add `.env.example` with every key documented and no real values (1)

**Sequencing note.** T-14.1 must be the *first* commit in the repository. Adding
`.gitignore` after a secret has been committed does not remove it from history, and the
brief forbids rewriting history to clean it up.

---

### US-15 — Deploy W1 to EC2
> **As the** marker, **I want** a working public URL, **so that** I can verify the workflow.

**Requirements:** N5, N6 · **Points:** 5 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given the public URL, when I open it from outside the local network, then the application loads.
- **AC2** — Given the deployed application, when I walk W1 end to end, then it completes and the booking persists.
- **AC3** — Given the security group, when I review inbound rules, then only the ports actually required are open, and SSH is not open to the world.
- **AC4** — Given the app process is restarted, when I re-query a booking, then it is still present.
- **AC5** — Given the runbook, when a person unfamiliar with the project follows it, then they can redeploy without further guidance.

**Tasks**
- T-15.1 Provision the instance and configure the security group (2)
- T-15.2 Install the runtime and configure the process manager for restart-on-boot (2)
- T-15.3 Deploy, set environment variables on the instance, and verify (2)
- T-15.4 Write the deployment runbook (2)

---

### US-16 — README and release tag
> **As the** marker, **I want** a README and a tagged release, **so that** I know what was
> submitted and how to run it.

**Requirements:** N3, N5 · **Points:** 3 · **Priority:** Must

**Acceptance criteria**
- **AC1** — Given the README, when I read it, then it covers setup, architecture, known limitations and the deployment URL.
- **AC2** — Given the repository, when I list tags, then the submitted release is tagged.
- **AC3** — Given the known-limitations section, when I read it, then it names the real gaps honestly rather than claiming none.

**Tasks**
- T-16.1 Write the README (2)
- T-16.2 Tag the release at submission (1)

---

## 2.8 Deferred — explicitly not built

Recorded so the demonstration can show these were *decided against*, not forgotten.

| ID | Item | Why deferred |
|---|---|---|
| US-17 | Search and filter events by date or keyword | Listing is small enough to scan; adds no new requirement coverage |
| US-18 | Ticket tiers (VIP / general) | Breaks assumption A4; would require a TicketType entity |
| US-19 | Email confirmation of booking | External dependency, out of scope per §1.6 |
| US-20 | Organiser revenue dashboard | Depends on payments, out of scope |
| US-21 | Waitlist when sold out | Genuinely interesting, but doubles the state machine |

---

## 2.9 Backlog summary

| Epic | Stories | Points | Iteration |
|---|---|---|---|
| E1 Accounts and access control | US-01 … US-03 | 13 | 1 |
| E2 Event management | US-04 … US-07 | 12 | 1 |
| E3 Discovery and booking | US-08 … US-10 | 16 | 2 |
| E4 Booking management | US-11 … US-13 | 11 | 2 |
| E5 Deployment and documentation | US-14 … US-16 | 10 | 1 and 2 |
| | **16 stories** | **62** | |

US-14 sits in Iteration 1 despite belonging to E5, because `.gitignore` must exist before
the first substantive commit. Everything else in E5 lands in Iteration 2.
