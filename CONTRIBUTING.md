# Contributing

Doppel is an early MVP. Focused improvements to lesson authoring, accessibility, playback, and export are welcome.

1. Create a branch from `main` and install with `npm ci`.
2. Run the app with `npm run dev`. The sample works without an API credential.
3. Keep changes focused and explain the user-visible behavior in your pull request.
4. Run `npm test` and `npm run build`. For interaction changes, run the app and `npm run test:e2e`.
5. Include a screenshot for visual changes and describe any known limitations.

Use normalized target coordinates so lessons remain responsive. Preserve the standalone export's offline behavior. Keep credentials in ignored `.env.local` files and use synthetic screenshots in tests.

See [the developer guide](docs/DEVELOPMENT.md) for the code map and API.
