import { useState, useEffect, useCallback } from 'react'
import type { Client } from '@renderer/types'

interface ClientFilters {
  search?: string
  status?: string
}

export function useClients(filters?: ClientFilters) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.clients.list(filters)
      setClients(data)
      setError(null)
    } catch {
      setError('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }, [filters?.search, filters?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  return { clients, loading, error, reload: load }
}
