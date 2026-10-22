# FlowSync

A collaborative task manager with live-synced shared tasks, recurring tasks, analytics, and an admin panel with an audit log.

**Live demo:** https://flowsync-productivity-suite.vercel.app

<!-- TODO: add a screenshot or GIF, e.g. docs/screenshot.png -->

The API runs on Render's free tier and sleeps when idle, so the first request after a quiet period can take 30 to 60 seconds.

---

## Features

**Tasks**
- Title, description, status, priority, category, mood, and due date
- Subtasks: an ordered checklist on each task
- Recurring tasks (daily, weekly, monthly). Completing one creates the next occurrence with the same subtasks (unticked) and collaborators. Its due date is one interval after the old due date, or after today if the old date has already passed.
- Search plus filters for status, priority, category, and mood
- Keyboard shortcuts, light and dark themes, and an avatar upload through Cloudinary

**Collaboration**
- A friends system with requests, accepting, and starring friends
- Share a task with a friend. The owner and collaborators can all edit it, and changes appear on everyone's screen right away over Socket.io. Only the owner can delete the task or change who has access.

**Analytics**
- Dashboard charts (Recharts) that break tasks down by status, priority, and mood

**Admin**
- Admin rights come from a `users.is_admin` database column, not from anything the client sends
- Site stats, a user list with search and pagination, a contact form inbox, and setting a user's password
- An audit log of admin actions (currently records admin password changes)

---

## Architecture

```
┌────────────────────────┐   REST (JWT bearer)    ┌──────────────────────────┐   pg pool, TLS   ┌──────────────────┐
│  React + Vite client   │ ─────────────────────▶ │  Express 5 API           │ ───────────────▶ │  PostgreSQL      │
│  (Vercel)              │                        │  + Socket.io (Render)    │                  │  (Neon)          │
│                        │ ◀───────────────────── │                          │                  └──────────────────┘
│                        │  WebSocket:            │  Zod · rate limits ·     │ ──▶ Cloudinary (avatars)
│                        │  "tasks:changed"       │  Helmet · Pino           │ ──▶ Brevo (email)
└────────────────────────┘                        └──────────────────────────┘ ──▶ Sentry (errors)
```

**How a realtime update moves through the system**

1. When the client logs in, it opens one Socket.io connection and sends the same JWT it uses for REST calls (`client/src/services/socket.js`).
2. The server checks that token the same way it checks REST requests, token version included, then puts the socket in a room named `user:<id>` (`server/realtime.js`).
3. A user edits a shared task with `PUT /api/tasks/:id`. After the write succeeds, the controller looks up the task's owner and collaborators and emits `tasks:changed` to each of their rooms.
4. Each open `Tasks` page receives the event and quietly refetches its task list (`client/src/pages/Tasks.jsx`).

The event carries no data on purpose. Refetching is simpler and more reliable than patching the client's state for every kind of change.

---

## Security

- **Revocable JWT sessions.** Each token carries the user's `token_version`, and every REST request and socket connection compares it with the database. Resetting a password, or an admin setting one, bumps the version, which logs that user out on every device. Verification only accepts HS256.
- **Hashed reset tokens.** Password reset tokens are stored as SHA-256 hashes, so a leaked database row can't be used as a reset link. They expire after one hour.
- **Constant-time login responses.** Unknown emails and wrong passwords get the same error. For unknown users the server still runs a bcrypt compare against a dummy hash, so response timing doesn't reveal which accounts exist.
- **Database-backed admin roles.** Admin rights used to come from an email allowlist. Signup doesn't verify that you own an email address, so anyone could have registered an allowlisted address. A database column replaced the allowlist.
- **Headers.** The API uses Helmet and a 100 KB JSON body limit. The frontend (`client/vercel.json`) sends a strict CSP that blocks inline scripts, plus `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, and `Permissions-Policy`.
- **Rate limiting.** Login and signup are limited to 10 requests per 15 minutes per IP. Forgot-password and the contact form are limited to 3 per hour. Writes are capped at 300 per 15 minutes per account. Express trusts exactly one proxy hop, so on Render the limits apply to the real client IP.
- **Validation.** Zod schemas check every request body. Numeric ID parameters are validated too, so a bad ID returns 404 instead of 500. Each user can have at most 1,000 tasks and each task at most 100 subtasks.
- **Database TLS.** The Postgres connection verifies Neon's certificate (`rejectUnauthorized: true`) instead of just encrypting the connection.
- Emails are stored lowercase, and email and username have case-insensitive unique indexes. The server refuses to start without `JWT_SECRET` and warns if it's shorter than 32 characters.

---

## Engineering notes

- **Moving from MySQL to Postgres without rewriting the controllers.** The app started on MySQL hosted by Aiven. When Aiven's free trial ended, the database became unreachable, so I moved to Neon's free Postgres tier. Every controller called `db.query(sql, params, callback)` in mysql2 style. Instead of rewriting them, `server/config/db.js` became a thin wrapper around `pg` that converts `?` placeholders to `$1, $2, …` and returns results in mysql2's shape. The migration also uncovered a quiet bug: Postgres lowercases unquoted identifiers, so camelCase aliases like `AS totalUsers` came back under the wrong key until I quoted them.
- **Session revocation.** A JWT stays valid until it expires, so a password reset alone wouldn't log out a stolen session. Storing a `token_version` and checking it on every request costs one indexed lookup. In return, "log out everywhere" works, and the same check also cuts off live socket updates for old sessions.
- **Due dates that were off by one day.** `pg` turns `DATE` columns into JavaScript `Date` objects at local midnight, and JSON then serializes them as UTC. On a server east of UTC, that moved every due date back a day. The fix keeps `DATE` values as plain `YYYY-MM-DD` strings (`types.setTypeParser(1082, …)`).
- **Recurring tasks can't spawn twice.** After a recurring task spawns its next occurrence, the completed task's recurrence is set to `None`. If someone un-completes and re-completes it, no duplicate is created.

---

## Testing

```bash
cd server
npm test
```

There are 56 Jest + Supertest tests in `server/tests/`. They call the Express app directly with a mocked database layer, so they check routing, authorization, validation, and responses rather than SQL. They cover:

- **Auth:** signup, login (including the generic error), forgot password, and reset password, including the session revocation from a token-version bump
- **Tasks:** auth required, create/read/update/delete, recurring-task spawning, ID parameter validation, subtasks, and sharing permissions (only the owner can share or delete)
- **Admin:** `is_admin` required on every route, setting a password (with an audit log entry), and the audit log endpoint

There is no CI pipeline yet. The tests run locally.

---

## Local setup

**Prerequisites:** Node.js 20+ and a Postgres database. The pool always uses TLS with certificate verification when `DATABASE_URL` is set, so a free Neon database is the simplest choice. A local Postgres server without TLS won't accept the connection.

**Server environment** (`server/.env`, see `server/.env.example`):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Key for signing session tokens (required, at least 32 characters) |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated |
| `APP_URL` | Base URL used in password-reset emails |
| `PORT` | API port (default `5000`) |
| `BREVO_API_KEY` | Transactional email (if unset, emails are logged and skipped) |
| `EMAIL_FROM` | Sender address |
| `CONTACT_NOTIFY_EMAIL` | Where contact form messages are sent |
| `CLOUDINARY_CLOUD_NAME` | Avatar uploads |
| `CLOUDINARY_API_KEY` | Avatar uploads |
| `CLOUDINARY_API_SECRET` | Avatar uploads |
| `SENTRY_DSN` | Error tracking (does nothing if unset) |
| `LOG_LEVEL` | Pino log level |

**Client environment** (`client/.env`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL, e.g. `http://localhost:5000` |

**Run it:**

```bash
# API
cd server
npm install
npm run migrate      # idempotent; safe to re-run
npm run dev          # http://localhost:5000

# Client (second terminal)
cd client
npm install
npm run dev          # http://localhost:5173
```

To make an account an admin: `UPDATE users SET is_admin = TRUE WHERE id = <id>;`

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Framer Motion, Recharts, Axios, socket.io-client |
| Backend | Node.js, Express 5, Socket.io, Zod, jsonwebtoken, bcryptjs, Multer |
| Database | PostgreSQL (Neon) through `pg` |
| Security | Helmet, express-rate-limit, CSP headers through Vercel |
| Services | Cloudinary (avatars), Brevo (email) |
| Observability | Pino / pino-http, Sentry |
| Testing | Jest, Supertest |
| Hosting | Vercel (client), Render (API), Neon (database) |

---

## Author

**Manthan Chauhan** · [GitHub](https://github.com/manthu01)
