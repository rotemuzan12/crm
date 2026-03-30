import { useState, useEffect, useCallback } from 'react'
import type { Task } from '@renderer/types'

interface TaskFilters {
  search?: string
  completed?: boolean
  client_id?: number
  deal_id?: number
  due_today?: boolean
}

export function useTasks(filters?: TaskFilters) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.tasks.list(filters)
      setTasks(data)
      setError(null)
    } catch {
      setError('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }, [filters?.search, filters?.completed, filters?.client_id, filters?.deal_id, filters?.due_today]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  return { tasks, loading, error, reload: load }
}
