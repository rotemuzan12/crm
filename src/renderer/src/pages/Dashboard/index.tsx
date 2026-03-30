import React, { useState } from 'react'
import { useDashboard } from '@renderer/hooks/useDashboard'
import LoadingSpinner from '@renderer/components/ui/LoadingSpinner'
import Card from '@renderer/components/ui/Card'
import Badge from '@renderer/components/ui/Badge'
import { STAGE_LABELS, NOTE_TYPE_ICONS } from '@renderer/types'
import type { Task, Note } from '@renderer/types'

function formatCurrency(amount: number): string {
  return `₪${amount.toLocaleString('he-IL')}`
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'עכשיו'
  if (diffMins < 60) return `לפני ${diffMins} דקות`
  if (diffHours < 24) return `לפני ${diffHours} שעות`
  if (diffDays === 1) return 'אתמול'
  if (diffDays < 7) return `לפני ${diffDays} ימים`
  return date.toLocaleDateString('he-IL')
}

function isOverdue(dueDateStr: string | null): boolean {
  if (!dueDateStr) return false
  return new Date(dueDateStr) < new Date(new Date().toDateString())
}

interface StatCardProps {
  label: string
  value: string | number
  isAlert?: boolean
  icon: React.ReactNode
}

function StatCard({ label, value, isAlert, icon }: StatCardProps): React.ReactElement {
  return (
    <div className={`bg-white rounded-lg border shadow-sm px-4 py-4 flex items-center gap-4 ${isAlert ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isAlert ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${isAlert ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
      </div>
    </div>
  )
}

const STAGE_ORDER = ['lead', 'qualified', 'proposal', 'negotiation']
const STAGE_HEADER_COLORS: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-700',
  qualified: 'bg-blue-100 text-blue-700',
  proposal: 'bg-violet-100 text-violet-700',
  negotiation: 'bg-amber-100 text-amber-700',
}

export default function Dashboard(): React.ReactElement {
  const { data, loading, error, reload } = useDashboard()
  const [completingTask, setCompletingTask] = useState<number | null>(null)

  async function handleCompleteTask(taskId: number, current: boolean) {
    setCompletingTask(taskId)
    try {
      await window.api.tasks.complete(taskId, !current)
      reload()
    } finally {
      setCompletingTask(null)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      </div>
    )
  }
  if (!data) return <LoadingSpinner />

  const { stats, upcomingTasks, recentNotes, dealsByStage } = data

  const activeStages = STAGE_ORDER.map((stage) => {
    const found = dealsByStage.find((d) => d.stage === stage)
    return { stage, count: found?.count ?? 0, total: found?.total ?? 0 }
  })

  const maxCount = Math.max(...activeStages.map((s) => s.count), 1)

  return (
    <div className="p-6 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="סה״כ לקוחות"
          value={stats.totalClients}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          }
        />
        <StatCard
          label="עסקאות פעילות"
          value={stats.activeDeals}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
        />
        <StatCard
          label="שווי עסקאות"
          value={formatCurrency(stats.totalDealsValue)}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label="משימות ממתינות"
          value={stats.pendingTasks}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
        <StatCard
          label="משימות באיחור"
          value={stats.overdueTasks}
          isAlert={stats.overdueTasks > 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-5 gap-4">
        {/* Deal pipeline */}
        <div className="col-span-3">
          <Card title="עסקאות לפי שלב">
            <div className="space-y-3">
              {activeStages.map(({ stage, count, total }) => {
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${STAGE_HEADER_COLORS[stage] ?? 'bg-slate-100 text-slate-700'}`}>
                          {STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? stage}
                        </span>
                        <span className="text-xs text-slate-500">{count} עסקאות</span>
                      </div>
                      <span className="text-xs font-medium text-slate-700">{formatCurrency(total)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {activeStages.every((s) => s.count === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">אין עסקאות פעילות</p>
              )}
            </div>
          </Card>
        </div>

        {/* Upcoming tasks */}
        <div className="col-span-2">
          <Card title="משימות קרובות">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">אין משימות קרובות</p>
            ) : (
              <div className="space-y-1">
                {upcomingTasks.slice(0, 5).map((task: Task) => {
                  const overdue = isOverdue(task.due_date)
                  const completing = completingTask === task.id
                  return (
                    <div key={task.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                      <button
                        onClick={() => handleCompleteTask(task.id, task.completed)}
                        disabled={completing}
                        className="mt-0.5 shrink-0 w-4 h-4 rounded border-2 border-slate-300 hover:border-blue-500 flex items-center justify-center transition-colors"
                      >
                        {completing && <div className="w-2 h-2 border border-blue-500 border-t-transparent rounded-full animate-spin" />}
                        {task.completed && !completing && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="2 6 5 9 10 3" />
                          </svg>
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {task.client_name && (
                            <span className="text-xs text-slate-500 truncate">{task.client_name}</span>
                          )}
                          {task.due_date && (
                            <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                              {new Date(task.due_date).toLocaleDateString('he-IL')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent activity */}
      <Card title="פעילות אחרונה">
        {recentNotes.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">אין פעילות אחרונה</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentNotes.slice(0, 10).map((note: Note) => (
              <div key={note.id} className="flex items-start gap-3 py-2.5">
                <span className="text-lg shrink-0 mt-0.5">{NOTE_TYPE_ICONS[note.type] ?? '📝'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 line-clamp-2">{note.content}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {note.client_name && (
                      <span className="text-xs text-slate-500">{note.client_name}</span>
                    )}
                    {note.deal_title && (
                      <span className="text-xs text-slate-400">· {note.deal_title}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">{timeAgo(note.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
