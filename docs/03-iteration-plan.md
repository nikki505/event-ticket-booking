# 3. Iteration Plan

**Project:** Event Ticket Booking System

Two time-boxed iterations run between the project confirmation in Week 3 and the
demonstration in Week 7.

> **How to use this document.** Sections marked **[FILL AFTER ITERATION]** are review
> outcomes. They must be completed *after* the iteration actually runs, using what really
> happened. Writing them in advance would make the whole traceability exercise fiction, and
> the brief explicitly warns against manufacturing evidence after the fact.

---

## 3.1 Iteration structure

| | Iteration 1 | Iteration 2 |
|---|---|---|
| **Theme** | Foundations — a user can log in and an organiser can manage events | Value — an attendee can book, cancel, and the whole thing runs on EC2 |
| **Length** | 1 week (time-boxed) | 1 week (time-boxed) |
| **Committed points** | 27 | 35 |
| **Goal** | An organiser can register, log in, and create an event that persists | W1 and W2 both complete against the public EC2 URL |
| **Definition of done** | Code merged via PR, acceptance criteria demonstrated locally, story moved to Done in Jira | As Iteration 1, plus verified on the deployed instance |

Iteration 2 carries more points deliberately: Iteration 1 includes the project setup
overhead (repository, tooling, database connection) that is not represented in story points,
so its effective load is higher than 27 suggests.

---

## 3.2 Iteration 1 — Foundations

**Goal:** an organiser can register, log in, and create an event that survives a restart.

| Story | Points | Depends on | Owner | Status |
|---|---|---|---|---|
| US-14 Configuration via environment variables | 2 | — | Student | Planned |
| US-01 Register with a role | 5 | US-14 | Student | Planned |
| US-02 Log in and stay signed in | 5 | US-01 | Student | Planned |
| US-03 Role-based route protection | 3 | US-02 | Student | Planned |
| US-04 Create an event | 3 | US-03 | Student | Planned |
| US-05 View my events | 3 | US-04 | Student | Planned |
| US-06 Update an event | 3 | US-05 | Student | Planned |
| US-07 Cancel an event | 3 | US-04 | Student | Planned |
| | **27** | | | |

**Ownership.** This is an individual assessment, so every item is owned by the student.
The Owner column is retained because the Jira board uses it and because it makes the
single-owner constraint explicit rather than implied.

### Dependency chain

```
US-14 (.gitignore, .env.example)
  └─> US-01 (register)
        └─> US-02 (login, token)
              └─> US-03 (role + ownership guards)
                    └─> US-04 (create event)
                          ├─> US-05 (list my events)
                          │     └─> US-06 (update event)
                          └─> US-07 (cancel event)
```

The chain is almost entirely linear, which is a scheduling risk in itself: there is no
parallel work to switch to if one item stalls. This is recorded as **RSK-04**.

### Iteration 1 exit criteria

- An organiser account can be created and used to log in
- An attendee calling an organiser-only route receives HTTP 403
- An event created before an application restart is still present afterwards
- No secret appears anywhere in the repository history

### Iteration 1 review outcome

**[FILL AFTER ITERATION]** — record: points actually completed, what carried over, what was
harder or easier than estimated, and one process change for Iteration 2.

| Field | Value |
|---|---|
| Points committed | 27 |
| Points completed | *[fill]* |
| Carried over | *[fill]* |
| Actual velocity | *[fill]* |
| What went well | *[fill]* |
| What did not | *[fill]* |
| Change for next iteration | *[fill]* |

---

## 3.3 Iteration 2 — Booking, cancellation and deployment

**Goal:** W1 and W2 both complete against the public EC2 URL.

| Story | Points | Depends on | Owner | Status |
|---|---|---|---|---|
| US-08 Browse events | 3 | US-04 | Student | Planned |
| US-09 Book tickets | 5 | US-08, US-02 | Student | Planned |
| US-10 Capacity is never exceeded | 8 | US-09 | Student | Planned |
| US-11 View my bookings | 3 | US-09 | Student | Planned |
| US-12 Cancel my booking | 5 | US-11, US-10 | Student | Planned |
| US-13 View attendees for my event | 3 | US-09, US-03 | Student | Planned |
| US-15 Deploy W1 to EC2 | 5 | US-10 | Student | Planned |
| US-16 README and release tag | 3 | US-15 | Student | Planned |
| | **35** | | | |

### Dependency chain

```
US-04 ──> US-08 (browse) ──> US-09 (book) ──> US-10 (capacity invariant)
                                │                     │
                                ├──> US-11 (my bookings) ──> US-12 (cancel) 
                                └──> US-13 (attendee list)
                                                      │
                                          US-15 (deploy) ──> US-16 (README, tag)
```

**Critical path:** US-08 → US-09 → US-10 → US-15 → US-16. US-10 sits on the critical path
and is also the highest-risk story, which is why it is scheduled early in the iteration
rather than left until the end.

### Iteration 2 exit criteria

- W1 completes end to end on the public EC2 URL
- W2 completes end to end on the public EC2 URL
- The concurrency test (US-10 AC4) passes
- Capacity returns exactly on cancellation and cannot be inflated by double cancellation
- The release is tagged and the README documents setup, architecture, limitations and URL

### Iteration 2 review outcome

**[FILL AFTER ITERATION]**

| Field | Value |
|---|---|
| Points committed | 35 |
| Points completed | *[fill]* |
| Carried over | *[fill]* |
| Actual velocity | *[fill]* |
| What went well | *[fill]* |
| What did not | *[fill]* |
| Change if there were a third iteration | *[fill]* |

---

## 3.4 Risk register

| ID | Risk | Likelihood | Impact | Mitigation | Trigger / early warning |
|---|---|---|---|---|---|
| **RSK-01** | The overbooking guard passes manual testing but fails under concurrency | High | High | Implement the decrement as a conditional atomic update from the start; write the two-simultaneous-request test (T-10.3) before declaring US-10 done | Any implementation that reads `seatsRemaining`, then writes it back |
| **RSK-02** | EC2 deployment consumes far more time than estimated, squeezing Iteration 2 | High | High | Deploy a trivial "hello" version to EC2 during Iteration 1, before there is anything worth deploying, so the infrastructure is proven early | Not having a public URL responding by the midpoint of Iteration 2 |
| **RSK-03** | Developer is new to the stack, so estimates are unreliable | High | Medium | Use relative points, not hours; re-plan Iteration 2 using Iteration 1 velocity rather than the original guess | Iteration 1 velocity below 20 points |
| **RSK-04** | The Iteration 1 dependency chain is linear — one blocked item stalls everything | Medium | Medium | Keep US-07 and US-06 as the designated "swap out" items; they are Should, not Must | Any story blocked for more than one working day |
| **RSK-05** | A secret is committed, and history cannot be rewritten to remove it | Low | High | `.gitignore` in the very first commit (US-14, T-14.1); never paste a real connection string into a tracked file | Any tracked file containing a value that looks like a credential |
| **RSK-06** | `seatsRemaining` drifts out of step with actual bookings | Medium | Medium | US-13 AC4 displays a total that must equal capacity minus remaining — a visible cross-check | The attendee-list total disagreeing with the remaining-seat count |
| **RSK-07** | The instance is stopped or its public IP changes before the marking window | Medium | High | Verify the URL the day before the demonstration; record the instance ID in the report; note that a stop/start changes a public IP unless an Elastic IP is attached | URL not responding on a pre-demo check |

**RSK-02 mitigation is the one most often skipped.** Deploying a trivial version early
separates "my code is broken" from "my deployment is broken" — two problems that are
painful to debug simultaneously under time pressure.

---

## 3.5 Blocked items log

Recorded as they occur. An item is *blocked* when work cannot proceed regardless of effort.

| Date | Item | Blocker | Blocked by | Resolved | How |
|---|---|---|---|---|---|
| *[fill as they occur]* | | | | | |

**[FILL DURING ITERATIONS]** — leave empty if genuinely nothing was blocked, but note that an
empty log across a four-week project is itself worth a sentence of explanation in the report.
