export default function OperatorRecommendations({ recommendations = {} }) {
  const high = recommendations.highPriority || {}
  const medium = recommendations.mediumPriority || {}
  const always = recommendations.alwaysIncluded || {}

  return (
    <div
      className="border border-blue-200 rounded-lg p-6"
      style={{ backgroundColor: '#EFF6FF' }}
    >
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">💡</span>
        <h2 className="text-lg font-semibold text-slate-900">Operator Recommendations</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            {high.title || 'High Priority'}
          </h3>
          <p className="text-xs text-slate-600 mb-3">{high.subtitle || 'Operators using 2+ specialized modules'}</p>
          <ul className="space-y-1 text-xs text-slate-700">
            {(high.recommendations || []).map((item, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-emerald-500">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            {medium.title || 'Medium Priority'}
          </h3>
          <p className="text-xs text-slate-600 mb-3">{medium.subtitle || 'Operators with billable services'}</p>
          <ul className="space-y-1 text-xs text-slate-700">
            {(medium.recommendations || []).map((item, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-emerald-500">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            {always.title || 'Always Included'}
          </h3>
          <p className="text-xs text-slate-600 mb-3">{always.subtitle || 'Every operator gets Grow HQ'}</p>
          <ul className="space-y-1 text-xs text-slate-700">
            {(always.recommendations || []).map((item, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-emerald-500">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
