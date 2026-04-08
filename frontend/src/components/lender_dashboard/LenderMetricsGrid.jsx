import React from 'react';
import { DollarSign, TrendingDown, Gavel, Percent } from "lucide-react";

export default function LenderMetricsGrid({ statsData = {} }) {
    const metrics = [
        {
            label: "Interest Earned",
            value: `A$${statsData.interestEarned || "0.00"}`,
            sub: "Estimated this quarter",
            badge: "↑ 12.4%",
            badgeColor: "text-emerald-600 bg-emerald-50",
            icon: DollarSign,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            border: "border-slate-200",
        },
        {
            label: "Default Rate",
            value: `${statsData.defaultRate || "0.0"}%`,
            sub: "Below industry avg",
            badge: "↘ 0.5%",
            badgeColor: "text-emerald-600 bg-emerald-50",
            icon: TrendingDown,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            border: "border-slate-200",
        },
        {
            label: "Active Bids",
            value: `${statsData.activeBids || 0}`,
            sub: "Open auction positions",
            badge: "LIVE",
            badgeColor: "text-purple-600 bg-purple-50",
            icon: Gavel,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
            border: "border-slate-200",
        },
        {
            label: "Portfolio LVR",
            value: `${statsData.lvr || "0.0"}%`,
            sub: "Conservative risk profile",
            badge: "AVG",
            badgeColor: "text-amber-600 bg-amber-50",
            icon: Percent,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            border: "border-slate-200",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, i) => (
                <div key={i} className={`bg-white rounded-xl border ${m.border} p-4 hover:shadow-sm transition-shadow`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 ${m.iconBg} ${m.iconColor} rounded-lg flex items-center justify-center`}>
                            <m.icon size={15} />
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${m.badgeColor}`}>
                            {m.badge}
                        </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{m.label}</p>
                    <p className="text-xl font-bold text-slate-900 leading-none">{m.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{m.sub}</p>
                </div>
            ))}
        </div>
    );
}
