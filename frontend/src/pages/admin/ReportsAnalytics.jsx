import { useState, useEffect } from 'react'
import { BarChart2, FileText, Users, Gavel, Download, RefreshCw, TrendingUp, DollarSign, Activity, CheckCircle } from 'lucide-react'
import AdminStatCard from '../../components/admin/AdminStatCard'
import { generateReportPDF } from '../../utils/pdfGenerator'
import { analyticsService, activityService } from '../../api/dataService'

function fmt(n) {
    if (!n && n !== 0) return '—'
    if (n >= 1_000_000) return `A$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `A$${(n / 1_000).toFixed(0)}K`
    return `${n}`
}

async function exportToPDF(reportType, stats) {
    const rows = stats?.map(s => [s.label, s.value]) || []
    await generateReportPDF({
        reportTitle: reportType,
        role: 'Admin',
        dateRange: 'Platform-wide',
        sections: rows.length > 0 ? [{ heading: reportType, head: ['Metric', 'Value'], rows }] : [],
        fileName: `admin-${reportType.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
    })
}

const ACTIVITY_COLORS = {
    bid: 'bg-orange-100 text-orange-600',
    status: 'bg-blue-100 text-blue-600',
    completion: 'bg-green-100 text-green-600',
    alert: 'bg-red-100 text-red-600',
    file: 'bg-indigo-100 text-indigo-600',
}

export default function ReportsAnalytics() {
    const [period, setPeriod] = useState('Last 30 Days')
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [dashboard, setDashboard] = useState(null)
    const [caseStats, setCaseStats] = useState(null)
    const [auctionStats, setAuctionStats] = useState(null)
    const [revenueStats, setRevenueStats] = useState(null)
    const [activity, setActivity] = useState([])

    const PERIOD_DAYS = { 'Last 30 Days': 30, 'Last 90 Days': 90, 'Last 6 Months': 180, 'Last Year': 365 }

    const loadData = (activePeriod) => {
        const days = PERIOD_DAYS[activePeriod] || 30
        const params = { days }
        analyticsService.getDashboardStats(params).then(r => { if (r.success) setDashboard(r.data) })
        analyticsService.getCaseStats(params).then(r => { if (r.success) setCaseStats(r.data) })
        analyticsService.getAuctionStats(params).then(r => { if (r.success) setAuctionStats(r.data) })
        analyticsService.getRevenueStats(params).then(r => { if (r.success) setRevenueStats(r.data) })
        activityService.getRecentActivity(params).then(r => { if (r.success) setActivity(Array.isArray(r.data) ? r.data : []) })
    }

    useEffect(() => { loadData(period) }, [period])

    const handleRefresh = () => {
        setIsRefreshing(true)
        loadData(period)
        setTimeout(() => setIsRefreshing(false), 1200)
    }

    const reportTypes = [
        {
            id: 'financial',
            title: 'Financial Summary',
            description: 'Revenue, payments, and transaction analysis',
            icon: DollarSign,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            stats: [
                { label: 'Total Recovered', value: fmt(revenueStats?.total_recovered) },
                { label: 'This Month', value: fmt(revenueStats?.this_month) },
                { label: 'Fees Collected', value: fmt(revenueStats?.fees_collected) },
            ]
        },
        {
            id: 'cases',
            title: 'Case Performance',
            description: 'Case volume, status breakdown, and trends',
            icon: FileText,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            stats: [
                { label: 'Total Cases', value: caseStats?.total ?? dashboard?.total_cases ?? '—' },
                { label: 'Active', value: caseStats?.active ?? dashboard?.active_cases ?? '—' },
                { label: 'Settled', value: caseStats?.settled ?? '—' },
            ]
        },
        {
            id: 'users',
            title: 'User Activity',
            description: 'User engagement, registrations, and KYC completion',
            icon: Users,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            stats: [
                { label: 'Total Users', value: dashboard?.total_users ?? '—' },
                { label: 'Active Users', value: dashboard?.active_users ?? '—' },
                { label: 'Pending KYC', value: dashboard?.pending_kyc_reviews ?? '—' },
            ]
        },
        {
            id: 'auctions',
            title: 'Auction Analytics',
            description: 'Bidding activity, win rates, and pricing insights',
            icon: Gavel,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            stats: [
                { label: 'Total Auctions', value: auctionStats?.total ?? '—' },
                { label: 'Total Bids', value: auctionStats?.total_bids ?? '—' },
                { label: 'Completed', value: auctionStats?.completed ?? '—' },
            ]
        },
    ]

    const maxCasesInMonth = Math.max(1, ...(caseStats?.monthly?.map(m => m.cases) || [0]))

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">Platform insights and performance metrics</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>Last 6 Months</option>
                        <option>Last Year</option>
                    </select>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="border border-gray-200 rounded px-2.5 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-1.5 transition-colors disabled:opacity-70"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button
                        onClick={() => exportToPDF('Platform Overview', reportTypes.flatMap(r => r.stats))}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5" /> Export All
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <AdminStatCard label="Total Cases" value={`${caseStats?.total ?? dashboard?.total_cases ?? '—'}`} icon={FileText} iconBg="bg-blue-100" iconColor="text-blue-600" />
                <AdminStatCard label="Active Cases" value={`${caseStats?.active ?? dashboard?.active_cases ?? '—'}`} icon={Activity} iconBg="bg-green-100" iconColor="text-green-600" />
                <AdminStatCard label="Total Recovered" value={fmt(revenueStats?.total_recovered)} icon={DollarSign} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
                <AdminStatCard label="This Month" value={fmt(revenueStats?.this_month)} icon={TrendingUp} iconBg="bg-purple-100" iconColor="text-purple-600" />
                <AdminStatCard label="Total Bids" value={`${auctionStats?.total_bids ?? '—'}`} icon={Gavel} iconBg="bg-orange-100" iconColor="text-orange-600" />
                <AdminStatCard label="Total Users" value={`${dashboard?.total_users ?? '—'}`} icon={CheckCircle} iconBg="bg-green-100" iconColor="text-green-600" />
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded px-3 py-2 text-sm font-medium text-indigo-700 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5" />
                Showing data for: <span className="font-bold">{period}</span>
            </div>

            {/* Report Export Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportTypes.map((report) => {
                    const Icon = report.icon
                    return (
                        <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-2.5 mb-3">
                                <div className={`w-8 h-8 rounded-lg ${report.iconBg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-4 h-4 ${report.iconColor}`} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{report.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {report.stats.map(stat => (
                                    <div key={stat.label} className="bg-gray-50 rounded p-2 text-center border border-gray-200">
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{stat.label}</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => exportToPDF(report.title, report.stats)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" /> Export PDF
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900">Case Volume Trend</h3>
                    </div>
                    <div className="h-48 flex items-end gap-2 px-2 pt-6">
                        {(caseStats?.monthly || []).map((m, i) => {
                            const barH = Math.round((m.cases / maxCasesInMonth) * 130)
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    {m.cases > 0 && (
                                        <span className="text-xs font-semibold text-indigo-700 mb-0.5">{m.cases}</span>
                                    )}
                                    <div
                                        className="w-full rounded-t bg-indigo-500 hover:bg-indigo-600 transition-all cursor-pointer"
                                        style={{ height: `${Math.max(barH, m.cases > 0 ? 4 : 0)}px` }}
                                        title={`${m.cases} cases`}
                                    />
                                    <span className="text-xs text-gray-400 mt-1">{m.month}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900">Monthly Revenue</h3>
                    </div>
                    <div className="space-y-2.5">
                        {(revenueStats?.monthly || []).map(m => {
                            const maxAmount = Math.max(...(revenueStats.monthly.map(x => x.amount) || [1]))
                            const pct = maxAmount > 0 ? Math.round((m.amount / maxAmount) * 100) : 0
                            return (
                                <div key={m.month}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-gray-600">{m.month}</span>
                                        <span className="font-bold text-slate-900">{fmt(m.amount)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">Recent Platform Activity</h3>
                </div>
                <div className="divide-y divide-slate-50">
                    {activity.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-400 text-center">No recent activity.</p>
                    ) : activity.map(item => (
                        <div key={item.id} className="px-4 py-3 flex items-start gap-2.5 hover:bg-gray-50/50 transition-colors">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${ACTIVITY_COLORS[item.type] || 'bg-gray-100 text-gray-600'}`}>
                                <Activity className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-800">{item.title}</p>
                                {item.details && <p className="text-sm text-gray-500 mt-1">{item.details}</p>}
                                <p className="text-sm text-gray-500 mt-1">{item.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
