import React from 'react'

interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-5xl mb-4 select-none">{icon}</span>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-5 max-w-xs">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
