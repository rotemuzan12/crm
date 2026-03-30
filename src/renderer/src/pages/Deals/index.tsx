import React, { useState } from 'react'
import { useDeals } from '@renderer/hooks/useDeals'
import Button from '@renderer/components/ui/Button'
import Input from '@renderer/components/ui/Input'
import Select from '@renderer/components/ui/Select'
import LoadingSpinner from '@renderer/components/ui/LoadingSpinner'
import EmptyState from '@renderer/components/ui/EmptyState'
import DealBoard from './DealBoard'
import DealTable from './DealTable'
import DealForm from './DealForm'
import type { DealStage } from '@renderer/types'
import { STAGE_LABELS } from '@renderer/types'

type ViewMode = 'board' | 'table'

const stageFilterOptions = [
  { value: '', label: 'כל השלבים' },
  ...Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label }))
]

export default function DealsPage(): React.ReactElement {
  const [view, setView] = useState<ViewMode>('board')
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { deals, loading, error, reload } = useDeals({
    search: search || undefined,
    stage: stage as DealStage || undefined
  })

  const totalValue = deals.reduce((s, d) => s + (d.amount ?? 0), 0)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">עסקאות</h1>
          {!loading && (
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded-full">
              {deals.length}
            </span>
          )}
          {!loading && totalValue > 0 && (
            <span className="text-sm text-slate-500">
              סה"כ ₪{totalValue.toLocaleString('he-IL')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                view === 'board'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              לוח
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                view === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              טבלה
            </button>
          </div>
          <Button variant="primary" onClick={() => setShowForm(true)}>+ עסקה חדשה</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-72">
          <Input
            placeholder="חיפוש עסקאות..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {view === 'table' && (
          <div className="w-44">
            <Select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              options={stageFilterOptions}
            />
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      ) : deals.length === 0 ? (
        <EmptyState
          icon="💼"
          title="אין עסקאות"
          description={search ? 'לא נמצאו עסקאות התואמות לחיפוש' : 'התחל על ידי יצירת עסקה חדשה'}
          action={!search ? <Button onClick={() => setShowForm(true)}>+ עסקה חדשה</Button> : undefined}
        />
      ) : view === 'board' ? (
        <DealBoard deals={deals} onReload={reload} />
      ) : (
        <DealTable deals={deals} onReload={reload} />
      )}

      {showForm && (
        <DealForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload() }}
        />
      )}
    </div>
  )
}
