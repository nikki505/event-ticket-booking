# 0. Submission Details and Links

Copy these onto the cover page of the submission PDF.

| Field | Value |
|---|---|
| **Full name** | Nikhittha Mukkala |
| **Student ID** | N12202665 |
| **Tutor's name** | Shinthi Tasnim Himi (Himi) |
| **Tutorial day and time** | Wednesday 1:00 pm to 3:00 pm |
| **Project name** | Event Ticket Booking System |

| Artefact | Link | Status |
|---|---|---|
| **GitHub** | https://github.com/nikki505/event-ticket-booking | Public, live |
| **Jira board** | https://connect-team-acmqgqe7.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog | Live — needs marker access granted |
| **Draw.io** | *[paste share link]* | Source committed at `docs/diagrams/event-ticket-booking.drawio` — open it at app.diagrams.net and share view-only |
| **Figma** | https://www.figma.com/design/9YK2uHsPeA2ZhLgq0SlIjG/Event-Ticket-Booking-System | Generated. **Set sharing to anyone with the link can view before submitting** |
| **EC2 instance ID and name** | `i-04a1250e9732b2449` / `n12202665-nikhittha-eventtix` | Running, ap-southeast-2a |
| **EC2 public URL** | http://32.236.117.199 | Live. **Elastic IP, so the address is now permanent. Reachable only from the developer IP** — see §7.7 of the runbook |

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

Ordered by what blocks what.

| # | Task | Who | Blocks |
|---|---|---|---|
| 1 | Supply tutor's name and tutorial day/time for the cover page | **You** — I cannot know these | Cover page |
| 2 | Ask your tutor how the marker gets Jira access (email invite vs. public board), then apply it | **You** — needs the tutor's answer | Jira marks |
| 3 | Open `docs/diagrams/event-ticket-booking.drawio` at app.diagrams.net, share view-only, paste the link above | **You** (needs your Google/OneDrive account) | Draw.io link |
| 4 | Run the Figma generator (see `design/README.md`), share view-only, paste the link above | **You** — needs Figma desktop app | Figma link, UI/UX marks |
| 5 | Build the application | Me | Commits column of the traceability matrix |
| 6 | Provision EC2, deploy, record instance ID and public URL | Me + your AWS login | Deployment column, 8 marks |
| 7 | Complete the GenAI log honestly — what you edited, what you rejected, what you wrote yourself | **You** — it is a personal declaration | 8 marks |
| 8 | Fill iteration review outcomes in `03-iteration-plan.md` after each iteration actually runs | **You** | Project management marks |
| 9 | Tag the release | Me | Git marks |

Items 1, 2, 3, 4, 7 and 8 need you specifically. Items 5, 6 and 9 are mine, and item 6 needs
you to be present for the AWS sign-in.
