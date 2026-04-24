import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    FileText, DollarSign, Users, Gavel, Clock,
    CheckCircle, AlertTriangle, BarChart2, Shield,
    Loader2, Activity, ChevronRight, ArrowUpRight,
    Building2, UserCheck, UserX, Zap, TrendingUp,
    CircleDot, Bell,
} from 'lucide-react'
import { adminService, casesService, auctionService } from '../../api/dataService'
import { formatCurrency } from '../../utils/formatters'

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const STAGES = [
    { status: 'SUBMITTED',    label: 'Submitted',  bar: 'bg-blue-500',    text: 'text-blue-600',    pill: 'bg-blue-50 text-blue-700' },
    { status: 'UNDER_REVIEW', label: 'In Review',  bar: 'bg-amber-500',   text: 'text-amber-600',   pill: 'bg-amber-50 text-amber-700' },
    { status: 'APPROVED',     label: 'Approved',   bar: 'bg-green-500',   text: 'text-green-600',   pill: 'bg-green-50 text-green-700' },
    { status: 'LISTED',       label: 'Listed',     bar: 'bg-indigo-500',  text: 'text-indigo-600',  pill: 'bg-indigo-50 text-indigo-700' },
    { status: 'AUCTION',      label: 'Auction',    bar: 'bg-violet-500',  text: 'text-violet-600',  pill: 'bg-violet-50 text-violet-700' },
    { status: 'FUNDED',       label: 'Funded',     bar: 'bg-emerald-500', text: 'text-emerald-600', pill: 'bg-emerald-50 text-emerald-700' },
]

const STATUS_META = {
    DRAFT:        { label: 'Draft',        pill: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400' },
    SUBMITTED:    { label: 'Submitted',    pill: 'bg-blue-50 text-blue-700',      dot: 'bg-blue-500' },
    UNDER_REVIEW: { label: 'In Review',   pill: 'bg-amber-50 text-amber-700',    dot: 'bg-amber-500' },
    APPROVED:     { label: 'Approved',     pill: 'bg-green-50 text-green-700',    dot: 'bg-green-500' },
    LISTED:       { label: 'Listed',       pill: 'bg-indigo-50 text-indigo-700',  dot: 'bg-indigo-500' },
    AUCTION:      { label: 'In Auction',  pill: 'bg-violet-50 text-violet-700',  dot: 'bg-violet-500' },
    FUNDED:       { label: 'Funded',       pill: 'bg-emerald-50 text-emerald-700',dot: 'bg-emerald-500' },
    SETTLED:      { label: 'Settled',      pill: 'bg-teal-50 text-teal-700',      dot: 'bg-teal-500' },
    CLOSED:       { label: 'Closed',       pill: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400' },
    REJECTED:     { label: 'Rejected',     pill: 'bg-red-50 text-red-600',        dot: 'bg-red-500' },
}

const QUICK_ACTIONS = [
    { label: 'KYC Review',    sub: 'Verify identities',   route: '/admin/kyc-review',         icon: UserCheck, bg: 'bg-blue-50',    color: 'text-blue-600',    border: 'border-blue-100' },
    { label: 'Case Management', sub: 'Pipeline & cases',  route: '/admin/case-management',    icon: FileText,  bg: 'bg-indigo-50',  color: 'text-indigo-600',  border: 'border-indigo-100' },
    { label: 'Auction Control', sub: 'Live & scheduled',  route: '/admin/auction-control',    icon: Gavel,     bg: 'bg-violet-50',  color: 'text-violet-600',  border: 'border-violet-100' },
    { label: 'User Management', sub: 'Roles & access',    route: '/admin/user-management',    icon: Users,     bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-100' },
    { label: 'Reports',         sub: 'Analytics & export',route: '/admin/reports-analytics',  icon: BarChart2, bg: 'bg-amber-50',   color: 'text-amber-600',   border: 'border-amber-100' },
    { label: 'Admin Console',   sub: 'Settings & config', route: '/admin/admin-center',       icon: Shield,    bg: 'bg-rose-50',    color: 'text-rose-600',    border: 'border-rose-100' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, icon: Icon, iconBg, iconColor, trend }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest truncate">{label}</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight mt-0.5">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>
            </div>
            {trend !== undefined && (
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {trend >= 0 ? '+' : ''}{trend}%
                </div>
            )}
        </div>
    )
}

function StatusPill({ status }) {
    const m = STATUS_META[status] || STATUS_META.DRAFT
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${m.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot} shrink-0`} />
            {m.label}
        </span>
    )
}

function PipelineBar({ cases }) {
    const counts = {}
    STAGES.forEach(s => { counts[s.status] = 0 })
    cases.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++ })
    const max = Math.max(...Object.values(counts), 1)
    const total = Object.values(counts).reduce((a, b) => a + b, 0)

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-800">Case Pipeline</p>
                </div>
                <span className="text-xs text-slate-400">{total} active cases</span>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-2 h-20 mb-3">
                {STAGES.map(s => {
                    const count = counts[s.status]
                    const pct = max > 0 ? (count / max) * 100 : 0
                    return (
                        <div key={s.status} className="flex-1 flex flex-col items-center gap-1">
                            <span className={`text-xs font-bold tabular-nums ${count > 0 ? s.text : 'text-slate-300'}`}>
                                {count}
                            </span>
                            <div className="w-full flex items-end" style={{ height: '52px' }}>
                                <div
                                    className={`w-full rounded-t-md transition-all duration-700 ${count > 0 ? s.bar : 'bg-slate-100'}`}
                                    style={{ height: `${Math.max(pct, count > 0 ? 8 : 4)}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Labels */}
            <div className="flex gap-2">
                {STAGES.map(s => (
                    <div key={s.status} className="flex-1 text-center">
                        <span className="text-[10px] text-slate-400 font-medium">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Progress strip */}
            <div className="flex h-1.5 rounded-full overflow-hidden mt-3 gap-px">
                {STAGES.map(s => (
                    <div
                        key={s.status}
                        className={`${s.bar} transition-all duration-700`}
                        style={{ flex: counts[s.status] || 0.2 }}
                    />
                ))}
            </div>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [dashStats, setDashStats] = useState(null)
    const [recentCases, setRecentCases] = useState([])
    const [allCases, setAllCases] = useState([])
    const [auctions, setAuctions] = useState([])
    const [liveCases, setLiveCases] = useState([])

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
            if (casesRes.success) { setAllCases(casesArr); setRecentCases(casesArr.slice(0, 8)) }
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
    const totalCases   = nonDraft.length || d.total_cases || 0
    const activeCases  = nonDraft.filter(c => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(c.status)).length
    const listedCases  = nonDraft.filter(c => ['LISTED', 'AUCTION'].includes(c.status)).length
    const liveAuctions = liveCases.filter(c => ['AUCTION', 'IN_AUCTION'].includes(c.status)).length || auctions.filter(a => a.status === 'LIVE').length
    const pendingKYC   = d.pending_kyc_reviews ?? 0
    const pendingRoles = d.pending_role_requests ?? 0
    const totalPending = pendingKYC + pendingRoles

    const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const statCards = [
        { label: 'Total Cases',     value: totalCases,        sub: `${activeCases} in review · ${listedCases} listed`, icon: FileText,  iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-600' },
        { label: 'Platform Users',  value: d.total_users ?? 0, sub: `${d.active_users ?? 0} active users`,              icon: Users,     iconBg: 'bg-violet-50',  iconColor: 'text-violet-600' },
        { label: 'Live Auctions',   value: liveAuctions,       sub: `${listedCases} total listed properties`,            icon: Gavel,     iconBg: 'bg-amber-50',   iconColor: 'text-amber-600' },
        { label: 'Pending Actions', value: totalPending,       sub: `KYC: ${pendingKYC} · Roles: ${pendingRoles}`,       icon: Bell,      iconBg: totalPending > 0 ? 'bg-rose-50' : 'bg-slate-50', iconColor: totalPending > 0 ? 'text-rose-500' : 'text-slate-400' },
    ]

    const attentionItems = [
        pendingKYC > 0 && {
            label: 'KYC Reviews Pending',
            count: pendingKYC,
            desc: 'Awaiting identity verification',
            route: '/admin/kyc-review',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            dot: 'bg-amber-500',
            urgent: pendingKYC > 5,
        },
        pendingRoles > 0 && {
            label: 'Role Requests',
            count: pendingRoles,
            desc: 'Users awaiting role approval',
            route: '/admin/user-management',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            dot: 'bg-blue-500',
            urgent: false,
        },
        liveAuctions > 0 && {
            label: 'Live Auctions',
            count: liveAuctions,
            desc: 'Auctions currently active',
            route: '/admin/auction-control',
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            dot: 'bg-violet-500',
            urgent: false,
            pulse: true,
        },
        d.suspended_users > 0 && {
            label: 'Suspended Users',
            count: d.suspended_users,
            desc: 'Accounts requiring review',
            route: '/admin/user-management',
            color: 'text-red-600',
            bg: 'bg-red-50',
            dot: 'bg-red-500',
            urgent: true,
        },
    ].filter(Boolean)

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-400">Loading dashboard…</p>
            </div>
        )
    }

    return (
        <div className="space-y-5">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-xs text-slate-400 mt-0.5">{today}</p>
                </div>
                <div className="flex items-center gap-2">
                    {totalPending > 0 && (
                        <Link to="/admin/kyc-review" className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {totalPending} pending
                        </Link>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">All Systems Operational</span>
                    </div>
                </div>
            </div>

            {/* ── Metric cards ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.map((card, i) => <MetricCard key={i} {...card} />)}
            </div>

            {/* ── Case Pipeline ──────────────────────────────────────────────── */}
            <PipelineBar cases={nonDraft} />

            {/* ── Main grid: Recent Cases + Needs Attention ───────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Recent Cases — 2/3 width */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-800">Recent Cases</p>
                        </div>
                        <Link to="/admin/case-management" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                            View all <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {recentCases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <FileText className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">No cases yet</p>
                        </div>
                    ) : (
                        <>
                            {/* Table header */}
                            <div className="grid grid-cols-12 px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                <span className="col-span-5">Case / Property</span>
                                <span className="col-span-3">Borrower</span>
                                <span className="col-span-2 text-right">Amount</span>
                                <span className="col-span-2 text-right">Status</span>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {recentCases.map((c, i) => {
                                    const m = STATUS_META[c.status] || STATUS_META.DRAFT
                                    return (
                                        <button
                                            key={c.id || i}
                                            onClick={() => navigate(`/admin/case-details/${c.id}/overview`)}
                                            className="w-full grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-50/80 transition-colors text-left group"
                                        >
                                            <div className="col-span-5 flex items-center gap-3 min-w-0">
                                                <div className={`w-1.5 h-8 rounded-full shrink-0 ${m.dot}`} />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                                                        {c.property_address || c.title || 'Untitled Case'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                                        {c.case_number || String(c.id || '').slice(0, 8).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="col-span-3 min-w-0">
                                                <p className="text-xs text-slate-600 truncate">{c.borrower_name || '—'}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}
                                                </p>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <p className="text-xs font-semibold text-slate-700 tabular-nums">
                                                    {c.outstanding_debt ? formatCurrency(c.outstanding_debt) : c.loan_amount ? formatCurrency(c.loan_amount) : '—'}
                                                </p>
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                <StatusPill status={c.status} />
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Needs Attention — 1/3 width */}
                <div className="flex flex-col gap-4">

                    {/* Action Items */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                            <Bell className="w-4 h-4 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-800">Needs Attention</p>
                        </div>

                        {attentionItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                <CheckCircle className="w-8 h-8 mb-2 text-emerald-400 opacity-60" />
                                <p className="text-sm font-medium text-slate-500">All clear</p>
                                <p className="text-xs text-slate-400 mt-0.5">Nothing requires attention</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {attentionItems.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => navigate(item.route)}
                                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors group text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                                {item.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.dot} opacity-60`} />}
                                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${item.dot}`} />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{item.label}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <span className={`text-sm font-bold tabular-nums ${item.color}`}>{item.count}</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Platform health — compact */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-800">Platform Health</p>
                        </div>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Active Users',       value: d.active_users ?? 0,     total: d.total_users ?? 0,    color: 'bg-emerald-500' },
                                { label: 'Cases in Pipeline',  value: activeCases + listedCases, total: Math.max(totalCases, 1), color: 'bg-indigo-500' },
                                { label: 'Auctions Live',      value: liveAuctions,               total: Math.max(listedCases, 1), color: 'bg-violet-500' },
                            ].map((row, i) => {
                                const pct = row.total > 0 ? Math.round((row.value / row.total) * 100) : 0
                                return (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-500">{row.label}</span>
                                            <span className="text-xs font-bold text-slate-700 tabular-nums">{row.value}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${row.color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Quick Actions strip ────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                    <Zap className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-800">Quick Actions</p>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-y divide-slate-50">
                    {QUICK_ACTIONS.map((action, i) => {
                        const Icon = action.icon
                        return (
                            <button
                                key={i}
                                onClick={() => navigate(action.route)}
                                className="flex flex-col items-center gap-2 py-5 px-3 hover:bg-slate-50 transition-colors group"
                            >
                                <div className={`w-10 h-10 rounded-xl ${action.bg} border ${action.border} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                    <Icon className={`w-4.5 h-4.5 ${action.color}`} />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{action.label}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{action.sub}</p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

        </div>
    )
}
