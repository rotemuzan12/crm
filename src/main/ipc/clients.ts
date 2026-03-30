import { ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { listClients, getClient, createClient, updateClient, deleteClient } from '../db/queries/clients'

export function registerClientHandlers(db: Database.Database): void {
  ipcMain.handle('clients:list', (_event, filters) => listClients(db, filters))
  ipcMain.handle('clients:get', (_event, id) => getClient(db, id))
  ipcMain.handle('clients:create', (_event, data) => createClient(db, data))
  ipcMain.handle('clients:update', (_event, id, data) => updateClient(db, id, data))
  ipcMain.handle('clients:delete', (_event, id) => deleteClient(db, id))
}
