import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { localVaultId, removeWorkspaceRows } from './workspace-removal'

function openDatabase(): DatabaseSync {
  const db = new DatabaseSync(':memory:')
  db.exec(`
    CREATE TABLE workspaces (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE commits (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE secrets (key TEXT PRIMARY KEY, value BLOB NOT NULL);
  `)
  db.prepare('INSERT INTO workspaces (id, data) VALUES (?, ?)').run('cloud-gone', '{}')
  db.prepare('INSERT INTO workspaces (id, data) VALUES (?, ?)').run('cloud-kept', '{}')
  db.prepare('INSERT INTO commits (id, workspace_id, data) VALUES (?, ?, ?)').run('c1', 'cloud-gone', '{}')
  db.prepare('INSERT INTO commits (id, workspace_id, data) VALUES (?, ?, ?)').run('c2', 'cloud-kept', '{}')
  db.prepare('INSERT INTO secrets (key, value) VALUES (?, ?)').run('workspace-variable:cloud-gone:v1', Buffer.from('x'))
  db.prepare('INSERT INTO secrets (key, value) VALUES (?, ?)').run('workspace-variable:cloud-kept:v1', Buffer.from('y'))
  return db
}

const count = (db: DatabaseSync, table: string) => (db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n

describe('removeWorkspaceRows', () => {
  it('removes the workspace, its commits, and its secret values, and leaves the other workspace alone', () => {
    const db = openDatabase()

    expect(removeWorkspaceRows(db, 'cloud-gone')).toBe(true)

    expect(count(db, 'workspaces')).toBe(1)
    expect(count(db, 'commits')).toBe(1)
    expect(db.prepare('SELECT key FROM secrets').all()).toEqual([{ key: 'workspace-variable:cloud-kept:v1' }])
  })

  it('never removes the local vault', () => {
    const db = openDatabase()
    db.prepare('INSERT INTO workspaces (id, data) VALUES (?, ?)').run(localVaultId, '{}')

    expect(removeWorkspaceRows(db, localVaultId)).toBe(false)
    expect(count(db, 'workspaces')).toBe(3)
  })
})
