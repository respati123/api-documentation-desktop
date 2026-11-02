# Security

Read this before you change window creation, preload, IPC, external links, file access, or anything that stores credentials.

The renderer is untrusted. It displays data from the cloud API, imported collections, and HTTP responses the user sends. Treat everything that crosses from the renderer to the main process as hostile input.

## BrowserWindow

Every window is created with:

```ts
webPreferences: {
  preload: join(__dirname, '../preload/index.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true,
  allowRunningInsecureContent: false,
  webviewTag: false,
}
```

- Never turn any of these off. Ask first if a feature seems to need it.
- Never load a remote URL in an app window. Windows load only the bundled renderer (or the dev server in `bun run dev`).
- Block navigation away from the app: handle `will-navigate` and call `event.preventDefault()` for any other origin.
- Deny new windows with `setWindowOpenHandler(() => ({ action: 'deny' }))`. Open allowed links with `shell.openExternal` instead.
- Deny all permission requests (`session.setPermissionRequestHandler`) unless a feature needs one. Allow it by name.

## Content Security Policy

`src/renderer/index.html` sets a strict CSP:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' <cloud API origin>;
```

- No `unsafe-eval`. No remote scripts.
- Requests the user sends from the API client run in the main process, not through renderer `fetch`, so `connect-src` stays narrow.

## Preload

- Expose one object, `window.apiDesktop`, with `contextBridge.exposeInMainWorld`.
- Expose named functions only. Never expose `ipcRenderer`, `require`, `process`, or a generic `invoke(channel, ...)`.
- Each function calls exactly one channel. See `main-process.md`.

## IPC input

- Every handler parses its payload with a zod schema before using it. Invalid input throws.
- Check the sender: `event.senderFrame.url` must be the app's own origin.
- Never pass renderer input to `exec`, `spawn`, `eval`, `new Function`, or a shell string.
- File paths from the renderer are resolved and checked against the allowed directories. Reject anything outside them, including `..` tricks and symlinks out of the folder.
- The user picks files through `dialog.showOpenDialog` / `showSaveDialog` in the main process. The renderer never sends an arbitrary path to read or write.

## External links

- `shell.openExternal` only for `https:` and `mailto:` URLs, parsed with `new URL()`.
- Never open `file:`, `javascript:`, or custom protocols from data the user did not type.
- Links inside imported docs, OpenAPI descriptions, or responses always go through this check.

## Rendering untrusted content

- Never use `dangerouslySetInnerHTML` with data from the API, imports, or responses. Render Markdown with a sanitizing renderer.
- HTML responses are shown as text, or in a preview with scripts disabled and no Node access.
- Large or binary responses are not rendered as text.

## Secrets

- Auth tokens, API keys, and saved credentials are encrypted with `safeStorage` in the main process.
- Never store secrets in `localStorage`, `sessionStorage`, IndexedDB, plain JSON files, or logs.
- The renderer never receives a raw refresh token. It asks the main process to make authenticated calls, or receives a short-lived access token only.
- Secret variables (marked secret in a workspace or environment) are masked in the UI and excluded from sync, export, and logs unless the user opts in.
- `.env` files are not committed. `.env.example` lists the names only.

## Dependencies

- Ask before adding a dependency. Prefer packages that are maintained and widely used.
- Keep Electron on a supported version. Security updates to Electron are applied promptly.
- Run `bun audit` (or the project's audit script) after changing dependencies.

## Checklist

1. `webPreferences` unchanged.
2. New IPC handlers validate input with zod and check the sender.
3. No new path, shell, or URL built from renderer data without validation.
4. No secret in renderer storage or logs.
5. No `dangerouslySetInnerHTML` with untrusted data.
