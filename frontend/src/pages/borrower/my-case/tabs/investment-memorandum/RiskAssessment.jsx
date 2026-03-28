const borderMap = { green: 'border-emerald-500', amber: 'border-amber-500', blue: 'border-blue-500' }
const bgMap = { green: 'bg-emerald-50', amber: 'bg-amber-50', blue: 'bg-blue-50' }
const iconBgMap = { green: 'bg-emerald-500', amber: 'bg-amber-500', blue: 'bg-blue-500' }
const iconMap = { positive: '✓', warning: '⚠', info: 'ℹ' }

export default function RiskAssessment({ risks = [] }) {
  if (risks.length === 0) return null
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Risk Assessment</h2>
      <div className="space-y-4">
        {risks.map((risk, i) => (
          <div
            key={i}
            className={`border-l-4 rounded-r-lg p-4 ${borderMap[risk.color] || 'border-slate-300'} ${bgMap[risk.color] || 'bg-slate-50'}`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${iconBgMap[risk.color] || 'bg-slate-500'}`}
              >
                {iconMap[risk.type] || '•'}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">{risk.title}</h3>
                <p className="text-sm text-slate-700">{risk.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
