import type { DatabaseSync } from 'node:sqlite'

// The device's own vault. It is never removed, even when a sync list does not include it.
export const localVaultId = 'local-default'

// Removes a cloud copy with its commits and its stored secret values. Nothing else is touched.
export function removeWorkspaceRows(db: DatabaseSync, workspaceId: string): boolean {
  if (workspaceId === localVaultId) return false
  const prefix = `workspace-variable:${workspaceId}:`
  db.exec('BEGIN IMMEDIATE;')
  try {
    db.prepare('DELETE FROM commits WHERE workspace_id = ?').run(workspaceId)
    for (const row of db.prepare('SELECT key FROM secrets').all() as Array<{ key: string }>) {
      if (row.key.startsWith(prefix)) db.prepare('DELETE FROM secrets WHERE key = ?').run(row.key)
    }
    db.prepare('DELETE FROM workspaces WHERE id = ?').run(workspaceId)
    db.exec('COMMIT;')
    return true
  } catch (error) {
    db.exec('ROLLBACK;')
    throw error
  }
}
