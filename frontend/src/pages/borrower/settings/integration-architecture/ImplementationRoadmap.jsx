const phaseLabels = {
  1: 'Day 1',
  2: 'Day 2-5',
  3: 'Day 5-8',
  4: 'Ongoing',
}

export default function ImplementationRoadmap({ phases = [] }) {
  if (phases.length === 0) return null

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
          <span className="text-xs">🚀</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Activation & Implementation Roadmap</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {phases.map((p) => (
          <div key={p.phase} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="inline-block bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                  Phase {p.phase}
                </span>
                <h3 className="text-sm font-semibold text-slate-900">{p.title}</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">{phaseLabels[p.phase] || ''}</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-700">
              {(p.tasks || []).map((task, i) => (
                <li key={i}>• {task}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
