import Database from 'better-sqlite3'

export interface Contact {
  id: number
  client_id: number | null
  client_name: string | null
  name: string
  role: string | null
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface ContactFilters {
  search?: string
  client_id?: number
}

export interface ContactInput {
  client_id?: number | null
  name: string
  role?: string | null
  email?: string | null
  phone?: string | null
}

const SELECT_WITH_CLIENT = `
  SELECT co.*, cl.name AS client_name
  FROM contacts co
  LEFT JOIN clients cl ON co.client_id = cl.id
`

export function listContacts(db: Database.Database, filters?: ContactFilters): Contact[] {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters?.search) {
    conditions.push('(co.name LIKE ? OR co.email LIKE ? OR co.role LIKE ?)')
    const like = `%${filters.search}%`
    params.push(like, like, like)
  }

  if (filters?.client_id !== undefined) {
    conditions.push('co.client_id = ?')
    params.push(filters.client_id)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db.prepare(`${SELECT_WITH_CLIENT} ${where} ORDER BY co.name ASC`).all(...params)
  return rows as Contact[]
}

export function getContact(db: Database.Database, id: number): Contact | null {
  const row = db.prepare(`${SELECT_WITH_CLIENT} WHERE co.id = ?`).get(id)
  return (row as Contact) ?? null
}

export function createContact(db: Database.Database, data: ContactInput): Contact {
  const stmt = db.prepare(`
    INSERT INTO contacts (client_id, name, role, email, phone)
    VALUES (@client_id, @name, @role, @email, @phone)
  `)
  const result = stmt.run({
    client_id: data.client_id ?? null,
    name: data.name,
    role: data.role ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null
  })
  return getContact(db, result.lastInsertRowid as number) as Contact
}

export function updateContact(db: Database.Database, id: number, data: Partial<ContactInput>): Contact | null {
  const existing = getContact(db, id)
  if (!existing) return null

  const merged = { ...existing, ...data }
  db.prepare(`
    UPDATE contacts SET
      client_id = @client_id,
      name = @name,
      role = @role,
      email = @email,
      phone = @phone,
      updated_at = datetime('now', 'localtime')
    WHERE id = @id
  `).run({
    id,
    client_id: merged.client_id ?? null,
    name: merged.name,
    role: merged.role ?? null,
    email: merged.email ?? null,
    phone: merged.phone ?? null
  })
  return getContact(db, id)
}

export function deleteContact(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(id)
  return result.changes > 0
}
