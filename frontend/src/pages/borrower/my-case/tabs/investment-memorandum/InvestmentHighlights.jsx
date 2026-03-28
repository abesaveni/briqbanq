const colorMap = {
  green: 'bg-green-50 border-green-200',
  blue: 'bg-blue-50 border-blue-200',
  purple: 'bg-purple-50 border-purple-200',
  red: 'bg-red-50 border-red-200',
}
const iconBgMap = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
}

export default function InvestmentHighlights({ highlights = [] }) {
  if (highlights.length === 0) return null
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Investment Highlights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {highlights.map((item, i) => (
          <div
            key={i}
            className={`flex items-start space-x-4 p-4 rounded-lg border ${colorMap[item.color] || 'bg-slate-50 border-slate-200'}`}
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg ${iconBgMap[item.color] || 'bg-slate-500'}`}
            >
              {item.icon || '•'}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-700">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
