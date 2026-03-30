import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContacts } from '@renderer/hooks/useContacts'
import Button from '@renderer/components/ui/Button'
import Badge from '@renderer/components/ui/Badge'
import Input from '@renderer/components/ui/Input'
import Select from '@renderer/components/ui/Select'
import LoadingSpinner from '@renderer/components/ui/LoadingSpinner'
import EmptyState from '@renderer/components/ui/EmptyState'
import ContactForm from './ContactForm'
import type { Contact } from '@renderer/types'

export default function ContactsPage(): React.ReactElement {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [clientId, setClientId] = useState<number | undefined>()
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([])
  const [showForm, setShowForm] = useState(false)
  const [editContact, setEditContact] = useState<Contact | undefined>()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { contacts, loading, error, reload } = useContacts({
    search: search || undefined,
    client_id: clientId
  })

  useEffect(() => {
    window.api.clients.list().then((data) =>
      setClients(data.map((c) => ({ id: c.id, name: c.name })))
    )
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(searchInput), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  function openCreate() {
    setEditContact(undefined)
    setShowForm(true)
  }

  function openEdit(e: React.MouseEvent, contact: Contact) {
    e.stopPropagation()
    setEditContact(contact)
    setShowForm(true)
  }

  async function handleDelete(e: React.MouseEvent, contact: Contact) {
    e.stopPropagation()
    if (!window.confirm(`האם למחוק את איש הקשר "${contact.name}"?`)) return
    setDeletingId(contact.id)
    try {
      await window.api.contacts.delete(contact.id)
      reload()
    } finally {
      setDeletingId(null)
    }
  }

  const clientOptions = [
    { value: '', label: 'כל הלקוחות' },
    ...clients.map((c) => ({ value: String(c.id), label: c.name }))
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">אנשי קשר</h1>
          {!loading && (
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded-full">
              {contacts.length}
            </span>
          )}
        </div>
        <Button variant="primary" onClick={openCreate}>+ איש קשר חדש</Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-72">
          <Input
            placeholder="חיפוש אנשי קשר..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-52">
          <Select
            value={clientId !== undefined ? String(clientId) : ''}
            onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : undefined)}
            options={clientOptions}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon="👥"
          title="אין אנשי קשר"
          description={search || clientId ? 'לא נמצאו אנשי קשר התואמים לסינון' : 'התחל על ידי הוספת איש קשר חדש'}
          action={!search && !clientId ? <Button onClick={openCreate}>+ איש קשר חדש</Button> : undefined}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-right font-semibold text-slate-700 px-4 py-3">שם</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">תפקיד</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">לקוח</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">אימייל</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">טלפון</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{contact.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{contact.role ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    {contact.client_name ? (
                      <button
                        onClick={() => navigate(`/clients/${contact.client_id}`)}
                        className="text-blue-600 hover:underline"
                      >
                        {contact.client_name}
                      </button>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{contact.email ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{contact.phone ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={(e) => openEdit(e, contact)}>עריכה</Button>
                      <Button
                        size="sm" variant="ghost"
                        loading={deletingId === contact.id}
                        onClick={(e) => handleDelete(e, contact)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        מחיקה
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ContactForm
          contact={editContact}
          defaultClientId={clientId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload() }}
        />
      )}
    </div>
  )
}
