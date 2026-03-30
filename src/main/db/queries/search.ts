import Database from 'better-sqlite3'

export interface SearchResult {
  type: 'client' | 'contact' | 'deal' | 'task'
  id: number
  title: string
  subtitle: string | null
}

export function globalSearch(db: Database.Database, query: string): SearchResult[] {
  if (!query || query.trim().length === 0) return []
  const like = `%${query.trim()}%`

  const clients = db
    .prepare(
      `SELECT id, name AS title, company AS subtitle
       FROM clients
       WHERE name LIKE ? OR company LIKE ?
       LIMIT 5`
    )
    .all(like, like) as Array<{ id: number; title: string; subtitle: string | null }>

  const contacts = db
    .prepare(
      `SELECT co.id, co.name AS title, cl.name AS subtitle
       FROM contacts co
       LEFT JOIN clients cl ON co.client_id = cl.id
       WHERE co.name LIKE ? OR co.email LIKE ?
       LIMIT 5`
    )
    .all(like, like) as Array<{ id: number; title: string; subtitle: string | null }>

  const deals = db
    .prepare(
      `SELECT d.id, d.title, cl.name AS subtitle
       FROM deals d
       LEFT JOIN clients cl ON d.client_id = cl.id
       WHERE d.title LIKE ?
       LIMIT 5`
    )
    .all(like) as Array<{ id: number; title: string; subtitle: string | null }>

  const tasks = db
    .prepare(
      `SELECT t.id, t.title, cl.name AS subtitle
       FROM tasks t
       LEFT JOIN clients cl ON t.client_id = cl.id
       WHERE t.title LIKE ?
       LIMIT 5`
    )
    .all(like) as Array<{ id: number; title: string; subtitle: string | null }>

  const results: SearchResult[] = [
    ...clients.map((r) => ({ type: 'client' as const, ...r })),
    ...contacts.map((r) => ({ type: 'contact' as const, ...r })),
    ...deals.map((r) => ({ type: 'deal' as const, ...r })),
    ...tasks.map((r) => ({ type: 'task' as const, ...r }))
  ]

  return results.slice(0, 20)
}
