/**
 * Displays summary metrics for the Integrations Hub (total, connected, required, platform health).
 * All data driven by props; backend can pass same shape.
 */
export default function IntegrationMetrics({ metrics = {} }) {
  const total = metrics.total ?? 0
  const connected = metrics.connected ?? 0
  const requiredCurrent = metrics.requiredCurrent ?? 0
  const requiredTotal = metrics.requiredTotal ?? 0
  const platformHealthPercent = metrics.platformHealthPercent ?? 0

  const cards = [
    {
      label: 'Total Integrations',
      value: total,
      icon: '🔗',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
    {
      label: 'Connected',
      value: connected,
      icon: '✓',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Required',
      value: `${requiredCurrent}/${requiredTotal}`,
      icon: '⏱',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Platform health',
      value: `${platformHealthPercent}%`,
      icon: '⚡',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full min-w-0">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between min-w-0"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{card.label}</p>
            <p className="text-xl lg:text-2xl font-bold text-slate-900 mt-0.5 truncate">{card.value}</p>
          </div>
          <div className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center ${card.iconBg} ${card.iconColor}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  )
}
