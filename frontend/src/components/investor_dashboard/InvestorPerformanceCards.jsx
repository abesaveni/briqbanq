import { TrendingUp, Award, Clock, PieChart, ArrowUpRight } from "lucide-react";

export default function InvestorPerformanceCards({ data }) {
    const roi = parseFloat(data.avgROI) || 0;
    const roiTag = roi > 0 ? `${roi.toFixed(1)}%` : '—';
    const roiSubtitle = roi > 10 ? "Above market average" : roi > 0 ? "Near market average" : "No active investments";
    const holdingDays = parseInt(data.holdingPeriod) || 0;
    const holdingSubtitle = holdingDays > 0 ? `~${Math.round(holdingDays / 30)} months average` : "No active investments";
    const diversification = parseInt(data.diversification) || 0;
    const diversificationTag = diversification >= 5 ? "DIVERSIFIED" : diversification >= 2 ? "MODERATE" : diversification > 0 ? "GROWING" : "—";
    const cards = [
        {
            title: "Total Return",
            value: parseFloat(data.totalReturn) > 0 ? `A$${data.totalReturn}K` : '—',
            subtitle: "Since inception",
            tag: roiTag,
            icon: TrendingUp,
            iconColor: "text-emerald-500",
            bgColor: "bg-emerald-50",
            borderColor: "border-emerald-100",
            tagColor: "text-emerald-600 bg-emerald-50",
        },
        {
            title: "Avg ROI",
            value: roi > 0 ? `${roi.toFixed(1)}%` : '—',
            subtitle: roiSubtitle,
            tag: roi > 10 ? "TOP 10%" : roi > 0 ? "ACTIVE" : "—",
            icon: Award,
            iconColor: "text-blue-500",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-100",
            tagColor: "text-blue-600 bg-blue-50",
        },
        {
            title: "Holding Period",
            value: holdingDays > 0 ? `${holdingDays}d` : '—',
            subtitle: holdingSubtitle,
            tag: holdingDays > 0 ? "AVG" : "—",
            icon: Clock,
            iconColor: "text-purple-500",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-100",
            tagColor: "text-purple-600 bg-purple-50",
        },
        {
            title: "Active Deals",
            value: diversification > 0 ? `${diversification}` : '—',
            subtitle: diversification > 0 ? `${diversification} deal${diversification !== 1 ? 's' : ''} in portfolio` : "No active investments",
            tag: diversificationTag,
            icon: PieChart,
            iconColor: "text-amber-500",
            bgColor: "bg-amber-50",
            borderColor: "border-amber-100",
            tagColor: "text-emerald-600 bg-emerald-50 font-bold",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div
                        key={idx}
                        className={`bg-white rounded-2xl p-4 border-2 ${card.borderColor} shadow-sm hover:shadow-md transition-all group`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className={`w-8 h-8 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                                <Icon size={16} className={card.iconColor} />
                            </div>
                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${card.tagColor}`}>
                                {card.title === "Total Return" && <ArrowUpRight size={10} />}
                                {card.tag}
                            </div>
                        </div>

                        <p className="text-[#64748B] text-[11px] font-bold mb-0.5">{card.title}</p>
                        <h3 className="text-xl font-bold text-[#0F172A] mb-0.5">{card.value}</h3>
                        <p className="text-gray-400 text-[10px] font-semibold">{card.subtitle}</p>
                    </div>
                );
            })}
        </div>
    );
}
