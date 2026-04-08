const STYLES = {
  // Backend standard statuses
  draft:        'bg-slate-100 text-slate-600',
  submitted:    'bg-blue-50 text-blue-700',
  under_review: 'bg-amber-50 text-amber-700',
  underreview:  'bg-amber-50 text-amber-700',
  approved:     'bg-emerald-50 text-emerald-700',
  listed:       'bg-indigo-50 text-indigo-700',
  auction:      'bg-purple-50 text-purple-700',
  inauction:    'bg-purple-50 text-purple-700',
  funded:       'bg-teal-50 text-teal-700',
  closed:       'bg-slate-100 text-slate-500',
  rejected:     'bg-red-50 text-red-700',
  // Task/priority statuses
  urgent:       'bg-red-100 text-red-700',
  high:         'bg-amber-100 text-amber-700',
  medium:       'bg-slate-100 text-slate-600',
  low:          'bg-slate-50 text-slate-500',
  done:         'bg-emerald-50 text-emerald-700',
  completed:    'bg-emerald-50 text-emerald-700',
  new:          'bg-indigo-50 text-indigo-700',
  inprogress:   'bg-blue-50 text-blue-700',
  active:       'bg-emerald-50 text-emerald-700',
  pending:      'bg-amber-50 text-amber-700',
  inreview:     'bg-amber-50 text-amber-700',
}

export default function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase().replace(/[\s_-]/g, '')
  const className = STYLES[key] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${className}`}>
      {status}
    </span>
  )
}
