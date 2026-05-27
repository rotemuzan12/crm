import Database from 'better-sqlite3'

export type PaymentMethod = 'transfer' | 'cash' | 'check' | 'bit' | 'paybox' | 'credit' | 'other'

export interface Payment {
  id: number
  deal_id: number | null
  client_id: number | null
  deal_title: string | null
  client_name: string | null
  amount: number
  currency: string
  payment_date: string
  method: PaymentMethod
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PaymentFilters {
  deal_id?: number
  client_id?: number
}

export interface PaymentInput {
  deal_id?: number | null
  client_id?: number | null
  amount: number
  currency?: string
  payment_date: string
  method?: PaymentMethod
  notes?: string | null
}

const SELECT_WITH_JOINS = `
  SELECT
    p.*,
    cl.name AS client_name,
    d.title AS deal_title
  FROM payments p
  LEFT JOIN clients cl ON p.client_id = cl.id
  LEFT JOIN deals d ON p.deal_id = d.id
`

export function listPayments(db: Database.Database, filters?: PaymentFilters): Payment[] {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters?.deal_id !== undefined) {
    conditions.push('p.deal_id = ?')
    params.push(filters.deal_id)
  }

  if (filters?.client_id !== undefined) {
    conditions.push('p.client_id = ?')
    params.push(filters.client_id)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db
    .prepare(`${SELECT_WITH_JOINS} ${where} ORDER BY p.payment_date DESC, p.created_at DESC`)
    .all(...params)
  return rows as Payment[]
}

export function getPayment(db: Database.Database, id: number): Payment | null {
  const row = db.prepare(`${SELECT_WITH_JOINS} WHERE p.id = ?`).get(id)
  return (row as Payment) ?? null
}

export function createPayment(db: Database.Database, data: PaymentInput): Payment {
  let clientId = data.client_id ?? null
  if (data.deal_id != null && clientId == null) {
    const deal = db.prepare('SELECT client_id FROM deals WHERE id = ?').get(data.deal_id) as
      | { client_id: number | null }
      | undefined
    if (deal?.client_id != null) clientId = deal.client_id
  }

  const result = db
    .prepare(
      `INSERT INTO payments (deal_id, client_id, amount, currency, payment_date, method, notes)
       VALUES (@deal_id, @client_id, @amount, @currency, @payment_date, @method, @notes)`
    )
    .run({
      deal_id: data.deal_id ?? null,
      client_id: clientId,
      amount: data.amount,
      currency: data.currency ?? 'ILS',
      payment_date: data.payment_date,
      method: data.method ?? 'transfer',
      notes: data.notes ?? null
    })
  return getPayment(db, result.lastInsertRowid as number) as Payment
}

export function updatePayment(
  db: Database.Database,
  id: number,
  data: Partial<PaymentInput>
): Payment | null {
  const existing = getPayment(db, id)
  if (!existing) return null

  const merged = { ...existing, ...data }

  let clientId: number | null
  if (data.client_id !== undefined) {
    clientId = data.client_id
  } else if (data.deal_id !== undefined && data.deal_id !== existing.deal_id) {
    if (data.deal_id != null) {
      const deal = db.prepare('SELECT client_id FROM deals WHERE id = ?').get(data.deal_id) as
        | { client_id: number | null }
        | undefined
      clientId = deal?.client_id ?? null
    } else {
      clientId = null
    }
  } else {
    clientId = existing.client_id
  }

  db.prepare(
    `UPDATE payments SET
       deal_id = @deal_id,
       client_id = @client_id,
       amount = @amount,
       currency = @currency,
       payment_date = @payment_date,
       method = @method,
       notes = @notes,
       updated_at = datetime('now', 'localtime')
     WHERE id = @id`
  ).run({
    id,
    deal_id: merged.deal_id ?? null,
    client_id: clientId,
    amount: merged.amount,
    currency: merged.currency,
    payment_date: merged.payment_date,
    method: merged.method,
    notes: merged.notes ?? null
  })

  return getPayment(db, id)
}

export function deletePayment(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM payments WHERE id = ?').run(id)
  return result.changes > 0
}
