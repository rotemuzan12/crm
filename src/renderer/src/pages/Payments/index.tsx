import React, { useState, useEffect } from 'react'
import { usePayments } from '@renderer/hooks/usePayments'
import Button from '@renderer/components/ui/Button'
import Select from '@renderer/components/ui/Select'
import LoadingSpinner from '@renderer/components/ui/LoadingSpinner'
import EmptyState from '@renderer/components/ui/EmptyState'
import PaymentForm from './PaymentForm'
import type { Payment, Deal } from '@renderer/types'
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ICONS } from '@renderer/types'

function formatAmount(amount: number, currency: string): string {
  const symbol = currency === 'ILS' ? '₪' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : ''
  return `${symbol}${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('he-IL')
}

export default function PaymentsPage(): React.ReactElement {
  const [dealId, setDealId] = useState<number | undefined>()
  const [deals, setDeals] = useState<Deal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | undefined>()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { payments, loading, error, reload } = usePayments({ deal_id: dealId })

  useEffect(() => {
    window.api.deals.list().then(setDeals).catch(() => setDeals([]))
  }, [])

  function openCreate() {
    setEditPayment(undefined)
    setShowForm(true)
  }

  function openEdit(payment: Payment) {
    setEditPayment(payment)
    setShowForm(true)
  }

  async function handleDelete(payment: Payment) {
    if (!window.confirm(`האם למחוק את התשלום על סך ${formatAmount(payment.amount, payment.currency)}?`)) return
    setDeletingId(payment.id)
    try {
      await window.api.payments.delete(payment.id)
      reload()
    } finally {
      setDeletingId(null)
    }
  }

  const dealOptions = [
    { value: '', label: 'כל העסקאות' },
    ...deals.map((d) => ({
      value: String(d.id),
      label: d.client_name ? `${d.title} — ${d.client_name}` : d.title
    }))
  ]

  // Totals by currency for the current filter
  const totalsByCurrency = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + p.amount
    return acc
  }, {})

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">תשלומים</h1>
          {!loading && (
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded-full">
              {payments.length}
            </span>
          )}
        </div>
        <Button variant="primary" onClick={openCreate}>+ תשלום חדש</Button>
      </div>

      {/* Totals summary */}
      {!loading && payments.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-6">
          <div className="text-emerald-700 text-sm font-medium">סה״כ התקבל:</div>
          <div className="flex items-center gap-4">
            {Object.entries(totalsByCurrency).map(([currency, total]) => (
              <div key={currency} className="text-emerald-900 text-lg font-bold">
                {formatAmount(total, currency)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-72">
          <Select
            value={dealId !== undefined ? String(dealId) : ''}
            onChange={(e) => setDealId(e.target.value ? Number(e.target.value) : undefined)}
            options={dealOptions}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon="💰"
          title="אין תשלומים"
          description={dealId ? 'לא נמצאו תשלומים לעסקה זו' : 'התחל על ידי הוספת תשלום חדש'}
          action={!dealId ? <Button onClick={openCreate}>+ תשלום חדש</Button> : undefined}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-right font-semibold text-slate-700 px-4 py-3">תאריך</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">סכום</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">אמצעי תשלום</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">עסקה / פרויקט</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">לקוח</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">הערות</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{formatDate(p.payment_date)}</td>
                  <td className="px-4 py-2.5 font-semibold text-emerald-700 whitespace-nowrap">
                    {formatAmount(p.amount, p.currency)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{PAYMENT_METHOD_ICONS[p.method]}</span>
                      <span>{PAYMENT_METHOD_LABELS[p.method]}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{p.deal_title ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{p.client_name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate" title={p.notes ?? ''}>
                    {p.notes ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>עריכה</Button>
                      <Button
                        size="sm" variant="ghost"
                        loading={deletingId === p.id}
                        onClick={() => handleDelete(p)}
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
        <PaymentForm
          payment={editPayment}
          defaultDealId={dealId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload() }}
        />
      )}
    </div>
  )
}
