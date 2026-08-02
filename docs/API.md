# QServe API Reference

Base URL (local dev): `http://localhost:5000/api`

All authenticated requests send `Authorization: Bearer <accessToken>`. The
refresh token is stored in an httpOnly cookie and is never exposed to
JavaScript. All responses follow the shape:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "...", "details": [ ... ] }
```

## Auth — `/api/auth`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/register` | public | Create a student account, returns `{ user, accessToken }` and sets refresh cookie |
| POST | `/login` | public | `{ email, password }` → `{ user, accessToken }` |
| POST | `/refresh` | public (cookie) | Rotates the refresh token, returns a new access token |
| POST | `/logout` | any | Invalidates the current refresh token (bumps `refreshTokenVersion`) |
| GET | `/me` | any | Current user |
| PATCH | `/profile` | any | Update `name`, `phone`, `avatarUrl`, `darkMode` |
| POST | `/change-password` | any | `{ currentPassword, newPassword }` |

## Menu — `/api/menu`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/` | any | List items. Query: `category`, `search`, `availableOnly=true` |
| GET | `/:id` | any | Single item |
| POST | `/` | admin | Create item |
| PATCH | `/:id` | admin | Update item |
| DELETE | `/:id` | admin | Remove item |

## Queue / Tokens — `/api/queue`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/tokens` | student | `{ items: [{ menuItemId, quantity }] }` → books a token, rejects if the student already has an active one |
| GET | `/tokens/mine/active` | student | Current active token + live position |
| GET | `/tokens/mine/history` | student | Last 50 tokens for this student |
| DELETE | `/tokens/:id` | student | Cancel own token (only while `waiting`) |
| GET | `/tokens/search/:code` | any | Look up any token by code, scoped to today |
| GET | `/live` | staff, admin | All `waiting`/`preparing` tokens, sorted for the queue view |
| GET | `/skipped` | staff, admin | Today's `skipped` tokens (for recall) |
| POST | `/call-next` | staff, admin | `{ counter }` → calls the next waiting token to that counter |
| PATCH | `/tokens/:id/ready` | staff, admin | Mark a `preparing` token `ready` |
| PATCH | `/tokens/:id/complete` | staff, admin | Mark `preparing`/`ready` token `completed` |
| PATCH | `/tokens/:id/skip` | staff, admin | Skip an active token |
| PATCH | `/tokens/:id/recall` | staff, admin | Bring a skipped token back to `waiting` |

## Settings — `/api/settings`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/` | any | Current system settings |
| PATCH | `/` | admin | Update `totalCounters`, `averagePrepBufferMinutes`, `announcement` |
| POST | `/pause` | staff, admin | `{ reason? }` pauses new token booking |
| POST | `/resume` | staff, admin | Resumes the queue |

## Users — `/api/users`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/` | admin | Query: `role`, `search` |
| POST | `/staff` | admin | Create a `staff` or `admin` account |
| PATCH | `/:id` | admin | Update `name`, `phone`, `role`, `counterAssigned`, `isActive` |
| DELETE | `/:id` | admin | Remove a user |

## Notifications — `/api/notifications`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/` | any | Last 50 notifications + unread count |
| PATCH | `/:id/read` | any | Mark one as read |
| PATCH | `/read-all` | any | Mark all as read |

## Analytics — `/api/analytics`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/overview` | staff, admin | Today's orders/revenue, active queue length, cancellations, avg completion time |
| GET | `/daily-trend?days=7` | staff, admin | Orders/revenue/cancellations per day |
| GET | `/peak-hours?days=7` | staff, admin | Order count grouped by hour of day |
| GET | `/top-items` | staff, admin | Top 8 items by `totalOrders` |
| GET | `/revenue-by-category?days=30` | staff, admin | Revenue grouped by menu category |

## Socket.IO events

Connect with `io('/', { path: '/socket.io', auth: { token: accessToken } })`.
Anonymous connections are allowed (used by the public TV display) but only
receive queue/settings broadcasts, not personal notifications.

| Event | Direction | Payload | Notes |
|---|---|---|---|
| `queue:updated` | server → client | `Token[]` | Full live queue snapshot, sent to `queue-room`, `tv-room`, `staff-room` |
| `token:created` | server → client | `Token` | New booking |
| `token:called` | server → client | `Token` | A token moved to `preparing` |
| `notification:new` | server → client | `Notification` | Sent only to `user-<id>` room |
| `settings:updated` | server → client | `Settings` | Pause/resume, counters, announcement changes |
| `join-tv-display` | client → server | — | Joins `tv-room` for the public display |
