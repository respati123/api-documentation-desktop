# Release

Read this when you change the version, build or installer config, auto-update, signing, or prepare a release.
Ask first before you change any release config.

## Versioning

- Semantic versioning in `package.json`: `MAJOR.MINOR.PATCH`.
  - PATCH: bug fixes only.
  - MINOR: new features, backward compatible.
  - MAJOR: breaking changes to stored data, sync, or the cloud API contract.
- Pre-releases use `-beta.N`, for example `1.4.0-beta.2`, and go to the beta channel only.
- The version is bumped in its own commit: `chore(release): v1.4.0`.
- Tag the release commit `v1.4.0`.

## Changelog

- `CHANGELOG.md` at this folder's root, newest first.
- Sections per version: Added, Changed, Fixed, Security.
- Write entries for users, not developers: what changed for them.
- Generate a draft from Conventional Commits, then edit it by hand.

## Build and installers

- `bun run dist:linux`, `dist:mac`, `dist:win` build installers with the config in `electron-builder.yml` (or the project's builder config).
- Always run from a clean checkout of the tag.
- `appId`, product name, and file associations never change after the first public release. Changing them breaks updates and user data paths.
- Do not bundle dev dependencies, source maps for production, `.env` files, or test fixtures.

## Code signing

- macOS: sign with a Developer ID certificate and notarize. Hardened runtime on. Entitlements are minimal and listed in `build/entitlements.mac.plist`.
- Windows: sign the installer and the app executable.
- Certificates and passwords come from CI secrets only. Never commit them or print them in logs.
- An unsigned build is for local testing only. Never publish it.

## Auto-update

- Use `electron-updater` with the provider set in the builder config.
- Update checks run in the main process, after the window is shown, and never block startup.
- Downloads happen in the background. The user chooses when to restart. Never force a restart while a request or sync is running.
- Update feed URLs are HTTPS only. Signature verification stays on.
- Channels: `latest` for stable, `beta` for pre-releases. The user picks the channel in settings.
- Update status and errors go to the log and to a quiet in-app notice. Text comes from i18n.

## Data compatibility

- A new version must open data written by every older released version. Storage migrations run at startup (see `main-process.md`).
- A downgrade must not corrupt data. If the stored `version` is newer than the app knows, show a message and open read-only, or refuse to open. Never overwrite it.
- Sync format changes are coordinated with the cloud API and released together.

## Release checklist

1. All handoff checks in `AGENTS.md` pass on the release commit.
2. Version bumped and `CHANGELOG.md` updated.
3. Storage migrations tested from the last two released versions.
4. Installers built and signed for every platform.
5. Smoke test on each platform: install, launch, sign in, open a workspace, send a request, sync.
6. Update tested from the previous release to this one.
7. Tag pushed and release notes published from the changelog.
