export default function TabBar({ tabs = [], activeTab, onTabChange }) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-800">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
