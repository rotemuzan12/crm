import { ipcMain } from 'electron'
import Database from 'better-sqlite3'

export function registerSettingsHandlers(db: Database.Database): void {
  ipcMain.handle('settings:get', (_event, key: string): string | null => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined
    return row?.value ?? null
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string): void => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
  })

  ipcMain.handle('settings:getAll', (): Record<string, string> => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{
      key: string
      value: string
    }>
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  })
}
