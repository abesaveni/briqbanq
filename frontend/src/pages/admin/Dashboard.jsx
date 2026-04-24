import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    FileText, DollarSign, Users, Gavel, TrendingUp, Clock,
    CheckCircle, AlertTriangle, BarChart2, Shield, ArrowUpRight,
    Loader2, Activity, ArrowRight, ChevronRight, Zap,
} from 'lucide-react'
import { adminService, casesService, auctionService } from '../../api/dataService'
import { formatCurrency } from '../../utils/formatters'

const QUICK_ACTIONS = [
    { label: 'Review KYC', sub: 'Pending approvals', route: '/admin/kyc-review', icon: Users, gradient: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50 text-indigo-600' },
    { label: 'Manage Cases', sub: 'Active pipeline', route: '/admin/case-management', icon: FileText, gradient: 'from-blue-500 to-blue-600', light: 'bg-blue-50 text-blue-600' },
    { label: 'View Reports', sub: 'Analytics & export', route: '/admin/reports-analytics', icon: BarChart2, gradient: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 text-emerald-600' },
    { label: 'Admin Console', sub: 'Settings & config', route: '/admin/admin-center', icon: Shield, gradient: 'from-violet-500 to-violet-600', light: 'bg-violet-50 text-violet-600' },
]

const STATUS_META = {
    DRAFT:        { label: 'Draft',        bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400' },
    SUBMITTED:    { label: 'Submitted',    bg: 'bg-blue-50',     text: 'text-blue-600',    dot: 'bg-blue-500' },
    UNDER_REVIEW: { label: 'Under Review', bg: 'bg-amber-50',    text: 'text-amber-600',   dot: 'bg-amber-500' },
    APPROVED:     { label: 'Approved',     bg: 'bg-green-50',    text: 'text-green-700',   dot: 'bg-green-500' },
    LISTED:       { label: 'Listed',       bg: 'bg-indigo-50',   text: 'text-indigo-700',  dot: 'bg-indigo-500' },
    AUCTION:      { label: 'In Auction',   bg: 'bg-violet-50',   text: 'text-violet-700',  dot: 'bg-violet-500' },
    CLOSED:       { label: 'Closed',       bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400' },
    FUNDED:       { label: 'Funded',       bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
    REJECTED:     { label: 'Rejected',     bg: 'bg-red-50',      text: 'text-red-600',     dot: 'bg-red-500' },
}

function StatusBadge({ status }) {
    const m = STATUS_META[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' }
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
            {m.label}
        </span>
    )
}

function MetricCard({ label, value, sub, icon: Icon, accentColor, borderColor, iconBg, iconColor }) {
    return (
        <div className={`relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor}`} />
            <div className="p-5 pt-6">
                <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{sub}</p>
            </div>
        </div>
    )
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

    const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const statCards = [
        { label: 'Total Cases', value: totalCases, sub: `${activeCases} active · ${listedCases} listed`, icon: FileText, accentColor: 'bg-indigo-500', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
        { label: 'Platform Users', value: d.total_users ?? 0, sub: `${d.pending_kyc_reviews ?? 0} pending KYC · ${d.active_users ?? 0} active`, icon: Users, accentColor: 'bg-violet-500', iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
        { label: 'Active Auctions', value: activeAuctions, sub: `${liveCases.length} total listed cases`, icon: Gavel, accentColor: 'bg-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        { label: 'Pending Actions', value: pendingActions, sub: `KYC: ${d.pending_kyc_reviews ?? 0} · Roles: ${d.pending_role_requests ?? 0}`, icon: Clock, accentColor: 'bg-rose-500', iconBg: 'bg-rose-50', iconColor: 'text-rose-500' },
    ]

    const platformRows = [
        { label: 'Live Auctions', value: liveCases.filter(c => c.status === 'AUCTION').length, sub: `${liveCases.length} total listed`, dot: 'bg-rose-500', pulse: true },
        { label: 'Pending Approvals', value: pendingActions, sub: `KYC: ${d.pending_kyc_reviews ?? 0} · Roles: ${d.pending_role_requests ?? 0}`, dot: 'bg-amber-500' },
        { label: 'Active Users', value: d.active_users ?? 0, sub: `of ${d.total_users ?? 0} total`, dot: 'bg-emerald-500' },
        { label: 'Suspended Users', value: d.suspended_users ?? 0, sub: 'Requires admin review', dot: 'bg-slate-400' },
    ]

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-400">Loading dashboard…</p>
            </div>
        )
    }

    return (
        <>
        <div className="space-y-6">

            {/* Page header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">{today}</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3.5 py-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">All Systems Operational</span>
                </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => <MetricCard key={i} {...card} />)}
            </div>

            {/* Platform status + Recent cases */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Platform Status */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-800">Platform Status</p>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {platformRows.map((row, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                                        {row.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${row.dot} opacity-60`} />}
                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${row.dot}`} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-700">{row.label}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{row.sub}</p>
                                    </div>
                                </div>
                                <span className="text-xl font-bold text-slate-800 shrink-0 ml-3 tabular-nums">{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Cases */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-800">Recent Cases</p>
                        </div>
                        <Link to="/admin/case-management" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                            View all <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    {recentCases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <FileText className="w-8 h-8 mb-2 opacity-30" />
                            <p className="text-sm">No cases yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {recentCases.map((c, i) => (
                                <div key={c.id || i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{c.title || c.property_address || 'Untitled Case'}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {c.case_number || String(c.id || '').slice(0, 8).toUpperCase()} · {c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU') : '—'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {c.loan_amount && <p className="text-sm font-semibold text-slate-600 hidden sm:block">{formatCurrency(c.loan_amount)}</p>}
                                        <StatusBadge status={c.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
                    <Zap className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-800">Quick Actions</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y divide-slate-50">
                    {QUICK_ACTIONS.map((action, i) => {
                        const Icon = action.icon
                        return (
                            <button
                                key={i}
                                onClick={() => navigate(action.route)}
                                className="flex flex-col items-start p-5 hover:bg-slate-50/80 transition-all text-left group"
                            >
                                <div className={`w-10 h-10 rounded-xl ${action.light} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{action.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{action.sub}</p>
                                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    Open <ArrowRight className="w-3 h-3" />
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Support banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl px-6 py-5">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white rounded-full translate-y-1/2" />
                </div>
                <div className="relative flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-white">Need help with the platform?</p>
                        <p className="text-xs text-indigo-200 mt-0.5">Our support team is available during business hours Mon–Fri.</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button onClick={() => setShowSupportModal(true)} className="text-sm font-semibold px-4 py-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors backdrop-blur-sm">Resources</button>
                        <button onClick={() => setShowContactModal(true)} className="text-sm font-semibold px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 transition-colors shadow-sm">Contact Support</button>
                    </div>
                </div>
            </div>

        </div>

        {/* Support Resources Modal */}
        {showSupportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowSupportModal(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 border border-gray-100" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">Support Resources</p>
                        <button onClick={() => setShowSupportModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-lg leading-none">&times;</button>
                    </div>
                    <div className="px-5 py-2">
                        {[
                            { name: "ASIC MoneySmart", phone: "1300 300 630" },
                            { name: "National Debt Helpline", phone: "1800 007 007" },
                            { name: "AFCA", phone: "1800 931 678" },
                            { name: "Legal Aid NSW", phone: "1300 888 529" },
                            { name: "Fair Trading NSW", phone: "13 32 20" },
                        ].map(r => (
                            <div key={r.name} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                                <p className="text-sm font-medium text-slate-700">{r.name}</p>
                                <p className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">{r.phone}</p>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-4 border-t border-slate-100">
                        <button onClick={() => setShowSupportModal(false)} className="w-full text-sm font-semibold py-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}

        {/* Contact Support Modal */}
        {showContactModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowContactModal(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 border border-gray-100" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">Contact Support</p>
                        <button onClick={() => setShowContactModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-lg leading-none">&times;</button>
                    </div>
                    <div className="px-5 py-2">
                        {[
                            { label: "Email", value: "support@briqbanq.com.au" },
                            { label: "Debt Helpline", value: "1800 007 007" },
                            { label: "AFCA Complaints", value: "1800 931 678" },
                        ].map(c => (
                            <div key={c.label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                                <p className="text-xs font-medium text-slate-400">{c.label}</p>
                                <p className="text-sm font-semibold text-slate-700">{c.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-4 border-t border-slate-100">
                        <button onClick={() => setShowContactModal(false)} className="w-full text-sm font-semibold py-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}
