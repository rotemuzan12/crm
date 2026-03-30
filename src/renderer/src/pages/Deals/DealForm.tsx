import React, { useState, useEffect } from 'react'
import Modal from '@renderer/components/ui/Modal'
import Input from '@renderer/components/ui/Input'
import Select from '@renderer/components/ui/Select'
import Textarea from '@renderer/components/ui/Textarea'
import Button from '@renderer/components/ui/Button'
import type { Deal, DealStage } from '@renderer/types'
import { STAGE_LABELS } from '@renderer/types'

interface Props {
  deal?: Deal
  defaultClientId?: number
  onClose: () => void
  onSaved: () => void
}

const stageOptions = (Object.entries(STAGE_LABELS) as [DealStage, string][]).map(
  ([value, label]) => ({ value, label })
)

const currencyOptions = [
  { value: 'ILS', label: '₪ שקל (ILS)' },
  { value: 'USD', label: '$ דולר (USD)' },
  { value: 'EUR', label: '€ יורו (EUR)' }
]

export default function DealForm({ deal, defaultClientId, onClose, onSaved }: Props): React.ReactElement {
  const [title, setTitle] = useState(deal?.title ?? '')
  const [clientId, setClientId] = useState<string>(
    deal?.client_id ? String(deal.client_id) : defaultClientId ? String(defaultClientId) : ''
  )
  const [stage, setStage] = useState<DealStage>(deal?.stage ?? 'lead')
  const [amount, setAmount] = useState(deal?.amount != null ? String(deal.amount) : '')
  const [currency, setCurrency] = useState(deal?.currency ?? 'ILS')
  const [closeDate, setCloseDate] = useState(deal?.expected_close_date ?? '')
  const [notes, setNotes] = useState(deal?.notes ?? '')
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.api.clients.list().then((data) =>
      setClients(data.map((c) => ({ id: c.id, name: c.name })))
    )
  }, [])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'שדה חובה'
    if (amount && isNaN(Number(amount))) e.amount = 'יש להזין מספר'
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
        client_id: clientId ? Number(clientId) : null,
        stage,
        amount: amount ? Number(amount) : null,
        currency,
        expected_close_date: closeDate || null,
        notes: notes.trim() || null
      }
      if (deal) {
        await window.api.deals.update(deal.id, data)
      } else {
        await window.api.deals.create(data as Parameters<typeof window.api.deals.create>[0])
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

  return (
    <Modal title={deal ? 'עריכת עסקה' : 'עסקה חדשה'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <Input
          label="כותרת *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          placeholder="שם העסקה"
          autoFocus
        />
        <Select
          label="לקוח"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          options={clientOptions}
        />
        <Select
          label="שלב"
          value={stage}
          onChange={(e) => setStage(e.target.value as DealStage)}
          options={stageOptions}
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="סכום"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors.amount}
              placeholder="0"
              type="text"
              inputMode="numeric"
            />
          </div>
          <div className="w-40">
            <Select
              label="מטבע"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={currencyOptions}
            />
          </div>
        </div>
        <Input
          label="תאריך סגירה צפוי"
          value={closeDate}
          onChange={(e) => setCloseDate(e.target.value)}
          type="date"
        />
        <Textarea
          label="הערות"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="פרטים נוספים..."
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>ביטול</Button>
          <Button type="submit" variant="primary" loading={saving}>
            {deal ? 'שמור שינויים' : 'צור עסקה'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
