// src/pages/admin/case-details/LawyerReview.jsx
import { useState } from 'react'
import { useCaseContext } from '../../../context/CaseContext'
import { casesService } from '../../../api/dataService'
import LawyerReviewPanel from '../../../components/common/LawyerReviewPanel'
import { CheckCircle2, XCircle, MessageSquare, Loader2, AlertCircle } from 'lucide-react'

export default function LawyerReview() {
    const { caseData, refetch } = useCaseContext()
    const [adminNotes, setAdminNotes] = useState('')
    const [actionLoading, setActionLoading] = useState(null) // 'approve' | 'changes' | 'reject'
    const [actionResult, setActionResult] = useState(null)   // { type: 'success'|'error', msg }

    if (!caseData) return null

    const review = caseData?.metadata_json?.lawyer_review
    const caseId = caseData.id
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

    return (
        <div className="space-y-4">
            <LawyerReviewPanel caseItem={caseData} />

            {/* Admin Actions — only show when a review exists */}
            {review && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-sm font-bold text-gray-900">Admin Actions</h3>
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

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Admin Notes / Feedback (optional)</label>
                        <textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            rows={3}
                            placeholder="Add notes or feedback for the lawyer..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => doAction('approve')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
                        >
                            {actionLoading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Approve Legal Review
                        </button>
                        <button
                            onClick={() => doAction('changes')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
                        >
                            {actionLoading === 'changes' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                            Request Changes
                        </button>
                        <button
                            onClick={() => doAction('reject')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
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
