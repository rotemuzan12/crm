import { useState, useEffect, useCallback } from 'react'
import type { Payment } from '@renderer/types'

interface PaymentFilters {
  deal_id?: number
  client_id?: number
}

export function usePayments(filters?: PaymentFilters) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.payments.list(filters)
      setPayments(data)
      setError(null)
    } catch {
      setError('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }, [filters?.deal_id, filters?.client_id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  return { payments, loading, error, reload: load }
}
