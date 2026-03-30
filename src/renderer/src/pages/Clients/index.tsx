import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients } from '@renderer/hooks/useClients'
import Button from '@renderer/components/ui/Button'
import Badge from '@renderer/components/ui/Badge'
import Input from '@renderer/components/ui/Input'
import Select from '@renderer/components/ui/Select'
import LoadingSpinner from '@renderer/components/ui/LoadingSpinner'
import EmptyState from '@renderer/components/ui/EmptyState'
import ClientForm from './ClientForm'
import { STATUS_LABELS, STATUS_COLORS } from '@renderer/types'
import type { Client } from '@renderer/types'

const statusFilterOptions = [
  { value: '', label: 'כולם' },
  { value: 'active', label: 'פעיל' },
  { value: 'inactive', label: 'לא פעיל' },
  { value: 'lead', label: 'ליד' },
]

export default function ClientsPage(): React.ReactElement {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState<Client | undefined>()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { clients, loading, error, reload } = useClients({ search: search || undefined, status: status || undefined })

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(searchInput), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput])

  function openCreate() {
    setEditClient(undefined)
    setShowForm(true)
  }

  function openEdit(e: React.MouseEvent, client: Client) {
    e.stopPropagation()
    setEditClient(client)
    setShowForm(true)
  }

  async function handleDelete(e: React.MouseEvent, client: Client) {
    e.stopPropagation()
    if (!window.confirm(`האם למחוק את הלקוח "${client.name}"?`)) return
    setDeletingId(client.id)
    try {
      await window.api.clients.delete(client.id)
      reload()
    } finally {
      setDeletingId(null)
    }
  }

  function handleSaved() {
    setShowForm(false)
    reload()
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">לקוחות</h1>
          {!loading && (
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded-full">
              {clients.length}
            </span>
          )}
        </div>
        <Button variant="primary" onClick={openCreate}>
          + לקוח חדש
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-72">
          <Input
            placeholder="חיפוש לקוחות..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusFilterOptions}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon="👤"
          title="אין לקוחות"
          description={search || status ? 'לא נמצאו לקוחות התואמים לסינון שנבחר' : 'התחל על ידי הוספת לקוח חדש'}
          action={!search && !status ? <Button onClick={openCreate}>+ לקוח חדש</Button> : undefined}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-right font-semibold text-slate-700 px-4 py-3">שם</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">חברה</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">אימייל</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">טלפון</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">סטטוס</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">{client.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{client.company ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{client.email ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{client.phone ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <Badge className={STATUS_COLORS[client.status]}>
                      {STATUS_LABELS[client.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => openEdit(e, client)}
                      >
                        עריכה
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={deletingId === client.id}
                        onClick={(e) => handleDelete(e, client)}
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
        <ClientForm
          client={editClient}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
