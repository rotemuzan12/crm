import { ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { listContacts, getContact, createContact, updateContact, deleteContact } from '../db/queries/contacts'

export function registerContactHandlers(db: Database.Database): void {
  ipcMain.handle('contacts:list', (_event, filters) => listContacts(db, filters))
  ipcMain.handle('contacts:get', (_event, id) => getContact(db, id))
  ipcMain.handle('contacts:create', (_event, data) => createContact(db, data))
  ipcMain.handle('contacts:update', (_event, id, data) => updateContact(db, id, data))
  ipcMain.handle('contacts:delete', (_event, id) => deleteContact(db, id))
}
