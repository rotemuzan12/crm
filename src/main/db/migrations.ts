import Database from 'better-sqlite3'

export function runMigrations(db: Database.Database): void {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      address TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      role TEXT,
      email TEXT,
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      amount REAL,
      currency TEXT NOT NULL DEFAULT 'ILS',
      stage TEXT NOT NULL DEFAULT 'lead',
      expected_close_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'note',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}
