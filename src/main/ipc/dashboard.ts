import { ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { getDashboardData } from '../db/queries/dashboard'

export function registerDashboardHandlers(db: Database.Database): void {
  ipcMain.handle('dashboard:getData', () => getDashboardData(db))
}
