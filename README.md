# Timely — Minimal Firebase Time Tracker

Minimal time tracking web app for tracking **multiple projects and multiple tasks concurrently** with **Daily, Weekly (Mon–Sun), Monthly, and Custom** summaries, powered by **Firebase Auth (Google Sign-In only)** and **Cloud Firestore**.

## Local Emulator Development

`.env.local` is pre-configured with `VITE_USE_EMULATORS=true` and linked to your Firebase project (`timely-e5f86`).

1. Start the local Firebase Emulators (uses `firebase.local.json` + `firestore.local.rules`):
   ```powershell
   npm run emulators
   ```
   - Auth Emulator: `http://127.0.0.1:9099`
   - Firestore Emulator: `http://127.0.0.1:8080`
   - Emulator UI: `http://127.0.0.1:4000`

2. In a second terminal, start the web app:
   ```powershell
   npm run dev
   ```
   Open `http://localhost:5173` and click **Continue with Google** (the Auth Emulator opens a local Google account picker).

## Local vs. Remote Firestore Security Rules

| Environment | Config | Rules | Command |
|---|---|---|---|
| **Local Emulators** | `firebase.local.json` | `firestore.local.rules` | `npm run emulators` |
| **Test Strict Rules Locally** | `firebase.json` | `firestore.rules` | `npm run emulators:strict` |
| **Remote Production** | `firebase.json` | `firestore.rules` | `npm run deploy:rules` |

`firebase deploy` always uses `firebase.json` → `firestore.rules` (strict default-deny, verified Google Sign-In required, per-user `uid` isolation, and full field/type/length/timestamp validation).

To point the app at your remote Firebase project instead of local emulators, set `VITE_USE_EMULATORS=false` in `.env.local`.

## Scripts

- `npm run dev` — Start Vite dev server
- `npm run lint` — ESLint (enforces strict TypeScript with zero `any`)
- `npm test` — Run Vitest unit tests
- `npm run build` — Type-check (`tsc --noEmit`) and build for production
- `npm run emulators` — Start Auth + Firestore + UI emulators with local rules
- `npm run emulators:strict` — Start emulators with strict production rules
- `npm run deploy:rules` — Deploy `firestore.rules` and `firestore.indexes.json` to remote Firebase
