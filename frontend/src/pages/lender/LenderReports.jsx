import { useState, useEffect, useCallback } from 'react';
import {
    Home, ChevronRight, RefreshCw, TrendingUp, DollarSign, FileText,
    Users, Activity, Download, BarChart2, PieChart, AlertCircle
} from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import { analyticsService } from '../../api/analyticsService';
import { LoadingState, ErrorState } from '../../components/common/States';
import { generateReportPDF } from '../../utils/pdfGenerator';

import { activityService } from '../../api/dataService';

export default function LenderReports() {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState('Last 30 Days');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [activity, setActivity] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            else setIsRefreshing(true);

            setError(null);

            const [summaryRes, chartsRes, activityRes] = await Promise.all([
                analyticsService.getSummaryStats(dateRange),
                analyticsService.getAnalyticsCharts(dateRange),
                activityService.getRecentActivity()
            ]);

            if (summaryRes.success) setSummary(summaryRes.data);
            if (chartsRes.success) setCharts(chartsRes.data);
            if (activityRes.success) setActivity(activityRes.data || []);

            if (!summaryRes.success && !chartsRes.success) {
                setError(summaryRes.error || chartsRes.error || "Failed to load report data");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();

        // Sync with live platform activity
        const handleNewActivity = (e) => {
            setActivity(prev => [e.detail, ...prev]);
        };
        window.addEventListener('new-activity', handleNewActivity);
        return () => window.removeEventListener('new-activity', handleNewActivity);
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData(true);
    };

    const buildRows = (section) => {
        if (section === "Financial Summary") {
            return [
                ['Total Revenue', summary?.totalRevenue || 'N/A'],
                ['Avg Case Value', summary?.avgCaseValue || 'N/A'],
                ['Active Cases', String(summary?.activeCases || '0')],
                ['Success Rate', summary?.successRate || '0%'],
            ];
        } else if (section === "Case Performance") {
            return [
                ['Total Cases', String(summary?.totalCases || '0')],
                ['Success Rate', summary?.successRate || '0%'],
                ['Total Bids', String(summary?.totalBids || '0')],
            ];
        }
        return [['Date Range', dateRange], ['Generated', new Date().toLocaleString()]];
    };

    const handleExportPDF = async (section) => {
        await generateReportPDF({
            reportTitle: section,
            role: 'Lender',
            dateRange,
            summary,
            sections: [{ heading: section, head: ['Metric', 'Value'], rows: buildRows(section) }],
            fileName: `lender-${section.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
        });
    };

    const handleExportExcel = async (section) => {
        await handleExportPDF(section);
    };

    if (loading && !isRefreshing) return <div className="p-8 max-w-[1240px] mx-auto"><LoadingState /></div>;
    if (error) return <div className="p-8 max-w-[1240px] mx-auto"><ErrorState message={error} /></div>;

    return (
        <div className="max-w-[1240px] mx-auto px-6 py-6 animate-fade-in relative z-10 w-full min-screen-available font-['Inter',sans-serif]">
            {/* Header */}
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Reports</h1>
                <p className="text-gray-500 text-[13px] font-medium leading-relaxed">Manage defaulted loans and auctions</p>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-4 font-bold uppercase tracking-wider">
                <Home size={14} className="text-gray-400" />
                <ChevronRight size={14} className="opacity-50" />
                <Link to="/lender/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                <ChevronRight size={14} className="opacity-50" />
                <span className="text-slate-900 font-bold">Reports & Analytics</span>
            </div>

            {/* Section Title & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Reports & Analytics</h2>
                    <p className="text-gray-500 text-[13px] font-medium">Comprehensive platform insights and performance metrics</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer appearance-none pr-10 shadow-sm"
                        >
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                            <option>Last 90 Days</option>
                            <option>Year to Date</option>
                            <option>All Time</option>
                        </select>
                        <BarChart2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard
                    title="Total Cases"
                    value={summary?.totalCases || 0}
                    subtext={<span className="text-emerald-500 flex items-center gap-1 font-bold"><TrendingUp size={12} /> {summary?.trends?.totalCases || '0%'}</span>}
                    isLoading={isRefreshing}
                />
                <StatCard
                    title="Active Cases"
                    value={summary?.activeCases || 0}
                    subtext={<span className="text-indigo-600 font-bold">{summary?.activeCases || 0} in progress</span>}
                    isLoading={isRefreshing}
                />
                <StatCard
                    title="Total Revenue"
                    value={summary?.totalRevenue || 0}
                    subtext={<span className="text-emerald-500 flex items-center gap-1 font-bold"><TrendingUp size={12} /> {summary?.trends?.totalRevenue || '0%'}</span>}
                    isLoading={isRefreshing}
                />
                <StatCard
                    title="Avg Case Value"
                    value={summary?.avgCaseValue || 0}
                    subtext={<span className="text-slate-400 font-bold">Per case</span>}
                    isLoading={isRefreshing}
                />
                <StatCard
                    title="Total Bids"
                    value={summary?.totalBids || 0}
                    subtext={<span className="text-purple-600 font-bold">{((summary?.totalBids || 0) / (summary?.totalCases || 1)).toFixed(1)} per case</span>}
                    isLoading={isRefreshing}
                />
                <StatCard
                    title="Success Rate"
                    value={summary?.successRate || '0%'}
                    subtext={<span className="text-emerald-500 flex items-center gap-1 font-bold"><TrendingUp size={12} /> {summary?.trends?.successRate || '0%'}</span>}
                    isLoading={isRefreshing}
                />
            </div>

            {/* Report Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                <ReportCategoryCard
                    icon={<DollarSign size={20} className="text-emerald-600" />}
                    iconBg="bg-emerald-50 border border-emerald-100"
                    title="Financial Summary"
                    description="Revenue, payments, and transaction analysis"
                    onPdf={() => handleExportPDF("Financial Summary")}
                    onExcel={() => handleExportExcel("Financial Summary")}
                />
                <ReportCategoryCard
                    icon={<FileText size={20} className="text-indigo-600" />}
                    iconBg="bg-indigo-50 border border-indigo-100"
                    title="Case Performance"
                    description="Case volume, status breakdown, and trends"
                    onPdf={() => handleExportPDF("Case Performance")}
                    onExcel={() => handleExportExcel("Case Performance")}
                />
                <ReportCategoryCard
                    icon={<Users size={20} className="text-purple-600" />}
                    iconBg="bg-purple-50 border border-purple-100"
                    title="User Activity"
                    description="User engagement, registrations, and KYC"
                    onPdf={() => handleExportPDF("User Activity")}
                    onExcel={() => handleExportExcel("User Activity")}
                />
                <ReportCategoryCard
                    icon={<TrendingUp size={20} className="text-rose-600" />}
                    iconBg="bg-rose-50 border border-rose-100"
                    title="Auction Analytics"
                    description="Bidding activity, win rates, and pricing"
                    onPdf={() => handleExportPDF("Auction Analytics")}
                    onExcel={() => handleExportExcel("Auction Analytics")}
                />
            </div>

            {/* Chart Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-[20px] border border-slate-100 p-6 shadow-sm group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-[15px] text-slate-900">Case Volume Trend</h3>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 italic">
                                ↑ 12% vs last month
                            </span>
                            <button onClick={() => navigate('/lender/trend-analysis')} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600 flex items-center gap-1.5 hover:bg-slate-100 transition-all shadow-sm active:scale-95">
                                <BarChart2 size={14} /> View Details
                            </button>
                        </div>
                    </div>
                    <div className="h-[220px] w-full relative group/chart">
                        {/* Premium SVG Bar Chart Mockup */}
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 200">
                            {/* Grid Lines */}
                            {[0, 50, 100, 150].map((y) => (
                                <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                            ))}

                            {/* Bars */}
                            {[
                                { h: 60, color: '#E2E8F0' },
                                { h: 80, color: '#CBD5E1' },
                                { h: 120, color: '#94A3B8' },
                                { h: 100, color: '#64748B' },
                                { h: 140, color: '#475569' },
                                { h: 180, color: '#334155' },
                                { h: 160, color: '#1E293B' },
                                { h: 190, color: '#2D31A6' } // Active highlighting
                            ].map((bar, i) => (
                                <rect
                                    key={i}
                                    x={i * 50 + 10}
                                    y={200 - bar.h}
                                    width="30"
                                    height={bar.h}
                                    rx="6"
                                    fill={bar.color}
                                    className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                                />
                            ))}
                        </svg>
                        {/* Legend */}
                        <div className="flex justify-between mt-4 px-2">
                            {Array.from({ length: 8 }, (_, i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - (7 - i));
                                return d.toLocaleString('en-AU', { month: 'short' });
                            }).map((m) => (
                                <span key={m} className="text-[10px] font-bold text-slate-400">{m}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] border border-slate-100 p-6 shadow-sm group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-[15px] text-slate-900">Revenue Distribution</h3>
                        <button onClick={() => handleExportPDF("Revenue Distribution")} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600 flex items-center gap-1.5 hover:bg-slate-100 transition-all shadow-sm active:scale-95">
                            <PieChart size={14} /> View Details
                        </button>
                    </div>
                    <div className="h-[220px] flex items-center justify-between gap-8">
                        {/* Premium SVG Donut Chart Mockup */}
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#2D31A6" strokeWidth="4" strokeDasharray="65 100" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#F97316" strokeWidth="4" strokeDasharray="35 100" strokeDashoffset="-65" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="15 100" strokeDashoffset="-85" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold text-slate-900 leading-none">{summary?.totalRevenue || '—'}</span>
                                <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Total</span>
                            </div>
                        </div>
                        {/* Chart Legend */}
                        <div className="flex-1 space-y-3">
                            {(charts?.revenueDistribution || [
                                { label: 'Active Cases', value: summary?.activeCases ? `${Math.round((summary.activeCases / (summary.totalCases || 1)) * 100)}%` : '—', color: 'bg-indigo-800' },
                                { label: 'In Auction', value: '—', color: 'bg-orange-500' },
                                { label: 'Completed', value: '—', color: 'bg-emerald-500' }
                            ]).map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                                        <span className="text-[12px] font-bold text-slate-600">{item.label}</span>
                                    </div>
                                    <span className="text-[12px] font-black text-slate-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-[20px] border border-slate-100 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-[15px] text-slate-900">Recent Platform Activity</h3>
                    <button onClick={() => navigate('/lender/my-cases')} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600 flex items-center gap-1.5 hover:bg-slate-100 transition-all active:scale-95">
                        <Activity size={14} /> View All
                    </button>
                </div>
                <div className="divide-y divide-slate-50">
                    {(activity || []).map((item) => (
                        <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-[14px] text-slate-900 mb-0.5">{item.title}</h4>
                                <p className="text-[13px] text-slate-500 font-medium">{item.description}</p>
                            </div>
                            <span className="text-[12px] text-slate-400 font-bold whitespace-nowrap">{item.time}</span>
                        </div>
                    ))}
                    {!(activity && activity.length > 0) && (
                         <div className="py-8 text-center text-[13px] font-bold text-slate-400">
                             No recent activity.
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, subtext, isLoading }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center min-h-[110px] hover:border-indigo-100 transition-all group">
            <h3 className="text-slate-400 text-[12px] font-bold uppercase tracking-wider mb-2">{title}</h3>
            {isLoading ? (
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg mb-2"></div>
            ) : (
                <p className="text-2xl font-bold text-slate-900 mb-1 leading-none">{value || 'N/A'}</p>
            )}
            <div className="text-[11px] font-medium">{subtext}</div>
        </div>
    );
}

function ReportCategoryCard({ icon, iconBg, title, description, onPdf, onExcel }) {
    return (
        <div className="bg-white p-5 rounded-[22px] border border-slate-100 shadow-sm flex flex-col group hover:border-indigo-100 transition-all overflow-hidden relative">
            <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transform group-hover:scale-110 transition-transform duration-300 ${iconBg}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-[15px] text-slate-900 mb-1 tracking-tight">{title}</h3>
                    <p className="text-[13px] text-slate-500 font-medium leading-snug">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onPdf}
                    className="flex-1 py-2.5 bg-blue-800 text-white rounded-xl text-[13px] font-bold hover:bg-blue-900 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                    <Download size={15} /> Export PDF
                </button>
                <button
                    onClick={onExcel}
                    className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                    <Download size={15} /> Export Excel
                </button>
            </div>
        </div>
    );
}
