# Developer guide

## Project map

| Path | Responsibility |
| --- | --- |
| `src/App.jsx` | Draft lifecycle, API calls, publication and dialogs. |
| `src/Editor.jsx` | Uploads, ordering, target placement and step authoring. |
| `src/Player.jsx` | Practice progression, hints, checklist and completion. |
| `src/export.js` | Escaped, self-contained offline HTML player. |
| `src/data.js` | Sample lesson, screenshot preparation and request helper. |
| `src/styles.css` | Shared visual system and responsive layouts. |
| `server.mjs` | Express server, GMI proxy and snapshot persistence. |
| `schema.mjs` | Validated image inputs, target bounds and model output. |
| `public/demo/` | Three screens from the fictional Orbit example. |
| `tests/` | Node validation tests and Playwright journeys. |

## Data model

A walkthrough has a title, learning goal, and 1–12 ordered steps. Each step carries an image, title, instruction, hint, and target `{ x, y, w, h }`. Coordinates are fractions of the full screenshot, with a top-left origin. The target must remain inside the image.

The creator draft is stored under `doppel-draft` in IndexedDB. Published snapshots live in ignored `data/<uuid>.json` files. Publishing creates a new snapshot; it does not mutate an old one. HTML export embeds images and player code into a single file.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Readiness and AI configuration status; no credential values. |
| POST | `/api/analyze` | Suggest steps from a goal and screenshots through GMI. |
| POST | `/api/walkthroughs` | Validate and publish an immutable snapshot. |
| GET | `/api/walkthroughs/:id` | Retrieve a published lesson. |

The server accepts same-origin mutations, bounds request size, validates model output, and permits one active AI analysis at a time. These measures do not replace authentication or per-user authorization for a public service.

## Test locally

```bash
npm ci
npx playwright install chromium
npm test
npm run build
npm start
# In another terminal:
npm run test:e2e
```

The browser suite mocks the external AI response so it runs without billing or a credential. Test a live provider separately with the sample screens; never commit a credential, private screenshot, or published snapshot.

## Deployment boundary

`npm start` serves the built client and API from one process. Keep `data/` persistent if hosting published lessons. An offline HTML lesson can be distributed or statically hosted independently of the creator server. Public creator hosting requires additional authentication, isolation and resource controls.
