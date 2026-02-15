# Budget Tracker

## What This Is
A standalone Progressive Web App (PWA) for daily budget tracking. Built for simple, phone-friendly expense tracking against a daily spending goal. No backend — all data lives in the browser's localStorage.

**Live at:** https://babrock89.github.io/Budget_Tracker/

## Tech Stack
- Plain HTML/CSS/JavaScript (no frameworks)
- Chart.js (CDN) for the 5-week history bar chart
- localStorage for all data persistence
- PWA (service worker + manifest) for offline support and home screen install

## File Structure
- `index.html` — App shell, all sections/modals
- `styles.css` — Mobile-first responsive styles, max-width 480px centered
- `app.js` — Single IIFE containing all logic: data model, CRUD, rendering, event handlers
- `manifest.json` — PWA manifest for install-to-home-screen
- `sw.js` — Service worker (cache-first for local assets, network-first for CDN)
- `icon.svg` — App icon (dollar sign with progress ring)

## Features
1. **Daily goal** — Configurable via settings gear. Progress bar goes green → yellow → red as spending approaches/exceeds goal.
2. **Expense entry** — Amount, category dropdown, optional note. Default categories: Groceries, Dining Out, Gas, Shopping, Entertainment, Health, Bills, Other. Custom categories can be added in settings.
3. **Day navigation** — Browse expenses for any date using arrow buttons.
4. **Weekly view** (tab) — Week total, daily average, weekly goal (daily × 7), category breakdown, daily bar chart with goal line marker.
5. **5-week history** (tab) — Bar chart of weekly spending with dashed goal line, plus detailed cards showing over/under goal per week.
6. **Settings** — Daily goal amount, custom categories, data export/import (JSON), clear all data.
7. **PWA** — Installable to home screen, works offline after first visit.

## Data Model
All data stored under localStorage key `budgetTracker` as JSON:
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

## Hosting
Deployed via GitHub Pages from the `main` branch. Push to `main` triggers automatic redeploy. HTTPS is enforced.

## What Was Done
1. Created the full app from scratch (HTML, CSS, JS) in a single session.
2. Initialized git repo, committed all files, pushed to `origin/main` at `github.com/babrock89/Budget_Tracker`.
3. Enabled GitHub Pages via the GitHub API (`gh api`) to serve from `main` branch root.
