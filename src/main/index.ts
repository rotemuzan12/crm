import { app, BrowserWindow, shell, dialog } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { openDatabase, closeDatabase } from './db'
import { registerAllHandlers } from './ipc'

function setupAutoUpdater(win: BrowserWindow): void {
  if (is.dev) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'עדכון זמין',
      message: 'גרסה חדשה נמצאה, ההורדה מתחילה ברקע...',
      buttons: ['אישור']
    })
  })

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox(win, {
        type: 'info',
        title: 'עדכון מוכן',
        message: 'העדכון הורד. האפליקציה תופעל מחדש כדי להתקין.',
        buttons: ['התקן עכשיו', 'מאוחר יותר']
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto-update error:', err)
  })

  autoUpdater.checkForUpdatesAndNotify()
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  const db = openDatabase()
  registerAllHandlers(db)
  const win = createWindow()
  setupAutoUpdater(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
