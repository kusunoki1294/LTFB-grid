# LTFB Grid

A 3x3 Immaculate Grid-style game built with Next.js and TypeScript.

It loads player data from these public Google Sheet tabs:

- `External`
- `Stats`
- `Advanced Stats`

It does not use the `Draft` tab.

It also avoids draft-style category logic such as team captains, win-rate categories, or round-based categories.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open `http://localhost:3000`

## Optional environment variable

The app defaults to the provided spreadsheet ID, but you can override it:

```bash
GOOGLE_SHEET_ID=your_sheet_id_here
```

## Main files

- `app/page.tsx`
  Loads the Google Sheet data server-side and renders the game.
- `app/api/game-data/route.ts`
  JSON endpoint for the normalized data.
- `components/GameClient.tsx`
  Main client game state and interaction flow.
- `components/GameHeader.tsx`
  Header, counters, buttons, and status messages.
- `components/Grid.tsx`
  3x3 board layout with row and column categories.
- `components/Cell.tsx`
  Individual answer cell UI.
- `components/PlayerSearch.tsx`
  Search modal with simple autocomplete.
- `components/DebugPanel.tsx`
  Debug counts and current category list.
- `lib/googleSheets.ts`
  Fetches the Google Sheet CSV exports.
- `lib/csv.ts`
  Lightweight CSV parser utilities.
- `lib/normalizeData.ts`
  Normalizes player names and merges sheet data into reusable structures.
- `lib/categories.ts`
  Flexible category engine built from real `Stats` and `Advanced Stats` fields.
- `lib/gridGenerator.ts`
  Random grid generation plus solvability checks.
- `lib/checkAnswer.ts`
  Validates player answers against both category tests and duplicate rules.

## If Google Sheet loading fails

The app will show:

> Could not load Google Sheet data. Make sure the sheet is shared publicly or published to the web.

To fix that in Google Sheets:

1. Open the sheet.
2. Click `Share`.
3. Set access so anyone with the link can view it.

If that still fails, you can also publish it:

1. Open `File` -> `Share` -> `Publish to web`.
2. Publish the relevant sheet.

The CSV export format used by the app is:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/gviz/tq?tqx=out:csv&sheet=SHEET_NAME
```

## Notes

- Player names are normalized by trimming spaces, ignoring case, collapsing extra spaces, and removing trailing asterisks.
- Duplicate player usage is blocked.
- Random grids are only accepted if every square has at least one valid answer and the full board has a unique-player solution path.
- The current category pool is intentionally easy to expand by editing `lib/categories.ts`.
