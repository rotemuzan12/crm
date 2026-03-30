import React from 'react'

interface CardProps {
  title?: string
  rightAction?: React.ReactNode
  children: React.ReactNode
  padding?: boolean
  className?: string
}

export default function Card({
  title,
  rightAction,
  children,
  padding = true,
  className = '',
}: CardProps): React.ReactElement {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {rightAction && <div>{rightAction}</div>}
        </div>
      )}
      {!title && rightAction && (
        <div className="flex justify-end px-4 pt-3">{rightAction}</div>
      )}
      <div className={padding ? 'p-4' : ''}>{children}</div>
    </div>
  )
}
