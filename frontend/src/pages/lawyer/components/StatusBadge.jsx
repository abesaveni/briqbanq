const STYLES = {
  urgent: 'bg-[#EF4444] text-white',
  high: 'bg-[#F59E0B] text-white',
  medium: 'bg-[#6B7280] text-white',
  low: 'bg-[#9CA3AF] text-white',
  done: 'bg-[#10B981] text-white',
  completed: 'bg-[#10B981] text-white',
  new: 'bg-[#6366F1] text-white',
  inprogress: 'bg-[#6366F1] text-white',
  inauction: 'bg-blue-100 text-blue-800',
  active: 'bg-emerald-100 text-emerald-800',
  pending: 'border border-gray-300 text-gray-700',
  inreview: 'border border-gray-300 text-gray-600',
}

export default function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase().replace(/\s+/g, '')
  const className = STYLES[key] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {status}
    </span>
  )
}
