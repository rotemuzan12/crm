import Database from 'better-sqlite3'

export interface Client {
  id: number
  name: string
  company: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  status: 'active' | 'inactive' | 'lead'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientFilters {
  search?: string
  status?: 'active' | 'inactive' | 'lead'
}

export interface ClientInput {
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  status?: 'active' | 'inactive' | 'lead'
  notes?: string | null
}

export function listClients(db: Database.Database, filters?: ClientFilters): Client[] {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters?.search) {
    conditions.push('(name LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ?)')
    const like = `%${filters.search}%`
    params.push(like, like, like, like)
  }

  if (filters?.status) {
    conditions.push('status = ?')
    params.push(filters.status)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db.prepare(`SELECT * FROM clients ${where} ORDER BY name ASC`).all(...params)
  return rows as Client[]
}

export function getClient(db: Database.Database, id: number): Client | null {
  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(id)
  return (row as Client) ?? null
}

export function createClient(db: Database.Database, data: ClientInput): Client {
  const stmt = db.prepare(`
    INSERT INTO clients (name, company, email, phone, website, address, status, notes)
    VALUES (@name, @company, @email, @phone, @website, @address, @status, @notes)
  `)
  const result = stmt.run({
    name: data.name,
    company: data.company ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    website: data.website ?? null,
    address: data.address ?? null,
    status: data.status ?? 'active',
    notes: data.notes ?? null
  })
  return getClient(db, result.lastInsertRowid as number) as Client
}

export function updateClient(db: Database.Database, id: number, data: Partial<ClientInput>): Client | null {
  const existing = getClient(db, id)
  if (!existing) return null

  const merged = { ...existing, ...data }
  db.prepare(`
    UPDATE clients SET
      name = @name,
      company = @company,
      email = @email,
      phone = @phone,
      website = @website,
      address = @address,
      status = @status,
      notes = @notes,
      updated_at = datetime('now', 'localtime')
    WHERE id = @id
  `).run({
    id,
    name: merged.name,
    company: merged.company ?? null,
    email: merged.email ?? null,
    phone: merged.phone ?? null,
    website: merged.website ?? null,
    address: merged.address ?? null,
    status: merged.status,
    notes: merged.notes ?? null
  })
  return getClient(db, id)
}

export function deleteClient(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM clients WHERE id = ?').run(id)
  return result.changes > 0
}
