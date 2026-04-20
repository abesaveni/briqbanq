import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { generateReportPDF, generateCasesTablePDF } from '../../utils/pdfGenerator'
import { lawyerService } from '../../api/dataService'

const DISTRIBUTION_COLORS = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500']

const STATUS_COLOR = {
  'DRAFT':        'bg-gray-100 text-gray-600',
  'SUBMITTED':    'bg-blue-100 text-blue-700',
  'UNDER_REVIEW': 'bg-amber-100 text-amber-700',
  'APPROVED':     'bg-emerald-100 text-emerald-700',
  'LISTED':       'bg-indigo-100 text-indigo-700',
  'CLOSED':       'bg-slate-100 text-slate-600',
  'REJECTED':     'bg-red-100 text-red-600',
  'AUCTION':      'bg-purple-100 text-purple-700',
}

const RISK_COLOR = {
  'Low Risk':    'text-emerald-600',
  'Medium Risk': 'text-amber-600',
  'High Risk':   'text-red-600',
}

export default function Reports() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('Last 6 Months')
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [allCases, setAllCases] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setRefreshing(true)
    try {
      // Combine my created cases + assigned cases for complete lawyer view
      const [myRes, assignedRes] = await Promise.all([
        lawyerService.getMyCases(),
        lawyerService.getMyAssignedCases(),
      ])
      const myCases = myRes?.success ? (Array.isArray(myRes.data) ? myRes.data : (myRes.data?.items || [])) : []
      const assignedCases = assignedRes?.success ? (Array.isArray(assignedRes.data) ? assignedRes.data : (assignedRes.data?.items || [])) : []
      // Merge deduplicating by id
      const seen = new Set()
      const merged = [...myCases, ...assignedCases].filter(c => {
        if (seen.has(c.id)) return false
        seen.add(c.id)
        return true
      })
      setAllCases(merged)
    } catch { /* stay silent on network error */ } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filteredCases = allCases.filter(
    (c) => statusFilter === 'All' || c.status === statusFilter
  )

  const handleRefresh = () => loadData()

  const buildSectionRows = (section) => {
    if (section === 'Cases') {
      return filteredCases.map(c => [
        c.case_number || c.id,
        c.borrower_name || c.borrower || '—',
        c.property_address || c.title || '—',
        c.status,
        c.loan_amount ? `$${Number(c.loan_amount).toLocaleString()}` : '—',
      ])
    }
    return [
      ['Total Cases (excl. Draft)', String(allCases.filter(c => c.status !== 'DRAFT').length)],
      ['Active Cases', String(allCases.filter(c => ['SUBMITTED','UNDER_REVIEW','APPROVED','LISTED','AUCTION'].includes(c.status)).length)],
      ['Completed', String(allCases.filter(c => ['CLOSED','FUNDED'].includes(c.status)).length)],
      ['Draft Cases', String(allCases.filter(c => c.status === 'DRAFT').length)],
    ]
  }

  const handleExport = async (format, section) => {
    if (format === 'Excel') {
      const header = section === 'Cases'
        ? ['Case ID', 'Borrower', 'Property', 'Status', 'Value']
        : ['Metric', 'Value']
      const rows = buildSectionRows(section)
      const csvContent = [header, ...rows]
        .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lawyer-${section.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    if (section === 'Cases') {
      await generateCasesTablePDF({
        title: 'Lawyer Cases Report',
        role: 'Lawyer',
        cases: filteredCases.map(c => ({
          id: c.case_number || c.id,
          property: c.property_address || c.title || '—',
          borrower: c.borrower_name || c.borrower || '—',
          status: c.status,
          value: c.loan_amount,
        })),
        dateRange: period,
      })
    } else {
      await generateReportPDF({
        reportTitle: section,
        role: 'Lawyer',
        dateRange: period,
        summary: {},
        sections: [{
          heading: section,
          head: ['Metric', 'Value'],
          rows: buildSectionRows(section),
        }],
        fileName: `lawyer-${section.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`,
      })
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/lawyer/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
        <span aria-hidden>/</span>
        <span className="text-gray-700 font-medium">Reports &amp; Analytics</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports &amp; Analytics</h1>
          <p className="text-[13px] font-medium text-gray-500 mt-1">Comprehensive platform insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 90 Days">Last 90 Days</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="Last Year">Last Year</option>
          </select>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-70 flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Key metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Cases',    value: loading ? '—' : allCases.filter(c => c.status !== 'DRAFT').length },
          { label: 'Active Cases',   value: loading ? '—' : allCases.filter(c => ['SUBMITTED','UNDER_REVIEW','APPROVED','LISTED','AUCTION'].includes(c.status)).length },
          { label: 'Draft Cases',    value: loading ? '—' : allCases.filter(c => c.status === 'DRAFT').length },
          { label: 'Under Review',   value: loading ? '—' : allCases.filter(c => c.status === 'UNDER_REVIEW').length },
          { label: 'Completed',      value: loading ? '—' : allCases.filter(c => ['CLOSED','FUNDED'].includes(c.status)).length },
          { label: 'Rejected',       value: loading ? '—' : allCases.filter(c => c.status === 'REJECTED').length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
            {s.growth && (
              <span className="text-xs font-medium text-emerald-600">{s.growth} vs prior</span>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Case Volume Trend */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Case Volume Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly case count — {period}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/lawyer/assigned-cases')}
              className="text-sm text-blue-600 hover:text-[#2a5fc4] font-medium"
            >
              View Cases →
            </button>
          </div>
          <div className="flex items-end gap-2 h-36">
            {(() => {
              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
              const counts = months.map(m => allCases.filter(c => {
                if (!c.created_at) return false
                return new Date(c.created_at).toLocaleString('en-AU', { month: 'short' }) === m
              }).length)
              const maxVal = Math.max(...counts, 1)
              return months.slice(-6).map((m, i) => {
                const count = counts[months.indexOf(m)]
                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{count}</span>
                    <div className="w-full bg-blue-600 rounded-t-md transition-all duration-500"
                      style={{ height: `${(count / maxVal) * 112}px` }} />
                    <span className="text-xs text-gray-400">{m}</span>
                  </div>
                )
              })
            })()}
          </div>
        </div>

        {/* Case Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Case Distribution</h3>
              <p className="text-xs text-gray-500 mt-0.5">By property type — {period}</p>
            </div>
          </div>
          {(() => {
            const typeCounts = {}
            allCases.forEach(c => {
              const t = c.property_type || c.metadata_json?.property_type || 'Other'
              typeCounts[t] = (typeCounts[t] || 0) + 1
            })
            const total = Object.values(typeCounts).reduce((a, b) => a + b, 0)
            const bars = Object.entries(typeCounts).map(([label, count]) => ({
              label,
              count,
              pct: total > 0 ? Math.round((count / total) * 100) : 0,
            })).sort((a, b) => b.count - a.count)
            if (bars.length === 0) return (
              <div className="flex flex-col items-center justify-center h-28 gap-2 text-gray-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                <p className="text-sm font-medium text-gray-400">No case data yet</p>
              </div>
            )
            return (
              <div className="space-y-3">
                {bars.map((r, i) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{r.label}</span>
                      <span className="font-medium">{r.pct}% ({r.count})</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${DISTRIBUTION_COLORS[i % DISTRIBUTION_COLORS.length]} rounded-full`} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── Case Details Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Case Details</h3>
            <p className="text-xs text-gray-500 mt-0.5">All cases for the selected period — click a row to view full details</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="LISTED">Listed</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button
              type="button"
              onClick={() => navigate('/lawyer/assigned-cases')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-[#2a5fc4] text-white text-sm font-medium rounded-lg"
            >
              View All Cases
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Case ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Borrower</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Debt</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Valuation</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-gray-400">
                    No cases match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-[#EEF4FF]/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/lawyer/assigned-cases/${c.id}`)}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{c.case_number || c.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{c.borrower_name || c.borrower || '—'}</td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{c.property_address || c.title || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{c.loan_amount ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(c.loan_amount) : '—'}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{c.property_value ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(c.property_value) : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium ${RISK_COLOR[c.risk_level] || 'text-gray-500'}`}>
                        {c.risk_level || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU') : '—'}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/lawyer/assigned-cases/${c.id}`) }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-[#2a5fc4] hover:bg-[#EEF4FF] rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredCases.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Showing {filteredCases.length} of {allCases.length} cases</p>
            <button
              type="button"
              onClick={() => navigate('/lawyer/assigned-cases')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              View all in Cases →
            </button>
          </div>
        )}
      </div>

      {/* Export sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: 'Financial Summary',  desc: 'Revenue, payments, and transaction analysis.',  color: 'bg-emerald-100', textColor: 'text-emerald-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
          { title: 'Case Performance',   desc: 'Case volume, status breakdown, and trends.',    color: 'bg-blue-100',    textColor: 'text-blue-600',    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
          { title: 'User Activity',      desc: 'User engagement, registrations, and KYC.',     color: 'bg-purple-100',  textColor: 'text-purple-600',  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
          { title: 'Auction Analytics',  desc: 'Bidding activity, win rates, and pricing.',    color: 'bg-amber-100',   textColor: 'text-amber-600',   icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
        ].map((s) => (
          <div key={s.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center flex-shrink-0`}>
                <svg className={`w-5 h-5 ${s.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleExport('PDF', s.title)}
                className="flex-1 bg-blue-600 hover:bg-[#2a5fc4] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Export PDF
              </button>
              <button
                type="button"
                onClick={() => handleExport('Excel', s.title)}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Export Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
