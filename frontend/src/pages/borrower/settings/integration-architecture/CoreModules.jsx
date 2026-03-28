const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  green: 'bg-emerald-100 text-emerald-600',
  orange: 'bg-orange-100 text-orange-600',
}

const moduleDescriptions = {
  'grow-crm': 'Universal Contact & Relationship Management',
  'grow-documents': 'Integrated Document Management System',
  'grow-time-billings': 'Time tracking & revenue management',
  'grow-hq': 'Centralized management console',
}

export default function CoreModules({ modules = [] }) {
  if (modules.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Core Add-On Modules</h2>
      <p className="text-sm text-slate-600 mb-4">
        Click any module to see how core add-ons integrate and enhance functionality
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${colorClasses[mod.color] || 'bg-slate-100 text-slate-600'}`}
              >
                {mod.icon}
              </div>
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">{mod.name}</h3>
            <p className="text-xs text-slate-600">{moduleDescriptions[mod.id] || mod.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
