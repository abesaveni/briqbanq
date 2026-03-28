import React from 'react';
import { Home, ChevronRight, TrendingUp, BarChart2, PieChart, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from 'react-router-dom';

export default function LenderTrendAnalysis() {
    return (
        <div className="max-w-[1240px] mx-auto px-6 py-6 animate-fade-in font-['Inter',sans-serif]">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Market Trend Analysis</h1>
                <p className="text-gray-500 text-[13px] font-medium leading-relaxed">Intelligence and predictive trends for properties and lending markets</p>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-8 font-bold uppercase tracking-wider">
                <Home size={14} />
                <ChevronRight size={14} className="opacity-50" />
                <Link to="/lender/dashboard" className="hover:text-indigo-600">Dashboard</Link>
                <ChevronRight size={14} className="opacity-50" />
                <Link to="/lender/reports" className="hover:text-indigo-600">Reports</Link>
                <ChevronRight size={14} className="opacity-50" />
                <span className="text-slate-900">Trend Analysis</span>
            </div>

            {/* Market Health Score Card - Premium UI */}
            <div className="bg-gradient-to-br from-blue-800 to-indigo-900 rounded-[32px] p-8 mb-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                <Activity size={20} className="text-blue-200" />
                            </div>
                            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-[0.2em]">Market Intelligence Summary</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 leading-tight">Property Market Outlook: <span className="text-emerald-400 italic">Positive</span></h2>
                        <p className="text-blue-100/70 text-[15px] font-medium max-w-[500px] leading-relaxed">
                            Overall recovery rate across MIP portfolio has increased by 4.2% this quarter, consistently outperforming broader industry benchmarks.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <TrendStat label="Average Recovery" val="92.4%" trend="+2.1%" icon={<TrendingUp size={16} />} color="emerald" />
                        <TrendStat label="Portfolio LVR" val="64.2%" trend="-0.5%" icon={<DollarSign size={16} />} color="blue" />
                    </div>
                </div>
            </div>

            {/* Main Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* 1. Recovery Trends (Chart Mockup) */}
                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm hover:border-indigo-100 transition-all transition-duration-500 hover:shadow-lg">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-0.5">Recovery Trends Over Time</h3>
                            <p className="text-[12px] font-medium text-slate-400">Monthly recovery percentage performance</p>
                        </div>
                        <button className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                            <BarChart2 size={18} />
                        </button>
                    </div>
                    {/* SVG Chart Design */}
                    <div className="h-[240px] w-full relative group">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 200">
                             {/* Vertical Grid Lines */}
                            {[0, 100, 200, 300, 400, 500].map(x => (
                                <line key={x} x1={x} y1="0" x2={x} y2="200" stroke="#F8FAFC" strokeWidth="1" />
                            ))}
                             {/* Horizontal Grid Line */}
                            <line x1="0" y1="100" x2="500" y2="100" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="5,5" />
                            
                            {/* Area Fill */}
                            <path d="M0 160 Q 100 140 200 150 Q 300 120 400 60 Q 500 40 L 500 200 L 0 200 Z" fill="url(#areaGradient)" className="opacity-0 group-hover:opacity-10 transition-opacity duration-1000" />
                            
                            {/* Main Line */}
                            <path 
                                d="M0 160 Q 100 140 200 150 Q 300 120 400 60 Q 500 40" 
                                fill="none" 
                                stroke="#4F46E5" 
                                strokeWidth="4" 
                                strokeLinecap="round" 
                                strokeDasharray="1000"
                                strokeDashoffset="1000"
                                className="animate-draw-line"
                            />
                            
                            <defs>
                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.5" />
                                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="flex justify-between mt-6 px-1">
                            {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                <span key={m} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Geographic Distribution */}
                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm hover:border-indigo-100 transition-all transition-duration-500 hover:shadow-lg">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-0.5">Regional Performance</h3>
                            <p className="text-[12px] font-medium text-slate-400">Portfolio distribution by State/Region</p>
                        </div>
                        <button className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                            <PieChart size={18} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between gap-10">
                        <div className="w-40 h-40 relative">
                             {/* Donut Chart Visual */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#4F46E5" strokeWidth="4" strokeDasharray="45 100" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#EC4899" strokeWidth="4" strokeDasharray="25 100" strokeDashoffset="-45" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="30 100" strokeDashoffset="-70" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">NSW</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Lead Market</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <LegendItem color="bg-indigo-600" label="New South Wales" value="45.0%" />
                            <LegendItem color="bg-amber-500" label="Queensland" value="30.0%" />
                            <LegendItem color="bg-pink-500" label="Victoria" value="25.0%" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Insight Feed */}
            <div className="bg-slate-50 border border-slate-200 rounded-[28px] p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                        <TrendingUp size={22} />
                    </div>
                    <h4 className="text-[17px] font-bold text-slate-900 tracking-tight">System Forecast for Q3 2026</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InsightCard title="Market Volatility" desc="Expected consolidation in high-end residential markets over next 90 days." />
                    <InsightCard title="Investor Liquidity" desc="Institutional liquidity levels for MIP portfolios showing 12% growth YoY." />
                    <InsightCard title="Default Outlook" desc="Early indicators suggest a slight reduction in default frequency in urban corridors." />
                </div>
            </div>
        </div>
    );
}

function TrendStat({ label, val, trend, icon, color }) {
    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 min-w-[160px] group cursor-pointer hover:bg-white/20 transition-all">
            <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-widest mb-1.5 leading-none">{label}</p>
            <div className="flex items-end justify-between">
                <div>
                   <h3 className="text-2xl font-black text-white leading-none mb-1">{val}</h3>
                   <span className={`text-[11px] font-bold flex items-center gap-1 ${trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                       {trend}
                   </span>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg ${color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function LegendItem({ color, label, value }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm group-hover:scale-125 transition-transform`}></div>
                <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{label}</span>
            </div>
            <span className="text-[14px] font-black text-slate-800">{value}</span>
        </div>
    );
}

function InsightCard({ title, desc }) {
    return (
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <h5 className="font-black text-slate-900 text-[13px] uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">{title}</h5>
            <p className="text-[14px] font-medium text-slate-500 leading-relaxed">{desc}</p>
        </div>
    );
}
