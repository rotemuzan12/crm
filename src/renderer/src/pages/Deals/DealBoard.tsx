import React, { useState } from 'react'
import Badge from '@renderer/components/ui/Badge'
import EmptyState from '@renderer/components/ui/EmptyState'
import DealForm from './DealForm'
import type { Deal, DealStage } from '@renderer/types'
import { STAGE_LABELS, STAGE_COLORS } from '@renderer/types'

interface Props {
  deals: Deal[]
  onReload: () => void
}

const ACTIVE_STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation']
const ALL_STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

const COLUMN_HEADER_COLORS: Record<DealStage, string> = {
  lead: 'bg-slate-100 border-slate-200',
  qualified: 'bg-blue-50 border-blue-200',
  proposal: 'bg-violet-50 border-violet-200',
  negotiation: 'bg-amber-50 border-amber-200',
  closed_won: 'bg-emerald-50 border-emerald-200',
  closed_lost: 'bg-red-50 border-red-200'
}

function formatAmount(amount: number | null, currency: string): string {
  if (amount == null) return '—'
  const symbol = currency === 'ILS' ? '₪' : currency === 'USD' ? '$' : '€'
  return `${symbol}${amount.toLocaleString('he-IL')}`
}

export default function DealBoard({ deals, onReload }: Props): React.ReactElement {
  const [editDeal, setEditDeal] = useState<Deal | undefined>()
  const [showAll, setShowAll] = useState(false)

  const stages = showAll ? ALL_STAGES : ALL_STAGES

  async function handleDelete(deal: Deal) {
    if (!window.confirm(`האם למחוק את העסקה "${deal.title}"?`)) return
    await window.api.deals.delete(deal.id)
    onReload()
  }

  return (
    <div>
      <div className="flex overflow-x-auto gap-4 pb-4" style={{ minHeight: '60vh' }}>
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage)
          const total = stageDeals.reduce((s, d) => s + (d.amount ?? 0), 0)

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-64 flex flex-col"
            >
              {/* Column header */}
              <div className={`rounded-t-lg border px-3 py-2.5 ${COLUMN_HEADER_COLORS[stage]}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-800">{STAGE_LABELS[stage]}</span>
                  <span className="text-xs bg-white/70 text-slate-600 font-medium px-1.5 py-0.5 rounded-full border border-white/50">
                    {stageDeals.length}
                  </span>
                </div>
                {total > 0 && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    ₪{total.toLocaleString('he-IL')}
                  </div>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 border-x border-b border-slate-200 rounded-b-lg bg-slate-50/50 p-2 space-y-2 overflow-y-auto">
                {stageDeals.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-6">אין עסקאות</div>
                ) : (
                  stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => setEditDeal(deal)}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-medium text-sm text-slate-900 leading-snug line-clamp-2">
                          {deal.title}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(deal) }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all flex-shrink-0 text-lg leading-none"
                          title="מחק"
                        >
                          ×
                        </button>
                      </div>
                      {deal.client_name && (
                        <p className="text-xs text-slate-500 mt-1">{deal.client_name}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        {deal.amount != null ? (
                          <span className="text-sm font-semibold text-slate-700">
                            {formatAmount(deal.amount, deal.currency)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">ללא סכום</span>
                        )}
                        {deal.expected_close_date && (
                          <span className="text-xs text-slate-400">
                            {new Date(deal.expected_close_date).toLocaleDateString('he-IL')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editDeal && (
        <DealForm
          deal={editDeal}
          onClose={() => setEditDeal(undefined)}
          onSaved={() => { setEditDeal(undefined); onReload() }}
        />
      )}
    </div>
  )
}
