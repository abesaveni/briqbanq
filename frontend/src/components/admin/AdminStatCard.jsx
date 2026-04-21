export default function AdminStatCard({ label, value, growth, sub, icon: Icon, iconBg, iconColor }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 leading-tight">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2 leading-none">{value}</p>
                {(growth || sub) && (
                    <p className="text-xs text-gray-400 mt-2 leading-tight">{growth || sub}</p>
                )}
            </div>
            {Icon && (
                <div className={`w-10 h-10 rounded-xl ${iconBg || 'bg-gray-50'} flex items-center justify-center shrink-0`}>
                    {typeof Icon === 'string' ? (
                        <span className={`text-base ${iconColor}`}>{Icon}</span>
                    ) : (
                        <Icon className={`w-5 h-5 ${iconColor || 'text-gray-400'}`} />
                    )}
                </div>
            )}
        </div>
    )
}
