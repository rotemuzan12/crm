import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export default function Badge({ children, className = '' }: BadgeProps): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}
    >
      {children}
    </span>
  )
}
