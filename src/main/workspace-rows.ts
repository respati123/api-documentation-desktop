import type { DatabaseSync } from 'node:sqlite'

// Remembers the stored text of each workspace row as the app last read or wrote it.
// A save is refused when the row has changed since, for example when the CLI or MCP server wrote to it while the app was open.
export class WorkspaceRows {
  private readonly seen = new Map<string, string>()

  remember(id: string, data: string): void {
    this.seen.set(id, data)
  }

  forget(id: string): void {
    this.seen.delete(id)
  }

  // The check and the write run in one immediate transaction, so no other process can change the row between them.
  // Returns false, and does not run write, when the row changed outside the app.
  save(db: DatabaseSync, id: string, write: () => string): boolean {
    db.exec('BEGIN IMMEDIATE;')
    try {
      const current = db.prepare('SELECT data FROM workspaces WHERE id = ?').get(id) as { data: string } | undefined
      const known = this.seen.get(id)
      if (known !== undefined && current?.data !== known) {
        db.exec('ROLLBACK;')
        return false
      }
      const data = write()
      db.exec('COMMIT;')
      this.seen.set(id, data)
      return true
    } catch (error) {
      db.exec('ROLLBACK;')
      throw error
    }
  }
}
