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

export type DealStage = 'lead' | 'qualified' | 'in_progress' | 'completed' | 'paid_closed' | 'irrelevant'

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
  priority: 'low' | 'medium' | 'high'
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
  type: 'note' | 'call' | 'email' | 'meeting'
  created_at: string
}

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

export interface DashboardData {
  stats: {
    totalClients: number
    activeDeals: number
    totalDealsValue: number
    pendingTasks: number
    overdueTasks: number
  }
  upcomingTasks: Task[]
  recentNotes: Note[]
  dealsByStage: Array<{ stage: string; count: number; total: number }>
}

export interface SearchResult {
  type: 'client' | 'contact' | 'deal' | 'task'
  id: number
  title: string
  subtitle: string | null
}

// ─── Hebrew labels ─────────────────────────────────────────────────────────

export const STAGE_LABELS: Record<DealStage, string> = {
  lead: 'ליד',
  qualified: 'רלוונטי והצעת מחיר',
  in_progress: 'בתהליך עבודה',
  completed: 'בוצע',
  paid_closed: 'שולם וסגור',
  irrelevant: 'לא רלוונטי'
}

export const STAGE_COLORS: Record<DealStage, string> = {
  lead: 'bg-slate-100 text-slate-700',
  qualified: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  paid_closed: 'bg-teal-100 text-teal-700',
  irrelevant: 'bg-red-100 text-red-700'
}

export const STAGE_BORDER_COLORS: Record<DealStage, string> = {
  lead: 'border-slate-300',
  qualified: 'border-blue-300',
  in_progress: 'border-amber-300',
  completed: 'border-emerald-300',
  paid_closed: 'border-teal-300',
  irrelevant: 'border-red-300'
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה'
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700'
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'פעיל',
  inactive: 'לא פעיל',
  lead: 'ליד'
}

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  lead: 'bg-blue-100 text-blue-700'
}

export const NOTE_TYPE_LABELS: Record<string, string> = {
  note: 'הערה',
  call: 'שיחה',
  email: 'אימייל',
  meeting: 'פגישה'
}

export const NOTE_TYPE_ICONS: Record<string, string> = {
  note: '📝',
  call: '📞',
  email: '✉️',
  meeting: '🤝'
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer: 'העברה בנקאית',
  cash: 'מזומן',
  check: 'צ\'ק',
  bit: 'ביט',
  paybox: 'פייבוקס',
  credit: 'אשראי',
  other: 'אחר'
}

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  transfer: '🏦',
  cash: '💵',
  check: '📃',
  bit: '📱',
  paybox: '📱',
  credit: '💳',
  other: '💰'
}

// ─── Window API types ───────────────────────────────────────────────────────

declare global {
  interface Window {
    api: {
      clients: {
        list: (filters?: { search?: string; status?: string }) => Promise<Client[]>
        get: (id: number) => Promise<Client | null>
        create: (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<Client>
        update: (id: number, data: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>) => Promise<Client>
        delete: (id: number) => Promise<void>
      }
      contacts: {
        list: (filters?: { search?: string; client_id?: number }) => Promise<Contact[]>
        get: (id: number) => Promise<Contact | null>
        create: (data: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'client_name'>) => Promise<Contact>
        update: (id: number, data: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'client_name'>>) => Promise<Contact>
        delete: (id: number) => Promise<void>
      }
      deals: {
        list: (filters?: { search?: string; stage?: string; client_id?: number }) => Promise<Deal[]>
        get: (id: number) => Promise<Deal | null>
        create: (data: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'client_name'>) => Promise<Deal>
        update: (id: number, data: Partial<Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'client_name'>>) => Promise<Deal>
        delete: (id: number) => Promise<void>
      }
      tasks: {
        list: (filters?: { search?: string; completed?: boolean; client_id?: number; deal_id?: number; due_today?: boolean }) => Promise<Task[]>
        get: (id: number) => Promise<Task | null>
        create: (data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'client_name' | 'deal_title'>) => Promise<Task>
        update: (id: number, data: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'client_name' | 'deal_title'>>) => Promise<Task>
        delete: (id: number) => Promise<void>
        complete: (id: number, completed: boolean) => Promise<void>
      }
      notes: {
        list: (filters?: { client_id?: number; deal_id?: number }) => Promise<Note[]>
        create: (data: Omit<Note, 'id' | 'created_at' | 'client_name' | 'deal_title'>) => Promise<Note>
        delete: (id: number) => Promise<void>
      }
      payments: {
        list: (filters?: { client_id?: number; deal_id?: number }) => Promise<Payment[]>
        get: (id: number) => Promise<Payment | null>
        create: (data: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'client_name' | 'deal_title'>) => Promise<Payment>
        update: (id: number, data: Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'client_name' | 'deal_title'>>) => Promise<Payment>
        delete: (id: number) => Promise<void>
      }
      dashboard: {
        getData: () => Promise<DashboardData>
      }
      search: {
        global: (query: string) => Promise<SearchResult[]>
      }
      csv: {
        exportClients: () => Promise<{ success: boolean; path?: string }>
        exportDeals: () => Promise<{ success: boolean; path?: string }>
        exportTasks: () => Promise<{ success: boolean; path?: string }>
        importClients: () => Promise<{ imported: number; errors: string[] }>
      }
      backup: {
        create: () => Promise<{ success: boolean; path?: string }>
        restore: () => Promise<{ success: boolean }>
      }
      settings: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<void>
        getAll: () => Promise<Record<string, string>>
      }
      telegram: {
        start: () => Promise<{ success: boolean; error?: string }>
        stop: () => Promise<void>
        status: () => Promise<{ running: boolean }>
      }
    }
  }
}
