# StatsApp front

Angular app for keeping basketball box scores: you track a game live from your phone (plays, substitutions, game clock) and it saves the result to [ApiStatsApp](https://github.com/FBENH/ApiStatsApp). It also shows per-team and per-player averages.

## Stack

- Angular 22: standalone components, signals, zoneless change detection, strict TypeScript and templates.
- Plain CSS with light and dark themes. No UI library.
- Vitest for unit tests.

## How the live game works

A game is a list of plays (`core/registro.ts`). The box score, minutes played and who is on court are all computed from that list, with the same rules the API uses when the game ends (`Services/Planilla.cs` in ApiStatsApp).

`core/partido-en-vivo.ts` keeps the game in progress:

- The game is created in the API when it starts, and each play is sent as soon as it's entered. Plays carry an id generated on the device, so a retry never duplicates them.
- Without a connection, plays stay in a local queue (saved in `localStorage`) and are sent when the connection comes back. The screen shows whether everything is saved.
- A game can be resumed from another device: it downloads the plays and continues.
- The clock is based on real time (`Date.now()`), so it doesn't drift in a background tab. Each play records the quarter and the time left, which is how minutes are computed.
- Undo removes the last play (a multi-player substitution is undone as a whole), locally and in the API.

Tests in `registro.spec.ts` and `partido-en-vivo.spec.ts` use explicit times and a fake HTTP backend.

## Running it

Requires Node 22.22 or later, and the API running locally (see its README).

```bash
npm install
npm start          # http://localhost:4200
npm test
npm run build      # output in dist/stats-basket/browser
```

The API URL is in `src/environments/environment.development.ts` (local) and `src/environments/environment.ts` (production build).

## Deploy

The demo runs on Cloudflare Pages, connected to this repository:

- Build command: `npm run build`
- Build output directory: `dist/stats-basket/browser`
- Environment variable: `NODE_VERSION=24`

Pages serves `index.html` for any route that isn't a file, so the Angular routes work on reload. The production build calls the API at `https://statsappapi.azurewebsites.net`.
