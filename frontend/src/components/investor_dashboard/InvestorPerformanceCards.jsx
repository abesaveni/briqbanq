import { TrendingUp, Award, Clock, PieChart } from "lucide-react";

export default function InvestorPerformanceCards({ data }) {
    const roi = parseFloat(data.avgROI) || 0;
    const holdingDays = parseInt(data.holdingPeriod) || 0;
    const diversification = parseInt(data.diversification) || 0;

    const cards = [
        {
            title: "Total Return",
            value: parseFloat(data.totalReturn) > 0 ? `A$${data.totalReturn}K` : "—",
            sub: roi > 0 ? `${roi.toFixed(1)}% avg yield` : "No active investments",
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            badge: roi > 0 ? `${roi.toFixed(1)}%` : null,
            badgeColor: "bg-emerald-100 text-emerald-700",
        },
        {
            title: "Avg ROI",
            value: roi > 0 ? `${roi.toFixed(1)}%` : "—",
            sub: roi > 10 ? "Above market average" : roi > 0 ? "Near market average" : "No active investments",
            icon: Award,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            badge: roi > 10 ? "Top tier" : roi > 0 ? "Active" : null,
            badgeColor: "bg-indigo-100 text-indigo-700",
        },
        {
            title: "Avg Holding Period",
            value: holdingDays > 0 ? `${holdingDays}d` : "—",
            sub: holdingDays > 0 ? `~${Math.round(holdingDays / 30)} months average` : "No active investments",
            icon: Clock,
            color: "text-violet-600",
            bg: "bg-violet-50",
            badge: holdingDays > 0 ? "Avg" : null,
            badgeColor: "bg-violet-100 text-violet-700",
        },
        {
            title: "Active Deals",
            value: diversification > 0 ? String(diversification) : "—",
            sub: diversification >= 5 ? "Well diversified" : diversification >= 2 ? "Moderately diversified" : diversification > 0 ? "Building portfolio" : "No active investments",
            icon: PieChart,
            color: "text-amber-600",
            bg: "bg-amber-50",
            badge: diversification >= 5 ? "Diversified" : diversification >= 2 ? "Moderate" : diversification > 0 ? "Growing" : null,
            badgeColor: "bg-amber-100 text-amber-700",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center`}>
                                <Icon size={16} className={card.color} />
                            </div>
                            {card.badge && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                                    {card.badge}
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-medium text-gray-500 mb-1">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900 leading-none">{card.value}</p>
                        <p className="text-xs text-gray-400 mt-1.5 leading-snug">{card.sub}</p>
                    </div>
                );
            })}
        </div>
    );
}
