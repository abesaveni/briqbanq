import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Gavel, TrendingUp, Home, CheckCircle, BarChart2 } from "lucide-react";

export default function LenderHeroSection({ statsData = {} }) {
    const navigate = useNavigate();

    const stats = [
        { label: "Portfolio Value",  value: `A$${statsData.portfolioValue || "0"}`,    icon: TrendingUp,   color: "text-blue-200" },
        { label: "Active Loans",     value: `${statsData.activeLoans || 0}`,            icon: Home,         color: "text-blue-200" },
        { label: "Recovery Rate",    value: `${statsData.recoveryRate || "0.0"}%`,      icon: CheckCircle,  color: "text-emerald-300" },
        { label: "Portfolio LVR",    value: `${statsData.lvr || "0.0"}%`,               icon: BarChart2,    color: "text-amber-300" },
    ];

    return (
        <div className="bg-[#1B3A6B] rounded-xl p-5 relative overflow-hidden">
            {/* subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1B3A6B] via-[#1e4080] to-[#162f5a] pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                        <Briefcase size={18} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-white leading-tight">Lender Command Center</h2>
                        <p className="text-blue-300/70 text-xs mt-0.5">Enterprise mortgage portfolio management</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/lender/submit-case')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#1B3A6B] rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors shadow-sm"
                    >
                        <Plus size={13} strokeWidth={2.5} /> New MIP Case
                    </button>
                    <button
                        onClick={() => navigate('/lender/auctions')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/20 transition-colors border border-white/20"
                    >
                        <Gavel size={13} /> Auctions
                    </button>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white/8 border border-white/10 rounded-lg p-3.5 hover:bg-white/12 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-blue-200/60 text-[10px] font-medium uppercase tracking-wider">{s.label}</p>
                            <s.icon size={13} className={s.color} />
                        </div>
                        <p className="text-white text-lg font-bold leading-none">{s.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
