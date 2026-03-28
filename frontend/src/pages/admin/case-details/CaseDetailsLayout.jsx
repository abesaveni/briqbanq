// src/pages/admin/case-details/CaseDetailsLayout.jsx
import { useState } from 'react'
import { Outlet, useNavigate, useParams, useLocation, NavLink } from 'react-router-dom'
import {
    ChevronLeft, Home, Building2, FileText, FileCheck, Shield,
    DollarSign, MessageSquare, Activity, Settings, Download, Loader2
} from 'lucide-react'
import { useCaseContext } from '../../../context/CaseContext'
import ManageCaseModal from '../../../components/admin/case/ManageCaseModal'
import { generateBrandedPDF } from '../../../utils/pdfGenerator'

const tabs = [
    { label: 'Overview', icon: Home, path: 'overview' },
    { label: 'Property', icon: Building2, path: 'property' },
    { label: 'Documents', icon: FileText, path: 'documents' },
    { label: 'Investment Memo', icon: FileCheck, path: 'investment-memorandum' },
    { label: 'Settlement', icon: Shield, path: 'settlement' },
    { label: 'Bids', icon: DollarSign, path: 'bids' },
    { label: 'Messages', icon: MessageSquare, path: 'messages' },
    { label: 'Activity', icon: Activity, path: 'activity' },
]

const STATUS_COLORS = {
    DRAFT: 'bg-gray-100 text-gray-600',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    LISTED: 'bg-indigo-100 text-indigo-700',
    AUCTION: 'bg-orange-100 text-orange-700',
    FUNDED: 'bg-purple-100 text-purple-700',
    SETTLED: 'bg-purple-100 text-purple-700',
    CLOSED: 'bg-gray-100 text-gray-500',
    REJECTED: 'bg-red-100 text-red-700',
}

const STATUS_LABELS = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    LISTED: 'Listed',
    AUCTION: 'In Auction',
    FUNDED: 'Funded',
    SETTLED: 'Settled',
    CLOSED: 'Closed',
    REJECTED: 'Rejected',
}

const AUCTION_STATUS_COLORS = {
    LIVE: 'bg-red-100 text-red-700',
    SCHEDULED: 'bg-amber-100 text-amber-700',
    PAUSED: 'bg-gray-100 text-gray-700',
    ENDED: 'bg-slate-100 text-slate-600',
}

const AUCTION_STATUS_LABELS = {
    LIVE: 'Auction Live',
    SCHEDULED: 'Auction Scheduled',
    PAUSED: 'Auction Paused',
    ENDED: 'Auction Ended',
}

const RISK_COLORS = {
    'Low Risk': 'bg-green-100 text-green-700',
    'Medium Risk': 'bg-amber-100 text-amber-700',
    'High Risk': 'bg-red-100 text-red-700',
}

export default function CaseDetailsLayout() {
    const navigate = useNavigate()
    const { caseData, loading } = useCaseContext()
    const [isManageModalOpen, setIsManageModalOpen] = useState(false)
    const [downloading, setDownloading] = useState(false)

    const fmt = (amount) => new Intl.NumberFormat('en-AU', {
        style: 'currency', currency: 'AUD', maximumFractionDigits: 0
    }).format(amount || 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!caseData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <FileText className="w-10 h-10 text-gray-300" />
                <p className="text-lg font-semibold text-gray-700">Case Not Found</p>
                <button
                    onClick={() => navigate('/admin/case-management')}
                    className="text-sm text-indigo-600 hover:underline"
                >
                    Return to Case Management
                </button>
            </div>
        )
    }

    const lastUpdated = caseData.timeline?.lastUpdated
    const daysAgo = lastUpdated
        ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
        : null
    const updatedLabel = daysAgo === null ? '—'
        : daysAgo === 0 ? 'Updated today'
        : daysAgo === 1 ? 'Updated yesterday'
        : `Updated ${daysAgo}d ago`

    const handleDownload = async () => {
        setDownloading(true)
        try {
            await generateBrandedPDF({
                title: `Case Report — ${caseData.id}`,
                subtitle: caseData.property?.address || '',
                infoItems: [
                    { label: 'Case ID', value: caseData.id },
                    { label: 'Status', value: STATUS_LABELS[caseData.status] || caseData.status },
                    { label: 'Borrower', value: caseData.borrower?.name || '—' },
                    { label: 'Property Address', value: caseData.property?.address || '—' },
                    { label: 'Property Type', value: caseData.property?.type || '—' },
                    { label: 'Outstanding Debt', value: fmt(caseData.financial?.outstandingDebt) },
                    { label: 'Estimated Value', value: fmt(caseData.financial?.estimatedValue) },
                    { label: 'LTV Ratio', value: `${caseData.financial?.ltv || 0}%` },
                    { label: 'Risk Level', value: caseData.risk || '—' },
                ],
                sections: caseData.bids?.length > 0 ? [{
                    title: 'Bid History',
                    head: ['Bidder', 'Amount', 'Time'],
                    rows: caseData.bids.map(b => [b.bidder, fmt(b.amount), new Date(b.timestamp).toLocaleDateString('en-AU')]),
                }] : [],
                fileName: `case-${caseData.id}-report.pdf`,
            })
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className="space-y-4 pb-10">
            {/* Back + Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/admin/case-management')}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Case Management
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 bg-white rounded-lg transition-colors disabled:opacity-60"
                        title="Download case report PDF"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setIsManageModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        Manage Case
                    </button>
                </div>
            </div>

            {/* Case Header Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold text-gray-900">{caseData.id}</h1>
                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[caseData.status] || 'bg-gray-100 text-gray-600'}`}>
                                {STATUS_LABELS[caseData.status] || caseData.status}
                            </span>
                            {caseData.auctionStatus && (
                                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${AUCTION_STATUS_COLORS[caseData.auctionStatus] || 'bg-gray-100 text-gray-600'}`}>
                                    {AUCTION_STATUS_LABELS[caseData.auctionStatus] || caseData.auctionStatus}
                                </span>
                            )}
                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${RISK_COLORS[caseData.risk] || 'bg-gray-100 text-gray-600'}`}>
                                {caseData.risk}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {caseData.property.address || 'Address not specified'}
                        </p>
                    </div>
                </div>

                {/* Key metrics row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
                    {[
                        { label: 'Borrower', value: caseData.borrower.name, sub: 'Borrower on record' },
                        { label: 'Lender', value: caseData.lender.name, sub: caseData.lender.name !== 'Unassigned' ? 'Assigned' : 'Pending' },
                        { label: 'Outstanding Debt', value: fmt(caseData.loan.outstandingDebt), sub: caseData.loan.ltv > 0 ? `LVR: ${caseData.loan.ltv}%` : 'LVR pending' },
                        { label: 'Property Value', value: fmt(caseData.valuation.amount), sub: updatedLabel },
                    ].map((item, i) => (
                        <div key={i}>
                            <p className="text-xs text-gray-400">{item.label}</p>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="flex overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                    isActive
                                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`
                            }
                        >
                            <tab.icon className="w-4 h-4 flex-shrink-0" />
                            {tab.label}
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <Outlet />

            {/* Manage Modal */}
            {isManageModalOpen && (
                <ManageCaseModal
                    isOpen={isManageModalOpen}
                    onClose={() => setIsManageModalOpen(false)}
                />
            )}
        </div>
    )
}
