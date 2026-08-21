# Event Ticket Booking System

**IFN636 Software Life Cycle Management, Assessment 1**
Nikhittha Mukkala (N12202665)

A small booking system where **organisers** publish events and **attendees** book tickets,
built so that an event can never be oversold, even when two people try to book the last seat
at the same instant.

**Live:** http://54.79.24.72 · **Instance:** `i-04a1250e9732b2449` (ap-southeast-2)

> Access note: the deployed URL is currently reachable from one IP address only. The account
> restriction that causes this, and what to do about it before marking, are explained in
> [§7.7 of the deployment runbook](docs/07-deployment-runbook.md#77-open-item-access-for-marking).

---

## What it does

Two roles, two complete workflows.

**W1, publish and book.** An organiser creates an event with a capacity and a price. It
appears in the public listing. An attendee opens it, chooses a quantity, books, and gets a
unique reference. The remaining seat count drops, and the booking shows up in the
organiser's attendee list.

**W2, cancel and release.** An attendee cancels a booking. The seats go back to the event and
the organiser's numbers update. Cancelling the same booking twice does not return the seats
twice.

| Role | Can do |
|---|---|
| **Organiser** | Create, edit and cancel their own events. See who booked. |
| **Attendee** | Browse events, book 1 to 10 tickets, view and cancel their own bookings. |

---

## The interesting part

Nearly all of this is ordinary CRUD. One requirement is not.

**An event must never be oversold.** The obvious way to write that is:

```js
const event = await Event.findById(id);
if (event.seatsRemaining >= quantity) {
  event.seatsRemaining -= quantity;
  await event.save();
}
```

That passes every test you can do by hand, and it is wrong. Between reading the count and
saving it, the server can start handling somebody else's request. Two people can both read
`seatsRemaining` as 1, both decide there is room, and both save. The event is oversold and
the counter can go negative.

So the check and the subtraction are a single database operation instead:

```js
const claimed = await Event.findOneAndUpdate(
  { _id: eventId, status: 'PUBLISHED', seatsRemaining: { $gte: quantity } },
  { $inc: { seatsRemaining: -quantity } },
  { new: true }
);
if (!claimed) { /* somebody else got there first, return 409 */ }
```

The condition is in the **filter**, not in an `if`. Whichever request arrives second matches
nothing and gets `null`. There is no window.

Cancelling has the mirror problem: two simultaneous cancels of one booking would add the
seats back twice and inflate capacity above what the venue holds. So the thing made atomic
there is the **status transition**, not the arithmetic. Only the request that wins the
transition is allowed to return the seats.

Both come from one derived requirement, R11.1, in [the design](docs/06-system-design.md).
Tests [`capacity.test.js`](backend/tests/capacity.test.js) and
[`cancellation.test.js`](backend/tests/cancellation.test.js) fire genuinely concurrent
requests to prove it.

---

## Architecture

```
Browser ──► nginx :80 ──┬──► /api/* ──► Node/Express :5000 ──► MongoDB :27017
                        │                                      (bound to 127.0.0.1)
                        └──► everything else ──► built React files
```

One EC2 instance runs all three. nginx is the only public listener; MongoDB is bound to
localhost so it cannot be reached from outside even though it shares the host.

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite, React Router |
| API | Node 20, Express 4 |
| Database | MongoDB 7, Mongoose |
| Auth | JWT, bcrypt password hashing |
| Tests | Jest, Supertest, mongodb-memory-server |
| Hosting | EC2 t3.micro, Amazon Linux 2023, nginx, pm2 |

```
backend/src/     models, controllers, routes, middleware
backend/tests/   49 tests
frontend/src/    pages and components
design/          Figma generator plugin
deploy/          EC2 bootstrap script
docs/            requirements, backlog, design, runbook, decision log
```

---

## Running it locally

Needs Node 20+ and MongoDB running on the default port.

```bash
git clone https://github.com/nikki505/event-ticket-booking.git
cd event-ticket-booking
```

Backend:

```bash
cd backend && npm install && cp .env.example .env
```

Fill in `.env`. Generate the secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Then:

```bash
npm run dev
```

Frontend, in a second terminal:

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to port 5000, so there is no CORS setup.

### Tests

```bash
cd backend && npm test
```

49 tests. They use an in-memory MongoDB, so they do not need a running database and cannot
touch your development data.

---

## API

| Method | Path | Auth | Role |
|---|---|---|---|
| POST | `/api/auth/register` | — | — |
| POST | `/api/auth/login` | — | — |
| GET | `/api/auth/me` | token | any |
| GET | `/api/events` | — | — |
| GET | `/api/events/:id` | — | — |
| POST | `/api/events` | token | organiser |
| GET | `/api/events/mine` | token | organiser |
| PATCH | `/api/events/:id` | token | organiser + owner |
| POST | `/api/events/:id/cancel` | token | organiser + owner |
| GET | `/api/events/:id/bookings` | token | organiser + owner |
| POST | `/api/bookings` | token | attendee |
| GET | `/api/bookings/mine` | token | attendee |
| POST | `/api/bookings/:id/cancel` | token | attendee + owner |

Role and ownership are both checked on the server. The UI hides what a role cannot do, but
that is tidiness, not security. Calling the API directly with the wrong role gets a 403.

---

## Documentation

| Document | Contents |
|---|---|
| [Submission links](docs/00-submission-links.md) | Every link and ID for the cover page |
| [Requirements](docs/01-problem-and-requirements.md) | Problem, roles, scope, R1 to R14, success criteria |
| [Backlog](docs/02-product-backlog.md) | 5 epics, 16 stories, acceptance criteria |
| [Iterations](docs/03-iteration-plan.md) | Two sprints, dependencies, risks |
| [Decisions](docs/04-decision-log.md) | D001 to D009 with alternatives considered |
| [GenAI log](docs/05-genai-log.md) | Use declaration and evidence |
| [System design](docs/06-system-design.md) | SysML views, behavioural views, traceability matrix |
| [Deployment runbook](docs/07-deployment-runbook.md) | How it was deployed and how to redo it |
| [Design generator](design/README.md) | How the Figma file is produced |

---

## Known limitations

Real gaps, not a claim that there are none.

- **HTTP only, no TLS.** A certificate needs a domain name and there is no domain for this
  project, so tokens and passwords cross the network in the clear. In anything real this
  would be the first thing fixed.
- **The deployed URL is open to one IP.** Students cannot create security groups in this
  teaching account, and the shared ones are attached to 30+ other students' instances, so
  opening port 80 to the world would expose their machines too. See §7.7 of the runbook.
- **No Elastic IP**, so the public address changes if the instance is stopped and started.
- **Single instance.** No load balancer, no redundancy, no zero-downtime deploys.
- **MongoDB has no authentication.** It is bound to localhost, so unreachable from outside,
  but any process on the instance could connect.
- **No backups.** The volume is set to delete on termination.
- **`seatsRemaining` is a stored counter**, so it could in principle drift from the real
  booking total. Mitigated but not eliminated: the attendee list shows both numbers side by
  side and they must agree. The reasoning is in decision D004.
- **No payments, no email, no seat selection, no waitlist.** All deliberately out of scope,
  with reasons recorded in the requirements document.
- **Deployment is manual.** CI/CD is out of scope per the brief.
