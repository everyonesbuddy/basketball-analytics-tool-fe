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
