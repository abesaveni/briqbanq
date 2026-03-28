const moduleIcons = {
  brickbanq: '🏠',
  'grow-accounting': '🧮',
  'grow-lending': '🤝',
  'grow-trust': '🤝',
  'grow-househomes': '📈',
  'grow-receivership': '💵',
  'grow-settlement': '🏢',
  'grow-payments': '💳',
}

const moduleCategories = {
  brickbanq: 'Virtual MP Platform',
  'grow-accounting': 'Practice Management',
  'grow-lending': 'Automated Lending',
  'grow-trust': 'Trust Account Management',
  'grow-househomes': 'Fund Management',
  'grow-receivership': 'Restructuring & MIP',
  'grow-settlement': 'Property Settlement',
  'grow-payments': 'Payment Gateway',
}

export default function SpecializedModules({ modules = [] }) {
  if (modules.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Specialized Modules</h2>
      <p className="text-sm text-slate-600 mb-4">
        Click any module to see how core add-ons integrate and enhance functionality
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
          >
            <div className="absolute top-2 right-2">
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3 text-xl text-slate-600">
              {moduleIcons[mod.id] || mod.icon || '📦'}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">{mod.name}</h3>
            <p className="text-xs text-slate-600">{moduleCategories[mod.id] || mod.category}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
