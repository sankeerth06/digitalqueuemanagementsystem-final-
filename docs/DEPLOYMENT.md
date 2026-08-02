# Deployment Guide

Recommended split: **frontend → Vercel**, **backend → Render**, **database →
MongoDB Atlas**. Any Node host works for the backend (Railway, Fly.io, a VPS);
Render is used below as a concrete example.

## 1. MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/atlas.
2. Database Access → add a user with a strong password.
3. Network Access → allow `0.0.0.0/0` (or your host's static egress IPs, if it has one) so Render can reach it.
4. Copy the connection string — it looks like
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/qserve`.

## 2. Backend on Render

1. Push this repo to GitHub.
2. Render → New → Web Service → connect the repo, set **Root Directory** to `backend`.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Environment variables (Render dashboard → Environment):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | Render sets this automatically — leave it, the app reads `process.env.PORT` |
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_ACCESS_SECRET` | output of `openssl rand -hex 64` |
   | `JWT_REFRESH_SECRET` | a **different** `openssl rand -hex 64` output |
   | `CLIENT_URL` | your Vercel frontend URL, e.g. `https://qserve.vercel.app` |

6. Deploy. Once live, note the backend URL, e.g. `https://qserve-api.onrender.com`.
7. Seed production data once, from your machine, by temporarily pointing your
   local `.env`'s `MONGO_URI` at the Atlas cluster and running `npm run seed`
   — or run it as a Render one-off job.

## 3. Frontend on Vercel

The frontend talks to the API via same-origin `/api` and `/socket.io` calls
(see `vite.config.ts`'s dev proxy). In production, these need to be pointed at
the deployed backend instead. Two ways to do that:

**Option A — same domain (recommended, avoids CORS/cookie issues):**
Put a rewrite in `frontend/vercel.json` so `/api/*` and `/socket.io/*` are
proxied to the Render backend by Vercel itself:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://qserve-api.onrender.com/api/:path*" },
    { "source": "/socket.io/:path*", "destination": "https://qserve-api.onrender.com/socket.io/:path*" }
  ]
}
```

With this, the frontend code needs no changes — it keeps calling `/api/...`.

**Option B — separate domains:** point `axios`'s `baseURL` and the Socket.IO
client at the full backend URL via `VITE_API_BASE_URL`, and set
`CLIENT_URL` on the backend to the exact Vercel URL so CORS + the refresh
cookie work. This requires `sameSite: 'none'` and `secure: true` on the
refresh cookie (already conditional on `NODE_ENV=production` in
`authController.ts`, but you'll also need to set `sameSite: 'none'`
explicitly for cross-site cookies to be sent).

1. Vercel → New Project → import the repo → **Root Directory**: `frontend`.
2. Build command: `npm run build`. Output directory: `dist`.
3. Add `frontend/vercel.json` as above (Option A) before deploying.
4. Deploy. Update the backend's `CLIENT_URL` env var to the resulting
   `https://<project>.vercel.app` and redeploy the backend so CORS allows it.

## 4. HTTPS & domains

Both Vercel and Render provision HTTPS automatically on their `*.vercel.app` /
`*.onrender.com` subdomains, and support attaching a custom domain with a
free managed certificate — add it in each platform's dashboard once you have
a domain pointed at them via CNAME.

## 5. Post-deploy checklist

- [ ] Visit `/api/health` on the backend URL — should return `{ "success": true }`
- [ ] Log in with a seeded account on the deployed frontend
- [ ] Book a token as a student, confirm it appears on `/staff` and `/tv` in real time
- [ ] Confirm the browser console shows a live Socket.IO connection (no repeated reconnect errors)
- [ ] Rotate the JWT secrets away from any values used during local testing
