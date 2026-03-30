import { useState, useEffect, useCallback } from 'react'
import type { Note } from '@renderer/types'

interface NoteFilters {
  client_id?: number
  deal_id?: number
}

export function useNotes(filters?: NoteFilters) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.notes.list(filters)
      setNotes(data)
      setError(null)
    } catch {
      setError('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }, [filters?.client_id, filters?.deal_id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  return { notes, loading, error, reload: load }
}
