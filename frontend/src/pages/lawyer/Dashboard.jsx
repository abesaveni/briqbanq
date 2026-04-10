import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from './components/StatCard'
import { casesService, lawyerService, auctionService } from '../../api/dataService'

const QUICK_ACTIONS = [
  { id: 'kyc', label: 'Review KYC', sub: 'Pending approvals', path: '/lawyer/kyc-review' },
  { id: 'cases', label: 'Manage Cases', sub: 'Active cases', path: '/lawyer/assigned-cases' },
  { id: 'reports', label: 'View Reports', sub: 'Generate', path: '/lawyer/reports' },
  { id: 'contracts', label: 'Contract Review', sub: 'Review contracts', path: '/lawyer/contract-review' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [showRangeMenu, setShowRangeMenu] = useState(false)
  const [openCaseMenu, setOpenCaseMenu] = useState(null)
  const [dashStats, setDashStats] = useState(null)
  const [cases, setCases] = useState([])
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const rangeMenuRef = useRef(null)
  const caseMenuRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (rangeMenuRef.current && !rangeMenuRef.current.contains(e.target)) setShowRangeMenu(false)
      if (caseMenuRef.current && !caseMenuRef.current.contains(e.target)) setOpenCaseMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const load = useCallback(async () => {
    const [dashRes, casesRes, auctionsRes] = await Promise.all([
      lawyerService.getDashboard(),
      lawyerService.getMyAssignedCases(),
      auctionService.getAuctions(),
    ])
    if (dashRes.success) setDashStats(dashRes.data)
    const casesArr = Array.isArray(casesRes.data) ? casesRes.data : (casesRes.data?.items || casesRes.data?.cases || [])
    if (casesRes.success) setCases(casesArr.slice(0, 5))
    const auctionsArr = Array.isArray(auctionsRes.data) ? auctionsRes.data : (auctionsRes.data?.items || auctionsRes.data?.auctions || [])
    if (auctionsRes.success) setAuctions(auctionsArr)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    window.addEventListener('focus', load)
    return () => window.removeEventListener('focus', load)
  }, [load])

  const d = dashStats || {}
  const liveAuctions = auctions.filter(a => a.status === 'active' || a.status === 'ACTIVE').length
  const totalCases = d.total_cases ?? cases.length
  const activeCases = d.active_cases ?? 0
  const pendingKYC = d.pending_kyc_reviews ?? 0
  const pendingReview = d.pending_review ?? 0

  const dashboardStats = [
    { id: 'totalCases', label: 'My Total Cases', value: totalCases, subtitle: `${activeCases} active`, trend: null, trendUp: true, icon: 'folder' },
    { id: 'activeAuctions', label: 'Active Auctions', value: liveAuctions, subtitle: `${auctions.length} total auctions`, trend: null, trendUp: true, icon: 'gavel' },
    { id: 'pendingReview', label: 'Pending Review', value: pendingReview, subtitle: 'Cases awaiting review', trend: null, trendUp: false, icon: 'clock' },
    { id: 'pendingKYC', label: 'Pending KYC', value: pendingKYC, subtitle: 'KYC submissions', trend: null, trendUp: false, icon: 'users' },
  ]

  const platformStatus = [
    { id: 'live', label: 'Live Auctions', value: liveAuctions, detail: `Total: ${auctions.length}`, color: 'blue' },
    { id: 'pending', label: 'Cases for Review', value: pendingReview, detail: `Under review by me`, color: 'orange' },
    { id: 'active', label: 'Active Cases', value: activeCases, detail: `My assigned active cases`, color: 'green' },
    { id: 'kyc', label: 'Pending KYC', value: pendingKYC, detail: 'Awaiting KYC review', color: 'red' },
  ]

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-[13px] font-medium text-gray-500">Overview of your legal case management</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/lawyer/submit-case')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Case
          </button>
          <button
            type="button"
            onClick={() => navigate('/lawyer/live-auctions')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" /></svg>
            Browse Deals
          </button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((s) => (
          <StatCard
            key={s.id}
            label={s.label}
            value={loading ? '—' : s.value}
            subtitle={s.subtitle}
            trend={s.trend}
            trendUp={s.trendUp}
            icon={s.icon}
          />
        ))}
      </div>

      {/* Platform Status + Recent Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Platform Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {platformStatus.map((s) => (
              <div key={s.id} className="p-3 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-semibold ${
                    s.color === 'blue' ? 'text-blue-600' :
                    s.color === 'orange' ? 'text-[#FF8C00]' :
                    s.color === 'green' ? 'text-emerald-500' : 'text-[#FF4500]'
                  }`}>{loading ? '—' : s.value}</span>
                  <span className="text-sm text-slate-800">{s.label}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">Recent Cases</h2>
            <button type="button" onClick={() => navigate('/lawyer/assigned-cases')} className="text-sm font-medium text-blue-600 flex items-center gap-1">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          ) : cases.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No cases found</p>
          ) : (
          <ul className="space-y-3" ref={caseMenuRef}>
            {cases.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => navigate(`/lawyer/assigned-cases/${c.id}`)}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase ${
                      {DRAFT:'bg-slate-100 text-slate-600',SUBMITTED:'bg-blue-50 text-blue-700',UNDER_REVIEW:'bg-amber-50 text-amber-700',APPROVED:'bg-emerald-50 text-emerald-700',LISTED:'bg-indigo-50 text-indigo-700',AUCTION:'bg-purple-50 text-purple-700',FUNDED:'bg-teal-50 text-teal-700',CLOSED:'bg-slate-100 text-slate-500',REJECTED:'bg-red-50 text-red-700',active:'bg-emerald-50 text-emerald-700',listed:'bg-indigo-50 text-indigo-700',completed:'bg-slate-100 text-slate-500',pending:'bg-amber-50 text-amber-700'}[c.status] || 'bg-gray-100 text-gray-700'
                    }`}>{(c.status || 'DRAFT').toUpperCase()}</span>
                    <span className="text-sm font-medium text-slate-800">{c.case_number || c.id}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{c.title || c.property_address || 'Untitled Case'}</p>
                  {c.loan_amount && <p className="text-xs text-gray-500">{new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(c.loan_amount)}</p>}
                  <p className="text-xs text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU') : ''}</p>
                </div>
              </li>
            ))}
          </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => a.path && navigate(a.path)}
              className="bg-white rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <p className="text-xs font-semibold text-slate-800">{a.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{a.sub}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
