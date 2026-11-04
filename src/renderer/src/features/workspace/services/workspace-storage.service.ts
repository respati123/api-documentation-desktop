import { z } from 'zod'
import { localCommitSchema, localWorkspaceSchema } from '@/features/workspace/models/local-workspace.model'

// The only renderer code that reads or writes workspaces and commits, through the main process.
export const workspaceStorageService = {
  loadWorkspace: async (legacyTree: unknown[]): Promise<LocalWorkspace> =>
    localWorkspaceSchema.parse(await window.apiDesktop.loadWorkspace(legacyTree)),

  listWorkspaces: async (): Promise<LocalWorkspace[]> => z.array(localWorkspaceSchema).parse(await window.apiDesktop.listWorkspaces()),

  // A refused save (the row changed outside the app) resolves to false. overwrite keeps this version, after the user chose it.
  saveWorkspace: async (workspace: LocalWorkspace, options?: { overwrite: boolean }): Promise<boolean> =>
    window.apiDesktop.saveWorkspace(workspace, options),

  // Removes a cloud copy that the cloud no longer lists for this account. The local vault is never removed.
  removeWorkspace: async (workspaceId: string): Promise<boolean> => z.boolean().parse(await window.apiDesktop.removeWorkspace(workspaceId)),

  secureStorageAvailable: async (): Promise<boolean> => z.boolean().parse(await window.apiDesktop.secureStorageAvailable()),

  saveCommit: async (workspaceId: string, commit: LocalCommit): Promise<void> => {
    await window.apiDesktop.saveCommit(workspaceId, commit)
  },

  listCommits: async (workspaceId: string): Promise<LocalCommit[]> =>
    z.array(localCommitSchema).parse(await window.apiDesktop.listCommits(workspaceId)),

  onExternalChange: (handler: () => void): (() => void) => window.apiDesktop.onExternalWorkspaceChange(handler),

  onConflict: (handler: (workspaceId: string) => void): (() => void) => window.apiDesktop.onWorkspaceConflict(handler),

  setActiveAccount: async (userId: string | null): Promise<void> => {
    await window.apiDesktop.setActiveAccount(userId)
  },
}
