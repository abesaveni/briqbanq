import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CaseCard from './components/CaseCard'
import RiskBadge from './components/RiskBadge'
import SubmitCaseForm from '../../components/case/SubmitCaseForm'
import { lawyerService } from '../../api/dataService'
import { generateCasesTablePDF } from '../../utils/pdfGenerator'

const STATUS_BADGE = {
  DRAFT:        "bg-slate-100 text-slate-600",
  SUBMITTED:    "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  APPROVED:     "bg-emerald-50 text-emerald-700",
  LISTED:       "bg-indigo-50 text-indigo-700",
  AUCTION:      "bg-purple-50 text-purple-700",
  FUNDED:       "bg-teal-50 text-teal-700",
  CLOSED:       "bg-slate-100 text-slate-500",
  REJECTED:     "bg-red-50 text-red-700",
  active:       "bg-emerald-50 text-emerald-700",
  pending:      "bg-amber-50 text-amber-700",
  listed:       "bg-indigo-50 text-indigo-700",
  completed:    "bg-slate-100 text-slate-500",
}

const STAT_ICONS = {
  total: () => <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  active: () => <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  inAuction: () => <svg className="w-5 h-5 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  completed: () => <svg className="w-5 h-5 text-[#6A0DAD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
}

export default function AssignedCases() {
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [showNewCase, setShowNewCase] = useState(false)

  const loadCases = async () => {
    setLoading(true)
    try {
      const res = await lawyerService.getMyAssignedCases()
      const d = res.data
      setCases(Array.isArray(d) ? d : (d?.items || d?.cases || []))
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { loadCases() }, [])

  const filtered = useMemo(() => {
    let list = [...cases]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          (c.case_number && c.case_number.toLowerCase().includes(q)) ||
          (c.borrower_name && c.borrower_name.toLowerCase().includes(q)) ||
          (c.property_address && c.property_address.toLowerCase().includes(q))
      )
    }
    if (statusFilter && statusFilter !== 'All Status') {
      list = list.filter((c) => c.status === statusFilter)
    }
    return list
  }, [cases, search, statusFilter])

  const handleStatusChange = async (id, status) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    try { await casesService.updateCaseStatus(id, status) } catch (_) {}
  }

  const handleView = (id) => navigate(`/lawyer/assigned-cases/${id}`)

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete case ${id}?`)) return
    setCases((prev) => prev.filter((c) => c.id !== id))
    try { await casesService.deleteCase(id) } catch (_) {}
  }

  const handleRefresh = () => {
    setSearch('')
    setStatusFilter('All Status')
    loadCases()
  }

  const handleNewCaseSuccess = () => {
    setShowNewCase(false)
    loadCases()
  }

  const handleExport = () => {
    generateCasesTablePDF({
      title: 'Assigned Cases Report',
      role: 'Lawyer',
      cases: filtered.map((c) => ({
        id: c.case_number || c.id,
        property: c.property_address || '—',
        borrower: c.borrower_name || '—',
        status: c.status,
        value: c.loan_amount,
      })),
      dateRange: 'All time',
    })
  }

  const stats = {
    total: cases.length,
    active: cases.filter((c) => ['UNDER_REVIEW', 'APPROVED'].includes(c.status)).length,
    inAuction: cases.filter((c) => ['LISTED', 'AUCTION'].includes(c.status)).length,
    completed: cases.filter((c) => c.status === 'CLOSED').length,
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assigned Cases</h1>
          <p className="text-[13px] font-medium text-slate-500">Manage your assigned legal cases</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'total', label: 'Total Cases', value: stats.total, icon: 'total' },
          { key: 'active', label: 'Active Cases', value: stats.active, icon: 'active' },
          { key: 'inAuction', label: 'In Auction', value: stats.inAuction, icon: 'inAuction' },
          { key: 'completed', label: 'Completed', value: stats.completed, icon: 'completed' },
        ].map((s) => (
          <div key={s.key} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            </div>
            {STAT_ICONS[s.icon] && <div className="flex-shrink-0 opacity-70">{STAT_ICONS[s.icon]()}</div>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800">All Cases ({filtered.length})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cases..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-800"
            >
              <option value="All Status">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="LISTED">Listed</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button type="button" onClick={handleRefresh} className="px-3 py-2 rounded-lg bg-gray-100 text-slate-800 text-sm font-medium hover:bg-gray-200 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
            <button type="button" onClick={handleExport} className="px-3 py-2 rounded-lg bg-gray-100 text-slate-800 text-sm font-medium hover:bg-gray-200 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </button>
          </div>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 font-medium text-slate-800">Case Number</th>
                <th className="py-3 px-4 font-medium text-slate-800">Borrower</th>
                <th className="py-3 px-4 font-medium text-slate-800">Property</th>
                <th className="py-3 px-4 font-medium text-slate-800">Debt</th>
                <th className="py-3 px-4 font-medium text-slate-800">Valuation</th>
                <th className="py-3 px-4 font-medium text-slate-800">Status</th>
                <th className="py-3 px-4 font-medium text-slate-800">Risk</th>
                <th className="py-3 px-4 font-medium text-slate-800">Created</th>
                <th className="py-3 px-4 font-medium text-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-8 text-center text-gray-400">Loading cases...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-gray-400">No cases found</td></tr>
              ) : filtered.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-slate-800">{row.case_number || row.id}</td>
                  <td className="py-3 px-4 text-slate-800">{row.borrower_name || row.borrower}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{row.property_address}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-800">{row.loan_amount ? `$${Number(row.loan_amount).toLocaleString()}` : '—'}</td>
                  <td className="py-3 px-4 text-slate-800">{row.property_value ? `$${Number(row.property_value).toLocaleString()}` : '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold uppercase ${STATUS_BADGE[row.status] || "bg-slate-100 text-slate-600"}`}>
                      {row.status || "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge risk={row.risk_level || row.risk} />
                  </td>
                  <td className="py-3 px-4 text-gray-600">{row.created_at ? new Date(row.created_at).toLocaleDateString('en-AU') : '—'}</td>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <button type="button" onClick={() => handleView(row.id)} className="p-2 rounded-md text-slate-800 hover:bg-gray-100" aria-label="View">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button type="button" onClick={() => handleDelete(row.id)} className="p-2 rounded-md text-red-600 hover:bg-red-50" aria-label="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden p-4 space-y-4">
          {filtered.map((c) => (
            <CaseCard
              key={c.id}
              case={{ ...c, caseNumber: c.case_number || c.id, borrower: c.borrower_name, property: c.property_address, debt: c.loan_amount, valuation: c.property_value, risk: c.risk_level }}
              onView={handleView}
            />
          ))}
        </div>
      </div>

      {/* New Case – full-screen overlay (same as borrower dashboard) */}
      {showNewCase && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-case-title"
        >
          <div className="flex-shrink-0 flex justify-end items-center p-2 md:p-3 border-b border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setShowNewCase(false)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close New Case"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 p-4 md:p-6 lg:p-8">
            <SubmitCaseForm role="lawyer" onClose={() => setShowNewCase(false)} onSuccess={handleNewCaseSuccess} />
          </div>
        </div>
      )}

    </div>
  )
}
