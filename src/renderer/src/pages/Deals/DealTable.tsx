import React, { useState } from 'react'
import Button from '@renderer/components/ui/Button'
import Badge from '@renderer/components/ui/Badge'
import DealForm from './DealForm'
import type { Deal } from '@renderer/types'
import { STAGE_LABELS, STAGE_COLORS } from '@renderer/types'

interface Props {
  deals: Deal[]
  onReload: () => void
}

function formatAmount(amount: number | null, currency: string): string {
  if (amount == null) return '—'
  const symbol = currency === 'ILS' ? '₪' : currency === 'USD' ? '$' : '€'
  return `${symbol}${amount.toLocaleString('he-IL')}`
}

export default function DealTable({ deals, onReload }: Props): React.ReactElement {
  const [editDeal, setEditDeal] = useState<Deal | undefined>()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function handleDelete(deal: Deal) {
    if (!window.confirm(`האם למחוק את העסקה "${deal.title}"?`)) return
    setDeletingId(deal.id)
    try {
      await window.api.deals.delete(deal.id)
      onReload()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-right font-semibold text-slate-700 px-4 py-3">כותרת</th>
              <th className="text-right font-semibold text-slate-700 px-4 py-3">לקוח</th>
              <th className="text-right font-semibold text-slate-700 px-4 py-3">שלב</th>
              <th className="text-right font-semibold text-slate-700 px-4 py-3">סכום</th>
              <th className="text-right font-semibold text-slate-700 px-4 py-3">תאריך סגירה</th>
              <th className="text-right font-semibold text-slate-700 px-4 py-3">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-slate-900">{deal.title}</td>
                <td className="px-4 py-2.5 text-slate-600">{deal.client_name ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <Badge className={STAGE_COLORS[deal.stage]}>
                    {STAGE_LABELS[deal.stage]}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-slate-700 font-medium">
                  {formatAmount(deal.amount, deal.currency)}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {deal.expected_close_date
                    ? new Date(deal.expected_close_date).toLocaleDateString('he-IL')
                    : '—'}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditDeal(deal)}>עריכה</Button>
                    <Button
                      size="sm" variant="ghost"
                      loading={deletingId === deal.id}
                      onClick={() => handleDelete(deal)}
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
        {deals.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm">אין עסקאות</div>
        )}
      </div>

      {editDeal && (
        <DealForm
          deal={editDeal}
          onClose={() => setEditDeal(undefined)}
          onSaved={() => { setEditDeal(undefined); onReload() }}
        />
      )}
    </>
  )
}
