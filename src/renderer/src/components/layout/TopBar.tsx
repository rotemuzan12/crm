import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SearchResult } from '@renderer/types'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'לוח בקרה',
  '/clients': 'לקוחות',
  '/contacts': 'אנשי קשר',
  '/deals': 'עסקאות',
  '/tasks': 'משימות',
  '/settings': 'הגדרות',
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/clients/')) return 'פרטי לקוח'
  return PAGE_TITLES[pathname] ?? ''
}

const TYPE_LABELS: Record<string, string> = {
  client: 'לקוח',
  contact: 'איש קשר',
  deal: 'עסקה',
  task: 'משימה',
}

const TYPE_ICONS: Record<string, string> = {
  client: '👤',
  contact: '👥',
  deal: '💼',
  task: '✓',
}

function getResultPath(result: SearchResult): string {
  switch (result.type) {
    case 'client': return `/clients/${result.id}`
    case 'contact': return '/contacts'
    case 'deal': return '/deals'
    case 'task': return '/tasks'
    default: return '/'
  }
}

export default function TopBar(): React.ReactElement {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pageTitle = getPageTitle(location.pathname)

  const performSearch = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([])
      setShowDropdown(false)
      return
    }
    setSearching(true)
    try {
      const data = await window.api.search.global(q)
      setResults(data)
      setShowDropdown(true)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 3) {
      setResults([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(() => performSearch(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, performSearch])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(result: SearchResult) {
    navigate(getResultPath(result))
    setQuery('')
    setShowDropdown(false)
    setResults([])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      setQuery('')
    }
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <h1 className="text-slate-900 font-semibold text-base">{pageTitle}</h1>
      </div>

      <div ref={containerRef} className="relative w-72">
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="חיפוש גלובלי..."
            className="w-full border border-slate-300 rounded px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 placeholder-slate-400"
          />
          {searching && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </span>
          )}
        </div>

        {showDropdown && results.length > 0 && (
          <div className="absolute top-full mt-1 right-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-right transition-colors"
                onClick={() => handleSelect(result)}
              >
                <span className="text-base shrink-0">{TYPE_ICONS[result.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{result.title}</p>
                  <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                  {TYPE_LABELS[result.type]}
                </span>
              </button>
            ))}
          </div>
        )}

        {showDropdown && results.length === 0 && !searching && query.length >= 3 && (
          <div className="absolute top-full mt-1 right-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 px-4 py-3">
            <p className="text-sm text-slate-500 text-center">לא נמצאו תוצאות</p>
          </div>
        )}
      </div>
    </header>
  )
}
