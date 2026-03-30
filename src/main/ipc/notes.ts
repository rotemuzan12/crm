import { ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { listNotes, createNote, deleteNote } from '../db/queries/notes'

export function registerNoteHandlers(db: Database.Database): void {
  ipcMain.handle('notes:list', (_event, filters) => listNotes(db, filters))
  ipcMain.handle('notes:create', (_event, data) => createNote(db, data))
  ipcMain.handle('notes:delete', (_event, id) => deleteNote(db, id))
}
