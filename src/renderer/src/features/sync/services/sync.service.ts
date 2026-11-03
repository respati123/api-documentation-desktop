import { z } from 'zod'
import {
  type CloudCommitDetailRecord,
  type CloudCommitRecord,
  cloudCommitDetailResponseSchema,
  cloudCommitSchema,
} from '@/features/sync/models/cloud-history.model'
import {
  type BranchPullRecord,
  branchCreateResponseSchema,
  branchListResponseSchema,
  branchPullResponseSchema,
  branchPushResponseSchema,
  type CollectionBranch,
} from '@/features/sync/models/collection-branch.model'
import { apiCall, apiListAll } from '@/lib/api'

const eventsTicketSchema = z.object({ ticket: z.string() })

const pushResponseSchema = z.object({ headCommitId: z.string() })
const pullResponseSchema = z.object({
  workspace: z.object({ headCommitId: z.string(), tree: z.array(z.unknown()).optional(), variables: z.unknown().optional() }),
})

// Sends unpushed commits to the cloud. Returns the new head.
export const syncService = {
  // A one-time ticket that opens the workspace event socket, so the session token is not sent in the URL.
  eventsTicket: async (token: string): Promise<string> => {
    const data = await apiCall('/api/sync/events-ticket', { token, method: 'POST' }, eventsTicketSchema)
    return data.ticket
  },

  // Fetches the cloud version of a workspace: its head, its tree, and its shared variables.
  pull: async (input: { token: string; cloudId: string }): Promise<{ headCommitId: string; tree: unknown[]; variables: unknown }> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/sync/pull`, { token: input.token })
    const { workspace } = pullResponseSchema.parse(data)
    return { headCommitId: workspace.headCommitId, tree: workspace.tree ?? [], variables: workspace.variables }
  },

  // Lists the cloud commits of a workspace across every page.
  listHistory: async (input: { token: string; cloudId: string }): Promise<CloudCommitRecord[]> => {
    return apiListAll(`/api/workspaces/${input.cloudId}/sync/history`, 'commits', { token: input.token }, cloudCommitSchema)
  },

  // Fetches one cloud commit with its tree and variables.
  getCommit: async (input: { token: string; cloudId: string; commitId: string }): Promise<CloudCommitDetailRecord> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/sync/history/${input.commitId}`, { token: input.token })
    return cloudCommitDetailResponseSchema.parse(data).commit
  },

  push: async (input: { token: string; cloudId: string; commits: LocalCommit[] }): Promise<string> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/sync/push`, {
      token: input.token,
      method: 'POST',
      body: { commits: input.commits },
    })
    return pushResponseSchema.parse(data).headCommitId
  },

  // The branches of a workspace. Each collection has a main branch, and its own branches made from it.
  listBranches: async (input: { token: string; cloudId: string }): Promise<CollectionBranch[]> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/branches`, { token: input.token })
    return branchListResponseSchema.parse(data).branches
  },

  // A new branch of one collection, made from its main branch or from another branch of the same collection.
  createBranch: async (input: {
    token: string
    cloudId: string
    collectionKey: string
    name: string
    fromBranchId?: string
  }): Promise<CollectionBranch> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/branches`, {
      token: input.token,
      method: 'POST',
      body: { collectionKey: input.collectionKey, name: input.name, fromBranchId: input.fromBranchId ?? null },
    })
    return branchCreateResponseSchema.parse(data).branch
  },

  // The collection at a branch head.
  pullBranch: async (input: { token: string; cloudId: string; branchId: string }): Promise<BranchPullRecord> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/branches/${input.branchId}/pull`, { token: input.token })
    return branchPullResponseSchema.parse(data)
  },

  // Sends commits of one collection to its branch. Each commit holds only that collection's node.
  pushBranch: async (input: {
    token: string
    cloudId: string
    branchId: string
    commits: Array<{ id: string; parentIds: string[]; message: string; tree: unknown[] }>
  }): Promise<string | null> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/branches/${input.branchId}/push`, {
      token: input.token,
      method: 'POST',
      body: { commits: input.commits },
    })
    return branchPushResponseSchema.parse(data).headCommitId
  },

  // The commits of one branch, newest first, across every page.
  listBranchHistory: async (input: { token: string; cloudId: string; branchId: string }): Promise<CloudCommitRecord[]> => {
    return apiListAll(
      `/api/workspaces/${input.cloudId}/branches/${input.branchId}/history`,
      'commits',
      { token: input.token },
      cloudCommitSchema,
    )
  },

  // Makes a new cloud head whose content is the content of an earlier commit. The history itself is kept.
  restore: async (input: { token: string; cloudId: string; commitId: string }): Promise<string> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/sync/restore/${input.commitId}`, { token: input.token, method: 'POST' })
    return pushResponseSchema.parse(data).headCommitId
  },
}
