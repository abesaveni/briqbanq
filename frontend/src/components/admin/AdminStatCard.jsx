export default function AdminStatCard({ label, value, growth, sub, icon: Icon, iconBg, iconColor }) {
    return (
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-tight">{label}</p>
                <p className="text-xl font-bold text-slate-900 mt-1.5 leading-none">{value}</p>
                {(growth || sub) && (
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">{growth || sub}</p>
                )}
            </div>
            {Icon && (
                <div className={`w-8 h-8 rounded-lg ${iconBg || 'bg-slate-50'} flex items-center justify-center shrink-0 mt-0.5`}>
                    {typeof Icon === 'string' ? (
                        <span className={`text-sm ${iconColor}`}>{Icon}</span>
                    ) : (
                        <Icon className={`w-4 h-4 ${iconColor || 'text-slate-400'}`} />
                    )}
                </div>
            )}
        </div>
    )
}
