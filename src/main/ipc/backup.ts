import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import { join } from 'path'
import * as fs from 'node:fs'

function getDbPath(): string {
  return join(app.getPath('userData'), 'crm.db')
}

export function registerBackupHandlers(): void {
  ipcMain.handle(
    'backup:create',
    async (): Promise<{ success: boolean; path?: string; error?: string }> => {
      try {
        const win = BrowserWindow.getFocusedWindow()
        const { canceled, filePath } = await dialog.showSaveDialog(win ?? undefined!, {
          defaultPath: `crm-backup-${new Date().toISOString().slice(0, 10)}.db`,
          filters: [{ name: 'SQLite Database', extensions: ['db'] }]
        })

        if (canceled || !filePath) return { success: false, error: 'ביטול על ידי המשתמש' }

        fs.copyFileSync(getDbPath(), filePath)
        return { success: true, path: filePath }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'backup:restore',
    async (): Promise<{ success: boolean; error?: string }> => {
      try {
        const win = BrowserWindow.getFocusedWindow()

        const { canceled, filePaths } = await dialog.showOpenDialog(win ?? undefined!, {
          filters: [{ name: 'SQLite Database', extensions: ['db'] }],
          properties: ['openFile']
        })

        if (canceled || filePaths.length === 0) return { success: false, error: 'ביטול על ידי המשתמש' }

        const response = dialog.showMessageBoxSync(win ?? undefined!, {
          type: 'warning',
          buttons: ['המשך', 'ביטול'],
          defaultId: 1,
          cancelId: 1,
          title: 'שחזור גיבוי',
          message: 'פעולה זו תחליף את כל הנתונים. להמשיך?',
          detail: 'לא ניתן לבטל פעולה זו לאחר ביצועה.'
        })

        if (response !== 0) return { success: false, error: 'ביטול על ידי המשתמש' }

        fs.copyFileSync(filePaths[0], getDbPath())
        app.relaunch()
        app.exit(0)
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )
}
