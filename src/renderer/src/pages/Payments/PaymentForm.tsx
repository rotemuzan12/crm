import React, { useState, useEffect } from 'react'
import Modal from '@renderer/components/ui/Modal'
import Input from '@renderer/components/ui/Input'
import Select from '@renderer/components/ui/Select'
import Textarea from '@renderer/components/ui/Textarea'
import Button from '@renderer/components/ui/Button'
import type { Payment, PaymentMethod, Deal } from '@renderer/types'
import { PAYMENT_METHOD_LABELS } from '@renderer/types'

interface Props {
  payment?: Payment
  defaultDealId?: number
  onClose: () => void
  onSaved: () => void
}

const methodOptions = (Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(
  ([value, label]) => ({ value, label })
)

const currencyOptions = [
  { value: 'ILS', label: '₪ שקל (ILS)' },
  { value: 'USD', label: '$ דולר (USD)' },
  { value: 'EUR', label: '€ יורו (EUR)' }
]

function todayIso(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function PaymentForm({ payment, defaultDealId, onClose, onSaved }: Props): React.ReactElement {
  const [dealId, setDealId] = useState<string>(
    payment?.deal_id ? String(payment.deal_id) : defaultDealId ? String(defaultDealId) : ''
  )
  const [amount, setAmount] = useState(payment?.amount != null ? String(payment.amount) : '')
  const [currency, setCurrency] = useState(payment?.currency ?? 'ILS')
  const [paymentDate, setPaymentDate] = useState(payment?.payment_date ?? todayIso())
  const [method, setMethod] = useState<PaymentMethod>(payment?.method ?? 'transfer')
  const [notes, setNotes] = useState(payment?.notes ?? '')
  const [deals, setDeals] = useState<Deal[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.api.deals.list().then(setDeals).catch(() => setDeals([]))
  }, [])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!amount.trim()) e.amount = 'שדה חובה'
    else if (isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'יש להזין סכום תקין'
    if (!paymentDate) e.payment_date = 'שדה חובה'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const data = {
        deal_id: dealId ? Number(dealId) : null,
        amount: Number(amount),
        currency,
        payment_date: paymentDate,
        method,
        notes: notes.trim() || null
      }
      if (payment) {
        await window.api.payments.update(payment.id, data)
      } else {
        await window.api.payments.create(data as Parameters<typeof window.api.payments.create>[0])
      }
      onSaved()
    } catch {
      setErrors({ amount: 'שגיאה בשמירה. אנא נסה שוב.' })
    } finally {
      setSaving(false)
    }
  }

  const dealOptions = [
    { value: '', label: 'ללא עסקה' },
    ...deals.map((d) => ({
      value: String(d.id),
      label: d.client_name ? `${d.title} — ${d.client_name}` : d.title
    }))
  ]

  return (
    <Modal title={payment ? 'עריכת תשלום' : 'תשלום חדש'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <Select
          label="עסקה / פרויקט"
          value={dealId}
          onChange={(e) => setDealId(e.target.value)}
          options={dealOptions}
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="סכום *"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors.amount}
              placeholder="0"
              inputMode="numeric"
              autoFocus
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
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="תאריך תשלום *"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              error={errors.payment_date}
            />
          </div>
          <div className="flex-1">
            <Select
              label="אמצעי תשלום"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              options={methodOptions}
            />
          </div>
        </div>
        <Textarea
          label="הערות"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="פרטים נוספים..."
        />

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose}>ביטול</Button>
          <Button type="submit" variant="primary" loading={saving}>
            {payment ? 'שמור שינויים' : 'הוסף תשלום'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
