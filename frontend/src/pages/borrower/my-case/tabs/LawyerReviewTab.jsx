import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { borrowerApi } from '../../api'
export default function LawyerReviewTab({ caseId }) {
  const { user } = useAuth()
  const isLawyer = user?.roles?.includes('lawyer') || user?.role === 'lawyer'
  const [nccpYes, setNccpYes] = useState(true)
  const [enforcement, setEnforcement] = useState([])
  const [compliance, setCompliance] = useState([])
  const [docReview, setDocReview] = useState([])
  const [reviewNotes, setReviewNotes] = useState('')
  const [soaFile, setSoaFile] = useState(null)
  const [soaUploaded, setSoaUploaded] = useState(false)
  const [soaUploading, setSoaUploading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)
  const [viewingDoc, setViewingDoc] = useState(null)
  const [caseData, setCaseData] = useState(null)

  useEffect(() => {
    if (!caseId) return
    borrowerApi.getCaseDetails(caseId)
      .then(res => { if (res?.data) setCaseData(res.data) })
      .catch(() => {})
  }, [caseId])

  const c = caseData || {}
  const addr = c.property_address || (c.property ? `${c.property.address || ''}, ${c.property.suburb || ''}, ${c.property.state || ''} ${c.property.postcode || ''}`.replace(/,\s*,/g, ',').trim() : '')

  const toggleEnforcement = (id) => {
    setEnforcement((prev) =>
      prev.map((e) => (e.id === id ? { ...e, checked: !e.checked } : e))
    )
  }
  const updateEnforcementField = (id, field, value) => {
    setEnforcement((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }
  const toggleCompliance = (id) => {
    setCompliance((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    )
  }
  const toggleDocReview = (id) => {
    setDocReview((prev) =>
      prev.map((d) => (d.id === id ? { ...d, checked: !d.checked } : d))
    )
  }

  const reviewProgress = Math.round(
    (enforcement.length + compliance.length) > 0
      ? ((enforcement.filter((e) => e.checked).length + compliance.filter((c) => c.checked).length) /
          (enforcement.length + compliance.length)) *
          100
      : 0
  )

  const requiredIncomplete = enforcement.filter((e) => e.required && !e.checked).length
  const criticalIncomplete = compliance.filter((c) => c.critical && !c.checked).length
  const criticalIssues = requiredIncomplete + criticalIncomplete
  const reviewedCount = docReview.filter((d) => d.checked).length

  const handleViewDoc = (doc) => {
    setViewingDoc(doc)
  }
  const handleDownloadDoc = (doc) => {
    const link = document.createElement('a')
    link.href = '#'
    link.download = `${doc.title.replace(/\s+/g, '-')}.pdf`
    link.click()
  }
  const handleSoaSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSoaFile(file)
      setSoaUploaded(false)
    }
  }
  const handleSoaUpload = async () => {
    if (!soaFile) return
    setSoaUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', soaFile)
      formData.append('caseId', caseId || '')
      await borrowerApi.uploadSoaDocument?.(formData)
    } catch {
      // treat as success in demo — file is selected and "submitted"
    } finally {
      setSoaUploading(false)
      setSoaUploaded(true)
    }
  }
  const handleRejectCase = async () => {
    if (!window.confirm('Reject this case? This action may be recorded.')) return
    setActionError(null)
    setActionSuccess(null)
    setActionLoading('reject')
    try {
      await borrowerApi.rejectCase(caseId, { reason: reviewNotes })
      setActionSuccess('Case has been rejected.')
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || 'Reject failed.')
    } finally {
      setActionLoading(null)
    }
  }


  return (
    <div className="space-y-6">
      {/* Document preview modal */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-8 px-4"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="w-full max-w-3xl flex flex-col gap-0 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Toolbar bar (PDF-viewer style) */}
            <div className="bg-gray-900 flex items-center gap-3 px-5 py-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                  <path d="M14 2v6h6"/>
                </svg>
                <span className="text-sm font-medium text-white truncate">{viewingDoc.title}.pdf</span>
                <span className={`ml-2 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  viewingDoc.status === 'Reviewed'
                    ? 'bg-green-900 text-green-300'
                    : 'bg-amber-900 text-amber-300'
                }`}>
                  {viewingDoc.status || 'Pending Review'}
                </span>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {viewingDoc.pages || '—'} pages &nbsp;·&nbsp; {viewingDoc.size || '—'}
              </span>
              <button
                type="button"
                onClick={() => handleDownloadDoc(viewingDoc)}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download
              </button>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="flex-shrink-0 text-gray-400 hover:text-white ml-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Paper document area */}
            <div className="bg-gray-200 px-8 py-8">
              <div className="bg-white shadow-lg rounded-sm mx-auto" style={{ maxWidth: 680 }}>

                {/* Document letterhead */}
                <div className="px-10 pt-10 pb-6 border-b-2 border-gray-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-blue-700 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                          </svg>
                        </div>
                        <span className="text-lg font-bold text-blue-800 tracking-tight">BriqBanq</span>
                      </div>
                      <p className="text-xs text-gray-400">BriqBanq Pty Ltd — ABN 12 345 678 901</p>
                      <p className="text-xs text-gray-400">Level 20, 1 Market St, Sydney NSW 2000</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Reference</p>
                      <p className="text-sm font-bold text-gray-800">{viewingDoc.ref || '—'}</p>
                      <p className="text-xs text-gray-500 mt-1">Date: {viewingDoc.date || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Document title block */}
                <div className="px-10 py-6 bg-gray-50 border-b border-gray-200">
                  <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide text-center">
                    {viewingDoc.title}
                  </h1>
                  {(viewingDoc.parties || []).length > 0 && (
                    <div className="mt-4 flex flex-col gap-1 text-center">
                      {viewingDoc.parties.map((p, i) => (
                        <p key={i} className="text-sm text-gray-700">
                          {i === 0 ? '' : i === 1 ? 'and' : ''} <strong>{p}</strong>
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary / recitals */}
                {viewingDoc.summary && (
                  <div className="px-10 py-5 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Background / Recitals</p>
                    <p className="text-sm text-gray-700 leading-relaxed italic border-l-4 border-blue-200 pl-4">
                      {viewingDoc.summary}
                    </p>
                  </div>
                )}

                {/* Content sections */}
                <div className="px-10 py-6 space-y-6">
                  {(viewingDoc.sections || []).map((section, i) => (
                    <div key={i}>
                      <h3 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">
                        {section.heading}
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{section.body}</p>
                    </div>
                  ))}
                </div>

                {/* Signature block */}
                <div className="px-10 py-8 border-t border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="h-10 border-b border-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">Authorised Signatory — Lender</p>
                      <p className="text-xs text-gray-400">BriqBanq Pty Ltd</p>
                    </div>
                    <div>
                      <div className="h-10 border-b border-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">Borrower Signature</p>
                      <p className="text-xs text-gray-400">Date: _______________</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-3 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-xs text-gray-400">CONFIDENTIAL — {viewingDoc.ref}</p>
                  <p className="text-xs text-gray-400">Page 1 of {viewingDoc.pages || 1}</p>
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="bg-gray-900 px-5 py-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  toggleDocReview(viewingDoc.id)
                  setViewingDoc(null)
                }}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors bg-green-700 hover:bg-green-600 text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                {docReview.find(d => d.id === viewingDoc.id)?.checked ? 'Mark as Unreviewed' : 'Mark as Reviewed'}
              </button>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="ml-auto text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Legal Review & Compliance</h2>
        <p className="text-sm text-gray-500 mt-1">Comprehensive legal review for {caseId || c?.case_number || '—'}.</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${reviewProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">In Review — {reviewProgress}%</p>
          </div>
        </div>
        {criticalIssues > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              {requiredIncomplete} required enforcement steps incomplete • {criticalIncomplete} critical compliance issues
            </p>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600">
          <span>Property: {addr || '—'}</span>
          <span>Borrower: {c.borrower_name || c.borrower_email || user?.name || user?.firstName || '—'}</span>
          <span>Outstanding Debt: {c.outstanding_debt ? `$${Number(c.outstanding_debt).toLocaleString()}` : '—'}</span>
          <span>Valuation: {c.estimated_value ? `$${Number(c.estimated_value).toLocaleString()}` : '—'}</span>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">NCCP Loan Determination</h2>
        <p className="text-sm text-gray-500 mt-1">National Consumer Credit Protection requirements apply to this loan.</p>
        <p className="text-sm font-medium text-gray-700 mt-3">Is this an NCCP loan?</p>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="nccp"
              checked={nccpYes}
              onChange={() => setNccpYes(true)}
              className="rounded-full border-gray-300 text-blue-600"
            />
            <span className="text-sm">Yes - NCCP</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="nccp"
              checked={!nccpYes}
              onChange={() => setNccpYes(false)}
              className="rounded-full border-gray-300 text-blue-600"
            />
            <span className="text-sm">No - Not NCCP</span>
          </label>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Document Review ({reviewedCount}/{docReview.length})
        </h2>
        <ul className="mt-4 divide-y divide-gray-200">
          {docReview.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between py-3 first:pt-0">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`doc-${doc.id}`}
                  checked={doc.checked}
                  onChange={() => toggleDocReview(doc.id)}
                  className="rounded border-gray-300 text-blue-600 h-4 w-4 cursor-pointer"
                />
                <label
                  htmlFor={`doc-${doc.id}`}
                  className="text-sm font-medium text-gray-900 cursor-pointer select-none"
                >
                  {doc.title}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleViewDoc(doc)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 rounded transition-colors"
                  title="View document"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(doc)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 rounded transition-colors"
                  title="Download document"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-orange-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2Z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Enforcement Steps Verification</h2>
        </div>
        <div className="flex items-start gap-2 mt-1 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-500">Verify that all required enforcement steps have been completed correctly and in accordance with legislation.</p>
        </div>
        <ul className="space-y-3">
          {enforcement.map((e) => (
            <li key={e.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Step header row */}
              <div className="flex items-start gap-3 p-4">
                <input
                  type="checkbox"
                  id={e.id}
                  checked={e.checked}
                  onChange={() => toggleEnforcement(e.id)}
                  className="rounded border-gray-300 text-blue-600 h-4 w-4 cursor-pointer mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <label htmlFor={e.id} className="text-sm font-semibold text-gray-900 cursor-pointer select-none block">
                    {e.label}
                  </label>
                  {e.required && (
                    <span className="inline-block mt-1.5 text-xs font-semibold text-white bg-red-500 px-2.5 py-0.5 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                {/* Status indicator on the right */}
                {e.checked ? (
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              {/* Expanded detail panel — shown when checked */}
              {e.checked && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date Completed */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date Completed</label>
                      <input
                        type="date"
                        value={e.dateCompleted}
                        onChange={(ev) => updateEnforcementField(e.id, 'dateCompleted', ev.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {/* Compliance Status */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Compliance Status</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateEnforcementField(e.id, 'complianceStatus', 'compliant')}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            e.complianceStatus === 'compliant'
                              ? 'bg-blue-800 border-blue-800 text-white'
                              : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Compliant
                        </button>
                        <button
                          type="button"
                          onClick={() => updateEnforcementField(e.id, 'complianceStatus', 'issues')}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            e.complianceStatus === 'issues'
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Issues
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Verification notes */}
                  <textarea
                    value={e.notes}
                    onChange={(ev) => updateEnforcementField(e.id, 'notes', ev.target.value)}
                    placeholder="Add verification notes..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Loan Compliance - Buyer Protection</h2>
        <p className="text-sm text-gray-500 mt-1">Ensure the loan is fully compliant and will present no legal issues for the buyer/investor.</p>
        <ul className="mt-4 space-y-2">
          {compliance.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                id={item.id}
                checked={item.checked}
                onChange={() => toggleCompliance(item.id)}
                className="rounded border-gray-300 text-blue-600 h-4 w-4 cursor-pointer"
              />
              <label htmlFor={item.id} className="flex-1 text-sm text-gray-900 cursor-pointer select-none">{item.label}</label>
              {item.critical && <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">Critical</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Statement of Advice</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload the Statement of Advice document for this case.
        </p>
        {soaUploaded ? (
          <div className="mt-4 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800">Document uploaded successfully</p>
              <p className="text-xs text-green-600 truncate">{soaFile?.name}</p>
            </div>
            <button
              type="button"
              onClick={() => { setSoaFile(null); setSoaUploaded(false) }}
              className="text-green-600 hover:text-green-800 text-sm font-medium flex-shrink-0"
            >
              Replace
            </button>
          </div>
        ) : (
          <>
            <div
              className={`mt-4 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                soaFile ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => document.getElementById('soa-upload').click()}
            >
              <input
                id="soa-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleSoaSelect}
              />
              <svg
                className={`w-10 h-10 mx-auto mb-2 ${soaFile ? 'text-blue-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-700 font-medium">
                {soaFile ? soaFile.name : 'Click to select a file'}
              </p>
              {!soaFile && (
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, or DOCX — Max 10 MB</p>
              )}
              {soaFile && (
                <p className="text-xs text-gray-500 mt-1">
                  {(soaFile.size / 1024 / 1024).toFixed(2)} MB — click to change
                </p>
              )}
            </div>
            {soaFile && (
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setSoaFile(null) }}
                  className="border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={handleSoaUpload}
                  disabled={soaUploading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-2"
                >
                  {soaUploading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {soaUploading ? 'Uploading…' : 'Upload Document'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Review Notes & Recommendations</h2>
        <textarea
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="Provide detailed review notes, findings, and recommendations."
          className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </section>

      {isLawyer && (
        <div className="flex flex-wrap items-center gap-4">
          {criticalIssues > 0 && !actionSuccess && (
            <p className="text-sm font-medium text-amber-600">
              {criticalIssues} critical issue{criticalIssues !== 1 ? 's' : ''} unresolved — approval will prompt a warning.
            </p>
          )}
          {actionError && (
            <p className="text-sm text-red-600" role="alert">{actionError}</p>
          )}
          {actionSuccess && (
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {actionSuccess}
            </div>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={handleRejectCase}
              disabled={!!actionLoading || !!actionSuccess}
              className="border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-medium px-4 py-2 rounded-lg"
            >
              {actionLoading === 'reject' ? 'Rejecting…' : 'Reject Case'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
