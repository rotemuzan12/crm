import React from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  className = '',
  id,
  ...props
}: SelectProps): React.ReactElement {
  const selectId = id ?? (label ? `select-${label.replace(/\s+/g, '-')}` : undefined)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        {...props}
        className={`
          border rounded px-3 py-2 text-sm w-full
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          text-slate-900 bg-white
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          cursor-pointer
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-300'}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
