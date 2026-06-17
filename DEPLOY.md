# Deploying MonkMode to Vercel

MonkMode is a Vite PWA with a **Firebase** backend (Auth + Cloud Firestore).
There's no server to run — Vercel hosts the static app, Firebase handles login + data.

## 1. Set up Firebase (once)

Follow **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** — create a project, enable
Email/Password (and Google) auth, create Firestore, paste the publish rules, and
copy your 6 `VITE_FIREBASE_*` keys.

> Without these keys the app still runs in **local-only mode** (no login, data in the
> browser). Add them to turn on login + cross-device sync.

## 2. Deploy to Vercel

### Option A — GitHub import (recommended)
1. Push is already done → repo: `https://github.com/raysanjeev19/monkmode`
2. On **vercel.com → Add New → Project**, import `raysanjeev19/monkmode`.
3. Framework preset: **Vite** (auto-detected; `vercel.json` already configures it).
4. **Environment Variables** → add the 6 keys from step 1:
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```
5. **Deploy.**

### Option B — CLI
```bash
npm i -g vercel
cd monkmode
vercel                       # login + link to sanjeev-rays-projects
# add each env var:
vercel env add VITE_FIREBASE_API_KEY
# … repeat for the other 5 …
vercel --prod
```

## 3. After deploy — authorize the domain
Firebase Console → **Authentication → Settings → Authorized domains** → add your
`*.vercel.app` domain (and any custom domain) so login works in production.

## 4. Verify
- `https://<app>.vercel.app/` loads (works offline, installable).
- Sign up → data appears in Firestore (`userState/{uid}`).
- Open on a second device, log in → same data syncs in real time.

## Local dev
```bash
cp .env.example .env     # paste your Firebase keys
npm run dev
npm test                 # 15 unit tests
```
