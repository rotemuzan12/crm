import React, { useState } from 'react'
import Modal from '@renderer/components/ui/Modal'
import Input from '@renderer/components/ui/Input'
import Select from '@renderer/components/ui/Select'
import Textarea from '@renderer/components/ui/Textarea'
import Button from '@renderer/components/ui/Button'
import type { Client } from '@renderer/types'

interface Props {
  client?: Client
  onClose: () => void
  onSaved: () => void
}

interface FormValues {
  name: string
  company: string
  email: string
  phone: string
  website: string
  address: string
  status: 'active' | 'inactive' | 'lead'
  notes: string
}

const statusOptions = [
  { value: 'active', label: 'פעיל' },
  { value: 'inactive', label: 'לא פעיל' },
  { value: 'lead', label: 'ליד' },
]

export default function ClientForm({ client, onClose, onSaved }: Props): React.ReactElement {
  const [values, setValues] = useState<FormValues>({
    name: client?.name ?? '',
    company: client?.company ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    website: client?.website ?? '',
    address: client?.address ?? '',
    status: client?.status ?? 'lead',
    notes: client?.notes ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [saving, setSaving] = useState(false)

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormValues, string>> = {}
    if (!values.name.trim()) newErrors.name = 'שם הלקוח הוא שדה חובה'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        name: values.name.trim(),
        company: values.company.trim() || null,
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
        website: values.website.trim() || null,
        address: values.address.trim() || null,
        status: values.status,
        notes: values.notes.trim() || null,
      }
      if (client) {
        await window.api.clients.update(client.id, payload)
      } else {
        await window.api.clients.create(payload)
      }
      onSaved()
    } catch {
      setErrors({ name: 'שגיאה בשמירת הנתונים. אנא נסה שוב.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={client ? 'עריכת לקוח' : 'לקוח חדש'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <Input
          label="שם *"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          placeholder="שם הלקוח"
          autoFocus
        />
        <Input
          label="חברה"
          value={values.company}
          onChange={(e) => set('company', e.target.value)}
          placeholder="שם החברה"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="אימייל"
            type="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="email@example.com"
          />
          <Input
            label="טלפון"
            type="tel"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="050-0000000"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="אתר"
            type="url"
            value={values.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://example.com"
          />
          <Select
            label="סטטוס"
            value={values.status}
            onChange={(e) => set('status', e.target.value as FormValues['status'])}
            options={statusOptions}
          />
        </div>
        <Input
          label="כתובת"
          value={values.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="כתובת מלאה"
        />
        <Textarea
          label="הערות"
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="הערות נוספות על הלקוח..."
          rows={3}
        />

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {client ? 'שמור שינויים' : 'צור לקוח'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
