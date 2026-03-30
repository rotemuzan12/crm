import { ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { listTasks, getTask, createTask, updateTask, deleteTask, completeTask } from '../db/queries/tasks'

export function registerTaskHandlers(db: Database.Database): void {
  ipcMain.handle('tasks:list', (_event, filters) => listTasks(db, filters))
  ipcMain.handle('tasks:get', (_event, id) => getTask(db, id))
  ipcMain.handle('tasks:create', (_event, data) => createTask(db, data))
  ipcMain.handle('tasks:update', (_event, id, data) => updateTask(db, id, data))
  ipcMain.handle('tasks:delete', (_event, id) => deleteTask(db, id))
  ipcMain.handle('tasks:complete', (_event, id, completed) => completeTask(db, id, completed))
}
