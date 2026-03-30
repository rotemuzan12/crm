import React from 'react'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface LoadingSpinnerProps {
  size?: SpinnerSize
  centered?: boolean
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
}

export default function LoadingSpinner({ size = 'md', centered = true }: LoadingSpinnerProps): React.ReactElement {
  const spinner = (
    <div
      className={`
        ${sizeClasses[size]}
        border-slate-200 border-t-blue-600 rounded-full animate-spin
      `}
      role="status"
      aria-label="טוען..."
    />
  )

  if (!centered) return spinner

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[120px]">
      {spinner}
    </div>
  )
}
