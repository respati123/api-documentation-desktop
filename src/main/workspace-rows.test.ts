import { DatabaseSync } from 'node:sqlite'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspaceRows } from './workspace-rows'

function openDatabase(): DatabaseSync {
  const db = new DatabaseSync(':memory:')
  db.exec('CREATE TABLE workspaces (id TEXT PRIMARY KEY, data TEXT NOT NULL);')
  return db
}

function rowOf(db: DatabaseSync, id: string): string | undefined {
  return (db.prepare('SELECT data FROM workspaces WHERE id = ?').get(id) as { data: string } | undefined)?.data
}

describe('WorkspaceRows', () => {
  let db: DatabaseSync
  let rows: WorkspaceRows

  beforeEach(() => {
    db = openDatabase()
    rows = new WorkspaceRows()
  })

  it('saves when the row is still what the app last saw', () => {
    db.prepare('INSERT INTO workspaces (id, data) VALUES (?, ?)').run('w1', '{"v":1}')
    rows.remember('w1', '{"v":1}')

    const saved = rows.save(db, 'w1', () => {
      db.prepare('UPDATE workspaces SET data = ? WHERE id = ?').run('{"v":2}', 'w1')
      return '{"v":2}'
    })

    expect(saved).toBe(true)
    expect(rowOf(db, 'w1')).toBe('{"v":2}')
  })

  it('refuses a save when another process changed the row after the app last saw it', () => {
    db.prepare('INSERT INTO workspaces (id, data) VALUES (?, ?)').run('w1', '{"v":1}')
    rows.remember('w1', '{"v":1}')
    db.prepare('UPDATE workspaces SET data = ? WHERE id = ?').run('{"v":"from-mcp"}', 'w1')
    const write = vi.fn(() => '{"v":"from-app"}')

    expect(rows.save(db, 'w1', write)).toBe(false)
    expect(write).not.toHaveBeenCalled()
    expect(rowOf(db, 'w1')).toBe('{"v":"from-mcp"}')
  })

  it('does not bring back a row that another process deleted after the app last saw it', () => {
    db.prepare('INSERT INTO workspaces (id, data) VALUES (?, ?)').run('w1', '{"v":1}')
    rows.remember('w1', '{"v":1}')
    db.prepare('DELETE FROM workspaces WHERE id = ?').run('w1')

    expect(rows.save(db, 'w1', () => '{"v":"from-app"}')).toBe(false)
    expect(rowOf(db, 'w1')).toBeUndefined()
  })

  it('saves the first version of a workspace the app has not seen before', () => {
    const saved = rows.save(db, 'new', () => {
      db.prepare('INSERT INTO workspaces (id, data) VALUES (?, ?)').run('new', '{"v":1}')
      return '{"v":1}'
    })

    expect(saved).toBe(true)
    expect(rowOf(db, 'new')).toBe('{"v":1}')
  })

  it('leaves the row unchanged when the write throws', () => {
    db.prepare('INSERT INTO workspaces (id, data) VALUES (?, ?)').run('w1', '{"v":1}')
    rows.remember('w1', '{"v":1}')

    expect(() =>
      rows.save(db, 'w1', () => {
        db.prepare('UPDATE workspaces SET data = ? WHERE id = ?').run('{"v":"partial"}', 'w1')
        throw new Error('disk full')
      }),
    ).toThrow('disk full')
    expect(rowOf(db, 'w1')).toBe('{"v":1}')
  })
})
