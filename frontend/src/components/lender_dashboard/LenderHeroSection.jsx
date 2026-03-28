import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Gavel, FileText, DollarSign, Award, Activity, Plus, TrendingUp, Home, Check } from "lucide-react";

export default function LenderHeroSection({ statsData = {} }) {
    const navigate = useNavigate();

    // Use dynamic stats if available, otherwise fallback to format equivalents of 0
    const stats = [
        { label: "Portfolio Value", val: `A$${statsData.portfolioValue || "0.00"}`, sub: "Total estimated property value", color: "text-emerald-400", icon: TrendingUp },
        { label: "Active Loans", val: `${statsData.activeLoans || 0}`, sub: "in MIP process", color: "text-blue-300", icon: Home },
        { label: "Recovery Rate", val: `${statsData.recoveryRate || "0.0"}%`, sub: "Closed cases / Total cases", color: "text-emerald-400", icon: Check },
        { label: "Portfolio LVR", val: `${statsData.lvr || "0.0"}%`, sub: "Loan-to-Value ratio", color: "text-amber-400", icon: Activity }
    ];

    return (
        <div className="hero-lender-gradient text-white rounded-2xl p-5 sm:p-6 md:p-7 relative overflow-hidden shadow-lg border border-white/10">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4 text-white relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                        <Briefcase size={24} className="text-blue-100" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none mb-2">Lender Command Center</h1>
                        <p className="text-blue-200/50 text-[10px] font-bold uppercase tracking-wider">Enterprise Management Platform</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/lender/submit-case')}
                        className="bg-white text-[#0F172A] px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={14} strokeWidth={3} />
                        New MIP Case
                    </button>
                    <button
                        onClick={() => navigate('/lender/auctions')}
                        className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all border border-white/20 backdrop-blur-sm active:scale-95"
                    >
                        <Gavel size={14} />
                        Browse Auctions
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((item, idx) => (
                    <div key={idx} className="bg-blue-900/20 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
                        <p className="text-blue-100/40 text-[9px] font-bold uppercase tracking-wider mb-2">{item.label}</p>
                        <div className="flex items-end justify-between relative z-10">
                            <div>
                                <h2 className="text-lg sm:text-xl font-extrabold text-white leading-none">{item.val}</h2>
                                <p className={`text-[9px] font-bold mt-1.5 ${item.color}`}>{item.sub}</p>
                            </div>
                            <item.icon className="text-white/10 group-hover:text-white/30 transition-colors" size={18} />
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-full -mr-8 -mt-8 pointer-events-none group-hover:bg-white/[0.05] transition-colors"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

