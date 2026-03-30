import React from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 disabled:bg-blue-400 disabled:border-blue-400',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 disabled:opacity-50',
  danger: 'bg-red-600 hover:bg-red-700 text-white border border-red-600 hover:border-red-700 disabled:bg-red-400 disabled:border-red-400',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border border-transparent disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded
        transition-colors cursor-pointer
        disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {loading && (
        <span className="shrink-0">
          <svg
            className="animate-spin"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </span>
      )}
      {children}
    </button>
  )
}
