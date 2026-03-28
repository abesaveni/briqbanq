export default function StatCard({ label, value, sub, icon, iconBg, iconColor, valueColor }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex justify-between items-start">
      <div>
        <p className={`text-2xl font-bold text-gray-900 mt-1 ${valueColor || ''}`}>{value}</p>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {sub && <p className="text-sm text-gray-500">{sub}</p>}
      </div>
      {(icon || iconBg) && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg || 'bg-gray-100'} ${iconColor || 'text-gray-600'}`}>
          {icon}
        </div>
      )}
    </div>
  )
}
