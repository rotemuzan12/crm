import Database from 'better-sqlite3'

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'

export interface Deal {
  id: number
  client_id: number | null
  client_name: string | null
  title: string
  amount: number | null
  currency: string
  stage: DealStage
  expected_close_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DealFilters {
  search?: string
  stage?: DealStage
  client_id?: number
}

export interface DealInput {
  client_id?: number | null
  title: string
  amount?: number | null
  currency?: string
  stage?: DealStage
  expected_close_date?: string | null
  notes?: string | null
}

const SELECT_WITH_CLIENT = `
  SELECT d.*, cl.name AS client_name
  FROM deals d
  LEFT JOIN clients cl ON d.client_id = cl.id
`

export function listDeals(db: Database.Database, filters?: DealFilters): Deal[] {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters?.search) {
    conditions.push('(d.title LIKE ? OR cl.name LIKE ?)')
    const like = `%${filters.search}%`
    params.push(like, like)
  }

  if (filters?.stage) {
    conditions.push('d.stage = ?')
    params.push(filters.stage)
  }

  if (filters?.client_id !== undefined) {
    conditions.push('d.client_id = ?')
    params.push(filters.client_id)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db.prepare(`${SELECT_WITH_CLIENT} ${where} ORDER BY d.created_at DESC`).all(...params)
  return rows as Deal[]
}

export function getDeal(db: Database.Database, id: number): Deal | null {
  const row = db.prepare(`${SELECT_WITH_CLIENT} WHERE d.id = ?`).get(id)
  return (row as Deal) ?? null
}

export function createDeal(db: Database.Database, data: DealInput): Deal {
  const stmt = db.prepare(`
    INSERT INTO deals (client_id, title, amount, currency, stage, expected_close_date, notes)
    VALUES (@client_id, @title, @amount, @currency, @stage, @expected_close_date, @notes)
  `)
  const result = stmt.run({
    client_id: data.client_id ?? null,
    title: data.title,
    amount: data.amount ?? null,
    currency: data.currency ?? 'ILS',
    stage: data.stage ?? 'lead',
    expected_close_date: data.expected_close_date ?? null,
    notes: data.notes ?? null
  })
  return getDeal(db, result.lastInsertRowid as number) as Deal
}

export function updateDeal(db: Database.Database, id: number, data: Partial<DealInput>): Deal | null {
  const existing = getDeal(db, id)
  if (!existing) return null

  const merged = { ...existing, ...data }
  db.prepare(`
    UPDATE deals SET
      client_id = @client_id,
      title = @title,
      amount = @amount,
      currency = @currency,
      stage = @stage,
      expected_close_date = @expected_close_date,
      notes = @notes,
      updated_at = datetime('now', 'localtime')
    WHERE id = @id
  `).run({
    id,
    client_id: merged.client_id ?? null,
    title: merged.title,
    amount: merged.amount ?? null,
    currency: merged.currency,
    stage: merged.stage,
    expected_close_date: merged.expected_close_date ?? null,
    notes: merged.notes ?? null
  })
  return getDeal(db, id)
}

export function deleteDeal(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM deals WHERE id = ?').run(id)
  return result.changes > 0
}
