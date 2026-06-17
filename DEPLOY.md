# Deploying MonkMode to Vercel

The app is a Vite PWA (static) + serverless API functions in `/api` (Node + Prisma + PostgreSQL).
Vercel serves both from one project.

## 1. Get a Postgres database (free options)

Pick one and copy its connection string:

- **Vercel Postgres** — Vercel dashboard → Storage → Create → Postgres (auto-adds `DATABASE_URL`)
- **Neon** — https://neon.tech → new project → copy `postgresql://…?sslmode=require`
- **Supabase** — https://supabase.com → Project → Settings → Database → URI

## 2. Deploy (CLI — fastest)

```bash
npm i -g vercel        # once
cd monkmode
vercel                 # login + link project (follow prompts)
vercel env add DATABASE_URL     # paste your Postgres URL (Production + Preview)
npx prisma migrate deploy       # create tables in that DB  (or: npm run db:push)
vercel --prod          # ship it
```

## 2b. Deploy (GitHub — auto-deploys on push)

```bash
git remote add origin https://github.com/<you>/monkmode.git
git push -u origin main
```
Then on vercel.com → **Add New Project** → import the repo → add `DATABASE_URL` env var → Deploy.
Run `npx prisma migrate deploy` once (locally with the prod `DATABASE_URL`, or via a one-off job).

> `vercel.json` already sets the build (`prisma generate && vite build`), SPA routing,
> and asset caching. The `/api/*` routes are excluded from the SPA rewrite automatically.

## 3. Verify

- `https://<your-app>.vercel.app/` → the app loads (works offline immediately, local-first)
- `https://<your-app>.vercel.app/api/health` → `{ "ok": true }`

## 4. (Optional) Turn on cloud sync

The app runs **local-first** (no backend needed). To sync across devices, the API is ready:

```
GET  /api/state?userId=<id>        → { data, updatedAt }
POST /api/state  { userId, data }  → { ok, updatedAt }
```

`data` is exactly the JSON from **Profile → Export**. Wiring it in is ~30 lines:
push the store on change (debounced), pull on launch, last-write-wins. Say the word and
I'll add a "Sync" toggle in Profile + a `useSync` hook. (Add real auth before multi-user.)

## Local backend dev

```bash
cp .env.example .env     # put your DATABASE_URL
npm run db:push          # create tables
vercel dev               # runs the API + app locally
```
