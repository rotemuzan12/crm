import { ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { listDeals, getDeal, createDeal, updateDeal, deleteDeal } from '../db/queries/deals'

export function registerDealHandlers(db: Database.Database): void {
  ipcMain.handle('deals:list', (_event, filters) => listDeals(db, filters))
  ipcMain.handle('deals:get', (_event, id) => getDeal(db, id))
  ipcMain.handle('deals:create', (_event, data) => createDeal(db, data))
  ipcMain.handle('deals:update', (_event, id, data) => updateDeal(db, id, data))
  ipcMain.handle('deals:delete', (_event, id) => deleteDeal(db, id))
}
