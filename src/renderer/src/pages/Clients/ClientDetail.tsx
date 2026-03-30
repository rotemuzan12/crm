import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContacts } from '@renderer/hooks/useContacts'
import { useDeals } from '@renderer/hooks/useDeals'
import { useTasks } from '@renderer/hooks/useTasks'
import { useNotes } from '@renderer/hooks/useNotes'
import Button from '@renderer/components/ui/Button'
import Badge from '@renderer/components/ui/Badge'
import LoadingSpinner from '@renderer/components/ui/LoadingSpinner'
import EmptyState from '@renderer/components/ui/EmptyState'
import ClientForm from './ClientForm'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STAGE_LABELS,
  STAGE_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  NOTE_TYPE_ICONS,
} from '@renderer/types'
import type { Client, Contact, Deal, Task } from '@renderer/types'

type TabKey = 'details' | 'contacts' | 'deals' | 'tasks' | 'activity'

const NOTE_TYPES = [
  { value: 'note', label: 'הערה' },
  { value: 'call', label: 'שיחה' },
  { value: 'email', label: 'אימייל' },
  { value: 'meeting', label: 'פגישה' }
]

const TABS: { key: TabKey; label: string }[] = [
  { key: 'details', label: 'פרטים' },
  { key: 'contacts', label: 'אנשי קשר' },
  { key: 'deals', label: 'עסקאות' },
  { key: 'tasks', label: 'משימות' },
  { key: 'activity', label: 'פעילות' },
]

function formatCurrency(amount: number | null, currency = 'ILS'): string {
  if (amount == null) return '—'
  return `₪${amount.toLocaleString('he-IL')}`
}

function isOverdue(dueDateStr: string | null): boolean {
  if (!dueDateStr) return false
  return new Date(dueDateStr) < new Date(new Date().toDateString())
}

export default function ClientDetail(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const clientId = parseInt(id ?? '0', 10)

  const [client, setClient] = useState<Client | null>(null)
  const [clientLoading, setClientLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('details')
  const [showEditForm, setShowEditForm] = useState(false)

  const [completingTask, setCompletingTask] = useState<number | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteType, setNewNoteType] = useState<'note' | 'call' | 'email' | 'meeting'>('note')
  const [savingNote, setSavingNote] = useState(false)
  const [deletingContactId, setDeletingContactId] = useState<number | null>(null)
  const [deletingDealId, setDeletingDealId] = useState<number | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null)

  const { contacts, loading: contactsLoading, reload: reloadContacts } = useContacts({ client_id: clientId })
  const { deals, loading: dealsLoading, reload: reloadDeals } = useDeals({ client_id: clientId })
  const { tasks, loading: tasksLoading, reload: reloadTasks } = useTasks({ client_id: clientId })
  const { notes, loading: notesLoading, reload: reloadNotes } = useNotes({ client_id: clientId })

  async function loadClient() {
    setClientLoading(true)
    try {
      const data = await window.api.clients.get(clientId)
      setClient(data)
    } finally {
      setClientLoading(false)
    }
  }

  useEffect(() => {
    loadClient()
  }, [clientId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCompleteTask(taskId: number, current: boolean) {
    setCompletingTask(taskId)
    try {
      await window.api.tasks.complete(taskId, !current)
      reloadTasks()
    } finally {
      setCompletingTask(null)
    }
  }

  async function handleDeleteContact(contact: Contact) {
    if (!window.confirm(`האם למחוק את איש הקשר "${contact.name}"?`)) return
    setDeletingContactId(contact.id)
    try {
      await window.api.contacts.delete(contact.id)
      reloadContacts()
    } finally {
      setDeletingContactId(null)
    }
  }

  async function handleDeleteDeal(deal: Deal) {
    if (!window.confirm(`האם למחוק את העסקה "${deal.title}"?`)) return
    setDeletingDealId(deal.id)
    try {
      await window.api.deals.delete(deal.id)
      reloadDeals()
    } finally {
      setDeletingDealId(null)
    }
  }

  async function handleDeleteTask(task: Task) {
    if (!window.confirm(`האם למחוק את המשימה "${task.title}"?`)) return
    setDeletingTaskId(task.id)
    try {
      await window.api.tasks.delete(task.id)
      reloadTasks()
    } finally {
      setDeletingTaskId(null)
    }
  }

  if (clientLoading) return <LoadingSpinner />
  if (!client) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">לקוח לא נמצא</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Back + Header */}
      <div className="mb-5">
        <button
          onClick={() => navigate('/clients')}
          className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-3 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          חזור ללקוחות
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <Badge className={STATUS_COLORS[client.status]}>{STATUS_LABELS[client.status]}</Badge>
          </div>
          <Button variant="secondary" onClick={() => setShowEditForm(true)}>
            עריכה
          </Button>
        </div>

        {client.company && (
          <p className="text-slate-500 text-sm mt-1">{client.company}</p>
        )}
      </div>

      {/* Info grid */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 mb-5 grid grid-cols-3 gap-4">
        {client.email && (
          <div>
            <p className="text-xs text-slate-500 mb-0.5">אימייל</p>
            <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:underline">{client.email}</a>
          </div>
        )}
        {client.phone && (
          <div>
            <p className="text-xs text-slate-500 mb-0.5">טלפון</p>
            <a href={`tel:${client.phone}`} className="text-sm text-blue-600 hover:underline">{client.phone}</a>
          </div>
        )}
        {client.website && (
          <div>
            <p className="text-xs text-slate-500 mb-0.5">אתר</p>
            <a href={client.website} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate block">{client.website}</a>
          </div>
        )}
        {client.address && (
          <div>
            <p className="text-xs text-slate-500 mb-0.5">כתובת</p>
            <p className="text-sm text-slate-800">{client.address}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-slate-500 mb-0.5">תאריך הוספה</p>
          <p className="text-sm text-slate-800">{new Date(client.created_at).toLocaleDateString('he-IL')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-5">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">הערות</h3>
          {client.notes ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.notes}</p>
          ) : (
            <p className="text-sm text-slate-400">אין הערות</p>
          )}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div>
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate(`/contacts?client_id=${clientId}`)}
            >
              + הוסף איש קשר
            </Button>
          </div>
          {contactsLoading ? (
            <LoadingSpinner />
          ) : contacts.length === 0 ? (
            <EmptyState icon="👥" title="אין אנשי קשר" description="הוסף אנשי קשר ללקוח זה" />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">שם</th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">תפקיד</th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">אימייל</th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">טלפון</th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{contact.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{contact.role ?? '—'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{contact.email ?? '—'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{contact.phone ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={deletingContactId === contact.id}
                          onClick={() => handleDeleteContact(contact)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          מחיקה
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'deals' && (
        <div>
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate(`/deals?client_id=${clientId}`)}
            >
              + הוסף עסקה
            </Button>
          </div>
          {dealsLoading ? (
            <LoadingSpinner />
          ) : deals.length === 0 ? (
            <EmptyState icon="💼" title="אין עסקאות" description="הוסף עסקאות ללקוח זה" />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">כותרת</th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">שלב</th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">סכום</th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">תאריך סגירה</th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{deal.title}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={STAGE_COLORS[deal.stage]}>{STAGE_LABELS[deal.stage]}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{formatCurrency(deal.amount)}</td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('he-IL') : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={deletingDealId === deal.id}
                          onClick={() => handleDeleteDeal(deal)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          מחיקה
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div>
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate(`/tasks?client_id=${clientId}`)}
            >
              + הוסף משימה
            </Button>
          </div>
          {tasksLoading ? (
            <LoadingSpinner />
          ) : tasks.length === 0 ? (
            <EmptyState icon="✓" title="אין משימות" description="הוסף משימות ללקוח זה" />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-10 px-4 py-3"></th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">כותרת</th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">עדיפות</th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">תאריך יעד</th>
                    <th className="text-right font-semibold text-slate-700 px-4 py-3">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((task) => {
                    const overdue = !task.completed && isOverdue(task.due_date)
                    return (
                      <tr key={task.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => handleCompleteTask(task.id, task.completed)}
                            disabled={completingTask === task.id}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              task.completed ? 'bg-blue-600 border-blue-600' : 'border-slate-300 hover:border-blue-500'
                            }`}
                          >
                            {task.completed && (
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="2 6 5 9 10 3" />
                              </svg>
                            )}
                          </button>
                        </td>
                        <td className={`px-4 py-2.5 font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge className={PRIORITY_COLORS[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
                        </td>
                        <td className={`px-4 py-2.5 text-sm ${overdue ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('he-IL') : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={deletingTaskId === task.id}
                            onClick={() => handleDeleteTask(task)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            מחיקה
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          {/* Add note inline */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
            <div className="flex gap-2 mb-2">
              {NOTE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setNewNoteType(t.value as typeof newNoteType)}
                  className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
                    newNoteType === t.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {NOTE_TYPE_ICONS[t.value]} {t.label}
                </button>
              ))}
            </div>
            <textarea
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="הוסף הערה, סכום שיחה, מייל..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && newNoteContent.trim()) {
                  e.preventDefault()
                  setSavingNote(true)
                  try {
                    await window.api.notes.create({ client_id: clientId, deal_id: null, content: newNoteContent.trim(), type: newNoteType })
                    setNewNoteContent('')
                    reloadNotes()
                  } finally { setSavingNote(false) }
                }
              }}
            />
            <div className="flex justify-end mt-2">
              <button
                disabled={!newNoteContent.trim() || savingNote}
                onClick={async () => {
                  if (!newNoteContent.trim()) return
                  setSavingNote(true)
                  try {
                    await window.api.notes.create({ client_id: clientId, deal_id: null, content: newNoteContent.trim(), type: newNoteType })
                    setNewNoteContent('')
                    reloadNotes()
                  } finally { setSavingNote(false) }
                }}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {savingNote ? 'שומר...' : 'הוסף הערה'}
              </button>
            </div>
          </div>

          {/* Notes list */}
          {notesLoading ? (
            <LoadingSpinner />
          ) : notes.length === 0 ? (
            <EmptyState icon="📝" title="אין פעילות" description="הוסף הערה ראשונה" />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100">
              {notes.map((note) => (
                <div key={note.id} className="flex items-start gap-3 px-4 py-3 group">
                  <span className="text-xl shrink-0">{NOTE_TYPE_ICONS[note.type] ?? '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</p>
                    {note.deal_title && (
                      <p className="text-xs text-slate-500 mt-0.5">עסקה: {note.deal_title}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(note.created_at).toLocaleDateString('he-IL')}
                    </span>
                    <button
                      onClick={async () => {
                        if (window.confirm('האם למחוק הערה זו?')) {
                          await window.api.notes.delete(note.id)
                          reloadNotes()
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-lg leading-none"
                      title="מחק"
                    >×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEditForm && (
        <ClientForm
          client={client}
          onClose={() => setShowEditForm(false)}
          onSaved={() => {
            setShowEditForm(false)
            loadClient()
          }}
        />
      )}
    </div>
  )
}
