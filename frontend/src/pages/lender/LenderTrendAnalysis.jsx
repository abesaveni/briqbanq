import React, { useState, useEffect } from 'react';
import { Home, ChevronRight, TrendingUp, BarChart2, PieChart, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from 'react-router-dom';
import { lenderService } from '../../api/dataService';
import { LoadingState } from '../../components/common/States';

export default function LenderTrendAnalysis() {
    const [portfolio, setPortfolio] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashRes, portRes] = await Promise.all([
                    lenderService.getDashboard(),
                    lenderService.getPortfolio()
                ]);
                if (dashRes.success) setDashboard(dashRes.data);
                if (portRes.success) {
                    const items = Array.isArray(portRes.data) ? portRes.data : (portRes.data?.items || []);
                    setPortfolio(items);
                }
            } catch (err) {
                console.error("Failed to load trend data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived stats from real portfolio
    const totalDebt = portfolio.reduce((s, c) => s + Number(c.outstanding_debt || 0), 0);
    const totalValue = portfolio.reduce((s, c) => s + Number(c.estimated_value || 0), 0);
    const avgLvr = totalValue > 0 ? ((totalDebt / totalValue) * 100).toFixed(1) : '—';
    const recoveryRate = totalDebt > 0 && totalValue > 0
        ? (((totalValue - totalDebt) / totalValue) * 100).toFixed(1)
        : '—';

    // Regional distribution from property addresses
    const stateCounts = {};
    portfolio.forEach(c => {
        const addr = c.property_address || '';
        const stateMatch = addr.match(/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/i);
        const st = stateMatch ? stateMatch[1].toUpperCase() : 'Other';
        stateCounts[st] = (stateCounts[st] || 0) + 1;
    });
    const totalCases = portfolio.length || 1;
    const regionData = Object.entries(stateCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([state, count], i) => ({
            state,
            pct: ((count / totalCases) * 100).toFixed(1),
            color: ['bg-indigo-600', 'bg-amber-500', 'bg-pink-500'][i]
        }));
    const leadState = regionData[0]?.state || 'N/A';

    // Month labels for chart (last 6 months)
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return d.toLocaleString('en-AU', { month: 'short' });
    });

    // Outlook based on recovery rate
    const rateNum = parseFloat(recoveryRate);
    const outlook = isNaN(rateNum) ? 'Stable' : rateNum > 20 ? 'Positive' : rateNum > 5 ? 'Stable' : 'Cautionary';
    const outlookColor = outlook === 'Positive' ? 'text-emerald-400' : outlook === 'Stable' ? 'text-blue-300' : 'text-amber-400';

    if (loading) return <div className="p-8"><LoadingState /></div>;

    return (
        <div className="max-w-[1240px] mx-auto px-6 py-6 animate-fade-in">
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

            {/* Market Health Score Card */}
            <div className="bg-gradient-to-br from-blue-800 to-indigo-900 rounded-[32px] p-8 mb-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                <Activity size={20} className="text-blue-200" />
                            </div>
                            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-widest">Market Intelligence Summary</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
                            Property Market Outlook: <span className={`italic ${outlookColor}`}>{outlook}</span>
                        </h2>
                        <p className="text-blue-100/70 text-[15px] font-medium max-w-[500px] leading-relaxed">
                            {portfolio.length > 0
                                ? `Portfolio of ${portfolio.length} case${portfolio.length !== 1 ? 's' : ''} with ${dashboard?.activeCases || 0} active. Average LVR of ${avgLvr}% across managed assets.`
                                : 'No portfolio data available. Cases assigned to your lender account will appear here.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <TrendStat
                            label="Equity Ratio"
                            val={recoveryRate !== '—' ? `${recoveryRate}%` : '—'}
                            trend={recoveryRate !== '—' && parseFloat(recoveryRate) > 0 ? `+${recoveryRate}%` : '—'}
                            icon={<TrendingUp size={16} />}
                            color="emerald"
                        />
                        <TrendStat
                            label="Portfolio LVR"
                            val={avgLvr !== '—' ? `${avgLvr}%` : '—'}
                            trend={avgLvr !== '—' && parseFloat(avgLvr) < 80 ? 'Healthy' : 'Monitor'}
                            icon={<DollarSign size={16} />}
                            color="blue"
                        />
                    </div>
                </div>
            </div>

            {/* Main Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recovery Trends Chart */}
                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm hover:border-indigo-100 transition-all hover:shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-0.5">Recovery Trends Over Time</h3>
                            <p className="text-[12px] font-medium text-slate-400">Monthly equity vs debt performance</p>
                        </div>
                        <button className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                            <BarChart2 size={18} />
                        </button>
                    </div>
                    {portfolio.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
                            <BarChart2 size={32} className="mb-3 opacity-30" />
                            <p className="text-sm font-medium">No trend data available yet</p>
                            <p className="text-[11px] font-medium mt-1 opacity-70">Cases assigned to your account will appear here</p>
                        </div>
                    ) : (
                        <div className="w-full">
                            <div className="h-[180px] w-full">
                                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 160">
                                    {[0, 40, 80, 120, 160].map(y => (
                                        <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                                    ))}
                                    <line x1="0" y1="80" x2="500" y2="80" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="5,5" />
                                    <defs>
                                        <linearGradient id="areaGradientTA" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
                                            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M0 130 Q 100 110 200 120 Q 300 90 400 50 L 500 30" fill="none" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M0 130 Q 100 110 200 120 Q 300 90 400 50 L 500 30 L 500 160 L 0 160 Z" fill="url(#areaGradientTA)" />
                                </svg>
                            </div>
                            <div className="flex justify-between mt-3 px-1">
                                {months.map(m => (
                                    <span key={m} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Geographic Distribution */}
                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm hover:border-indigo-100 transition-all hover:shadow-lg">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-0.5">Regional Performance</h3>
                            <p className="text-[12px] font-medium text-slate-400">Portfolio distribution by State/Region</p>
                        </div>
                        <button className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                            <PieChart size={18} />
                        </button>
                    </div>
                    {regionData.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-slate-400 text-sm font-medium">
                            No portfolio data available
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-10">
                            <div className="w-40 h-40 relative">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                                    {regionData[0] && <circle cx="18" cy="18" r="16" fill="none" stroke="#4F46E5" strokeWidth="4" strokeDasharray={`${regionData[0].pct} 100`} />}
                                    {regionData[1] && <circle cx="18" cy="18" r="16" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray={`${regionData[1].pct} 100`} strokeDashoffset={`-${regionData[0]?.pct || 0}`} />}
                                    {regionData[2] && <circle cx="18" cy="18" r="16" fill="none" stroke="#EC4899" strokeWidth="4" strokeDasharray={`${regionData[2].pct} 100`} strokeDashoffset={`-${parseFloat(regionData[0]?.pct || 0) + parseFloat(regionData[1]?.pct || 0)}`} />}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-bold text-slate-800 tracking-tight leading-none uppercase">{leadState}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Lead Market</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                {regionData.map((r, i) => (
                                    <LegendItem key={r.state} color={r.color} label={stateFullName(r.state)} value={`${r.pct}%`} />
                                ))}
                                {regionData.length === 0 && <p className="text-sm text-slate-400">No region data</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Insight Feed */}
            <div className="bg-slate-50 border border-slate-200 rounded-[28px] p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                        <TrendingUp size={22} />
                    </div>
                    <h4 className="text-[17px] font-bold text-slate-900 tracking-tight">Portfolio Insights</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InsightCard
                        title="Total Cases"
                        desc={`${dashboard?.totalCases || portfolio.length} case${(dashboard?.totalCases || portfolio.length) !== 1 ? 's' : ''} in your portfolio. ${dashboard?.activeCases || 0} currently active.`}
                    />
                    <InsightCard
                        title="Portfolio Value"
                        desc={`Total outstanding debt of ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(totalDebt)} across all managed cases.`}
                    />
                    <InsightCard
                        title="Pending Review"
                        desc={`${dashboard?.pendingReview || 0} case${(dashboard?.pendingReview || 0) !== 1 ? 's' : ''} awaiting lender review. Average LVR: ${avgLvr}%.`}
                    />
                </div>
            </div>
        </div>
    );
}

function stateFullName(code) {
    const names = { NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia', SA: 'South Australia', TAS: 'Tasmania', ACT: 'ACT', NT: 'Northern Territory' };
    return names[code] || code;
}

function TrendStat({ label, val, trend, icon, color }) {
    const isPositive = trend && (trend.startsWith('+') || trend === 'Healthy');
    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 min-w-[160px] group cursor-pointer hover:bg-white/20 transition-all">
            <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-widest mb-1.5 leading-none">{label}</p>
            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-white leading-none mb-1">{val}</h3>
                    <span className={`text-[11px] font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
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
            <span className="text-[14px] font-bold text-slate-800">{value}</span>
        </div>
    );
}

function InsightCard({ title, desc }) {
    return (
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <h5 className="font-bold text-slate-900 text-[13px] uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">{title}</h5>
            <p className="text-[14px] font-medium text-slate-500 leading-relaxed">{desc}</p>
        </div>
    );
}
