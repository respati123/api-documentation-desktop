# API Documentation (desktop)

Electron desktop app for editing local API collections, sending requests, documenting endpoints, and syncing workspaces with the cloud portal.

## Setup

```
npm ci
cp .env.example .env
npm run dev
```

`VITE_API_URL` points to the cloud API and `VITE_CLOUD_URL` to the web portal. Both are baked into builds, so set the production URLs before creating installers.

## Scripts

- `npm run dev`: run the desktop app in development mode.
- `npm run build`: build the Electron bundles into `out/`.
- `npm run typecheck`: check the main, preload, and renderer code.
- `npm run dist:linux`, `dist:mac`, `dist:win`: create installers in `release/`.

## Releases

Every push to `main` runs the release workflow. It bumps the patch version, creates the `vX.Y.Z` tag, builds installers for Linux, macOS, and Windows, and attaches them to a draft GitHub release. Publish the draft manually when it is ready. Run the "Release desktop app" workflow manually to choose a minor or major bump.

The app checks this repository's releases for updates. Only published releases that are not pre-releases are offered.
