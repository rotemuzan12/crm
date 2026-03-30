import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', id, ...props }: InputProps): React.ReactElement {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-')}` : undefined)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`
          border rounded px-3 py-2 text-sm w-full
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          placeholder-slate-400 text-slate-900
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
