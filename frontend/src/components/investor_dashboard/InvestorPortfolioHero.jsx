import { useNavigate } from "react-router-dom";
import { Gavel, BarChart2, TrendingUp, Shield, DollarSign, Layers } from "lucide-react";

export default function InvestorPortfolioHero({ stats }) {
    const navigate = useNavigate();

    const cards = [
        {
            label: "Total Invested",
            value: `A$${stats.totalInvested}M`,
            sub: "Outstanding loan capital",
            icon: DollarSign,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-600",
        },
        {
            label: "Portfolio Value",
            value: `A$${stats.portfolioValue}M`,
            sub: stats.portfolioGrowth !== "0.0" ? `${stats.portfolioGrowth}% equity buffer` : "Estimated property value",
            icon: TrendingUp,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            highlight: true,
        },
        {
            label: "Annual Returns",
            value: `A$${stats.totalReturns}K`,
            sub: `${stats.avgROI}% avg yield`,
            icon: BarChart2,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
        },
        {
            label: "Active Deals",
            value: stats.activeDealsCount,
            sub: `${stats.completedDealsCount} completed`,
            icon: Layers,
            iconBg: "bg-violet-50",
            iconColor: "text-violet-600",
        },
        {
            label: "Avg LVR",
            value: stats.riskScore === "—" ? "—" : `${stats.riskScore}%`,
            sub: "Loan-to-value ratio",
            icon: Shield,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
        },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">Portfolio Overview</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Live metrics across all your investments</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate("/investor/auctions")}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Gavel size={15} />
                        Live Auctions
                    </button>
                    <button
                        onClick={() => navigate("/investor/reports")}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <BarChart2 size={15} />
                        Reports
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {cards.map((c, i) => {
                    const Icon = c.icon;
                    return (
                        <div
                            key={i}
                            className={`rounded-xl p-4 border ${c.highlight ? 'border-indigo-100 bg-indigo-50/40' : 'border-gray-100 bg-gray-50/60'}`}
                        >
                            <div className={`w-8 h-8 ${c.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                                <Icon size={16} className={c.iconColor} />
                            </div>
                            <p className="text-xs font-medium text-gray-500 mb-1">{c.label}</p>
                            <p className={`text-xl font-bold ${c.highlight ? 'text-indigo-700' : 'text-gray-900'} leading-none`}>{c.value}</p>
                            <p className="text-xs text-gray-400 mt-1.5">{c.sub}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
