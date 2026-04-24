import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    FileText, Users, Gavel, Clock, CheckCircle,
    AlertTriangle, BarChart2, Shield, Loader2,
    ChevronRight, TrendingUp, Bell, UserCheck,
    Activity, Zap, ArrowUpRight, CircleDot,
} from 'lucide-react'
import { adminService, casesService, auctionService } from '../../api/dataService'
import { formatCurrency } from '../../utils/formatters'

// ─── Config ───────────────────────────────────────────────────────────────────

const STAGES = [
    { status: 'SUBMITTED',    label: 'Submitted',  color: 'text-sky-400',     ring: 'border-sky-400',     bg: 'bg-sky-400/10',     dot: 'bg-sky-400' },
    { status: 'UNDER_REVIEW', label: 'In Review',  color: 'text-amber-400',   ring: 'border-amber-400',   bg: 'bg-amber-400/10',   dot: 'bg-amber-400' },
    { status: 'APPROVED',     label: 'Approved',   color: 'text-emerald-400', ring: 'border-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400' },
    { status: 'LISTED',       label: 'Listed',     color: 'text-indigo-400',  ring: 'border-indigo-400',  bg: 'bg-indigo-400/10',  dot: 'bg-indigo-400' },
    { status: 'AUCTION',      label: 'Auction',    color: 'text-violet-400',  ring: 'border-violet-400',  bg: 'bg-violet-400/10',  dot: 'bg-violet-400' },
    { status: 'FUNDED',       label: 'Funded',     color: 'text-green-400',   ring: 'border-green-400',   bg: 'bg-green-400/10',   dot: 'bg-green-400' },
]

const STATUS_META = {
    DRAFT:        { label: 'Draft',       pill: 'bg-slate-100 text-slate-500',    dot: 'bg-slate-400' },
    SUBMITTED:    { label: 'Submitted',   pill: 'bg-sky-50 text-sky-700',         dot: 'bg-sky-500' },
    UNDER_REVIEW: { label: 'In Review',   pill: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-500' },
    APPROVED:     { label: 'Approved',    pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    LISTED:       { label: 'Listed',      pill: 'bg-indigo-50 text-indigo-700',   dot: 'bg-indigo-500' },
    AUCTION:      { label: 'In Auction',  pill: 'bg-violet-50 text-violet-700',   dot: 'bg-violet-500' },
    FUNDED:       { label: 'Funded',      pill: 'bg-green-50 text-green-700',     dot: 'bg-green-500' },
    SETTLED:      { label: 'Settled',     pill: 'bg-teal-50 text-teal-700',       dot: 'bg-teal-500' },
    CLOSED:       { label: 'Closed',      pill: 'bg-slate-100 text-slate-500',    dot: 'bg-slate-400' },
    REJECTED:     { label: 'Rejected',    pill: 'bg-red-50 text-red-600',         dot: 'bg-red-500' },
}

const QUICK_ACTIONS = [
    { label: 'KYC Review',      sub: 'Verify identities',    route: '/admin/kyc-review',        icon: UserCheck, accent: 'text-sky-600',     bg: 'bg-sky-50',     hover: 'hover:bg-sky-100' },
    { label: 'Case Management', sub: 'Pipeline & cases',     route: '/admin/case-management',   icon: FileText,  accent: 'text-indigo-600',  bg: 'bg-indigo-50',  hover: 'hover:bg-indigo-100' },
    { label: 'Auction Control', sub: 'Live & scheduled',     route: '/admin/auction-control',   icon: Gavel,     accent: 'text-violet-600',  bg: 'bg-violet-50',  hover: 'hover:bg-violet-100' },
    { label: 'User Management', sub: 'Roles & access',       route: '/admin/user-management',   icon: Users,     accent: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:bg-emerald-100' },
    { label: 'Reports',         sub: 'Analytics & export',   route: '/admin/reports-analytics', icon: BarChart2, accent: 'text-amber-600',   bg: 'bg-amber-50',   hover: 'hover:bg-amber-100' },
    { label: 'Admin Console',   sub: 'Settings & config',    route: '/admin/admin-center',      icon: Shield,    accent: 'text-rose-600',    bg: 'bg-rose-50',    hover: 'hover:bg-rose-100' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

function StatusPill({ status }) {
    const m = STATUS_META[status] || STATUS_META.DRAFT
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${m.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
            {m.label}
        </span>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const navigate = useNavigate()
    const [loading, setLoading]       = useState(true)
    const [dashStats, setDashStats]   = useState(null)
    const [recentCases, setRecentCases] = useState([])
    const [allCases, setAllCases]     = useState([])
    const [auctions, setAuctions]     = useState([])
    const [liveCases, setLiveCases]   = useState([])

    useEffect(() => {
        ;(async () => {
            setLoading(true)
            const [dashRes, casesRes, auctionsRes, liveRes] = await Promise.all([
                adminService.getDashboardStats(),
                casesService.getCases(),
                auctionService.getAuctions(),
                casesService.getLiveListings(),
            ])
            if (dashRes.success)    setDashStats(dashRes.data)
            const cArr = Array.isArray(casesRes.data) ? casesRes.data : (casesRes.data?.items || casesRes.data?.cases || [])
            if (casesRes.success)   { setAllCases(cArr); setRecentCases(cArr.slice(0, 8)) }
            const aArr = Array.isArray(auctionsRes.data) ? auctionsRes.data : (auctionsRes.data?.items || [])
            if (auctionsRes.success) setAuctions(aArr)
            const lArr = Array.isArray(liveRes.data) ? liveRes.data : (liveRes.data?.items || [])
            if (liveRes.success)    setLiveCases(lArr)
            setLoading(false)
        })()
    }, [])

    const d            = dashStats || {}
    const nonDraft     = allCases.filter(c => c.status !== 'DRAFT')
    const totalCases   = nonDraft.length || d.total_cases || 0
    const activeCases  = nonDraft.filter(c => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(c.status)).length
    const listedCases  = nonDraft.filter(c => ['LISTED', 'AUCTION'].includes(c.status)).length
    const liveAuctions = liveCases.filter(c => ['AUCTION', 'IN_AUCTION'].includes(c.status)).length || auctions.filter(a => a.status === 'LIVE').length
    const pendingKYC   = d.pending_kyc_reviews ?? 0
    const pendingRoles = d.pending_role_requests ?? 0
    const totalPending = pendingKYC + pendingRoles

    // Pipeline stage counts
    const stageCounts = {}
    STAGES.forEach(s => { stageCounts[s.status] = 0 })
    nonDraft.forEach(c => { if (stageCounts[c.status] !== undefined) stageCounts[c.status]++ })

    // Attention items
    const attentionItems = [
        pendingKYC   > 0 && { label: 'KYC Pending',       count: pendingKYC,          route: '/admin/kyc-review',       dot: 'bg-amber-500',  text: 'text-amber-600',  pulse: false },
        pendingRoles > 0 && { label: 'Role Requests',      count: pendingRoles,        route: '/admin/user-management',  dot: 'bg-sky-500',    text: 'text-sky-600',    pulse: false },
        liveAuctions > 0 && { label: 'Live Auctions',      count: liveAuctions,        route: '/admin/auction-control',  dot: 'bg-violet-500', text: 'text-violet-600', pulse: true  },
        d.suspended_users > 0 && { label: 'Suspended Users', count: d.suspended_users, route: '/admin/user-management',  dot: 'bg-red-500',    text: 'text-red-600',    pulse: false },
    ].filter(Boolean)

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-72 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-sm text-slate-400">Loading…</p>
        </div>
    )

    const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    return (
        <div className="space-y-4">

            {/* ── DARK HERO ──────────────────────────────────────────────────── */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden">
                {/* Dot grid texture */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                {/* Subtle gradient glow */}
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative px-6 pt-5 pb-6">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">{greeting()}</p>
                            <h1 className="text-white text-xl font-bold mt-1">Admin Dashboard</h1>
                            <p className="text-slate-500 text-xs mt-0.5">{today}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {totalPending > 0 && (
                                <button onClick={() => navigate('/admin/kyc-review')}
                                    className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors">
                                    <AlertTriangle className="w-3 h-3" />
                                    {totalPending} pending
                                </button>
                            )}
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-emerald-400 text-xs font-semibold">Operational</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat tiles inside hero */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Cases',     value: totalCases,        sub: `${activeCases} active · ${listedCases} listed`,         icon: FileText,  accent: 'text-indigo-400',  border: 'border-indigo-500/20' },
                            { label: 'Platform Users',  value: d.total_users ?? 0, sub: `${d.active_users ?? 0} active`,                          icon: Users,     accent: 'text-violet-400',  border: 'border-violet-500/20' },
                            { label: 'Live Auctions',   value: liveAuctions,       sub: `${listedCases} properties listed`,                       icon: Gavel,     accent: 'text-amber-400',   border: 'border-amber-500/20' },
                            { label: 'Pending Actions', value: totalPending,       sub: totalPending > 0 ? `KYC: ${pendingKYC} · Roles: ${pendingRoles}` : 'Nothing pending', icon: Bell, accent: totalPending > 0 ? 'text-rose-400' : 'text-slate-500', border: totalPending > 0 ? 'border-rose-500/20' : 'border-white/5' },
                        ].map((s, i) => (
                            <div key={i} className={`bg-white/5 border ${s.border} rounded-xl p-4 backdrop-blur-sm`}>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-widest">{s.label}</p>
                                    <s.icon className={`w-4 h-4 ${s.accent}`} />
                                </div>
                                <p className={`text-3xl font-bold tabular-nums ${s.accent}`}>{s.value}</p>
                                <p className="text-slate-500 text-xs mt-1.5">{s.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── PIPELINE JOURNEY ───────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">Case Pipeline</p>
                            <p className="text-xs text-slate-400">{nonDraft.length} active cases across all stages</p>
                        </div>
                    </div>
                    <Link to="/admin/case-management" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        Manage <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* Stage journey */}
                <div className="flex items-center">
                    {STAGES.map((s, i) => {
                        const count = stageCounts[s.status] || 0
                        const active = count > 0
                        return (
                            <div key={s.status} className="flex items-center flex-1 min-w-0">
                                {/* Stage node */}
                                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                    {/* Count badge */}
                                    <div className={`text-lg font-bold tabular-nums min-w-[28px] text-center ${active ? s.color : 'text-slate-300'}`}>
                                        {count}
                                    </div>
                                    {/* Circle */}
                                    <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
                                        active
                                            ? `${s.ring} ${s.bg} shadow-sm`
                                            : 'border-slate-200 bg-slate-50'
                                    }`}>
                                        {active
                                            ? <span className={`text-xs font-bold ${s.color}`}>{count}</span>
                                            : <span className="text-slate-300 text-xs font-semibold">—</span>
                                        }
                                    </div>
                                    {/* Label */}
                                    <p className={`text-[11px] font-medium text-center ${active ? 'text-slate-600' : 'text-slate-300'}`}>
                                        {s.label}
                                    </p>
                                </div>
                                {/* Connector line */}
                                {i < STAGES.length - 1 && (
                                    <div className="flex-1 mx-1 mb-5">
                                        <div className={`h-0.5 w-full ${
                                            count > 0 && (stageCounts[STAGES[i + 1]?.status] > 0 || true)
                                                ? 'bg-slate-200'
                                                : 'bg-slate-100'
                                        }`} />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── MAIN GRID ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Recent Cases — 2/3 */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">Recent Cases</p>
                        </div>
                        <Link to="/admin/case-management" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                            View all <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {recentCases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                            <FileText className="w-10 h-10 mb-2" />
                            <p className="text-sm font-medium text-slate-400">No cases yet</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-12 px-5 py-2.5 bg-slate-50/70 border-b border-slate-100">
                                {['Case / Property', 'Borrower', 'Debt', 'Status'].map((h, i) => (
                                    <span key={h} className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest ${
                                        i === 0 ? 'col-span-5' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-2 text-right' : 'col-span-2 text-right'
                                    }`}>{h}</span>
                                ))}
                            </div>
                            <div className="divide-y divide-slate-50">
                                {recentCases.map((c, i) => {
                                    const m = STATUS_META[c.status] || STATUS_META.DRAFT
                                    return (
                                        <button
                                            key={c.id || i}
                                            onClick={() => navigate(`/admin/case-details/${c.id}/overview`)}
                                            className="w-full grid grid-cols-12 items-center px-5 py-3 hover:bg-indigo-50/30 transition-colors group text-left"
                                        >
                                            <div className="col-span-5 flex items-center gap-3 min-w-0">
                                                <span className={`w-1 h-9 rounded-full shrink-0 ${m.dot}`} />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors leading-tight">
                                                        {c.property_address || c.title || 'Untitled Case'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                        {c.case_number || String(c.id || '').slice(0, 8).toUpperCase()}
                                                        {c.created_at && ` · ${new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="col-span-3 min-w-0 pr-2">
                                                <p className="text-xs font-medium text-slate-600 truncate">{c.borrower_name || '—'}</p>
                                            </div>
                                            <div className="col-span-2 text-right pr-2">
                                                <p className="text-xs font-bold text-slate-700 tabular-nums">
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

                {/* Right sidebar — 1/3 */}
                <div className="flex flex-col gap-4">

                    {/* Needs Attention */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100">
                            <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Bell className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">Needs Attention</p>
                            {totalPending > 0 && (
                                <span className="ml-auto text-xs font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{totalPending}</span>
                            )}
                        </div>

                        {attentionItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                </div>
                                <p className="text-sm font-semibold text-slate-600">All clear</p>
                                <p className="text-xs text-slate-400 text-center mt-0.5">Nothing requires your attention right now</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {attentionItems.map((item, i) => (
                                    <button key={i} onClick={() => navigate(item.route)}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group text-left">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                                {item.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.dot} opacity-60`} />}
                                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${item.dot}`} />
                                            </span>
                                            <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{item.label}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={`text-sm font-bold tabular-nums ${item.text}`}>{item.count}</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Platform Overview */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Activity className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">Overview</p>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Users Active',     value: d.active_users ?? 0,     max: d.total_users || 1,             color: 'bg-indigo-500',  light: 'bg-indigo-50',  text: 'text-indigo-600' },
                                { label: 'Cases in Review',  value: activeCases,               max: Math.max(totalCases, 1),        color: 'bg-amber-500',   light: 'bg-amber-50',   text: 'text-amber-600' },
                                { label: 'Live / Listed',    value: listedCases,               max: Math.max(totalCases, 1),        color: 'bg-violet-500',  light: 'bg-violet-50',  text: 'text-violet-600' },
                                { label: 'Funded Cases',     value: nonDraft.filter(c => c.status === 'FUNDED').length, max: Math.max(totalCases, 1), color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
                            ].map((row, i) => {
                                const pct = Math.min(Math.round((row.value / row.max) * 100), 100)
                                return (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-medium text-slate-500">{row.label}</span>
                                            <span className={`text-xs font-bold tabular-nums ${row.text}`}>{row.value}</span>
                                        </div>
                                        <div className={`h-1.5 ${row.light} rounded-full overflow-hidden`}>
                                            <div className={`h-full ${row.color} rounded-full transition-all duration-700`} style={{ width: `${pct || 2}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── QUICK ACTIONS ──────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Quick Actions</p>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6">
                    {QUICK_ACTIONS.map((a, i) => (
                        <button
                            key={i}
                            onClick={() => navigate(a.route)}
                            className={`flex flex-col items-center gap-2.5 py-5 px-2 transition-colors group border-r border-b border-slate-50 last:border-r-0 ${a.hover}`}
                        >
                            <div className={`w-10 h-10 ${a.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <a.icon className={`w-4.5 h-4.5 ${a.accent}`} />
                            </div>
                            <div className="text-center">
                                <p className={`text-xs font-bold text-slate-700 group-hover:${a.accent} transition-colors`}>{a.label}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{a.sub}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

        </div>
    )
}
