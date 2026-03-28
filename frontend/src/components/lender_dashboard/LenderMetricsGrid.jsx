import React from 'react';
import { DollarSign, TrendingUp, Gavel, Percent } from "lucide-react";

export default function LenderMetricsGrid({ statsData = {} }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
                label="Interest Earned"
                value={`A$${statsData.interestEarned || "0.00"}`}
                sub="This quarter"
                trend="↑ 12.4%"
                trendColor="text-emerald-500"
                icon={<DollarSign size={20} />}
                borderColor="border-emerald-100"
                bgColor="bg-emerald-50/30"
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
            />
            <MetricCard
                label="Default Rate"
                value={`${statsData.defaultRate || "0.0"}%`}
                sub="Below industry avg"
                trend="↘ 0.5%"
                trendColor="text-emerald-500"
                icon={<TrendingUpIcon />}
                borderColor="border-blue-100"
                bgColor="bg-blue-50/30"
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
            />
            <MetricCard
                label="Active Bids"
                value={`${statsData.activeBids || 0}`}
                sub="Available deals"
                trend="ACTIVE"
                trendColor="text-purple-500"
                icon={<Gavel size={20} />}
                borderColor="border-purple-100"
                bgColor="bg-purple-50/30"
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
            />
            <MetricCard
                label="Portfolio LVR"
                value={`${statsData.lvr || "0.0"}%`}
                sub="Conservative risk profile"
                trend="AVG"
                trendColor="text-amber-500"
                icon={<Percent size={20} />}
                borderColor="border-amber-100"
                bgColor="bg-amber-50/30"
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
            />
        </div>
    );
}

function MetricCard({ label, value, sub, trend, trendColor, icon, borderColor, bgColor, iconBg, iconColor }) {
    return (
        <div className={`p-4 rounded-2xl border-2 ${borderColor} shadow-sm hover:shadow-md transition-all group bg-white`}>
            <div className="flex justify-between items-start mb-3">
                <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center ${iconColor}`}>
                    {React.cloneElement(icon, { size: 16 })}
                </div>
                <div className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1 bg-gray-50/50 ${trendColor} opacity-80`}>
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-slate-500 text-[12px] font-bold mb-1 tracking-tight uppercase opacity-80">{label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mb-0.5 tracking-tight">{value}</h3>
                <p className="text-slate-400 text-[11px] font-medium">{sub}</p>
            </div>
        </div>
    );
}

function TrendingUpIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
    );
}
