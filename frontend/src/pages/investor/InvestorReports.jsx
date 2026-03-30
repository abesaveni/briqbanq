import { useState, useEffect, useCallback } from 'react';
import {
    Home, ChevronRight, RefreshCw, TrendingUp, DollarSign, FileText,
    Users, Activity, Download, BarChart2, PieChart, AlertCircle
} from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import { analyticsService } from '../../api/analyticsService';
import { LoadingState, ErrorState } from '../../components/common/States';
import { generateReportPDF } from '../../utils/pdfGenerator';

export default function InvestorReports() {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState('Last 30 Days');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [activity, setActivity] = useState([]);
    const [showAllActivity, setShowAllActivity] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            else setIsRefreshing(true);

            setError(null);

            const [summaryRes, chartsRes, activityRes] = await Promise.all([
                analyticsService.getSummaryStats(dateRange),
                analyticsService.getAnalyticsCharts(dateRange),
                analyticsService.getRecentActivity()
            ]);

            if (summaryRes.success && chartsRes.success && activityRes.success) {
                setSummary(summaryRes.data);
                setCharts(chartsRes.data);
                const activityData = activityRes.data;
                setActivity(Array.isArray(activityData) ? activityData : (activityData?.items || []));
            } else {
                setError(summaryRes.error || chartsRes.error || activityRes.error || "Failed to load reports");
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
    }, [fetchData]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Artificially wait for a better feel
        await new Promise(resolve => setTimeout(resolve, 800));
        await fetchData(true);
        setIsRefreshing(false);
    };

    const buildSectionRows = (section) => {
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
                ['Active Cases', String(summary?.activeCases || '0')],
                ['Success Rate', summary?.successRate || '0%'],
                ['Total Bids', String(summary?.totalBids || '0')],
            ];
        } else if (section === "User Activity") {
            return [
                ['Registrations', String(summary?.newUsers || '124')],
                ['KYC Verified', '98'],
                ['Active Investors', '56'],
                ['Pending Reviews', '12'],
            ];
        } else if (section === "Auction Analytics") {
            return [
                ['Total Investment', summary?.totalRevenue || '$0'],
                ['Win Rate', '62%'],
                ['Avg Pricing Gap', '4.2%'],
                ['Bidding Activity', 'High'],
            ];
        }
        return [['Date Range', dateRange], ['Generated', new Date().toLocaleString()]];
    };

    const handleExportPDF = async (section) => {
        await generateReportPDF({
            reportTitle: section,
            role: 'Investor',
            dateRange,
            summary,
            sections: [{ heading: section, head: ['Metric', 'Value'], rows: buildSectionRows(section) }],
            fileName: `investor-${section.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
        });
    };

    const handleExportExcel = async (section) => {
        // Export as PDF per user requirements
        await handleExportPDF(section);
    };

    const handleViewDetails = (type) => {
        if (type === 'volume') {
            navigate('/investor/auctions');
        } else {
            navigate('/investor/dashboard');
        }
    };

    if (loading && !isRefreshing) return <div className="p-8 max-w-7xl mx-auto"><LoadingState /></div>;
    if (error) return <div className="p-8 max-w-7xl mx-auto"><ErrorState message={error} /></div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10 w-full min-h-screen">
            {/* Header */}
            <div className="mb-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Reports & Analytics</h1>
                <p className="text-slate-500 text-[13px] font-medium leading-relaxed">Comprehensive platform insights, financial trends, and performance metrics</p>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-4 font-bold uppercase tracking-wider">
                <Home size={12} className="text-slate-300" />
                <ChevronRight size={12} />
                <Link to="/investor/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                <ChevronRight size={12} />
                <span className="text-indigo-600">Analytics Hub</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%234F46E5%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[right_14px_center] shadow-sm active:scale-95 transition-transform"
                    >
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>This Year</option>
                        <option>All Time</option>
                    </select>
                    <button
                        onClick={handleRefresh}
                        className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 active:scale-95"
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={14} className={isRefreshing ? "animate-spin" : "text-indigo-600"} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard
                    title="Total Cases"
                    value={summary?.totalCases || 0}
                    subtext={<span className="text-green-600 flex items-center gap-1"><TrendingUp size={12} /> {summary?.trends?.totalCases || '0%'}</span>}
                    isLoading={isRefreshing}
                />
                <StatCard
                    title="Active Cases"
                    value={summary?.activeCases || 0}
                    subtext={<span className="text-blue-600">{summary?.activeCases || 0} in progress</span>}
                    isLoading={isRefreshing}
                />
                <StatCard
                    title="Total Revenue"
                    value={summary?.totalRevenue || '$0'}
                    subtext={<span className="text-green-600 flex items-center gap-1"><TrendingUp size={12} /> {summary?.trends?.totalRevenue || '0%'}</span>}
                    isLoading={isRefreshing}
                />
                <StatCard
                    title="Avg Case Value"
                    value={summary?.avgCaseValue || '$0'}
                    subtext={<span className="text-gray-500">Per case</span>}
                    isLoading={isRefreshing}
                />
                <StatCard
                    title="Total Bids"
                    value={summary?.totalBids || 0}
                    subtext={<span className="text-purple-600">{(summary?.totalBids / summary?.totalCases || 0).toFixed(1)} per case</span>}
                    isLoading={isRefreshing}
                />
                <StatCard
                    title="Success Rate"
                    value={summary?.successRate || '0%'}
                    subtext={<span className="text-green-600 flex items-center gap-1"><TrendingUp size={12} /> {summary?.trends?.successRate || '0%'}</span>}
                    isLoading={isRefreshing}
                />
            </div>

            {/* Report Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ReportCard
                    icon={<DollarSign size={20} className="text-green-600" />}
                    iconBg="bg-green-100/80 border border-green-200"
                    title="Financial Summary"
                    description="Revenue, payments, and transaction analysis"
                    onPdf={() => handleExportPDF("Financial Summary")}
                    onExcel={() => handleExportExcel("Financial Summary")}
                />
                <ReportCard
                    icon={<FileText size={20} className="text-blue-600" />}
                    iconBg="bg-blue-100/80 border border-blue-200"
                    title="Case Performance"
                    description="Case volume, status breakdown, and trends"
                    onPdf={() => handleExportPDF("Case Performance")}
                    onExcel={() => handleExportExcel("Case Performance")}
                />
                <ReportCard
                    icon={<Users size={20} className="text-fuchsia-600" />}
                    iconBg="bg-fuchsia-100/80 border border-fuchsia-200"
                    title="User Activity"
                    description="User engagement, registrations, and KYC"
                    onPdf={() => handleExportPDF("User Activity")}
                    onExcel={() => handleExportExcel("User Activity")}
                />
                <ReportCard
                    icon={<Activity size={20} className="text-red-500" />}
                    iconBg="bg-red-50 border border-red-100"
                    title="Auction Analytics"
                    description="Bidding activity, win rates, and pricing"
                    onPdf={() => handleExportPDF("Auction Analytics")}
                    onExcel={() => handleExportExcel("Auction Analytics")}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-[15px] text-gray-900">Case Volume Trend</h3>
                    </div>
                    <div className="h-[200px] mt-2 relative">
                        {isRefreshing ? (
                            <ChartSkeleton />
                        ) : charts?.caseVolume?.length > 0 ? (
                            <div className="w-full h-full flex items-end justify-between gap-2 px-2">
                                {charts.caseVolume.map((item, i) => {
                                    const maxVal = Math.max(...charts.caseVolume.map(d => d.value), 1);
                                    const height = Math.max((item.value / maxVal) * 100, 4);
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center group relative">
                                            <div
                                                className="w-full bg-indigo-500/80 rounded-t-sm transition-all duration-500 hover:bg-indigo-600 cursor-pointer"
                                                style={{ height: `${height}%` }}
                                            >
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                                    {item.name}: {item.value} cases
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-2 font-bold">{item.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyChart message="No trend data available" Icon={BarChart2} />
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-[15px] text-gray-900">Revenue Distribution</h3>
                    </div>
                    <div className="h-[200px] mt-2 relative flex items-center">
                        {isRefreshing ? (
                            <ChartSkeleton />
                        ) : charts?.revenueDistribution?.length > 0 ? (
                            <div className="flex items-center w-full gap-8">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                        {charts?.revenueDistribution && Array.isArray(charts.revenueDistribution) && charts.revenueDistribution.reduce((acc, item, i) => {
                                            const total = 100;
                                            const offset = acc.offset;
                                            const stroke = (item.value / total) * 100;
                                            acc.elements.push(
                                                <circle
                                                    key={i}
                                                    cx="18" cy="18" r="16"
                                                    fill="transparent"
                                                    stroke={item.color || '#CBD5E1'}
                                                    strokeWidth="4"
                                                    strokeDasharray={`${stroke} ${100 - stroke}`}
                                                    strokeDashoffset={-offset}
                                                    className="transition-all duration-700"
                                                />
                                            );
                                            acc.offset += stroke;
                                            return acc;
                                        }, { elements: [], offset: 0 }).elements}
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-xl font-bold text-gray-900 leading-none">100%</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2.1">
                                    {charts.revenueDistribution.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-[12px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{item.name}</span>
                                            </div>
                                            <span className="text-[12px] font-bold text-gray-900">{item.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <EmptyChart message="No distribution data" Icon={PieChart} />
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-[15px] text-gray-900">Recent Platform Activity</h3>
                    <button 
                        onClick={() => setShowAllActivity(!showAllActivity)}
                        className="px-3 py-1.5 border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 flex items-center gap-1.5 hover:bg-gray-50 transition-colors shadow-sm bg-white"
                    >
                        <Activity size={13} /> {showAllActivity ? 'Show Less' : 'View All'}
                    </button>
                </div>
                <div className="space-y-3">
                    {activity.length > 0 ? (
                        activity.slice(0, showAllActivity ? undefined : 3).map((item, idx) => (
                            <ActivityRow
                                key={item.id}
                                title={item.title}
                                description={item.description}
                                time={item.time}
                                isLast={idx === activity.length - 1}
                            />
                        ))
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                            <Activity size={24} className="mb-2 opacity-20" />
                            <p className="text-sm font-medium">No recent activity found</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

function StatCard({ title, value, subtext, isLoading }) {
    return (
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between h-[130px] relative overflow-hidden group hover:border-indigo-100 hover:shadow-md transition-all duration-300">
            <div>
                <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</h3>
                {isLoading ? (
                    <div className="h-8 w-24 bg-slate-50 animate-pulse rounded-lg mb-2"></div>
                ) : (
                    <p className="text-2xl font-bold text-slate-900 mb-1.5">{value || 'N/A'}</p>
                )}
            </div>
            <div className={`text-[11px] font-bold ${isLoading ? 'opacity-30' : ''}`}>{subtext}</div>

            {/* Hover Decorative Element */}
            <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-indigo-500/5 rounded-full group-hover:scale-[3] transition-transform duration-700 pointer-events-none"></div>

            {isLoading && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 animate-loading-bar w-full"></div>
            )}
        </div>
    );
}

function ReportCard({ icon, iconBg, title, description, onPdf, onExcel }) {
    return (
        <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col h-full group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 border-b-4 hover:border-b-indigo-500">
            <div className="flex items-start gap-5 mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${iconBg}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-[16px] text-slate-900 mb-1.5">{title}</h3>
                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 mt-auto">
                <button
                    onClick={onPdf}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-[14px] text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 group/btn shadow-indigo-100"
                >
                    <Download size={14} className="group-hover/btn:translate-y-0.5 transition-transform" />
                    <span>Export PDF</span>
                </button>
                <button
                    onClick={onExcel}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-[14px] text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 border-b-2"
                >
                    <Download size={14} />
                    <span>Export Excel</span>
                </button>
            </div>
        </div>
    );
}

function ActivityRow({ title, description, time, isLast = false }) {
    return (
        <div 
            className={`p-5 bg-white border border-slate-100 rounded-[24px] flex justify-between items-center transition-all hover:border-indigo-100 group ${!isLast ? 'mb-2' : ''}`}
        >
            <div>
                <h4 className="font-bold text-[14px] text-slate-900 mb-0.5 tracking-tight transition-colors uppercase">{title}</h4>
                <p className="text-[13px] text-slate-500 font-medium italic">"{description}"</p>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tight whitespace-nowrap">{time}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20 mt-1"></div>
            </div>
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="w-full h-full flex items-end justify-between gap-4 px-2 py-4">
            {[40, 60, 30, 80, 50, 70].map((height, i) => (
                <div key={i} className="flex-1 bg-gray-50 animate-pulse rounded-t-lg" style={{ height: `${height}%` }}></div>
            ))}
        </div>
    );
}

function EmptyChart({ message, Icon }) {
    return (
        <div className="w-full h-full border border-dashed border-gray-200 rounded-[12px] flex flex-col items-center justify-center text-center p-6 mt-2 relative">
            <Icon size={32} className="text-gray-200 mb-3" strokeWidth={1.5} />
            <h4 className="font-semibold text-[13px] text-gray-400 mb-1">{message}</h4>
        </div>
    );
}
