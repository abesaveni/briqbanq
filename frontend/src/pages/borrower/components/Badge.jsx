const variantClasses = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-amber-500 text-white',
  medium: 'bg-gray-500 text-white',
  done: 'bg-emerald-500 text-white',
  overdue: 'bg-red-500 text-white',
  'in-progress': 'bg-blue-500 text-white',
  pending: 'bg-amber-100 text-amber-700',
  'in-auction': 'border border-gray-400 text-gray-700 bg-white',
  completed: 'bg-emerald-100 text-emerald-700',
  'under-contract': 'bg-indigo-100 text-indigo-700',
  protected: 'bg-amber-100 text-amber-700',
  'brickbanq-now': 'bg-indigo-600 text-white',
  draft: 'bg-gray-100 text-gray-600 border border-gray-300',
  cancelled: 'bg-red-100 text-red-700',
}

export default function Badge({ label, variant = 'pending' }) {
  const cls = variantClasses[variant] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
