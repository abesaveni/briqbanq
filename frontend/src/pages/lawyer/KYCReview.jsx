import { useState, useEffect } from 'react'
import { kycService } from '../../api/dataService'

export default function KYCReview() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvedToday, setApprovedToday] = useState(0)
  const [rejectedToday, setRejectedToday] = useState(0)
  const [reviewModal, setReviewModal] = useState(null)

  useEffect(() => {
    kycService.getKYCQueue()
      .then((res) => {
        const data = res.data || res || []
        setSubmissions(data)
        setApprovedToday(data.filter((s) => s.status === 'approved').length)
        setRejectedToday(data.filter((s) => s.status === 'rejected').length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pendingCount = submissions.filter((s) => s.status === 'pending' || s.status === 'Pending').length

  const handleApprove = async (id) => {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'approved' } : s)))
    setApprovedToday((c) => c + 1)
    try { await kycService.approveKYC(id) } catch (_) {}
  }

  const handleReject = async (id) => {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s)))
    setRejectedToday((c) => c + 1)
    try { await kycService.rejectKYC(id) } catch (_) {}
  }

  const handleReview = (submission) => setReviewModal(submission)
  const closeReview = () => setReviewModal(null)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">KYC Review</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve or reject KYC submissions</p>
      </div>

      {/* Stat cards - Figma: Pending (orange eye), Approved Today (green check), Rejected Today (red x) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Pending Reviews</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Approved Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{approvedToday}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Rejected Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{rejectedToday}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* KYC Submissions table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">KYC Submissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">User</th>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Role</th>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Email</th>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Submitted</th>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Documents</th>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Status</th>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading KYC submissions...</td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No submissions found</td></tr>
              ) : submissions.map((kyc) => (
                <tr key={kyc.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{kyc.name || kyc.full_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{kyc.role}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{kyc.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{kyc.submitted || (kyc.created_at ? new Date(kyc.created_at).toLocaleDateString('en-AU') : '—')}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{kyc.documents || kyc.document_count || 0} files</td>
                  <td className="px-4 py-3">
                    {(kyc.status === 'Pending' || kyc.status === 'pending') && (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    )}
                    {(kyc.status === 'Approved' || kyc.status === 'approved') && (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Approved
                      </span>
                    )}
                    {(kyc.status === 'Rejected' || kyc.status === 'rejected') && (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {(kyc.status === 'Pending' || kyc.status === 'pending') && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReview(kyc)}
                            className="inline-flex items-center gap-1 text-xs border border-gray-300 text-gray-700 px-2.5 py-1.5 rounded-md hover:bg-gray-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Review
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(kyc.id)}
                            className="inline-flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-md"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(kyc.id)}
                            className="inline-flex items-center gap-1 text-xs bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-md"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </>
                      )}
                      {(['Approved', 'Rejected', 'approved', 'rejected'].includes(kyc.status)) && (
                        <button
                          type="button"
                          onClick={() => handleReview(kyc)}
                          className="inline-flex items-center gap-1 text-xs border border-gray-300 text-gray-700 px-2.5 py-1.5 rounded-md hover:bg-gray-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
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

      {/* Review / View modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="kyc-review-title">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 id="kyc-review-title" className="text-lg font-semibold text-gray-900">
                KYC – {reviewModal.name}
              </h2>
              <button
                type="button"
                onClick={closeReview}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">User</p>
                <p className="text-sm font-medium text-gray-900">{reviewModal.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Role</p>
                <p className="text-sm text-gray-900">{reviewModal.role}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                <p className="text-sm text-gray-900">{reviewModal.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Submitted</p>
                <p className="text-sm text-gray-900">{reviewModal.submitted}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Documents</p>
                <p className="text-sm text-gray-900">{reviewModal.documents} files submitted</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                <p className="text-sm text-gray-900">{reviewModal.status}</p>
              </div>
              {(reviewModal.status === 'Pending' || reviewModal.status === 'pending') && (
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { handleApprove(reviewModal.id); closeReview(); }}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleReject(reviewModal.id); closeReview(); }}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
