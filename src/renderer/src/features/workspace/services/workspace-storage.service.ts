import { z } from 'zod'
import { localCommitSchema, localWorkspaceSchema } from '@/features/workspace/models/local-workspace.model'

// The only renderer code that reads or writes workspaces and commits, through the main process.
export const workspaceStorageService = {
  loadWorkspace: async (legacyTree: unknown[]): Promise<LocalWorkspace> =>
    localWorkspaceSchema.parse(await window.apiDesktop.loadWorkspace(legacyTree)),

  listWorkspaces: async (): Promise<LocalWorkspace[]> => z.array(localWorkspaceSchema).parse(await window.apiDesktop.listWorkspaces()),

  saveWorkspace: async (workspace: LocalWorkspace): Promise<void> => {
    await window.apiDesktop.saveWorkspace(workspace)
  },

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
