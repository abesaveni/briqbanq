import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    FileText, DollarSign, Users, Gavel, TrendingUp, Clock,
    CheckCircle, AlertTriangle, BarChart2, Shield, ArrowUpRight, Loader2,
} from 'lucide-react'
import { adminService, casesService, auctionService } from '../../api/dataService'
import { formatCurrency } from '../../utils/formatters'

const QUICK_ACTIONS = [
    { label: 'Review KYC', sub: 'Pending approvals', route: '/admin/kyc-review', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Manage Cases', sub: 'Active pipeline', route: '/admin/case-management', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'View Reports', sub: 'Analytics & export', route: '/admin/reports-analytics', icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Admin Console', sub: 'Settings & config', route: '/admin/admin-center', icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50' },
]

const STATUS_BADGE = {
    DRAFT: 'bg-gray-100 text-gray-500',
    SUBMITTED: 'bg-blue-50 text-blue-600',
    UNDER_REVIEW: 'bg-amber-50 text-amber-600',
    APPROVED: 'bg-green-50 text-green-700',
    LISTED: 'bg-indigo-50 text-indigo-700',
    AUCTION: 'bg-red-50 text-red-600',
    CLOSED: 'bg-gray-100 text-gray-500',
    REJECTED: 'bg-red-50 text-red-500',
}

export default function Dashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [dashStats, setDashStats] = useState(null)
    const [recentCases, setRecentCases] = useState([])
    const [allCases, setAllCases] = useState([])
    const [auctions, setAuctions] = useState([])
    const [liveCases, setLiveCases] = useState([])
    const [showSupportModal, setShowSupportModal] = useState(false)
    const [showContactModal, setShowContactModal] = useState(false)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            const [dashRes, casesRes, auctionsRes, liveRes] = await Promise.all([
                adminService.getDashboardStats(),
                casesService.getCases(),
                auctionService.getAuctions(),
                casesService.getLiveListings(),
            ])
            if (dashRes.success) setDashStats(dashRes.data)
            const casesArr = Array.isArray(casesRes.data) ? casesRes.data : (casesRes.data?.items || casesRes.data?.cases || [])
            if (casesRes.success) { setAllCases(casesArr); setRecentCases(casesArr.slice(0, 6)) }
            const auctionsArr = Array.isArray(auctionsRes.data) ? auctionsRes.data : (auctionsRes.data?.items || [])
            if (auctionsRes.success) setAuctions(auctionsArr)
            const liveArr = Array.isArray(liveRes.data) ? liveRes.data : (liveRes.data?.items || [])
            if (liveRes.success) setLiveCases(liveArr)
            setLoading(false)
        }
        load()
    }, [])

    const d = dashStats || {}
    const nonDraft = allCases.filter(c => c.status !== 'DRAFT')
    const totalCases = nonDraft.length || d.total_cases || 0
    const activeCases = nonDraft.filter(c => ['ACTIVE', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(c.status)).length
    const listedCases = nonDraft.filter(c => ['LISTED', 'AUCTION'].includes(c.status)).length
    const activeAuctions = liveCases.filter(c => ['AUCTION', 'IN_AUCTION'].includes(c.status)).length || auctions.length
    const pendingActions = (d.pending_kyc_reviews ?? 0) + (d.pending_role_requests ?? 0)

    const statCards = [
        { label: 'Total Cases', value: totalCases, sub: `${activeCases} active · ${listedCases} listed`, icon: FileText, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
        { label: 'Platform Users', value: d.total_users ?? 0, sub: `${d.pending_kyc_reviews ?? 0} pending KYC`, icon: Users, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
        { label: 'Active Auctions', value: activeAuctions, sub: `${d.pending_role_requests ?? 0} pending role requests`, icon: Gavel, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        { label: 'Pending Actions', value: pendingActions, sub: `KYC: ${d.pending_kyc_reviews ?? 0} · Roles: ${d.pending_role_requests ?? 0}`, icon: Clock, iconBg: 'bg-red-50', iconColor: 'text-red-500' },
    ]

    const platformRows = [
        { label: 'Live Auctions', value: liveCases.filter(c => c.status === 'AUCTION').length, sub: `${liveCases.length} total listed`, dot: 'bg-red-500', animate: true },
        { label: 'Pending Approvals', value: pendingActions, sub: `KYC: ${d.pending_kyc_reviews ?? 0} · Roles: ${d.pending_role_requests ?? 0}`, dot: 'bg-amber-500' },
        { label: 'Active Users', value: d.active_users ?? 0, sub: `${d.suspended_users ?? 0} suspended`, dot: 'bg-emerald-500' },
        { label: 'Suspended Users', value: d.suspended_users ?? 0, sub: 'Requires admin review', dot: 'bg-gray-400' },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <>
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Platform administration and compliance management</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => {
                    const Icon = card.icon
                    return (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                            <p className="text-xs text-gray-400 mt-2">{card.sub}</p>
                        </div>
                    )
                })}
            </div>

            {/* Platform status + Recent cases */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Platform Status */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <p className="text-sm font-semibold text-gray-800 mb-4">Platform Status</p>
                    <div className="space-y-1">
                        {platformRows.map((row, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                                        {row.animate && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${row.dot} opacity-60`} />}
                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${row.dot}`} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-700">{row.label}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{row.sub}</p>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-gray-800 shrink-0 ml-2">{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Cases */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-gray-800">Recent Cases</p>
                        <Link to="/admin/case-management" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                            View all <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    {recentCases.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No cases yet</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {recentCases.map((c, i) => (
                                <div key={c.id || i} className="py-3 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-gray-800 truncate">{c.title || c.property_address || 'Untitled Case'}</p>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-500'}`}>
                                                {c.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {c.case_number || String(c.id || '').slice(0, 8)} · {c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU') : '—'}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-600 shrink-0">{c.loan_amount ? formatCurrency(c.loan_amount) : ''}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {QUICK_ACTIONS.map((action, i) => {
                        const Icon = action.icon
                        return (
                            <button
                                key={i}
                                onClick={() => navigate(action.route)}
                                className="flex flex-col items-start p-4 rounded-xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group"
                            >
                                <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center mb-3`}>
                                    <Icon className={`w-5 h-5 ${action.color}`} />
                                </div>
                                <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{action.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{action.sub}</p>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Help bar */}
            <div className="flex items-center justify-between bg-gray-800 rounded-xl px-5 py-4">
                <p className="text-sm text-gray-400">Need help? Our support team is available during business hours.</p>
                <div className="flex gap-2 shrink-0">
                    <button onClick={() => setShowSupportModal(true)} className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">Resources</button>
                    <button onClick={() => setShowContactModal(true)} className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Contact Support</button>
                </div>
            </div>
        </div>

        {/* Support Resources Modal */}
        {showSupportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSupportModal(false)}>
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 border border-gray-200" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">Support Resources</p>
                        <button onClick={() => setShowSupportModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                    </div>
                    <div className="px-5 py-3 space-y-1">
                        {[
                            { name: "ASIC MoneySmart", phone: "1300 300 630" },
                            { name: "National Debt Helpline", phone: "1800 007 007" },
                            { name: "AFCA", phone: "1800 931 678" },
                            { name: "Legal Aid NSW", phone: "1300 888 529" },
                            { name: "Fair Trading NSW", phone: "13 32 20" },
                        ].map(r => (
                            <div key={r.name} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">{r.name}</p>
                                    <p className="text-xs text-gray-400">{r.phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-4 border-t border-gray-100">
                        <button onClick={() => setShowSupportModal(false)} className="w-full text-sm font-medium py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}

        {/* Contact Support Modal */}
        {showContactModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowContactModal(false)}>
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 border border-gray-200" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">Contact Support</p>
                        <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                    </div>
                    <div className="px-5 py-3 space-y-1">
                        {[
                            { label: "Email", value: "support@briqbanq.com.au" },
                            { label: "Debt Helpline", value: "1800 007 007" },
                            { label: "AFCA Complaints", value: "1800 931 678" },
                        ].map(c => (
                            <div key={c.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                                <p className="text-xs text-gray-400">{c.label}</p>
                                <p className="text-sm font-medium text-gray-700">{c.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-4 border-t border-gray-100">
                        <button onClick={() => setShowContactModal(false)} className="w-full text-sm font-medium py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}
