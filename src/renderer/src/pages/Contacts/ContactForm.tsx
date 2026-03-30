import React, { useState, useEffect } from 'react'
import Modal from '@renderer/components/ui/Modal'
import Input from '@renderer/components/ui/Input'
import Select from '@renderer/components/ui/Select'
import Button from '@renderer/components/ui/Button'
import type { Contact, Client } from '@renderer/types'

interface Props {
  contact?: Contact
  defaultClientId?: number
  onClose: () => void
  onSaved: () => void
}

interface FormValues {
  name: string
  role: string
  client_id: string
  email: string
  phone: string
}

export default function ContactForm({ contact, defaultClientId, onClose, onSaved }: Props): React.ReactElement {
  const [values, setValues] = useState<FormValues>({
    name: contact?.name ?? '',
    role: contact?.role ?? '',
    client_id: contact?.client_id?.toString() ?? defaultClientId?.toString() ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)

  useEffect(() => {
    window.api.clients.list().then((data) => {
      setClients(data)
      setClientsLoading(false)
    }).catch(() => setClientsLoading(false))
  }, [])

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormValues, string>> = {}
    if (!values.name.trim()) newErrors.name = 'שם הוא שדה חובה'
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
        role: values.role.trim() || null,
        client_id: values.client_id ? parseInt(values.client_id, 10) : null,
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
      }
      if (contact) {
        await window.api.contacts.update(contact.id, payload)
      } else {
        await window.api.contacts.create(payload)
      }
      onSaved()
    } catch {
      setErrors({ name: 'שגיאה בשמירת הנתונים. אנא נסה שוב.' })
    } finally {
      setSaving(false)
    }
  }

  const clientOptions = [
    { value: '', label: 'ללא לקוח' },
    ...clients.map((c) => ({ value: c.id.toString(), label: `${c.name}${c.company ? ` — ${c.company}` : ''}` })),
  ]

  return (
    <Modal title={contact ? 'עריכת איש קשר' : 'איש קשר חדש'} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <Input
          label="שם *"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          placeholder="שם מלא"
          autoFocus
        />
        <Input
          label="תפקיד"
          value={values.role}
          onChange={(e) => set('role', e.target.value)}
          placeholder="מנהל שיווק, CTO..."
        />
        <Select
          label="לקוח"
          value={values.client_id}
          onChange={(e) => set('client_id', e.target.value)}
          options={clientOptions}
          disabled={clientsLoading}
        />
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

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {contact ? 'שמור שינויים' : 'צור איש קשר'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
