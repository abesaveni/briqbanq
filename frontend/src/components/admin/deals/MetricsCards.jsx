import { AlertCircle, Clock, Percent, TrendingUp, DollarSign } from 'lucide-react'

export default function MetricsCards({ metrics, buyNow }) {
    const cards = [
        { label: 'Days in Default', value: metrics.daysInDefault, sub: metrics.defaultStatus, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        { label: 'Days in Arrears', value: metrics.daysInArrears, sub: metrics.arrearsSub, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Interest Rate', value: `${metrics.interestRate}%`, sub: metrics.interestSub, icon: Percent, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Default Rate', value: `${metrics.defaultRate}%`, sub: metrics.defaultRateSub, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'LVR', value: `${metrics.lvr}%`, sub: metrics.lvrSub, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Total Arrears', value: `A$${(metrics.totalArrears / 1000).toFixed(0)}k`, sub: metrics.arrearsStatus, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
            {cards.map((card, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500 group">
                    <div className="flex flex-col gap-6">
                        <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.label}</p>
                            <p className={`text-2xl font-black ${card.color} tracking-tight`}>{card.value}</p>
                            <p className="text-[10px] font-bold text-gray-400">{card.sub}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
