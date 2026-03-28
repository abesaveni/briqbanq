const CardIcon = ({ type, className }) => {
  const c = className || 'w-6 h-6'
  if (type === 'property') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  }
  if (type === 'debt') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  }
  if (type === 'documents') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }
  if (type === 'messages') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  }
  return null
}

export default function StatCard({ label, value, icon, iconType, iconBg, iconColor, subtext }) {
  const colorClass = iconColor || 'text-slate-600'
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 flex items-stretch">
      <div className="flex items-center justify-between gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-600">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg || 'bg-slate-100'}`}>
          {iconType ? (
            <span className={colorClass}>
              <CardIcon type={iconType} className="w-6 h-6" />
            </span>
          ) : (
            <span className={`text-2xl ${colorClass}`}>{icon}</span>
          )}
        </div>
      </div>
    </div>
  )
}
