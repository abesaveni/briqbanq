import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Trash2, RefreshCw, Download, FileText, CheckSquare, CheckCircle, Gavel, UserPlus, X, Plus } from 'lucide-react'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AdminRiskBadge from '../../components/admin/AdminRiskBadge'
import { generateCasesTablePDF } from '../../utils/pdfGenerator'
import { casesService, adminUsersService } from '../../api/dataService'
import SubmitCaseForm from '../../components/case/SubmitCaseForm'

export default function CaseManagement() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [showNewCaseModal, setShowNewCaseModal] = useState(false)
    const [statusFilter, setStatusFilter] = useState('All Status')
    const [cases, setCases] = useState([])
    const [allCases, setAllCases] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isExporting, setIsExporting] = useState(false)
    const [assignModal, setAssignModal] = useState({ open: false, caseId: null })
    const [lawyers, setLawyers] = useState([])
    const [lenders, setLenders] = useState([])
    const [selectedLawyer, setSelectedLawyer] = useState('')
    const [selectedLender, setSelectedLender] = useState('')
    const [isAssigning, setIsAssigning] = useState(false)
    const [loadError, setLoadError] = useState('')
    const [auctionModal, setAuctionModal] = useState({ open: false, caseId: null })
    const [auctionForm, setAuctionForm] = useState({ endDate: '', endTime: '10:00', reservePrice: '', minIncrement: '1000', notes: '' })
    const [auctionError, setAuctionError] = useState('')
    const [isSubmittingAuction, setIsSubmittingAuction] = useState(false)

    // ============================================================================
    // LOAD / REFRESH CASES FROM BACKEND
    // ============================================================================
    const loadCases = async () => {
        setIsLoading(true)
        setLoadError('')
        const res = await casesService.getCases()
        if (res.success) {
            // Backend returns CaseListResponse: { items: [...], total, page, page_size }
            // Exclude DRAFT cases — borrower is still filling the form
            const data = (Array.isArray(res.data) ? res.data : (res.data?.items || [])).filter(c => c.status !== 'DRAFT')
            setAllCases(data)
            applyFilters(data, statusFilter, searchTerm)
        } else {
            setLoadError(res.error || 'Failed to load cases')
        }
        setIsLoading(false)
    }

    useEffect(() => { loadCases() }, [])

    const handleRefresh = () => loadCases()

    // ============================================================================
    // EXPORT FUNCTIONALITY - Generate PDF of all cases
    // ============================================================================
    const handleExport = async () => {
        setIsExporting(true)
        try {
            await generateCasesTablePDF({
                title: 'Case Management Report',
                role: 'Admin',
                cases: allCases.map(c => ({
                    id: c.case_number || c.id,
                    property: c.property_address || c.title || '—',
                    borrower: c.borrower_name || c.borrower || '—',
                    status: c.status,
                    value: c.loan_amount || c.debt,
                    lvr: c.lvr,
                    image: c.image || null,
                })),
            })
        } catch (error) {
            console.error('Error exporting PDF:', error)
        } finally {
            setIsExporting(false)
        }
    }

    // Maps display label → array of API status values
    const STATUS_FILTER_MAP = {
        'Under Review': ['SUBMITTED', 'UNDER_REVIEW'],
        'Approved': ['APPROVED'],
        'Listed': ['LISTED', 'FUNDED'],
        'In Auction': ['AUCTION'],
        'Completed': ['CLOSED'],
        'Rejected': ['REJECTED'],
    }

    // ============================================================================
    // STATUS FILTER FUNCTIONALITY - Filter cases by status
    // ============================================================================
    const applyFilters = (casesToFilter, status, search) => {
        let filtered = [...casesToFilter]

        // Apply status filter using API enum mapping
        if (status !== 'All Status') {
            const allowedStatuses = STATUS_FILTER_MAP[status]
            if (allowedStatuses) filtered = filtered.filter(c => allowedStatuses.includes(c.status))
        }

        // Apply search filter
        if (search.trim()) {
            const searchLower = search.toLowerCase()
            filtered = filtered.filter(c =>
                String(c.id || '').toLowerCase().includes(searchLower) ||
                String(c.case_number || '').toLowerCase().includes(searchLower) ||
                String(c.borrower_name || c.borrower || '').toLowerCase().includes(searchLower) ||
                String(c.property_address || c.title || '').toLowerCase().includes(searchLower)
            )
        }

        setCases(filtered)
    }

    // Handle status filter change
    const handleStatusFilterChange = (newStatus) => {
        setStatusFilter(newStatus)
        applyFilters(allCases, newStatus, searchTerm)

        // TODO: Replace with API call when backend is ready
        // fetchCasesByStatus(newStatus)
    }

    // Handle search term change
    const handleSearchChange = (newSearch) => {
        setSearchTerm(newSearch)
        applyFilters(allCases, statusFilter, newSearch)
    }

    // TODO: API function for fetching cases by status (for future backend integration)
    // const fetchCasesByStatus = async (status) => {
    //     setIsLoading(true)
    //     try {
    //         const endpoint = status === 'All Status' 
    //             ? '/api/admin/cases' 
    //             : `/api/admin/cases?status=${encodeURIComponent(status)}`
    //         const response = await fetch(endpoint)
    //         const data = await response.json()
    //         setAllCases(data)
    //         applyFilters(data, status, searchTerm)
    //     } catch (error) {
    //         console.error('Error fetching cases:', error)
    //     } finally {
    //         setIsLoading(false)
    //     }
    // }

    const handleStatusChange = async (caseId, newStatus) => {
        try {
            await casesService.updateCaseStatus(caseId, newStatus)
            const updatedCases = allCases.map(c => c.id === caseId ? { ...c, status: newStatus } : c)
            setAllCases(updatedCases)
            applyFilters(updatedCases, statusFilter, searchTerm)
        } catch (err) {
            console.error('Status update failed:', err)
        }
    }

    const handleApprove = async (caseId) => {
        try {
            await casesService.approveCase(caseId)
            const updatedCases = allCases.map(c => c.id === caseId ? { ...c, status: 'APPROVED' } : c)
            setAllCases(updatedCases)
            applyFilters(updatedCases, statusFilter, searchTerm)
        } catch (err) { console.error('Approve failed:', err) }
    }

    const handleMoveToAuction = (caseId) => {
        setAuctionForm({ endDate: '', endTime: '10:00', reservePrice: '', minIncrement: '1000', notes: '' })
        setAuctionError('')
        setAuctionModal({ open: true, caseId })
    }

    const handleSubmitAuction = async () => {
        if (!auctionForm.endDate) { setAuctionError('Auction end date is required'); return }
        if (!auctionForm.reservePrice || Number(auctionForm.reservePrice) < 1000) { setAuctionError('Reserve price must be at least $1,000'); return }
        // Combine date + time fields; support both YYYY-MM-DD and DD/MM/YYYY entry
        let datePart = auctionForm.endDate.trim()
        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(datePart)) {
            const parts = datePart.split(/[\/\-]/)
            datePart = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
        }
        const endDate = new Date(`${datePart}T${auctionForm.endTime || '00:00'}`)
        if (isNaN(endDate.getTime())) { setAuctionError('Please enter a valid date (e.g. 31/12/2026)'); return }
        if (endDate <= new Date()) { setAuctionError('End date must be in the future'); return }
        setIsSubmittingAuction(true)
        setAuctionError('')
        try {
            const res = await casesService.moveToAuction(auctionModal.caseId, {
                end_date: endDate.toISOString(),
                reserve_price: Number(auctionForm.reservePrice),
                minimum_increment: Number(auctionForm.minIncrement) || 1000,
                notes: auctionForm.notes || '',
            })
            if (!res.success) { setAuctionError(res.error || 'Failed to create auction'); return }
            const updatedCases = allCases.map(c => c.id === auctionModal.caseId ? { ...c, status: 'AUCTION' } : c)
            setAllCases(updatedCases)
            applyFilters(updatedCases, statusFilter, searchTerm)
            setAuctionModal({ open: false, caseId: null })
        } catch (err) {
            setAuctionError(err.message || 'Failed to create auction')
        } finally {
            setIsSubmittingAuction(false)
        }
    }

    const handleDelete = async (caseId) => {
        if (window.confirm('Are you sure you want to delete this case?')) {
            await casesService.deleteCase(caseId)
            const updatedCases = allCases.filter(c => c.id !== caseId)
            setAllCases(updatedCases)
            applyFilters(updatedCases, statusFilter, searchTerm)
        }
    }

    const openAssignModal = async (caseId) => {
        setAssignModal({ open: true, caseId })
        setSelectedLawyer('')
        setSelectedLender('')
        const [lawyersRes, lendersRes] = await Promise.all([
            adminUsersService.getUsersByRole('LAWYER'),
            adminUsersService.getUsersByRole('LENDER'),
        ])
        if (lawyersRes.success) setLawyers(lawyersRes.data || [])
        if (lendersRes.success) setLenders(lendersRes.data || [])
    }

    const handleAssign = async () => {
        if (!selectedLawyer && !selectedLender) return
        setIsAssigning(true)
        const payload = {}
        if (selectedLawyer) payload.lawyer_id = selectedLawyer
        if (selectedLender) payload.lender_id = selectedLender
        const res = await casesService.assignParticipants(assignModal.caseId, payload)
        if (res.success) {
            setAssignModal({ open: false, caseId: null })
            loadCases()
        }
        setIsAssigning(false)
    }

    const formatCurrency = (amount) => {
        if (!amount) return '—'
        return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount)
    }

    // Calculate stats based on all cases
    const stats = {
        total: allCases.length,
        active: allCases.filter(c => ['APPROVED', 'LISTED', 'FUNDED'].includes(c.status)).length,
        inAuction: allCases.filter(c => c.status === 'AUCTION').length,
        completed: allCases.filter(c => ['CLOSED', 'FUNDED'].includes(c.status)).length,
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <AdminBreadcrumb items={[
                { label: 'Dashboard', path: '/admin/dashboard' },
                { label: 'Admin' },
                { label: 'Case Management' }
            ]} />

            {/* Page Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Case Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Platform administration and compliance management</p>
                </div>
                <button
                    onClick={() => setShowNewCaseModal(true)}
                    className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors font-medium shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    New Case
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatCard
                    label="Total Cases"
                    value={stats.total.toString()}
                    icon={FileText}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                />
                <AdminStatCard
                    label="Active Cases"
                    value={stats.active.toString()}
                    icon={Eye}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                />
                <AdminStatCard
                    label="In Auction"
                    value={stats.inAuction.toString()}
                    icon={RefreshCw}
                    iconBg="bg-purple-100"
                    iconColor="text-purple-600"
                />
                <AdminStatCard
                    label="Completed"
                    value={stats.completed.toString()}
                    icon={CheckSquare}
                    iconBg="bg-emerald-100"
                    iconColor="text-emerald-600"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200">
                {/* Table Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">All Cases ({cases.length})</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className={`flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-3 py-1.5 rounded transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <RefreshCw className={`w-4 h-4 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className={`flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded transition-colors ${isExporting ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <Download className="w-4 h-4 flex-shrink-0" />
                                {isExporting ? 'Exporting...' : 'Export'}
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Search cases..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusFilterChange(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                            <option>All Status</option>
                            <option>Under Review</option>
                            <option>Approved</option>
                            <option>Listed</option>
                            <option>In Auction</option>
                            <option>Completed</option>
                            <option>Rejected</option>
                        </select>
                    </div>
                </div>

                {loadError && (
                    <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-sm text-red-700 font-medium">
                        Error loading cases: {loadError}
                    </div>
                )}

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Case Number</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Borrower</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Property</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Debt</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Valuation</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">LVR</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Status</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Risk</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Created</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                                        Loading cases...
                                    </td>
                                </tr>
                            ) : cases.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">No cases found</td>
                                </tr>
                            ) : cases.map((caseItem) => {
                                const debt = Number(caseItem.outstanding_debt || caseItem.loan_amount || caseItem.debt || 0);
                                const val = Number(caseItem.estimated_value || caseItem.property_value || caseItem.valuation || 0);
                                const lvr = val > 0 ? ((debt / val) * 100).toFixed(1) : '—';
                                
                                return (
                                <tr key={caseItem.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{caseItem.case_number || caseItem.id?.slice(0, 8)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{caseItem.borrower_name || caseItem.borrower || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {caseItem.property_address || caseItem.title || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{formatCurrency(debt)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(val)}</td>
                                    <td className="px-4 py-3 text-sm text-indigo-600 font-bold">{lvr}{lvr !== '—' ? '%' : ''}</td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={caseItem.status || 'pending'}
                                            onChange={(e) => handleStatusChange(caseItem.id, e.target.value)}
                                            className="text-[11px] font-bold uppercase tracking-wider border border-gray-200 rounded px-2 py-1 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                        >
                                            <option value="UNDER_REVIEW">Under Review</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="LISTED">Listed</option>
                                            <option value="AUCTION">In Auction</option>
                                            <option value="CLOSED">Completed</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <AdminRiskBadge risk={caseItem.risk_level || caseItem.risk} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                        {caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString('en-AU') : caseItem.created || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => navigate(`/admin/case-details/${caseItem.id}`)}
                                                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {(caseItem.status === 'SUBMITTED' || caseItem.status === 'UNDER_REVIEW') && (
                                                <button
                                                    onClick={() => handleApprove(caseItem.id)}
                                                    className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors" title="Approve Case"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            {caseItem.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => handleMoveToAuction(caseItem.id)}
                                                    className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors" title="Move to Auction"
                                                >
                                                    <Gavel className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openAssignModal(caseItem.id)}
                                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" title="Assign Lawyer / Lender"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(caseItem.id)}
                                                className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Case Modal */}
            {showNewCaseModal && (
                <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto">
                    <div className="min-h-screen py-8 px-4 flex items-start justify-center">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-slate-900">Create New Case</h2>
                                <button
                                    onClick={() => setShowNewCaseModal(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="px-6">
                                <SubmitCaseForm
                                    role="admin"
                                    onClose={() => setShowNewCaseModal(false)}
                                    onSuccess={() => { setShowNewCaseModal(false); loadCases() }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Move to Auction Modal */}
            {auctionModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Gavel className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base font-semibold text-gray-900">Move Case to Auction</h2>
                            </div>
                            <button onClick={() => setAuctionModal({ open: false, caseId: null })} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Auction End Date <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={auctionForm.endDate}
                                        onChange={e => setAuctionForm(f => ({ ...f, endDate: e.target.value }))}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="DD/MM/YYYY"
                                    />
                                    <input
                                        type="time"
                                        value={auctionForm.endTime || '10:00'}
                                        onChange={e => setAuctionForm(f => ({ ...f, endTime: e.target.value }))}
                                        className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Date then time (24hr)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reserve Price / Minimum Bid (AUD) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                    <input
                                        type="number"
                                        value={auctionForm.reservePrice}
                                        onChange={e => setAuctionForm(f => ({ ...f, reservePrice: e.target.value }))}
                                        placeholder="e.g. 500000"
                                        min="1000"
                                        className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Minimum $1,000</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Bid Increment (AUD)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                    <input
                                        type="number"
                                        value={auctionForm.minIncrement}
                                        onChange={e => setAuctionForm(f => ({ ...f, minIncrement: e.target.value }))}
                                        placeholder="1000"
                                        min="100"
                                        className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Auction Notes (optional)</label>
                                <textarea
                                    value={auctionForm.notes}
                                    onChange={e => setAuctionForm(f => ({ ...f, notes: e.target.value }))}
                                    rows={3}
                                    placeholder="Any notes for this auction..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                />
                            </div>
                            {auctionError && (
                                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{auctionError}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 px-6 pb-5">
                            <button
                                onClick={() => setAuctionModal({ open: false, caseId: null })}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitAuction}
                                disabled={isSubmittingAuction}
                                className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Gavel className="w-4 h-4" />
                                {isSubmittingAuction ? 'Creating Auction...' : 'Move to Auction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Lawyer / Lender Modal */}
            {assignModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
                        <button
                            onClick={() => setAssignModal({ open: false, caseId: null })}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Assign Participants</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Lawyer</label>
                                <select
                                    value={selectedLawyer}
                                    onChange={(e) => setSelectedLawyer(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">— No change —</option>
                                    {lawyers.map(l => (
                                        <option key={l.id} value={l.id}>
                                            {l.first_name} {l.last_name} ({l.email})
                                        </option>
                                    ))}
                                </select>
                                {lawyers.length === 0 && (
                                    <p className="text-xs text-gray-400 mt-1">No approved lawyers found</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Lender</label>
                                <select
                                    value={selectedLender}
                                    onChange={(e) => setSelectedLender(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">— No change —</option>
                                    {lenders.map(l => (
                                        <option key={l.id} value={l.id}>
                                            {l.first_name} {l.last_name} ({l.email})
                                        </option>
                                    ))}
                                </select>
                                {lenders.length === 0 && (
                                    <p className="text-xs text-gray-400 mt-1">No approved lenders found</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setAssignModal({ open: false, caseId: null })}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={isAssigning || (!selectedLawyer && !selectedLender)}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAssigning ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
