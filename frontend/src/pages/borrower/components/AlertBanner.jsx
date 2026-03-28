const variantClasses = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
}

export default function AlertBanner({ variant = 'info', title, message, actionLabel, onAction }) {
  const cls = variantClasses[variant] || variantClasses.info
  const borderCls = variant === 'info' ? 'border-blue-200' : variant === 'warning' ? 'border-amber-200' : 'border-red-200'
  return (
    <div className={`border rounded-lg p-4 ${cls} ${borderCls}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0">
          {variant === 'info' && 'ℹ️'}
          {variant === 'warning' && '⚠️'}
          {variant === 'danger' && '🔴'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-sm mt-0.5">{message}</p>
          {actionLabel && onAction && (
            <button type="button" onClick={onAction} className="text-sm font-medium mt-2 hover:underline">
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
