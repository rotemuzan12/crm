import { ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { startBot, stopBot, getBotStatus } from '../telegram/bot'

export function registerTelegramHandlers(db: Database.Database): void {
  ipcMain.handle(
    'telegram:start',
    async (): Promise<{ success: boolean; error?: string }> => {
      try {
        const tokenRow = db
          .prepare('SELECT value FROM settings WHERE key = ?')
          .get('telegram_token') as { value: string } | undefined

        if (!tokenRow?.value) {
          return { success: false, error: 'טוקן טלגרם לא מוגדר. עדכן בהגדרות.' }
        }

        const allowedRow = db
          .prepare('SELECT value FROM settings WHERE key = ?')
          .get('telegram_allowed_users') as { value: string } | undefined

        const allowedUserIds: number[] = allowedRow?.value
          ? allowedRow.value
              .split(',')
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => !isNaN(n))
          : []

        startBot(db, tokenRow.value, allowedUserIds)
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('telegram:stop', async (): Promise<{ success: boolean }> => {
    stopBot()
    return { success: true }
  })

  ipcMain.handle('telegram:status', (): { running: boolean } => {
    return getBotStatus()
  })
}
