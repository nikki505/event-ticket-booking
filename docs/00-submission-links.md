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
| **Jira board** | https://connect-team-acmqgqe7.atlassian.net/jira/software/projects/SCRUM/boards/1/timeline | Timeline, not backlog. Both sprints are closed and all 21 items are Done, which leaves the backlog view empty. Needs marker access granted |
| **Draw.io** | https://viewer.diagrams.net/?lightbox=1&nav=1#Uhttps%3A%2F%2Fraw.githubusercontent.com%2Fnikki505%2Fevent-ticket-booking%2Fmain%2Fdocs%2Fdiagrams%2Fevent-ticket-booking.drawio | View only. The viewer loads the committed source straight from the public repository, so the link needs no cloud account and can never drift from the file in the repo |
| **Figma** | https://www.figma.com/design/9YK2uHsPeA2ZhLgq0SlIjG/Event-Ticket-Booking-System | Generated. **Set sharing to anyone with the link can view before submitting** |
| **EC2 instance ID and name** | `i-04a1250e9732b2449` / `n12202665-nikhittha-eventtix` | Running, ap-southeast-2a |
| **EC2 public URL** | http://32.236.117.199 | Elastic IP, so the address is permanent. Reachable from the developer IP only. **The account stops the instance on a schedule, so check it is running before the demo.** See §7.6a and §7.7 of the runbook |

> **Every link on the report cover page is a real clickable hyperlink.** The draw.io URL is long enough that the PDF wraps it across two lines, so as plain text it could not be copied reliably. It is now an annotation carrying the whole address.

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
| Iteration 1 — Foundations | 8 stories, 27 points | 21 Aug 2026, closed |
| Iteration 2 — Book & Deploy | 8 stories, 35 points | 22 Aug 2026, closed |

Every story carries its requirement IDs as Jira labels (`R1`, `R11`, `N3` …), so the board
can be filtered by requirement and the traceability matrix checked against it.

**Sprint dates match the actual commit history** (21 and 22 August 2026). Both sprints are
closed and all 21 issues are Done, so the board agrees with the repository rather than
showing planned dates that never happened.

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

Everything below needs a person other than the developer, which is why it is still open.

| # | Task | Why it is not done |
|---|---|---|
| 1 | Confirm the Figma link opens for someone who is not signed in | Figma blocks automated clients, so it could not be verified from outside. Open it in a private window. |
| 2 | Ask Himi how the marker reaches the EC2 URL | Students cannot create security groups in this account, so port 80 admits one address. Needs the marking IP, or her agreement to open it wider for the demo. |
| 3 | Ask Himi how the marker gets Jira access | The board sits in a QUT tenanted site. She may already have access through the same tenancy. |
| 5 | Rewrite the reflection in section 6.3 in your own words | It is a personal account. The events in it are real and verifiable in the repository, but the wording was drafted with AI assistance and it is declared as such in section 6.1. |
| 6 | Release the Elastic IP after marking | It is shared account capacity held for this project. |

---

## Done

| Item | State |
|---|---|
| Repository | 30 commits, tagged `v1.0`, one merged pull request with a written self review |
| Jira | 5 epics, 16 stories, all 21 issues Done, both sprints closed on the real working dates |
| Application | Both workflows working, 49 automated tests passing |
| Deployment | Live on an Elastic IP, verified end to end including a full instance stop and start |
| Report | 40 pages, no placeholders, 22 figures including the Figma design pages |
