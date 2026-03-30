import { useState, useEffect, useCallback } from 'react'
import type { DashboardData } from '@renderer/types'

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.dashboard.getData()
      setData(result)
      setError(null)
    } catch {
      setError('שגיאה בטעינת נתוני לוח הבקרה')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}
