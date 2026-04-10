import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { lawyerService, casesService } from '../../api/dataService'
import { generateCasesTablePDF } from '../../utils/pdfGenerator'

const STATUS_BADGE = {
  DRAFT:        'bg-slate-100 text-slate-600',
  SUBMITTED:    'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  APPROVED:     'bg-emerald-50 text-emerald-700',
  LISTED:       'bg-indigo-50 text-indigo-700',
  AUCTION:      'bg-purple-50 text-purple-700',
  FUNDED:       'bg-teal-50 text-teal-700',
  CLOSED:       'bg-slate-100 text-slate-500',
  REJECTED:     'bg-red-50 text-red-700',
}

export default function LawyerMyCases() {
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')

  const loadCases = async () => {
    setLoading(true)
    try {
      const res = await lawyerService.getMyCases()
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
      list = list.filter(c =>
        (c.case_number && c.case_number.toLowerCase().includes(q)) ||
        (c.borrower_name && c.borrower_name.toLowerCase().includes(q)) ||
        (c.property_address && c.property_address.toLowerCase().includes(q))
      )
    }
    if (statusFilter !== 'All Status') {
      list = list.filter(c => c.status === statusFilter)
    }
    return list
  }, [cases, search, statusFilter])

  const stats = {
    total: cases.filter(c => c.status !== 'DRAFT').length,
    draft: cases.filter(c => c.status === 'DRAFT').length,
    active: cases.filter(c => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(c.status)).length,
    closed: cases.filter(c => ['CLOSED', 'FUNDED'].includes(c.status)).length,
  }

  const handleExport = () => {
    generateCasesTablePDF({
      title: 'My Cases Report',
      role: 'Lawyer',
      cases: filtered.map(c => ({
        id: c.case_number || c.id,
        property: c.property_address || '—',
        borrower: c.borrower_name || '—',
        status: c.status,
        value: c.loan_amount,
      })),
      dateRange: 'All time',
    })
  }

  const canEdit = (status) => ['DRAFT', 'SUBMITTED'].includes(status)

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Cases</h1>
          <p className="text-sm font-medium text-slate-500">Cases you have created and submitted</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/lawyer/assigned-cases')}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
        >
          View Assigned Cases →
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total (excl. Draft)', value: stats.total },
          { label: 'Draft', value: stats.draft },
          { label: 'Active', value: stats.active },
          { label: 'Closed', value: stats.closed },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800">All My Cases ({filtered.length})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cases..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-800"
            >
              <option value="All Status">All Status</option>
              {Object.keys(STATUS_BADGE).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" onClick={loadCases} className="px-3 py-2 rounded-lg bg-gray-100 text-slate-700 text-sm font-medium hover:bg-gray-200">
              Refresh
            </button>
            <button type="button" onClick={handleExport} className="px-3 py-2 rounded-lg bg-gray-100 text-slate-700 text-sm font-medium hover:bg-gray-200">
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 font-medium text-slate-700">Case Ref</th>
                <th className="py-3 px-4 font-medium text-slate-700">Property</th>
                <th className="py-3 px-4 font-medium text-slate-700">Borrower</th>
                <th className="py-3 px-4 font-medium text-slate-700">Loan Amount</th>
                <th className="py-3 px-4 font-medium text-slate-700">Status</th>
                <th className="py-3 px-4 font-medium text-slate-700">Created</th>
                <th className="py-3 px-4 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading cases...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No cases found. Create a case to get started.</td></tr>
              ) : filtered.map(row => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-slate-800">{row.case_number || String(row.id).slice(0, 8)}</td>
                  <td className="py-3 px-4 text-slate-700">{row.property_address || '—'}</td>
                  <td className="py-3 px-4 text-slate-700">{row.borrower_name || '—'}</td>
                  <td className="py-3 px-4 text-slate-700">
                    {row.outstanding_debt ? `$${Number(row.outstanding_debt).toLocaleString()}` : (row.loan_amount ? `$${Number(row.loan_amount).toLocaleString()}` : '—')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold uppercase ${STATUS_BADGE[row.status] || 'bg-slate-100 text-slate-600'}`}>
                      {row.status || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString('en-AU') : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/lawyer/my-cases/${row.id}`)}
                        className="p-2 rounded-md text-slate-600 hover:bg-gray-100"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {canEdit(row.status) && (
                        <button
                          type="button"
                          onClick={() => navigate(`/lawyer/edit-case/${row.id}`)}
                          className="p-2 rounded-md text-indigo-600 hover:bg-indigo-50"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
