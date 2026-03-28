const tabs = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'property', label: 'Property', icon: '🏡' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'investment-memo', label: 'Investment Memorandum', icon: '📊' },
  { id: 'settlement', label: 'Settlement', icon: '🤝' },
  { id: 'bids', label: 'Bids', icon: '💰' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'activity', label: 'Activity', icon: '⚡' },
]

export default function TabNavigation({ activeTab, onTabChange }) {
  return (
    <div className="border-b border-slate-200">
      <nav className="flex space-x-6 px-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
