import { initialTree } from '@/lib/sample-tree'
import { migrateNode, normalizeSharedVariables } from '@/lib/tree-normalize'
import type { WorkspaceVariables } from '@/lib/workspace-variables'
import type { TreeNode } from '@/models/workspace.model'

export function readTree(): TreeNode[] {
  try {
    const stored = localStorage.getItem('api-docs-workspace') ?? localStorage.getItem('api-docs-collections')
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed.map(migrateNode).filter((node): node is TreeNode => node !== null)
    }
  } catch {
    localStorage.removeItem('api-docs-workspace')
    localStorage.removeItem('api-docs-collections')
  }
  return initialTree
}

export function readStagedSnapshot(workspaceId: string): TreeNode[] | null {
  try {
    const value = localStorage.getItem(`api-docs-staged-${workspaceId}`)
    if (!value) return null
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(migrateNode).filter((node): node is TreeNode => node !== null) : null
  } catch {
    return null
  }
}

export function readStagedVariables(workspaceId: string): WorkspaceVariables | null {
  try {
    const value = localStorage.getItem(`api-docs-staged-variables-${workspaceId}`)
    if (!value) return null
    return normalizeSharedVariables(JSON.parse(value))
  } catch {
    return null
  }
}
