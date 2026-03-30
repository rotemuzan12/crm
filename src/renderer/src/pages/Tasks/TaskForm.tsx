import React, { useState, useEffect } from 'react'
import Modal from '@renderer/components/ui/Modal'
import Input from '@renderer/components/ui/Input'
import Select from '@renderer/components/ui/Select'
import Textarea from '@renderer/components/ui/Textarea'
import Button from '@renderer/components/ui/Button'
import type { Task } from '@renderer/types'
import { PRIORITY_LABELS } from '@renderer/types'

interface Props {
  task?: Task
  defaultClientId?: number
  defaultDealId?: number
  onClose: () => void
  onSaved: () => void
}

const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))

export default function TaskForm({ task, defaultClientId, defaultDealId, onClose, onSaved }: Props): React.ReactElement {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [clientId, setClientId] = useState<string>(
    task?.client_id ? String(task.client_id) : defaultClientId ? String(defaultClientId) : ''
  )
  const [dealId, setDealId] = useState<string>(
    task?.deal_id ? String(task.deal_id) : defaultDealId ? String(defaultDealId) : ''
  )
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([])
  const [deals, setDeals] = useState<Array<{ id: number; title: string; client_id: number | null }>>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.api.clients.list().then((data) =>
      setClients(data.map((c) => ({ id: c.id, name: c.name })))
    )
    window.api.deals.list().then((data) =>
      setDeals(data.map((d) => ({ id: d.id, title: d.title, client_id: d.client_id })))
    )
  }, [])

  const filteredDeals = clientId
    ? deals.filter((d) => d.client_id === Number(clientId))
    : deals

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'שדה חובה'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || null,
        client_id: clientId ? Number(clientId) : null,
        deal_id: dealId ? Number(dealId) : null,
        priority,
        due_date: dueDate || null,
        completed: task?.completed ?? false
      }
      if (task) {
        await window.api.tasks.update(task.id, data)
      } else {
        await window.api.tasks.create(data as Parameters<typeof window.api.tasks.create>[0])
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const clientOptions = [
    { value: '', label: 'ללא לקוח' },
    ...clients.map((c) => ({ value: String(c.id), label: c.name }))
  ]

  const dealOptions = [
    { value: '', label: 'ללא עסקה' },
    ...filteredDeals.map((d) => ({ value: String(d.id), label: d.title }))
  ]

  return (
    <Modal title={task ? 'עריכת משימה' : 'משימה חדשה'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <Input
          label="כותרת *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          placeholder="תיאור המשימה"
          autoFocus
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <Select
              label="לקוח"
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setDealId('') }}
              options={clientOptions}
            />
          </div>
          <div className="flex-1">
            <Select
              label="עסקה"
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              options={dealOptions}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Select
              label="עדיפות"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              options={priorityOptions}
            />
          </div>
          <div className="flex-1">
            <Input
              label="תאריך יעד"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              type="date"
            />
          </div>
        </div>
        <Textarea
          label="תיאור"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="פרטים נוספים..."
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>ביטול</Button>
          <Button type="submit" variant="primary" loading={saving}>
            {task ? 'שמור שינויים' : 'צור משימה'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
