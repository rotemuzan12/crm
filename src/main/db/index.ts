import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { runMigrations } from './migrations'
import { seedDatabase } from './seed'

let db: Database.Database | null = null

export function openDatabase(): Database.Database {
  if (db) return db
  const dbPath = join(app.getPath('userData'), 'crm.db')
  db = new Database(dbPath)
  runMigrations(db)
  seedDatabase(db)
  return db
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
