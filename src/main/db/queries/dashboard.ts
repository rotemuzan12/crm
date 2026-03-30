import Database from 'better-sqlite3'

export interface DashboardStats {
  totalClients: number
  activeDeals: number
  totalDealsValue: number
  pendingTasks: number
  overdueTasks: number
}

export interface DealsByStage {
  stage: string
  count: number
  total: number
}

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
  priority: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: number
  client_id: number | null
  deal_id: number | null
  client_name: string | null
  deal_title: string | null
  content: string
  type: string
  created_at: string
}

export interface DashboardData {
  stats: DashboardStats
  upcomingTasks: Task[]
  recentNotes: Note[]
  dealsByStage: DealsByStage[]
}

export function getDashboardData(db: Database.Database): DashboardData {
  // Stats
  const totalClients = (
    db.prepare("SELECT COUNT(*) AS cnt FROM clients").get() as { cnt: number }
  ).cnt

  const activeDealsRow = db
    .prepare(
      "SELECT COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS total FROM deals WHERE stage NOT IN ('closed_won', 'closed_lost')"
    )
    .get() as { cnt: number; total: number }

  const pendingTasks = (
    db.prepare('SELECT COUNT(*) AS cnt FROM tasks WHERE completed = 0').get() as { cnt: number }
  ).cnt

  const overdueTasks = (
    db
      .prepare(
        "SELECT COUNT(*) AS cnt FROM tasks WHERE completed = 0 AND due_date < date('now', 'localtime')"
      )
      .get() as { cnt: number }
  ).cnt

  const stats: DashboardStats = {
    totalClients,
    activeDeals: activeDealsRow.cnt,
    totalDealsValue: activeDealsRow.total,
    pendingTasks,
    overdueTasks
  }

  // Upcoming tasks (next 5 not completed, ordered by due_date, nulls last)
  const upcomingTaskRows = db
    .prepare(
      `SELECT
        t.*,
        cl.name AS client_name,
        d.title AS deal_title
      FROM tasks t
      LEFT JOIN clients cl ON t.client_id = cl.id
      LEFT JOIN deals d ON t.deal_id = d.id
      WHERE t.completed = 0
      ORDER BY t.due_date ASC NULLS LAST, t.created_at ASC
      LIMIT 5`
    )
    .all() as Record<string, unknown>[]

  const upcomingTasks: Task[] = upcomingTaskRows.map((row) => ({
    ...(row as Omit<Task, 'completed'>),
    completed: row.completed === 1 || row.completed === true
  }))

  // Recent notes (last 10)
  const recentNotes = db
    .prepare(
      `SELECT
        n.*,
        cl.name AS client_name,
        d.title AS deal_title
      FROM notes n
      LEFT JOIN clients cl ON n.client_id = cl.id
      LEFT JOIN deals d ON n.deal_id = d.id
      ORDER BY n.created_at DESC
      LIMIT 10`
    )
    .all() as Note[]

  // Deals by stage (all stages)
  const dealsByStage = db
    .prepare(
      `SELECT
        stage,
        COUNT(*) AS count,
        COALESCE(SUM(amount), 0) AS total
      FROM deals
      GROUP BY stage
      ORDER BY
        CASE stage
          WHEN 'lead' THEN 1
          WHEN 'qualified' THEN 2
          WHEN 'proposal' THEN 3
          WHEN 'negotiation' THEN 4
          WHEN 'closed_won' THEN 5
          WHEN 'closed_lost' THEN 6
          ELSE 7
        END`
    )
    .all() as DealsByStage[]

  return {
    stats,
    upcomingTasks,
    recentNotes,
    dealsByStage
  }
}
