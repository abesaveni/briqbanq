import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AdminBadge from '../../components/admin/AdminBadge'
import { useState, useEffect } from 'react'
import { kycService } from '../../api/dataService'

export default function KYCReviewQueue() {
    const navigate = useNavigate();
    const [kycData, setKycData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL');

    const normalizeStatus = (s) => {
        const u = (s || '').toUpperCase().replace(/ /g, '_')
        if (u === 'PENDING' || u === 'SUBMITTED') return 'SUBMITTED'
        if (u === 'UNDER_REVIEW') return 'UNDER_REVIEW'
        if (u === 'APPROVED') return 'APPROVED'
        if (u === 'REJECTED') return 'REJECTED'
        return 'SUBMITTED'
    }

    const fetchKYC = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await kycService.getKYCQueue();
            if (res.success) {
                const items = Array.isArray(res.data) ? res.data
                    : Array.isArray(res.data?.items) ? res.data.items
                    : [];
                setKycData(items.map(k => ({ ...k, status: normalizeStatus(k.status) })));
            } else {
                setError(res.error || 'Failed to load KYC data');
            }
        } catch (err) {
            setError(err.message || 'Failed to load KYC data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchKYC(); }, [])

    const handleApprove = async (id) => {
        setKycData(prev => prev.map(k => k.id === id ? { ...k, status: 'APPROVED' } : k))
        try { await kycService.approveKYC(id) } catch { /* keep optimistic update */ }
    }

    const handleReject = async (id) => {
        setKycData(prev => prev.map(k => k.id === id ? { ...k, status: 'REJECTED' } : k))
        try { await kycService.rejectKYC(id, 'Rejected by admin') } catch { /* keep optimistic update */ }
    }

    const normalizeRisk = (r) => {
        const map = { low: 'Low', medium: 'Medium', high: 'High' }
        return map[(r || '').toLowerCase()] || r || 'Medium'
    }

    const handleRiskChange = async (id, newRisk) => {
        setKycData(prev => prev.map(k => k.id === id ? { ...k, risk_level: newRisk } : k))
        await kycService.updateKYCRisk(id, newRisk).catch(() => {})
    }
    const pendingCount = kycData.filter(k => k.status === 'SUBMITTED' || k.status === 'UNDER_REVIEW').length
    const approvedCount = kycData.filter(k => k.status === 'APPROVED').length
    const rejectedCount = kycData.filter(k => k.status === 'REJECTED').length

    const displayed = statusFilter === 'ALL' ? kycData
        : statusFilter === 'PENDING' ? kycData.filter(k => k.status === 'SUBMITTED' || k.status === 'UNDER_REVIEW')
        : kycData.filter(k => k.status === statusFilter)

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">KYC Review</h1>
                <p className="text-sm text-gray-500 mt-1">Identity verification queue and compliance review</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button onClick={() => setStatusFilter('ALL')}
                    className={`text-left p-4 rounded-xl border transition-all ${statusFilter === 'ALL' ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-200'}`}>
                    <p className="text-lg font-bold text-slate-900">{loading ? '…' : kycData.length}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wider">Total</p>
                </button>
                <button onClick={() => setStatusFilter('PENDING')}
                    className={`text-left p-4 rounded-xl border transition-all ${statusFilter === 'PENDING' ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-200'}`}>
                    <p className="text-lg font-bold text-amber-600">{loading ? '…' : pendingCount}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wider">Pending</p>
                </button>
                <button onClick={() => setStatusFilter('APPROVED')}
                    className={`text-left p-4 rounded-xl border transition-all ${statusFilter === 'APPROVED' ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-200'}`}>
                    <p className="text-lg font-bold text-emerald-600">{loading ? '…' : approvedCount}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wider">Approved</p>
                </button>
                <button onClick={() => setStatusFilter('REJECTED')}
                    className={`text-left p-4 rounded-xl border transition-all ${statusFilter === 'REJECTED' ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-200'}`}>
                    <p className="text-lg font-bold text-red-500">{loading ? '…' : rejectedCount}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wider">Rejected</p>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-700">KYC Submissions</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{displayed.length} record{displayed.length !== 1 ? 's' : ''}</span>
                        <button onClick={fetchKYC} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded hover:bg-indigo-50 transition-colors">Refresh</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/50">
                                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">User</th>
                                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">Role</th>
                                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">Email</th>
                                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">Submitted</th>
                                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">Document</th>
                                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">Risk</th>
                                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">Status</th>
                                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={8} className="py-10 text-center text-gray-400 text-sm">Loading KYC data…</td></tr>
                            ) : error ? (
                                <tr><td colSpan={8} className="py-10 text-center text-sm">
                                    <p className="text-red-500 font-medium mb-2">{error}</p>
                                    <button onClick={fetchKYC} className="text-indigo-600 text-xs font-semibold hover:underline">Retry</button>
                                </td></tr>
                            ) : displayed.length === 0 ? (
                                <tr><td colSpan={8} className="py-10 text-center text-gray-400 text-sm">No submissions found</td></tr>
                            ) : displayed.map((kyc) => (
                                <tr key={kyc.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold whitespace-nowrap">{kyc.user_name || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 capitalize whitespace-nowrap">{kyc.user_role || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{kyc.user_email || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                                        {kyc.created_at ? new Date(kyc.created_at).toLocaleDateString('en-AU') : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[140px] truncate">{kyc.document_type || kyc.metadata_json?.original_file_name || '—'}</td>
                                    <td className="px-4 py-3">
                                        {(() => {
                                            const riskVal = normalizeRisk(kyc.risk_level || kyc.risk)
                                            return (
                                                <select
                                                    value={riskVal}
                                                    onChange={(e) => handleRiskChange(kyc.id, e.target.value)}
                                                    className={`text-xs border rounded px-1.5 py-0.5 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer
                                                        ${riskVal === 'High' ? 'text-red-700 border-red-300 bg-red-50' :
                                                          riskVal === 'Low' ? 'text-emerald-700 border-emerald-300 bg-emerald-50' :
                                                          'text-amber-700 border-amber-300 bg-amber-50'}`}
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            )
                                        })()}
                                    </td>
                                    <td className="px-4 py-3">
                                        {(kyc.status === 'SUBMITTED' || kyc.status === 'UNDER_REVIEW') ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                                                <Clock className="w-2.5 h-2.5" /> Pending
                                            </span>
                                        ) : kyc.status === 'APPROVED' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                                                <CheckCircle className="w-2.5 h-2.5" /> Approved
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                                                <XCircle className="w-2.5 h-2.5" /> Rejected
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1.5 items-center">
                                            {(kyc.status === 'SUBMITTED' || kyc.status === 'UNDER_REVIEW') ? (
                                                <>
                                                    <button onClick={() => navigate(`/admin/kyc-review/${kyc.id}`)} className="text-xs border border-gray-200 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-50 flex items-center gap-1 font-medium">
                                                        <Eye className="w-3 h-3 flex-shrink-0" /> Review
                                                    </button>
                                                    <button onClick={() => handleApprove(kyc.id)} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                                                        <CheckCircle className="w-3 h-3 flex-shrink-0" /> Approve
                                                    </button>
                                                    <button onClick={() => handleReject(kyc.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                                                        <XCircle className="w-3 h-3 flex-shrink-0" /> Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => navigate(`/admin/kyc-review/${kyc.id}`)} className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded hover:bg-gray-50 flex items-center gap-1 font-medium">
                                                    <Eye className="w-3 h-3 flex-shrink-0" /> View
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
