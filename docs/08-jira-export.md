# 8. Jira Board Export

**Project:** SCRUM, Team Astro
**Site:** connect-team-acmqgqe7.atlassian.net
**Exported:** 25 August 2026, direct from the Jira REST API

---

## Why this file exists

The Jira link on the cover page asks for a sign in when opened by anyone who is not already
in this Atlassian site. That is not a setting that can be changed from the project. Atlassian
Cloud no longer allows anonymous access to Jira projects, and the project itself is already
set to open rather than private, so there is nothing further to switch on.

This file is the board exported as data, so the work can be checked even before access is
arranged. It is pulled straight from the API rather than typed out, so it cannot disagree
with the board.

**This is a fallback, not a replacement.** The marker should still be given access to the
live board. What to ask for is in section 8.3.

---

## 8.1 All 21 work items

| Key | Type | Summary | Status | Points | Parent | Sprint | Labels | Resolved |
|---|---|---|---|---|---|---|---|---|
| SCRUM-1 | Epic | E1 Accounts and access control | Done |  |  |  | N2 R1 R2 R3 R4 epic-E1 | 2026-08-22 |
| SCRUM-2 | Epic | E2 Event management (Organiser) | Done |  |  |  | R5 R6 R7 R8 epic-E2 | 2026-08-22 |
| SCRUM-3 | Epic | E3 Discovery and booking (Attendee) | Done |  |  |  | R10 R11 R9 epic-E3 | 2026-08-22 |
| SCRUM-4 | Epic | E4 Booking management | Done |  |  |  | R12 R13 R14 epic-E4 | 2026-08-22 |
| SCRUM-5 | Epic | E5 Deployment, security hygiene and documentation | Done |  |  |  | N3 N5 N6 epic-E5 | 2026-08-22 |
| SCRUM-6 | Story | US-01 Register with a role | Done | 5 | SCRUM-1 | Iteration 1 Foundations (closed) | N2 R1 iteration-1 | 2026-08-22 |
| SCRUM-7 | Story | US-02 Log in and stay signed in | Done | 5 | SCRUM-1 | Iteration 1 Foundations (closed) | R2 R3 iteration-1 | 2026-08-22 |
| SCRUM-8 | Story | US-03 Role-based route protection | Done | 3 | SCRUM-1 | Iteration 1 Foundations (closed) | R4 iteration-1 | 2026-08-22 |
| SCRUM-9 | Story | US-04 Create an event (reference story) | Done | 3 | SCRUM-2 | Iteration 1 Foundations (closed) | R5 iteration-1 | 2026-08-22 |
| SCRUM-10 | Story | US-05 View my events | Done | 3 | SCRUM-2 | Iteration 1 Foundations (closed) | R6 iteration-1 | 2026-08-22 |
| SCRUM-11 | Story | US-06 Update an event | Done | 3 | SCRUM-2 | Iteration 1 Foundations (closed) | R7 iteration-1 | 2026-08-22 |
| SCRUM-12 | Story | US-07 Cancel an event | Done | 3 | SCRUM-2 | Iteration 1 Foundations (closed) | R8 iteration-1 | 2026-08-22 |
| SCRUM-13 | Story | US-08 Browse events | Done | 3 | SCRUM-3 | Iteration 2 Book and Deploy (closed) | R9 iteration-2 | 2026-08-22 |
| SCRUM-14 | Story | US-09 Book tickets | Done | 5 | SCRUM-3 | Iteration 2 Book and Deploy (closed) | R10 iteration-2 | 2026-08-22 |
| SCRUM-15 | Story | US-10 Capacity is never exceeded | Done | 8 | SCRUM-3 | Iteration 2 Book and Deploy (closed) | R11 iteration-2 risk-RSK-01 | 2026-08-22 |
| SCRUM-16 | Story | US-11 View my bookings | Done | 3 | SCRUM-4 | Iteration 2 Book and Deploy (closed) | R12 iteration-2 | 2026-08-22 |
| SCRUM-17 | Story | US-12 Cancel my booking | Done | 5 | SCRUM-4 | Iteration 2 Book and Deploy (closed) | R13 iteration-2 | 2026-08-22 |
| SCRUM-18 | Story | US-13 View attendees for my event | Done | 3 | SCRUM-4 | Iteration 2 Book and Deploy (closed) | R14 iteration-2 | 2026-08-22 |
| SCRUM-19 | Story | US-14 Configuration through environment variables | Done | 2 | SCRUM-5 | Iteration 1 Foundations (closed) | N3 iteration-1 | 2026-08-22 |
| SCRUM-20 | Story | US-15 Deploy W1 to EC2 | Done | 5 | SCRUM-5 | Iteration 2 Book and Deploy (closed) | N5 N6 iteration-2 risk-RSK-02 | 2026-08-22 |
| SCRUM-21 | Story | US-16 README and release tag | Done | 3 | SCRUM-5 | Iteration 2 Book and Deploy (closed) | N3 N5 iteration-2 | 2026-08-22 |

**Totals.** 5 epics, 16 stories, 62 story points. Iteration 1 carried 27 points across 8
stories, iteration 2 carried 35 across 8. Both sprints are closed and every item is Done.

---

## 8.2 What the labels are for

Every story carries its requirement IDs as Jira labels, so the board can be filtered by
requirement and checked against the traceability matrix in section 2.10 of the report. Two
stories also carry a risk label, `risk-RSK-01` on the overbooking story and `risk-RSK-02` on
the deployment story, because those were the two items the risk register flagged as most
likely to go wrong.

Filtering the board by the label `R11` returns the story, and the same ID appears in the
commit messages and in the frame names of the prototype. That is what makes the matrix a
by product of working normally rather than a document written at the end.

Each story also holds its full acceptance criteria and task breakdown in the description
field, which this table does not reproduce. Those are in section 1.10 of the report and in
`docs/02-product-backlog.md`.

---

## 8.3 Getting the marker into the live board

The board sits in a QUT tenanted Atlassian site, so a sign in is required. Ask the tutor
which of these she wants:

1. **She already has access.** If her account is in the same tenancy the link works as it is
   and nothing needs doing. Worth checking first, because it costs nothing.
2. **Invite her by email.** Project settings, Access, add her QUT address. This is the normal
   route and takes a minute.
3. **Walk the board during the demonstration** by sharing a screen, using this export as the
   written record.

Regenerating this file, if the board changes:

```
GET /rest/api/3/search/jql?jql=project=SCRUM+ORDER+BY+key+ASC
    &fields=summary,status,issuetype,labels,parent,customfield_10016,customfield_10020,resolutiondate
```

`customfield_10016` is the story point estimate and `customfield_10020` is the sprint on this
site. Those IDs are site specific, so look them up with `/rest/api/3/field` rather than
assuming them.
