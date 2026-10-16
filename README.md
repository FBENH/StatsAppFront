# StatsApp front

Angular app for keeping basketball box scores: you track a game live from your phone (plays, substitutions, game clock) and it saves the result to [ApiStatsApp](https://github.com/FBENH/ApiStatsApp). It also shows per-team and per-player averages.

## Stack

- Angular 22: standalone components, signals, zoneless change detection, strict TypeScript and templates.
- Plain CSS with light and dark themes. No UI library.
- Vitest for unit tests.

## How the live game works

All live-game logic is in `src/app/core/partido-en-vivo.ts`, separate from the screen:

- The clock is based on real time (`Date.now()`), not on counting interval ticks, so it doesn't drift or slow down in a background tab.
- Minutes played are added to the players on court whenever the clock stops or there is a substitution.
- Undo works for several steps (plays, substitutions, score corrections). It never rewinds the clock or minutes played.
- The game in progress is saved to `localStorage` on every change, so reloading the page loses nothing.

Its tests are in `partido-en-vivo.spec.ts` and pass explicit times, so they don't depend on the real clock.

## Running it

Requires Node 22.22 or later, and the API running locally (see its README).

```bash
npm install
npm start          # http://localhost:4200
npm test
npm run build      # output in dist/stats-basket/browser
```

The API URL is in `src/environments/environment.development.ts` (local) and `src/environments/environment.ts` (production build).
