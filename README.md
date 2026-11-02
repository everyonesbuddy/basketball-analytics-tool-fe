# Personal OS (Frontend)

A personal dashboard for guidance and decisions: goals and the daily schedule first, with gifting, style, events, travel and money widgets to come. The original basketball analytics tool lives on under **Sports**.

## Widgets

| Widget | Status |
| --- | --- |
| Today | Built: the block you're in, its goal and mode and why, what needs a decision, the full day, your six goals, a quote |
| Goals & schedule | Built: one goal per category, obstacle classification, tool check, session logging, end of window (completed, expand, roll over) |
| Weekly review | Built: sessions and % this week, the ceiling check and a next action per goal |
| Framework | Built: the cheat sheet, printable |
| Sports | Built: the existing analytics tools, unchanged |
| Gifting, Style, Events & concerts, Travel, Money | Coming next |

## Setup

- The API is the same backend (`/api/os`), which needs `MONGODB_URI` and `JWT_SECRET` set. See the backend README.
- Sign-in uses the login made with the backend's `scripts/create-user.js`.
- `public/_redirects` sends every path to the app, so links like `/goals` work on Netlify.
- Code for the OS is in `src/os/`; the sports code is unchanged in `src/components/`.

---

# Basketball Analytics Tool (Frontend)

React + TypeScript + Vite frontend for player and team analytics powered by the backend ESPN aggregation service.

## What This App Does

- Loads single-player profiles and summary splits.
- Compares two players split-to-split (regular vs regular, postseason vs postseason, career vs career).
- Shows player impact trends (plus-minus and game context).
- Shows team efficiency trends (off/def/net ratings and game context).
- Shows player value comps (similarity-ranked peers).
- Shows player trajectory/development curve (rolling points and rolling TS%).
- Shows team need-gap analysis (league-average deltas, strengths, and gaps).
- Uses backend-driven player/team selectors (no hardcoded option list).

## Demo Video

- https://www.loom.com/share/97bfd45b2bc942fe89676ffb9742ad9f

## Current Architecture

The UI is now split into focused portal components:

- `src/components/Dashboard.tsx`: top-level shell, navigation, shared state, data fetch orchestration.
- `src/components/features/ProfilePortal.tsx`: single player report flow.
- `src/components/features/ComparePortal.tsx`: head-to-head compare flow.
- `src/components/features/ImpactPortal.tsx`: player impact flow.
- `src/components/features/TeamPortal.tsx`: team efficiency flow.
- `src/components/common/SearchableEntitySelect.tsx`: reusable searchable selector.
- `src/components/dashboard/DashboardCards.tsx`: charts/tables/cards used across features.
- `src/utils/dashboardApi.ts`: API client + payload normalization.
- `src/utils/dashboardFormatters.ts`: formatting, split parsing, metrics extraction.
- `src/utils/dashboardTypes.ts`: frontend data contracts.

## Backend Contract (Expected Endpoints)

Base URL is automatically selected in the frontend API client:

- Localhost (`localhost`, `127.0.0.1`, `::1`) -> `http://localhost:5000/api`
- Any live host -> `https://basketball-analytics-tool-be-780d720c8c7d.herokuapp.com/api`

- `GET /health`
- `GET /players/:athleteId`
- `GET /players/:athleteId/impact`
- `GET /players/:athleteId/comps`
- `GET /players/:athleteId/trajectory`
- `GET /players/compare/head-to-head`
- `GET /players/all` and/or `GET /players/options`
- `GET /teams`
- `GET /teams/:teamId/efficiency`
- `GET /teams/:teamId/needs`

### Team Efficiency Params

- `games` (number)
- `forceRefresh` (boolean)
- `seasonType` (`regular` | `postseason` | `all`)

### New Feature Params

- Player comps: `limit`, `sampleSize`, `forceRefresh`
- Player trajectory: `games`, `window`, `forceRefresh`
- Team needs: `games`, `seasonType`, `forceRefresh`

## Season Tagging (Now Supported)

The frontend now surfaces season metadata where available:

- Per-row tags like `2026 Regular Season` / `2026 Postseason` in impact and efficiency tables.
- Coverage metadata in subtitles/chips using backend fields such as:
  - `seasonsCovered`
  - `seasonTypesCovered`
  - `seasonTypeRequested`
- Year-aware split labels in single-player and compare contexts when metadata is present.

## Search + UX Notes

- Team selector uses backend search (`/teams?query=...`) with debounce.
- Team search input focus behavior was stabilized (no blur on each keystroke).
- Selected Team ID is shown in the Team Efficiency form for transparency.

## Development

Install and run:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Current Status

- Core profile/compare/impact/team workflows are implemented and working.
- Profile workflow now also hydrates comps + trajectory from backend in the same load action.
- Team workflow now hydrates efficiency + need-gap analysis from backend in the same load action.
- Season type controls are integrated for team efficiency.
- Season/year tagging is integrated across major analytics tables and labels.

## Install as an app (PWA)

- `public/manifest.webmanifest`, `public/icons/` and `public/sw.js` make it installable with its own icon, full screen, and push notifications. `public/_headers` keeps the worker and manifest fresh on Netlify.
- iPhone: open the site in Safari → Share → Add to Home Screen, then open it from the home screen and go to Settings → Turn on notifications (iOS 16.4+). Android: Chrome → Install app.
- Notification types, quiet hours and the daily cap are in Settings. The backend needs the VAPID keys (see the backend README).

## Backend address

`VITE_API_URL` (Netlify → Site configuration → Environment variables), e.g. `https://your-app.herokuapp.com/api`, sets where the API lives. Without it, the current Heroku app is used.
