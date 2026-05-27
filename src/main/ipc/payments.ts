import { ipcMain } from 'electron'
import Database from 'better-sqlite3'
import {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment
} from '../db/queries/payments'

export function registerPaymentHandlers(db: Database.Database): void {
  ipcMain.handle('payments:list', (_event, filters) => listPayments(db, filters))
  ipcMain.handle('payments:get', (_event, id) => getPayment(db, id))
  ipcMain.handle('payments:create', (_event, data) => createPayment(db, data))
  ipcMain.handle('payments:update', (_event, id, data) => updatePayment(db, id, data))
  ipcMain.handle('payments:delete', (_event, id) => deletePayment(db, id))
}
