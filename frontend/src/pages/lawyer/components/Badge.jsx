const variantClasses = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-amber-500 text-white',
  medium: 'bg-gray-500 text-white',
  done: 'bg-emerald-500 text-white',
  overdue: 'bg-red-500 text-white',
  'in-progress': 'bg-blue-600 text-white',
  pending: 'bg-gray-200 text-gray-700',
  completed: 'bg-emerald-100 text-emerald-700',
}

export default function Badge({ label, variant = 'pending' }) {
  const cls = variantClasses[variant] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
