import { beforeEach, describe, expect, it, vi } from 'vitest'
import { workspaceStorageService } from '@/features/workspace/services/workspace-storage.service'

const apiDesktop = {
  loadWorkspace: vi.fn(),
  listWorkspaces: vi.fn(),
  saveWorkspace: vi.fn(),
  secureStorageAvailable: vi.fn(),
  saveCommit: vi.fn(),
  listCommits: vi.fn(),
  onExternalWorkspaceChange: vi.fn(),
}

const stored = {
  id: 'local-default',
  cloudId: null,
  name: 'Local workspace',
  tree: [],
  baseTree: [],
  baseCommitId: null,
  localHeadId: null,
}

describe('workspaceStorageService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    Object.defineProperty(window, 'apiDesktop', { value: apiDesktop, configurable: true })
  })

  it('loads a workspace saved before environments had a secret flag', async () => {
    apiDesktop.loadWorkspace.mockResolvedValue({
      ...stored,
      variables: { globals: [{ id: 'g', name: 'host', value: 'x' }], environments: [] },
    })
    const workspace = await workspaceStorageService.loadWorkspace([])
    expect(workspace.variables?.globals).toEqual([expect.objectContaining({ name: 'host', value: 'x' })])
  })

  it('loads a workspace with no variables at all', async () => {
    apiDesktop.loadWorkspace.mockResolvedValue(stored)
    const workspace = await workspaceStorageService.loadWorkspace([])
    expect(workspace.variables).toBeUndefined()
  })

  it('reads a workspace with no cloud id as a local one', async () => {
    const { cloudId: _omitted, ...withoutCloud } = stored
    apiDesktop.loadWorkspace.mockResolvedValue(withoutCloud)
    const workspace = await workspaceStorageService.loadWorkspace([])
    expect(workspace.cloudId).toBeNull()
  })

  it('rejects a workspace record that has no id', async () => {
    apiDesktop.loadWorkspace.mockResolvedValue({ ...stored, id: undefined })
    await expect(workspaceStorageService.loadWorkspace([])).rejects.toThrow()
  })

  it('lists every stored workspace', async () => {
    apiDesktop.listWorkspaces.mockResolvedValue([stored, { ...stored, id: 'other' }])
    await expect(workspaceStorageService.listWorkspaces()).resolves.toHaveLength(2)
  })

  it('passes the workspace id through when saving a commit', async () => {
    apiDesktop.saveCommit.mockResolvedValue(undefined)
    const commit = { id: 'c1', parentIds: [], message: 'm', tree: [], createdAt: '2026-01-01', pushed: false }
    await workspaceStorageService.saveCommit('local-default', commit)
    expect(apiDesktop.saveCommit).toHaveBeenCalledWith('local-default', commit)
  })
})
