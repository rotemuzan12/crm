import React, { useState } from 'react'
import { useTasks } from '@renderer/hooks/useTasks'
import Button from '@renderer/components/ui/Button'
import Badge from '@renderer/components/ui/Badge'
import Input from '@renderer/components/ui/Input'
import Select from '@renderer/components/ui/Select'
import LoadingSpinner from '@renderer/components/ui/LoadingSpinner'
import EmptyState from '@renderer/components/ui/EmptyState'
import TaskForm from './TaskForm'
import type { Task } from '@renderer/types'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@renderer/types'

type TabFilter = 'open' | 'completed' | 'all'

const priorityFilterOptions = [
  { value: '', label: 'כל העדיפויות' },
  { value: 'high', label: 'גבוהה' },
  { value: 'medium', label: 'בינונית' },
  { value: 'low', label: 'נמוכה' }
]

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.completed) return false
  return task.due_date < new Date().toISOString().split('T')[0]
}

export default function TasksPage(): React.ReactElement {
  const [tab, setTab] = useState<TabFilter>('open')
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | undefined>()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const completed = tab === 'open' ? false : tab === 'completed' ? true : undefined
  const { tasks, loading, error, reload } = useTasks({
    search: search || undefined,
    completed
  })

  const filtered = priority ? tasks.filter((t) => t.priority === priority) : tasks
  const openCount = tasks.filter((t) => !t.completed).length
  const completedCount = tasks.filter((t) => t.completed).length

  async function handleComplete(task: Task) {
    await window.api.tasks.complete(task.id, !task.completed)
    reload()
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`האם למחוק את המשימה "${task.title}"?`)) return
    setDeletingId(task.id)
    try {
      await window.api.tasks.delete(task.id)
      reload()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">משימות</h1>
          {!loading && (
            <span className="text-sm text-slate-500">
              {openCount} פתוחות · {completedCount} הושלמו
            </span>
          )}
        </div>
        <Button variant="primary" onClick={() => { setEditTask(undefined); setShowForm(true) }}>
          + משימה חדשה
        </Button>
      </div>

      {/* Tabs + filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
          {(['open', 'completed', 'all'] as TabFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                tab === t
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'open' ? 'פתוחות' : t === 'completed' ? 'הושלמו' : 'הכול'}
            </button>
          ))}
        </div>
        <div className="w-64">
          <Input
            placeholder="חיפוש משימות..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={priorityFilterOptions}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="✅"
          title={tab === 'open' ? 'אין משימות פתוחות' : 'אין משימות'}
          description={search ? 'לא נמצאו משימות התואמות לחיפוש' : 'התחל על ידי יצירת משימה חדשה'}
          action={!search && tab !== 'completed' ? (
            <Button onClick={() => setShowForm(true)}>+ משימה חדשה</Button>
          ) : undefined}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-10 px-3 py-3"></th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">כותרת</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">לקוח</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">עסקה</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">עדיפות</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">תאריך יעד</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((task) => {
                const overdue = isOverdue(task)
                return (
                  <tr key={task.id} className={`hover:bg-slate-50 transition-colors ${task.completed ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleComplete(task)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-medium text-slate-900 ${task.completed ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{task.client_name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{task.deal_title ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={PRIORITY_COLORS[task.priority]}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {task.due_date ? (
                        <span className={overdue ? 'text-red-600 font-medium' : 'text-slate-600'}>
                          {overdue && '⚠ '}
                          {new Date(task.due_date).toLocaleDateString('he-IL')}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => { setEditTask(task); setShowForm(true) }}
                        >
                          עריכה
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          loading={deletingId === task.id}
                          onClick={() => handleDelete(task)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          מחיקה
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editTask}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload() }}
        />
      )}
    </div>
  )
}
