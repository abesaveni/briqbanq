// src/pages/admin/case-details/LawyerReview.jsx
import { useState } from 'react'
import { useCaseContext } from '../../../context/CaseContext'
import { casesService } from '../../../api/dataService'
import LawyerReviewPanel from '../../../components/common/LawyerReviewPanel'
import { CheckCircle2, XCircle, MessageSquare, Loader2, AlertCircle, User, Briefcase, Calendar, Shield, Clock } from 'lucide-react'

export default function LawyerReview() {
    const { caseData, refetch } = useCaseContext()
    const [adminNotes, setAdminNotes] = useState('')
    const [actionLoading, setActionLoading] = useState(null)
    const [actionResult, setActionResult] = useState(null)

    if (!caseData) return null

    const review = caseData?.metadata_json?.lawyer_review
    const caseId = caseData._id || caseData.id
    const alreadyActioned = review?.admin_approved !== undefined

    const doAction = async (action) => {
        setActionLoading(action)
        setActionResult(null)
        try {
            const metaPatch = {
                lawyer_review: {
                    ...(review || {}),
                    admin_notes: adminNotes.trim() || undefined,
                    admin_approved: action === 'approve',
                    admin_request_changes: action === 'changes',
                    admin_rejected: action === 'reject',
                    admin_action_at: new Date().toISOString(),
                },
            }
            const r1 = await casesService.updateCaseMetadata(caseId, metaPatch)
            if (!r1.success) throw new Error(r1.error || 'Failed to save')

            if (action === 'approve') {
                await casesService.updateCaseStatus(caseId, 'APPROVED')
            }

            setActionResult({ type: 'success', msg: action === 'approve' ? 'Legal review approved — case status updated.' : action === 'changes' ? 'Changes requested — lawyer has been notified.' : 'Legal review rejected.' })
            setAdminNotes('')
            if (refetch) refetch()
        } catch (e) {
            setActionResult({ type: 'error', msg: e.message || 'Action failed. Please try again.' })
        } finally {
            setActionLoading(null)
        }
    }

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

    return (
        <div className="space-y-4">
            {/* Assignment Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                    Legal Assignment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Assigned Lawyer</p>
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {caseData.lawyer_name || 'Unassigned'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Review Status</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            review?.submitted_to_admin
                                ? 'bg-blue-100 text-blue-700'
                                : review
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-500'
                        }`}>
                            {review?.submitted_to_admin ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {review?.submitted_to_admin ? 'Submitted' : review ? 'In Progress' : 'Not Started'}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Admin Decision</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            review?.admin_approved
                                ? 'bg-emerald-100 text-emerald-700'
                                : review?.admin_rejected
                                    ? 'bg-red-100 text-red-700'
                                    : review?.admin_request_changes
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-gray-100 text-gray-500'
                        }`}>
                            {review?.admin_approved ? '✓ Approved' : review?.admin_rejected ? '✗ Rejected' : review?.admin_request_changes ? '⟳ Changes Req.' : '— Pending'}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Last Activity</p>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {fmtDate(review?.last_saved_at || review?.completed_at || caseData.timeline?.lastUpdated)}
                        </p>
                    </div>
                </div>

                {/* Progress bar if review in progress */}
                {review && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">Compliance checklist</span>
                            <span className="text-xs font-semibold text-gray-700">
                                {review.checked_count ?? 0} / {review.total_count ?? 0} items
                            </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${review.completed ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                style={{ width: `${review.total_count > 0 ? Math.round(((review.checked_count ?? 0) / review.total_count) * 100) : 0}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Lawyer Review Checklist */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    Compliance Checklist
                </h3>
                <LawyerReviewPanel caseItem={caseData} />
            </div>

            {/* Admin Actions — only show when a review exists */}
            {review && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-sm font-bold text-gray-900">Admin Decision</h3>
                        {alreadyActioned && (
                            <span className="text-xs text-gray-400 ml-auto">
                                {review.admin_approved ? '✓ Approved' : review.admin_request_changes ? '⟳ Changes requested' : review.admin_rejected ? '✗ Rejected' : ''}
                            </span>
                        )}
                    </div>

                    {actionResult && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${actionResult.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {actionResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                            {actionResult.msg}
                        </div>
                    )}

                    {review.admin_notes && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                            <span className="font-semibold text-gray-700">Previous admin note: </span>{review.admin_notes}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes / Feedback (optional)</label>
                        <textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            rows={2}
                            placeholder="Add notes or feedback for the lawyer..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => doAction('approve')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
                        >
                            {actionLoading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Approve
                        </button>
                        <button
                            onClick={() => doAction('changes')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
                        >
                            {actionLoading === 'changes' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                            Request Changes
                        </button>
                        <button
                            onClick={() => doAction('reject')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
                        >
                            {actionLoading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Reject
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
