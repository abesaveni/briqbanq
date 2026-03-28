export default function ExecutiveSummary({ text = [], highlights = [] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Executive Summary</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {text.length > 0 ? (
            text.map((paragraph, i) => (
              <p key={i} className="text-sm text-slate-700 leading-relaxed mb-4 last:mb-0">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed">No summary available.</p>
          )}
        </div>
        <div className="space-y-4">
          {highlights.map((item, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 text-sm">✓</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
