import { Link, useNavigate } from 'react-router-dom'

export function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-slate-500 mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span>›</span>}
          {item.link ? (
            <Link to={item.link} className="hover:text-slate-900">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-700">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

export function BackToSettings() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/borrower/settings')}
      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
    >
      <span>←</span>
      <span>Back to Settings</span>
    </button>
  )
}

export function Toggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description && (
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          enabled ? 'bg-indigo-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            enabled ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export function FormInput({ label, required, error, className = '', ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...props}
        className={`w-full border rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? 'border-red-500' : 'border-slate-300'
        } ${className}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function FormSelect({ label, required, error, options, value, onChange, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? 'border-red-500' : 'border-slate-300'
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
