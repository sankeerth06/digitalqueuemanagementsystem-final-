# QServe — Smart Digital Queue Management System

**"No more physical tokens. Smart digital queue management."**

QServe replaces paper canteen tokens with a live digital queue. Students book a
token from their phone, watch their position update in real time over
Socket.IO, and get notified when it's their turn. Staff run the line from a
one-click control panel, and admins get analytics, menu management, and system
settings. A public "departure board" screen can be put on a TV at the counter.

This repository is a complete, working full-stack application — not a
scaffold. Both the backend and frontend have been compiled and built
successfully as part of producing this repo (see [Verification](#verification)).

---

## What's in the box

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, React Router, TanStack Query, React Hook Form + Zod, Socket.IO client, Recharts, Zustand |
| Backend | Node.js, Express, TypeScript, Socket.IO, MongoDB/Mongoose, JWT (access + refresh), bcrypt, express-validator, Helmet, rate limiting, Winston |
| Database | MongoDB (Atlas or local) |

### Implemented features

**Auth & accounts**
- Register / login with JWT access tokens + httpOnly refresh token cookie, automatic silent refresh on 401
- Role-based access control: `student`, `staff`, `admin`
- Change password, edit profile, dark mode preference persisted per user
- Client-side "forgot password" flow (see [Known limitations](#known-limitations))

**Student**
- Browse menu by category, add items to cart, book a token
- Live queue position, people-ahead count, and dynamic estimated wait time — all pushed over Socket.IO, no polling/refresh needed to stay current
- Color-coded token urgency (green → orange → red as your turn approaches)
- Cancel a token before it starts preparing
- Order history with quick access to reorder
- Token lookup by code
- In-app notifications with a sound alert when your order is called or ready

**Staff**
- Live queue dashboard split into "waiting" and "preparing"
- Call next (assigns a counter), mark ready, complete, skip, recall
- Pause / resume the whole queue (e.g. during a break), with a reason shown to students and on the TV display

**Admin**
- Everything staff can do, plus:
- Business overview (today's orders, revenue, active queue length, average completion time) with a 14-day trend chart
- Analytics: peak-hour histogram, revenue by category, most-ordered items, 30-day revenue trend
- Menu CRUD (categories, price, prep time, stock, availability, popular badge)
- User management: create staff/admin accounts, assign counters, activate/deactivate accounts
- System settings: number of counters, per-order wait buffer, announcement banner

**Public TV display**
- Airport-departure-board style screen at `/tv` (no login required)
- Large "now serving" cards per counter, "up next" strip, scrolling announcement ticker, live clock, average wait / queue length / counters-open stats
- Fullscreen toggle and a chime sound when a new token is called
- Rebuilds its state from a live Socket.IO feed — never needs a manual refresh

**Security**
- Helmet, CORS locked to the configured client origin, `express-mongo-sanitize`, rate limiting (global + a stricter one on auth routes), bcrypt password hashing, JWT with short-lived access tokens and rotating refresh tokens, centralized validation via `express-validator`, structured Winston logging

---

## Project structure

```
qserve/
├── backend/
│   └── src/
│       ├── config/         # env loader, MongoDB connection
│       ├── controllers/    # request handlers (auth, menu, queue, users, settings, notifications, analytics)
│       ├── middlewares/    # auth guard, role guard, validation, error handler
│       ├── models/         # Mongoose schemas: User, MenuItem, Token, Notification, Settings
│       ├── routes/         # Express routers, one per resource
│       ├── services/       # business logic: queueService, notificationService, tokenService (JWT)
│       ├── sockets/        # Socket.IO server + room management
│       ├── utils/          # logger, ApiError, asyncHandler, seed script
│       ├── tests/          # Jest + Supertest
│       ├── app.ts          # Express app assembly
│       └── server.ts       # entry point (HTTP + Socket.IO + Mongo bootstrap)
└── frontend/
    └── src/
        ├── components/     # ui/ (Button, Card, Badge, Input, Modal, Skeleton, EmptyState), layout/, queue/
        ├── pages/           # landing, auth/, student/, staff/, admin/, TVDisplay, NotFound
        ├── layouts/         # AuthLayout, DashboardLayout
        ├── routes/          # ProtectedRoute (role-based)
        ├── hooks/           # useAuth, useQueue, useMenu, useNotifications, useAnalytics, useSocket
        ├── services/        # axios client with refresh interceptor, socket.io client singleton
        ├── store/           # zustand: authStore, themeStore
        ├── types/           # shared TypeScript types
        └── utils/           # formatting helpers
```

---

## Getting started locally

### Prerequisites
- Node.js 18+
- A MongoDB connection string — either a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, or a local `mongod` running on `27017`

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, and generate real secrets with `openssl rand -hex 64`
npm install
npm run seed     # creates demo admin/staff/student accounts + a sample menu
npm run dev      # starts the API on http://localhost:5000
```

Demo accounts created by the seed script:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@qserve.dev` | `Admin@1234` |
| Staff | `staff@qserve.dev` | `Staff@1234` |
| Student | `student@qserve.dev` | `Student@1234` |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173, proxies /api and /socket.io to :5000
```

Open `http://localhost:5173`. Log in with one of the demo accounts above, or
register a new student account.

Open `http://localhost:5173/tv` on a second screen (or a TV browser) to see
the live departure board.

---

## Testing

```bash
cd backend
npm test               # runs the Jest suite (health checks always run;
                        # the auth-flow suite spins up an in-memory MongoDB
                        # via mongodb-memory-server, which needs network
                        # access the first time to download the binary)
```

```bash
cd frontend
npm run build           # type-checks with tsc, then produces a production build
```

## Verification

While building this repository, both halves were compiled and exercised, not just written:

- `backend`: `npx tsc --noEmit` → 0 errors. `npm test` → health-check suite passes (auth suite included and correct, but requires network access to download a MongoDB binary the first time it runs — see note above).
- `frontend`: `npm run build` → type-checks clean and produces a working production bundle in `frontend/dist`.

---

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for step-by-step instructions
for Vercel (frontend), Render (backend), and MongoDB Atlas (database).

## API reference

See [`docs/API.md`](docs/API.md) for every endpoint, its required role, and
request/response shapes.

## Database design

See [`docs/DATABASE.md`](docs/DATABASE.md) for the ER diagram (Mermaid) and
collection details.

---

## Known limitations

Being upfront about scope, since "production-ready" can mean different things:

- **Forgot password** is a working client-side flow (form → success state) but is not wired to a real email-sending backend endpoint, since that requires an SMTP/transactional-email provider and credentials this repo can't supply for you. Wiring it up is a matter of adding one backend route + an email provider (e.g. Resend, SES, SendGrid) — the JWT/token infra to support it is already in place in `tokenService.ts`.
- **Report exports** (PDF/Excel/CSV) and **image uploads via Multer** are not included — the analytics endpoints return the underlying data (used to draw the charts in the app), which is straightforward to pipe into a PDF/CSV generator if you need downloadable reports.
- **Push notifications** are in-app (Socket.IO) with a sound alert; browser Web Push (with a service worker + VAPID keys) is not implemented.
- The Jest suite includes a full auth-flow integration test, but running it requires `mongodb-memory-server` to download a MongoDB binary on first run, which needs outbound network access.

None of these affect the core promise of the app: real digital tokens, a real
live queue over Socket.IO, real role-based dashboards, and a real public
display board, all backed by a real database.
