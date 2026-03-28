import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    FileText,
    DollarSign,
    Users,
    Gavel,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertTriangle,
    BarChart2,
    Shield,
    ArrowUpRight,
    Loader2,
} from 'lucide-react'
import { adminService, casesService, auctionService } from '../../api/dataService'
import { formatCurrency } from '../../utils/formatters'

const QUICK_ACTIONS = [
    { label: 'Review KYC', sub: 'pending approvals', route: '/admin/kyc-review', icon: 'kyc' },
    { label: 'Manage Cases', sub: 'active cases', route: '/admin/case-management', icon: 'cases' },
    { label: 'View Reports', sub: 'Generate', route: '/admin/reports-analytics', icon: 'reports' },
    { label: 'Admin Console', sub: 'Full access', route: '/admin/admin-center', icon: 'admin' },
]

// ============================================================================
// SIMPLE BAR CHART COMPONENT
// ============================================================================

function SimpleBarChart({ data, barColor }) {
    return (
        <div className="mt-2">
            <div className="flex items-end gap-1 h-14 bg-gray-50 rounded px-2 pb-1 pt-2">
                {data.map((d) => (
                    <div key={d.month} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                        <div
                            className={`w-full rounded-sm ${barColor}`}
                            style={{ height: `${d.height}%` }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex gap-1 px-2 mt-1">
                {data.map((d) => (
                    <div key={d.month} className="flex-1 text-center text-xs text-gray-400">
                        {d.month}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function Dashboard() {
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [dashStats, setDashStats] = useState(null)
    const [platformStats, setPlatformStats] = useState(null)
    const [recentCases, setRecentCases] = useState([])
    const [auctions, setAuctions] = useState([])
    const [liveCases, setLiveCases] = useState([])
    const [showSupportModal, setShowSupportModal] = useState(false)
    const [showContactModal, setShowContactModal] = useState(false)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            const [dashRes, platformRes, casesRes, auctionsRes, liveRes] = await Promise.all([
                adminService.getDashboardStats(),
                adminService.getPlatformStats(),
                casesService.getCases(),
                auctionService.getAuctions(),
                casesService.getLiveListings(),
            ])
            if (dashRes.success) setDashStats(dashRes.data)
            if (platformRes.success) setPlatformStats(platformRes.data)
            const casesArr = Array.isArray(casesRes.data) ? casesRes.data : (casesRes.data?.items || casesRes.data?.cases || [])
            if (casesRes.success) setRecentCases(casesArr.slice(0, 5))
            const auctionsArr = Array.isArray(auctionsRes.data) ? auctionsRes.data : (auctionsRes.data?.items || auctionsRes.data?.auctions || [])
            if (auctionsRes.success) setAuctions(auctionsArr)
            const liveArr = Array.isArray(liveRes.data) ? liveRes.data : (liveRes.data?.items || [])
            if (liveRes.success) setLiveCases(liveArr)
            setLoading(false)
        }
        load()
    }, [])

    // Icon mapping
    const getStatIcon = (iconType) => {
        switch (iconType) {
            case 'cases': return <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            case 'sales': return <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
            case 'users': return <Users className="w-5 h-5 text-purple-600 flex-shrink-0" />
            case 'auctions': return <Gavel className="w-5 h-5 text-amber-600 flex-shrink-0" />
            case 'pending': return <Clock className="w-5 h-5 text-red-600 flex-shrink-0" />
            default: return null
        }
    }

    const getStatusIcon = (iconType) => {
        switch (iconType) {
            case 'live':
                return (
                    <span className="relative flex h-3 w-3 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )
            case 'pending': return <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            case 'attention': return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            default: return null
        }
    }

    const getQuickActionIcon = (iconType) => {
        switch (iconType) {
            case 'kyc': return <Users className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            case 'cases': return <BarChart2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            case 'reports': return <TrendingUp className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            case 'admin': return <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            default: return null
        }
    }

    // Status badge styles
    const statusBadgeClass = {
        'LIVE': 'bg-red-500 text-white',
        'BUY NOW': 'bg-green-500 text-white',
        'SOLD': 'bg-gray-400 text-white',
    }

    // Platform status color map
    const statusColorMap = {
        indigo: { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-600' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-600' },
        green: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-600' },
        red: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-600' },
    }

    const d = dashStats || {}
    const p = platformStats || {}

    const statCards = [
        {
            label: 'Total Cases',
            value: d.total_cases ?? 0,
            sub: `${d.active_cases ?? 0} active • ${d.listed_cases ?? 0} listed`,
            growth: d.cases_growth ?? '',
            icon: 'cases',
            color: 'indigo',
        },
        {
            label: 'Platform Users',
            value: d.total_users ?? 0,
            sub: `${d.pending_kyc_reviews ?? 0} pending KYC`,
            growth: d.users_growth ?? '',
            icon: 'users',
            color: 'purple',
        },
        {
            label: 'Active Auctions',
            value: liveCases.filter(c => c.status === 'AUCTION').length,
            sub: `${d.pending_role_requests ?? 0} pending role requests`,
            growth: '',
            icon: 'auctions',
            color: 'amber',
        },
        {
            label: 'Pending Actions',
            value: (d.pending_kyc_reviews ?? 0) + (d.pending_role_requests ?? 0),
            sub: `KYC: ${d.pending_kyc_reviews ?? 0} • Roles: ${d.pending_role_requests ?? 0}`,
            growth: '',
            icon: 'pending',
            color: 'red',
        },
    ]

    const platformStatus = [
        {
            label: 'Live Auctions',
            value: liveCases.filter(c => c.status === 'AUCTION').length,
            sub: `Listed + Auction: ${liveCases.length}`,
            color: 'indigo',
            icon: 'live',
        },
        {
            label: 'Pending Approvals',
            value: (d.pending_kyc_reviews ?? 0) + (d.pending_role_requests ?? 0),
            sub: `KYC: ${d.pending_kyc_reviews ?? 0} • Roles: ${d.pending_role_requests ?? 0}`,
            color: 'amber',
            icon: 'pending',
        },
        {
            label: 'Active Users',
            value: d.active_users ?? 0,
            sub: `Suspended: ${d.suspended_users ?? 0}`,
            color: 'green',
            icon: 'completed',
        },
        {
            label: 'Suspended Users',
            value: d.suspended_users ?? 0,
            sub: 'Requires admin review',
            color: 'red',
            icon: 'attention',
        },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <>
        <div className="space-y-6">
            {/* ========== SECTION 1: Page Header ========== */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">Platform administration and compliance management</p>
            </div>

            {/* ========== SECTION 2: Stat Cards ========== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {statCards.map((card, idx) => {
                    const iconBgClass = {
                        indigo: 'bg-indigo-100',
                        green: 'bg-green-100',
                        purple: 'bg-purple-100',
                        amber: 'bg-amber-100',
                        red: 'bg-red-100',
                    }[card.color] || 'bg-gray-100'

                    return (
                        <div key={idx} className="bg-white rounded-lg border border-gray-200 p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-9 h-9 rounded-lg ${iconBgClass} flex items-center justify-center`}>
                                    {getStatIcon(card.icon)}
                                </div>
                                {card.growth && (
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                        <TrendingUp className="w-3 h-3 flex-shrink-0" />
                                        {card.growth}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-3">{card.label}</p>
                            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                        </div>
                    )
                })}
            </div>

            {/* ========== SECTION 3: Platform Status + Recent Cases ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Platform Status */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Platform Status</h2>
                    {platformStatus.map((status, idx) => {
                        const colors = statusColorMap[status.color]
                        return (
                            <div key={idx} className={`${colors.bg} border-l-4 ${colors.border} rounded-lg p-3 mb-3 last:mb-0`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(status.icon)}
                                        <span className="text-sm font-medium text-gray-800">{status.label}</span>
                                    </div>
                                    <span className={`text-xl font-bold ${colors.text}`}>{status.value}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-6">{status.sub}</p>
                            </div>
                        )
                    })}
                </div>

                {/* Recent Cases */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-900">Recent Cases</h2>
                        <Link to="/admin/case-management" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                            View All <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                        </Link>
                    </div>
                    {recentCases.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No cases found</p>
                    ) : (
                        <div>
                            {recentCases.map((c, idx) => (
                                <div key={c.id || idx} className="py-3 border-b border-gray-100 last:border-0">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">{c.case_number || c.id}</span>
                                            {c.status && (
                                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${statusBadgeClass[c.status?.toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>
                                                    {c.status}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU') : ''}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">{c.title || c.property_address || 'Untitled Case'}</p>
                                    <p className="text-xs text-gray-500">{c.loan_amount ? formatCurrency(c.loan_amount) : ''}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ========== SECTION 4: Quick Actions ========== */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {QUICK_ACTIONS.map((action, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(action.route)}
                            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-indigo-200 cursor-pointer transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                {getQuickActionIcon(action.icon)}
                            </div>
                            <p className="text-sm font-medium text-gray-900 mt-2">{action.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{action.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Help Bar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <p className="text-sm text-slate-500">Need assistance? Our support team is here to help.</p>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setShowSupportModal(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors">Support Resources</button>
                    <button type="button" onClick={() => setShowContactModal(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Contact Support</button>
                </div>
            </div>
        </div>

        {/* Support Resources Modal */}
        {showSupportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSupportModal(false)}>
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-slate-800">Support Resources</h3>
                        <button onClick={() => setShowSupportModal(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                        {[
                            { name: "ASIC MoneySmart", phone: "1300 300 630", url: "https://moneysmart.gov.au" },
                            { name: "National Debt Helpline", phone: "1800 007 007", url: "https://ndh.org.au" },
                            { name: "AFCA", phone: "1800 931 678", url: "https://afca.org.au" },
                            { name: "Legal Aid NSW", phone: "1300 888 529", url: "https://legalaid.nsw.gov.au" },
                            { name: "Fair Trading NSW", phone: "13 32 20", url: "https://fairtrading.nsw.gov.au" },
                        ].map((r) => (
                            <div key={r.name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                <div>
                                    <p className="text-xs font-medium text-slate-700">{r.name}</p>
                                    <p className="text-xs text-slate-400">{r.phone}</p>
                                </div>
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline font-medium">Visit</a>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100">
                        <button onClick={() => setShowSupportModal(false)} className="w-full text-xs font-semibold py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}

        {/* Contact Support Modal */}
        {showContactModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowContactModal(false)}>
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-slate-800">Contact Support</h3>
                        <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                        {[
                            { label: "Email", value: "support@briqbanq.com.au" },
                            { label: "Debt Helpline", value: "1800 007 007" },
                            { label: "AFCA Complaints", value: "1800 931 678" },
                        ].map((c) => (
                            <div key={c.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <p className="text-xs text-slate-500">{c.label}</p>
                                <p className="text-xs font-semibold text-slate-700">{c.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100">
                        <button onClick={() => setShowContactModal(false)} className="w-full text-xs font-semibold py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}
