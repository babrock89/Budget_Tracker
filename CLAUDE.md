# Budget Tracker

## What This Is
A Progressive Web App (PWA) for daily budget tracking. Built for simple, phone-friendly expense tracking against a daily spending goal. Uses Firebase Authentication (Google sign-in) and Firestore for cloud data persistence, with localStorage as an offline cache.

**Live at:** https://babrock89.github.io/Budget_Tracker/

## Tech Stack
- Plain HTML/CSS/JavaScript (no frameworks)
- Chart.js (CDN) for the 5-week history bar chart
- Firebase Auth (Google sign-in) for user accounts
- Cloud Firestore for per-user data persistence
- localStorage as fast cache + offline fallback
- PWA (service worker + manifest) for offline support and home screen install

## Firebase Project
- **Project:** `budget-database-79094`
- **Console:** https://console.firebase.google.com/project/budget-database-79094
- **Auth:** Google sign-in enabled
- **Firestore:** Production mode, security rules restrict each user to their own document
- **Firestore structure:** `users/{uid}` → `{ dailyGoal, customCategories, expenses }`

## File Structure
- `index.html` — App shell: login screen, main app sections/modals, Firebase SDK loading
- `styles.css` — Mobile-first responsive styles, max-width 480px centered
- `app.js` — Single IIFE containing all logic: Firebase auth, Firestore read/write, data model, CRUD, rendering, event handlers
- `manifest.json` — PWA manifest for install-to-home-screen
- `sw.js` — Service worker (cache-first for local assets, network-first for CDN)
- `icon.svg` — App icon (dollar sign with progress ring)

## Features
1. **Google sign-in** — Each user gets their own data, synced across devices.
2. **Daily goal** — Configurable via settings gear. Progress bar goes green → yellow → red as spending approaches/exceeds goal.
3. **Expense entry** — Amount, category dropdown, optional note. Default categories: Groceries, Dining Out, Gas, Shopping, Entertainment, Health, Bills, Other. Custom categories can be added in settings.
4. **Day navigation** — Browse expenses for any date using arrow buttons.
5. **Weekly view** (tab) — Week total, daily average, weekly goal (daily × 7), category breakdown, daily bar chart with goal line marker.
6. **5-week history** (tab) — Bar chart of weekly spending with dashed goal line, plus detailed cards showing over/under goal per week.
7. **Settings** — Daily goal amount, custom categories, data export/import (JSON), clear all data.
8. **PWA** — Installable to home screen, works offline after first visit.
9. **Data migration** — First-time sign-in automatically migrates any existing localStorage data to Firestore.

## Data Model
Stored in Firestore at `users/{uid}` and mirrored in localStorage key `budgetTracker`:
```json
{
  "dailyGoal": 50,
  "customCategories": [],
  "expenses": {
    "2026-02-15": [
      { "id": 1234567890, "amount": 12.50, "category": "groceries", "note": "Milk", "time": "ISO string" }
    ]
  }
}
```

## Data Flow
- On sign-in: load from Firestore → populate in-memory `data` → cache to localStorage → render UI
- On save (add/delete expense, change settings): update in-memory → write localStorage immediately → debounced (500ms) write to Firestore
- On offline: localStorage serves as fallback; Firestore SDK queues writes and syncs when back online

## Hosting
Deployed via GitHub Pages from the `main` branch. Push to `main` triggers automatic redeploy. HTTPS is enforced.

## What Was Done
1. Created the full app from scratch (HTML, CSS, JS) in a single session.
2. Initialized git repo, committed all files, pushed to `origin/main` at `github.com/babrock89/Budget_Tracker`.
3. Enabled GitHub Pages via the GitHub API (`gh api`) to serve from `main` branch root.
4. Added Firebase Auth (Google sign-in) and Firestore cloud persistence. Login screen gates the app; each user's data is stored at `users/{uid}` in Firestore. localStorage kept as offline cache with automatic first-login migration.
