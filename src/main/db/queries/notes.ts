import Database from 'better-sqlite3'

export type NoteType = 'note' | 'call' | 'email' | 'meeting'

export interface Note {
  id: number
  client_id: number | null
  deal_id: number | null
  client_name: string | null
  deal_title: string | null
  content: string
  type: NoteType
  created_at: string
}

export interface NoteFilters {
  client_id?: number
  deal_id?: number
}

export interface NoteInput {
  client_id?: number | null
  deal_id?: number | null
  content: string
  type?: NoteType
}

const SELECT_WITH_JOINS = `
  SELECT
    n.*,
    cl.name AS client_name,
    d.title AS deal_title
  FROM notes n
  LEFT JOIN clients cl ON n.client_id = cl.id
  LEFT JOIN deals d ON n.deal_id = d.id
`

export function listNotes(db: Database.Database, filters?: NoteFilters): Note[] {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters?.client_id !== undefined) {
    conditions.push('n.client_id = ?')
    params.push(filters.client_id)
  }

  if (filters?.deal_id !== undefined) {
    conditions.push('n.deal_id = ?')
    params.push(filters.deal_id)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db
    .prepare(`${SELECT_WITH_JOINS} ${where} ORDER BY n.created_at DESC`)
    .all(...params)
  return rows as Note[]
}

export function createNote(db: Database.Database, data: NoteInput): Note {
  const stmt = db.prepare(`
    INSERT INTO notes (client_id, deal_id, content, type)
    VALUES (@client_id, @deal_id, @content, @type)
  `)
  const result = stmt.run({
    client_id: data.client_id ?? null,
    deal_id: data.deal_id ?? null,
    content: data.content,
    type: data.type ?? 'note'
  })
  const row = db
    .prepare(`${SELECT_WITH_JOINS} WHERE n.id = ?`)
    .get(result.lastInsertRowid as number)
  return row as Note
}

export function deleteNote(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM notes WHERE id = ?').run(id)
  return result.changes > 0
}
