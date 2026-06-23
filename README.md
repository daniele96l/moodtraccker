# Mood Tracker

A minimalist mood, habit, journal, and meditation tracker with a scrollable pastel calendar. All data is stored locally in your browser as JSON.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000, set a PIN, and start tracking.

## Storage

Data lives in `localStorage` under the key `moodtracker_data` as JSON:

- `day_entries` — mood scores and journal text per day
- `habits` / `habit_logs` — habits, vices, and daily check-offs
- `meditation_sessions` — completed meditation sessions

Your PIN hash is stored separately in `localStorage`. Resetting the PIN also clears all tracker data.

## Features

- Infinite-scroll month calendar with mood-colored cells
- Day sheet: mood slider, journal, habits/vices, meditation timer
- Local PIN gate
