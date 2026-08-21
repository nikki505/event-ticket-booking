# 0. Submission Details and Links

Copy these onto the cover page of the submission PDF.

| Field | Value |
|---|---|
| **Full name** | Nikhittha Mukkala |
| **Student ID** | N12202665 |
| **Tutor's name** | *[fill]* |
| **Tutorial day and time** | *[fill]* |
| **Project name** | Event Ticket Booking System |

| Artefact | Link | Status |
|---|---|---|
| **GitHub** | https://github.com/nikki505/event-ticket-booking | Public, live |
| **Jira board** | https://connect-team-acmqgqe7.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog | Live — needs marker access granted |
| **Draw.io** | *[pending]* | Not yet created |
| **Figma** | *[pending]* | Not yet created |
| **EC2 instance ID and name** | *[pending]* | Not yet provisioned |
| **EC2 public URL** | *[pending]* | Not yet deployed |

> **The brief warns of negative marking for broken links.** Check every one of these from a
> logged-out private browsing window before submitting. A Jira board that works while you are
> signed in and 404s for the marker is the most common way to lose these marks.

---

## Submission filename

`N12202665_Nikhittha Mukkala_Event Ticket Booking System.pdf`

Per the template: `StudentID_Name_ProjectName.pdf`.

---

## Jira board contents

Project **SCRUM — Team Astro** (team-managed software project).

| Item | Count | Notes |
|---|---|---|
| Epics | 5 | SCRUM-1 … SCRUM-5 |
| Stories | 16 | SCRUM-6 … SCRUM-21 |
| Iteration 1 — Foundations | 8 stories, 27 points | 24–30 Aug 2026 |
| Iteration 2 — Book & Deploy | 8 stories, 35 points | 31 Aug – 6 Sep 2026 |

Every story carries its requirement IDs as Jira labels (`R1`, `R11`, `N3` …), so the board
can be filtered by requirement and the traceability matrix checked against it.

**Sprint dates are provisional** — adjust them to your real tutorial schedule.

### Epic to story mapping

| Epic | Jira | Stories |
|---|---|---|
| E1 Accounts and access control | SCRUM-1 | SCRUM-6, 7, 8 |
| E2 Event management | SCRUM-2 | SCRUM-9, 10, 11, 12 |
| E3 Discovery and booking | SCRUM-3 | SCRUM-13, 14, 15 |
| E4 Booking management | SCRUM-4 | SCRUM-16, 17, 18 |
| E5 Deployment and documentation | SCRUM-5 | SCRUM-19, 20, 21 |

### Story to requirement mapping

| Jira | Story | Requirements | Points | Iteration |
|---|---|---|---|---|
| SCRUM-6 | US-01 Register with a role | R1, N2 | 5 | 1 |
| SCRUM-7 | US-02 Log in and stay signed in | R2, R3 | 5 | 1 |
| SCRUM-8 | US-03 Role-based route protection | R4 | 3 | 1 |
| SCRUM-9 | US-04 Create an event | R5 | 3 | 1 |
| SCRUM-10 | US-05 View my events | R6 | 3 | 1 |
| SCRUM-11 | US-06 Update an event | R7 | 3 | 1 |
| SCRUM-12 | US-07 Cancel an event | R8 | 3 | 1 |
| SCRUM-13 | US-08 Browse events | R9 | 3 | 2 |
| SCRUM-14 | US-09 Book tickets | R10 | 5 | 2 |
| SCRUM-15 | US-10 Capacity is never exceeded | R11 | 8 | 2 |
| SCRUM-16 | US-11 View my bookings | R12 | 3 | 2 |
| SCRUM-17 | US-12 Cancel my booking | R13 | 5 | 2 |
| SCRUM-18 | US-13 View attendees for my event | R14 | 3 | 2 |
| SCRUM-19 | US-14 Config via environment variables | N3 | 2 | 1 |
| SCRUM-20 | US-15 Deploy W1 to EC2 | N5, N6 | 5 | 2 |
| SCRUM-21 | US-16 README and release tag | N3, N5 | 3 | 2 |

---

## Outstanding before submission

1. Grant the marker access to the Jira board — check with your tutor whether they need to be
   invited by email or whether the board should be made publicly viewable.
2. Create the draw.io diagram file and share it view-only.
3. Build the Figma prototype (low-fidelity wireframes first, then clickable high-fidelity).
4. Build and deploy the application; record the instance ID and public URL.
5. Complete the `[fill]` markers in `05-genai-log.md` and the iteration review outcomes in
   `03-iteration-plan.md`.
6. Tag the release.
