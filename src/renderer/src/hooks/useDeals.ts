import { useState, useEffect, useCallback } from 'react'
import type { Deal } from '@renderer/types'

interface DealFilters {
  search?: string
  stage?: string
  client_id?: number
}

export function useDeals(filters?: DealFilters) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.deals.list(filters)
      setDeals(data)
      setError(null)
    } catch {
      setError('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }, [filters?.search, filters?.stage, filters?.client_id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  return { deals, loading, error, reload: load }
}
