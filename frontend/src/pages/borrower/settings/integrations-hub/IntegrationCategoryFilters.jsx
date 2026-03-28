/**
 * Horizontal category filter pills for Integrations Hub.
 * Selected category driven by props; onChange for backend wiring.
 */
export default function IntegrationCategoryFilters({ categories = [], selectedId = 'all', onSelect }) {
  if (categories.length === 0) return null

  return (
    <div className="mb-6 w-full min-w-0">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isSelected = cat.id === selectedId
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect?.(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
              {cat.id !== 'all' && cat.count != null ? ` (${cat.count})` : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
