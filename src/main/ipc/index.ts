import Database from 'better-sqlite3'
import { registerClientHandlers } from './clients'
import { registerContactHandlers } from './contacts'
import { registerDealHandlers } from './deals'
import { registerTaskHandlers } from './tasks'
import { registerNoteHandlers } from './notes'
import { registerDashboardHandlers } from './dashboard'
import { registerSearchHandlers } from './search'
import { registerSettingsHandlers } from './settings'
import { registerCsvHandlers } from './csv'
import { registerBackupHandlers } from './backup'
import { registerTelegramHandlers } from './telegram'

export function registerAllHandlers(db: Database.Database): void {
  registerClientHandlers(db)
  registerContactHandlers(db)
  registerDealHandlers(db)
  registerTaskHandlers(db)
  registerNoteHandlers(db)
  registerDashboardHandlers(db)
  registerSearchHandlers(db)
  registerSettingsHandlers(db)
  registerCsvHandlers(db)
  registerBackupHandlers()
  registerTelegramHandlers(db)
}
