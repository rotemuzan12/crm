import { ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { globalSearch } from '../db/queries/search'

export function registerSearchHandlers(db: Database.Database): void {
  ipcMain.handle('search:global', (_event, query) => globalSearch(db, query))
}
