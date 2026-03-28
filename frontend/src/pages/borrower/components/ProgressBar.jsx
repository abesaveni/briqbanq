const colorClasses = {
  indigo: 'bg-indigo-600',
  blue: 'bg-blue-600',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
}

export default function ProgressBar({ value = 0, color = 'indigo' }) {
  const fillCls = colorClasses[color] || colorClasses.indigo
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${fillCls}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
