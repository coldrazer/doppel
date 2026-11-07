# Doppel

**Stop sending tutorials. Send a practice run.**

Doppel turns screenshots into interactive, shareable product lessons. Learners click through a safe simulation, get hints when they miss, and finish with a completed practice run. Includes an Orbit expense onboarding example.

## Run

Node.js 22.12+ is required (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open http://localhost:5173. For a production build:

```sh
npm run build
npm start
```

The server reads `.env.local` automatically. `GMI_API_KEY` is server-only; it is never sent to the browser or embedded in exported lessons. `GMI_MODEL` optionally selects a model; the verified default is `google/gemini-3.8-flash`. The configured local credential is intentionally not committed. Without credentials, manual editing, preview, publishing, and exports still work; AI generation returns an explicit configuration error.

## Use it

1. Explore the sample, or choose **New walkthrough** and upload 1–12 PNG, JPG, or WebP screenshots in workflow order.
2. Give your walkthrough a title and learning goal. **Generate with AI** sends screenshots to GMI Cloud and proposes one action and target for each screen.
3. Review each suggestion. Edit instructions and hints; click **Click here to place a target**, then click its new location. Set width and height, reorder screens, or remove steps.
4. **Preview** the learner experience. Wrong clicks reveal a hint; correct clicks advance the lesson. The final action completes the lesson.
5. **Publish** creates an immutable snapshot and a learner URL. **Export HTML** downloads a self-contained lesson that works offline, including screenshots.

Drafts are saved in this browser's IndexedDB. Publishing stores JSON snapshots under `data/`. Local completion timestamps are recorded per published lesson; they are not cross-device analytics.

## Sharing and scope

The app binds to `127.0.0.1` by default. Localhost links work on this machine, not on arbitrary recipients' machines. HTML exports can be shared as files or hosted on a static server. Published URLs work while the corresponding server and `data/` directory are available.

This MVP is a single-user creator workspace, not a public multi-tenant service. Before exposing the creator/API server publicly, add authentication, per-user authorization, request quotas, HTTPS, and durable storage. The learner uses clickable screenshot targets, not real input fields or a cloned application backend. AI targets are suggestions that creators must review.

## Verification

```sh
npm test
npm run build
# With the app running:
npm run test:e2e
```

The browser suite covers upload/edit/reorder/persistence/publish, learner hints/completion/restart, offline HTML export and escaping, AI success/error UI, mobile overflow, and API validation. Provider calls are mocked in CI; a separate live GMI check was performed locally. See [QA notes](docs/QA.md).

Hackathon prize eligibility also requires Wren results. No Wren integration is available in this environment. [Two Wren journeys](docs/WREN.md) are ready to run against the final build; Playwright results do not substitute for Wren results.

## Architecture

- React + Vite: editor, learner, local draft persistence, HTML export.
- Express: GMI vision proxy, strict schema validation, immutable publication storage.
- Zod: accepts only supported image data and bounded normalized target coordinates.
- Playwright + Node test runner: functional and validation coverage.

GMI API reference: https://docs.gmicloud.ai/inference-engine/api-reference/llm-api-reference
