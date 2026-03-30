import { useState, useEffect, useCallback } from 'react'
import type { Contact } from '@renderer/types'

interface ContactFilters {
  search?: string
  client_id?: number
}

export function useContacts(filters?: ContactFilters) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.contacts.list(filters)
      setContacts(data)
      setError(null)
    } catch {
      setError('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }, [filters?.search, filters?.client_id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  return { contacts, loading, error, reload: load }
}
