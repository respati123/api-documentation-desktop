---
name: new-ipc-channel
description: Add an IPC channel end to end - channel name, zod contract, main-process handler, preload function, renderer service, and tests - following references/main-process.md and references/security.md. Use whenever the renderer needs something from the main process (files, storage, HTTP execution, OS features) or main needs to push an event to the renderer.
---

# New IPC channel

Read `references/main-process.md` and `references/security.md` first. Changing an existing contract needs approval (see "Ask first" in `AGENTS.md`).

## 0. One-time setup

Skip a file that already exists.

```ts
// src/shared/ipc/result.ts
export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string } }
```

```ts
// src/shared/ipc/channels.ts
export const CHANNELS = {} as const
```

```ts
// src/main/ipc/trusted-sender.ts
import type { IpcMainInvokeEvent } from 'electron'

// Throws on purpose: an untrusted sender is an attack, not a user error.
export const assertTrustedSender = (event: IpcMainInvokeEvent): void => {
  const url = event.senderFrame?.url ?? ''
  const devUrl = process.env.ELECTRON_RENDERER_URL
  const isTrusted = url.startsWith('file://') || (devUrl !== undefined && url.startsWith(devUrl))
  if (!isTrusted) throw new Error('Untrusted IPC sender')
}
```

```ts
// src/main/ipc/to-ipc-error.ts
import type { IpcResult } from '@shared/ipc/result'

export const toIpcError = (error: unknown): Extract<IpcResult<never>, { ok: false }>['error'] =>
  error instanceof Error ? { message: error.message } : { message: 'Unexpected error' }
```

## 1. Name the channel

`<domain>:<action>`, lowercase, English. Domains match the feature areas: `workspace`, `collection`, `request`, `http`, `variables`, `docs`, `sync`, `settings`.

```ts
// src/shared/ipc/channels.ts
export const CHANNELS = {
  collection: {
    save: 'collection:save',
  },
} as const
```

## 2. Write the contract

```ts
// src/shared/ipc/collection.contract.ts
import { z } from 'zod'

export const saveCollectionInput = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(200),
})
export const saveCollectionOutput = z.object({ savedAt: z.string() })

export type SaveCollectionInput = z.infer<typeof saveCollectionInput>
export type SaveCollectionOutput = z.infer<typeof saveCollectionOutput>
```

- Bound every string and array (`max`). Never `z.any()`.
- File paths are not accepted as input. The main process asks the user with a dialog, or derives the path from ids.

## 3. Test the handler first

```ts
// src/main/ipc/collection.ipc.test.ts
describe('collection:save', () => {
  it('rejects invalid input', async () => {
    const result = await invoke(CHANNELS.collection.save, { workspaceId: '' })
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: 'INVALID_INPUT' }) })
  })
  it('returns data on success', async () => { /* mock the service, expect { ok: true } */ })
  it('returns the service error message on failure', async () => { /* mock a throw, expect { ok: false } */ })
})
```

Mock `electron` so `ipcMain.handle` stores the handler, and `invoke` calls it with a trusted fake event. Run the test and see it fail.

## 4. Write the handler

```ts
// src/main/ipc/collection.ipc.ts
export const registerCollectionIpc = (): void => {
  ipcMain.handle(CHANNELS.collection.save, async (event, raw): Promise<IpcResult<SaveCollectionOutput>> => {
    assertTrustedSender(event)
    const input = saveCollectionInput.safeParse(raw)
    if (!input.success) return { ok: false, error: { message: 'Invalid input', code: 'INVALID_INPUT' } }
    try {
      return { ok: true, data: await collectionStore.save(input.data) }
    } catch (error) {
      log.error('collection:save failed', { workspaceId: input.data.workspaceId, error })
      return { ok: false, error: toIpcError(error) }
    }
  })
}
```

- Logic lives in `src/main/services/` or `src/main/storage/`, not in the handler.
- Register the module in `src/main/ipc/register.ts`.
- Never log the payload if it can contain secrets or request bodies.

## 5. Expose it in preload

```ts
// src/preload/api.ts
collection: {
  save: (input: SaveCollectionInput): Promise<IpcResult<SaveCollectionOutput>> =>
    ipcRenderer.invoke(CHANNELS.collection.save, input),
},
```

For a push event from main:

```ts
onSyncProgress: (listener: (progress: SyncProgress) => void): (() => void) => {
  const handler = (_event: IpcRendererEvent, progress: SyncProgress): void => listener(progress)
  ipcRenderer.on(CHANNELS.sync.progress, handler)
  return () => ipcRenderer.removeListener(CHANNELS.sync.progress, handler)
},
```

## 6. Call it from a renderer service

```ts
// features/collection/services/collection.service.ts
export const collectionService = {
  save: async (input: SaveCollectionInput): Promise<SaveCollectionOutput> => {
    const result = await window.apiDesktop.collection.save(input)
    if (!result.ok) throw new Error(result.error.message)
    return saveCollectionOutput.parse(result.data)
  },
}
```

Only services call `window.apiDesktop`. ViewModels use the service through TanStack Query (`references/data-and-state.md`). A push event is subscribed in a ViewModel `useEffect` that returns the unsubscribe function.

## 7. Finish

Run the `finish-change` skill. `src/main/security-rules.test.ts` checks literal channels, `sendSync`, input parsing, the sender check, and a leaked `ipcRenderer`.
