import Database from 'better-sqlite3'

export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: number
  client_id: number | null
  deal_id: number | null
  client_name: string | null
  deal_title: string | null
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  priority: TaskPriority
  created_at: string
  updated_at: string
}

export interface TaskFilters {
  search?: string
  completed?: boolean
  client_id?: number
  deal_id?: number
  due_today?: boolean
}

export interface TaskInput {
  client_id?: number | null
  deal_id?: number | null
  title: string
  description?: string | null
  due_date?: string | null
  completed?: boolean
  priority?: TaskPriority
}

const SELECT_WITH_JOINS = `
  SELECT
    t.*,
    cl.name AS client_name,
    d.title AS deal_title
  FROM tasks t
  LEFT JOIN clients cl ON t.client_id = cl.id
  LEFT JOIN deals d ON t.deal_id = d.id
`

function mapRow(row: Record<string, unknown>): Task {
  return {
    ...(row as Omit<Task, 'completed'>),
    completed: row.completed === 1 || row.completed === true
  }
}

export function listTasks(db: Database.Database, filters?: TaskFilters): Task[] {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters?.search) {
    conditions.push('t.title LIKE ?')
    params.push(`%${filters.search}%`)
  }

  if (filters?.completed !== undefined) {
    conditions.push('t.completed = ?')
    params.push(filters.completed ? 1 : 0)
  }

  if (filters?.client_id !== undefined) {
    conditions.push('t.client_id = ?')
    params.push(filters.client_id)
  }

  if (filters?.deal_id !== undefined) {
    conditions.push('t.deal_id = ?')
    params.push(filters.deal_id)
  }

  if (filters?.due_today) {
    conditions.push("t.due_date = date('now', 'localtime')")
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `${SELECT_WITH_JOINS} ${where} ORDER BY t.due_date ASC NULLS LAST, t.created_at ASC`
    )
    .all(...params) as Record<string, unknown>[]

  return rows.map(mapRow)
}

export function getTask(db: Database.Database, id: number): Task | null {
  const row = db.prepare(`${SELECT_WITH_JOINS} WHERE t.id = ?`).get(id) as
    | Record<string, unknown>
    | undefined
  return row ? mapRow(row) : null
}

export function createTask(db: Database.Database, data: TaskInput): Task {
  const stmt = db.prepare(`
    INSERT INTO tasks (client_id, deal_id, title, description, due_date, completed, priority)
    VALUES (@client_id, @deal_id, @title, @description, @due_date, @completed, @priority)
  `)
  const result = stmt.run({
    client_id: data.client_id ?? null,
    deal_id: data.deal_id ?? null,
    title: data.title,
    description: data.description ?? null,
    due_date: data.due_date ?? null,
    completed: data.completed ? 1 : 0,
    priority: data.priority ?? 'medium'
  })
  return getTask(db, result.lastInsertRowid as number) as Task
}

export function updateTask(db: Database.Database, id: number, data: Partial<TaskInput>): Task | null {
  const existing = getTask(db, id)
  if (!existing) return null

  const merged = { ...existing, ...data }
  db.prepare(`
    UPDATE tasks SET
      client_id = @client_id,
      deal_id = @deal_id,
      title = @title,
      description = @description,
      due_date = @due_date,
      completed = @completed,
      priority = @priority,
      updated_at = datetime('now', 'localtime')
    WHERE id = @id
  `).run({
    id,
    client_id: merged.client_id ?? null,
    deal_id: merged.deal_id ?? null,
    title: merged.title,
    description: merged.description ?? null,
    due_date: merged.due_date ?? null,
    completed: merged.completed ? 1 : 0,
    priority: merged.priority
  })
  return getTask(db, id)
}

export function completeTask(db: Database.Database, id: number, completed: boolean): Task | null {
  const existing = getTask(db, id)
  if (!existing) return null

  db.prepare(`
    UPDATE tasks SET completed = @completed, updated_at = datetime('now', 'localtime')
    WHERE id = @id
  `).run({ id, completed: completed ? 1 : 0 })
  return getTask(db, id)
}

export function deleteTask(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  return result.changes > 0
}
