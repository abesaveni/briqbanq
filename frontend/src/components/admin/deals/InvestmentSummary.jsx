import { TrendingUp, ShieldCheck, Clock, AlertTriangle } from 'lucide-react'

export default function InvestmentSummary({ financials, buyNow }) {
    const stats = [
        { label: 'Expected ROI', value: `${financials.expectedROI}%`, icon: TrendingUp, color: 'text-emerald-500' },
        { label: buyNow ? 'Equity Position' : 'Recovery Rate', value: buyNow ? `$${(financials.equityPosition / 1000).toFixed(0)}k` : `${financials.recoveryRate}%`, icon: ShieldCheck, color: buyNow ? 'text-indigo-600' : 'text-emerald-500' },
        { label: 'Time to Settlement', value: financials.timeToSettlement, icon: Clock, color: 'text-gray-900' },
        { label: 'Risk Level', value: financials.riskLevel || '—', icon: AlertTriangle, color: financials.riskLevel?.includes('Low') ? 'text-emerald-500' : 'text-amber-500' },
    ]

    return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8">Investment Summary</h3>

            <div className="space-y-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                            <stat.icon className="w-4 h-4 text-gray-300" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <span className={`text-base font-black ${stat.color} tracking-tight`}>{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
