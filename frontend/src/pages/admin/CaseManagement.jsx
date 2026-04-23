import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Trash2, RefreshCw, Download, FileText, CheckSquare, CheckCircle, Gavel, UserPlus, X, Plus, Archive, RotateCcw, Clock } from 'lucide-react'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AdminRiskBadge from '../../components/admin/AdminRiskBadge'
import { generateCasesTablePDF } from '../../utils/pdfGenerator'
import { casesService, adminUsersService } from '../../api/dataService'
import SubmitCaseForm from '../../components/case/SubmitCaseForm'

function Tip({ label, children }) {
    return (
        <div className="relative group/tip">
            {children}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:flex flex-col items-center z-50">
                <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded whitespace-nowrap shadow-lg">{label}</div>
                <div className="border-4 border-transparent border-t-gray-900 -mt-px" />
            </div>
        </div>
    )
}

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
            const raw = Array.isArray(res.data) ? res.data : (res.data?.items || [])
            const data = [...raw].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
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
        'Drafts': ['DRAFT'],
        'Under Review': ['SUBMITTED', 'UNDER_REVIEW'],
        'Approved': ['APPROVED'],
        'Listed': ['LISTED', 'FUNDED'],
        'In Auction': ['AUCTION'],
        'Completed': ['CLOSED'],
        'Rejected': ['REJECTED'],
        'Archived': ['DRAFT', 'REJECTED', 'CLOSED'], // show is_archived
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
        if (window.confirm('Are you sure you want to permanently delete this case? This cannot be undone.')) {
            const snapshot = allCases
            const updatedCases = allCases.filter(c => c.id !== caseId)
            setAllCases(updatedCases)
            applyFilters(updatedCases, statusFilter, searchTerm)
            try {
                const res = await casesService.deleteCase(caseId)
                if (res && res.success === false) {
                    alert(res.error || 'Failed to delete case')
                    setAllCases(snapshot)
                    applyFilters(snapshot, statusFilter, searchTerm)
                }
            } catch (err) {
                alert(err?.message || 'Failed to delete case')
                setAllCases(snapshot)
                applyFilters(snapshot, statusFilter, searchTerm)
            }
        }
    }

    const handleArchive = async (caseId, isArchived) => {
        const res = isArchived
            ? await casesService.unarchiveCase(caseId)
            : await casesService.archiveCase(caseId)
        if (res.success) {
            loadCases()
        } else {
            alert(res.error || 'Failed to archive/unarchive case')
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
        total: allCases.filter(c => (c.status || '').toUpperCase() !== 'DRAFT').length,
        drafts: allCases.filter(c => (c.status || '').toUpperCase() === 'DRAFT').length,
        inAuction: allCases.filter(c => (c.status || '').toUpperCase() === 'AUCTION').length,
        completed: allCases.filter(c => ['CLOSED', 'FUNDED'].includes((c.status || '').toUpperCase())).length,
    }

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Case Management</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Manage the full case lifecycle from submission to settlement</p>
                </div>
                <button
                    onClick={() => setShowNewCaseModal(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition-colors shrink-0"
                >
                    <Plus className="w-3.5 h-3.5" /> New Case
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatCard label="Total Cases" value={stats.total.toString()} icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-600" />
                <AdminStatCard label="Drafts" value={stats.drafts.toString()} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" />
                <AdminStatCard label="In Auction" value={stats.inAuction.toString()} icon={RefreshCw} iconBg="bg-violet-50" iconColor="text-violet-600" />
                <AdminStatCard label="Completed" value={stats.completed.toString()} icon={CheckSquare} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                {/* Table Header */}
                <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700">All Cases <span className="text-gray-400 font-normal">({cases.length})</span></p>
                        <div className="flex gap-1.5">
                            <button onClick={handleRefresh} disabled={isLoading} className={`flex items-center gap-1 text-xs font-medium text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-colors ${isLoading ? 'opacity-50' : ''}`}>
                                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? 'Loading…' : 'Refresh'}
                            </button>
                            <button onClick={handleExport} disabled={isExporting} className={`flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1.5 rounded-md transition-colors ${isExporting ? 'opacity-50' : ''}`}>
                                <Download className="w-3 h-3" />
                                {isExporting ? 'Exporting…' : 'Export'}
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Search cases…" value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="flex-1 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50 focus:bg-white" />
                        <select value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value)} className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                            <option>All Status</option><option>Drafts</option><option>Under Review</option>
                            <option>Approved</option><option>Listed</option><option>In Auction</option>
                            <option>Completed</option><option>Rejected</option>
                        </select>
                    </div>
                </div>

                {loadError && (
                    <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-sm text-red-600 font-medium">
                        Error loading cases: {loadError}
                    </div>
                )}

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed" style={{ fontSize: '11px' }}>
                        <colgroup>
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '11%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '7%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '13%' }} />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/50">
                                <th className="text-left font-semibold text-gray-400 uppercase tracking-wide px-2 py-2" style={{ fontSize: '10px' }}>Case #</th>
                                <th className="text-left font-semibold text-gray-400 uppercase tracking-wide px-2 py-2" style={{ fontSize: '10px' }}>Borrower</th>
                                <th className="text-left font-semibold text-gray-400 uppercase tracking-wide px-2 py-2" style={{ fontSize: '10px' }}>Property</th>
                                <th className="text-left font-semibold text-gray-400 uppercase tracking-wide px-2 py-2" style={{ fontSize: '10px' }}>Debt</th>
                                <th className="text-left font-semibold text-gray-400 uppercase tracking-wide px-2 py-2" style={{ fontSize: '10px' }}>Valuation</th>
                                <th className="text-left font-semibold text-gray-400 uppercase tracking-wide px-2 py-2" style={{ fontSize: '10px' }}>LVR</th>
                                <th className="text-left font-semibold text-gray-400 uppercase tracking-wide px-2 py-2" style={{ fontSize: '10px' }}>Status</th>
                                <th className="text-left font-semibold text-gray-400 uppercase tracking-wide px-2 py-2" style={{ fontSize: '10px' }}>Completion</th>
                                <th className="text-left font-semibold text-gray-400 uppercase tracking-wide px-2 py-2" style={{ fontSize: '10px' }}>Risk</th>
                                <th className="text-left font-semibold text-gray-400 uppercase tracking-wide px-2 py-2" style={{ fontSize: '10px' }}>Updated</th>
                                <th className="text-left font-semibold text-gray-400 uppercase tracking-wide px-2 py-2" style={{ fontSize: '10px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-400">Loading cases…</td></tr>
                            ) : cases.length === 0 ? (
                                <tr><td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-400">No cases found</td></tr>
                            ) : cases.map((caseItem) => {
                                const isDraft = (caseItem.status || '').toUpperCase() === 'DRAFT';
                                const debt = Number(caseItem.outstanding_debt || caseItem.loan_amount || caseItem.debt || 0);
                                const val = Number(caseItem.estimated_value || caseItem.property_value || caseItem.valuation || 0);
                                const lvr = val > 0 ? ((debt / val) * 100).toFixed(1) : '—';
                                const completionPct = caseItem.completion_pct ?? null;
                                const lastUpdated = caseItem.last_saved_at || caseItem.updated_at || caseItem.created_at;

                                const missingItems = isDraft ? (() => {
                                  const m = []
                                  if (!caseItem.property_address && !caseItem.title) m.push('Property address')
                                  if (!debt || debt === 0) m.push('Outstanding debt')
                                  if (!val || val === 0) m.push('Property value')
                                  if (!caseItem.borrower_name && !caseItem.borrower) m.push('Borrower details')
                                  return m
                                })() : [];

                                return (
                                <tr key={caseItem.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${isDraft ? 'bg-amber-50/20' : ''}`}>
                                    <td className="px-2 py-2 text-gray-800 font-medium truncate">
                                        <div className="flex flex-col gap-0.5">
                                            {isDraft && <span className="font-bold bg-amber-100 text-amber-700 px-1 py-0.5 rounded uppercase w-fit" style={{ fontSize: '9px' }}>Draft</span>}
                                            {caseItem.is_archived && <span className="font-bold bg-gray-100 text-gray-500 px-1 py-0.5 rounded uppercase w-fit" style={{ fontSize: '9px' }}>Archived</span>}
                                            <span className="truncate">{caseItem.case_number || caseItem.id?.slice(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-gray-700 truncate">{caseItem.borrower_name || caseItem.borrower || '—'}</td>
                                    <td className="px-2 py-2 text-gray-700 truncate" title={caseItem.property_address || caseItem.title}>
                                        {caseItem.property_address || caseItem.title || '—'}
                                    </td>
                                    <td className="px-2 py-2 text-gray-800 font-semibold truncate">{formatCurrency(debt)}</td>
                                    <td className="px-2 py-2 text-gray-600 truncate">{formatCurrency(val)}</td>
                                    <td className="px-2 py-2 text-indigo-600 font-bold">{lvr}{lvr !== '—' ? '%' : ''}</td>
                                    <td className="px-2 py-2">
                                        <select value={caseItem.status || 'DRAFT'} onChange={(e) => handleStatusChange(caseItem.id, e.target.value)} className="font-semibold border border-gray-200 rounded px-1 py-0.5 bg-white focus:ring-1 focus:ring-indigo-500 cursor-pointer w-full" style={{ fontSize: '11px' }}>
                                            {isDraft && <option value="DRAFT">Draft</option>}
                                            <option value="UNDER_REVIEW">Under Review</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="LISTED">Listed</option>
                                            <option value="AUCTION">In Auction</option>
                                            <option value="CLOSED">Completed</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </td>
                                    <td className="px-2 py-2">
                                        {completionPct != null ? (
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-10 bg-gray-200 rounded-full h-1">
                                                        <div className={`h-1 rounded-full ${completionPct >= 80 ? 'bg-emerald-500' : completionPct >= 40 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${completionPct}%` }} />
                                                    </div>
                                                    <span className="font-semibold text-gray-600">{completionPct}%</span>
                                                </div>
                                                {missingItems.length > 0 && (
                                                    <div className="relative group inline-block">
                                                        <span className="text-amber-600 font-semibold cursor-help underline decoration-dotted">{missingItems.length} missing</span>
                                                        <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 w-44 shadow-xl">
                                                            <p className="font-bold mb-1">Missing:</p>
                                                            <ul className="list-disc list-inside space-y-0.5">{missingItems.map(m => <li key={m}>{m}</li>)}</ul>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-2 py-2">
                                        <AdminRiskBadge risk={caseItem.risk_level || caseItem.risk} />
                                    </td>
                                    <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
                                        {lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-AU') : '—'}
                                    </td>
                                    <td className="px-2 py-2">
                                        <div className="flex items-center gap-0.5 flex-wrap">
                                            {isDraft ? (
                                                <Tip label="View draft case details">
                                                    <button onClick={() => navigate(`/admin/case-details/${caseItem.id}/overview`)} className="px-1.5 py-0.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors" style={{ fontSize: '10px' }}>View</button>
                                                </Tip>
                                            ) : (
                                                <Tip label="View case details">
                                                    <button onClick={() => navigate(`/admin/case-details/${caseItem.id}`)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"><Eye className="w-3 h-3" /></button>
                                                </Tip>
                                            )}
                                            {(caseItem.status === 'SUBMITTED' || caseItem.status === 'UNDER_REVIEW') && (
                                                <Tip label="Approve case">
                                                    <button onClick={() => handleApprove(caseItem.id)} className="p-1 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"><CheckCircle className="w-3 h-3" /></button>
                                                </Tip>
                                            )}
                                            {caseItem.status === 'APPROVED' && (
                                                <Tip label="Move to Auction">
                                                    <button onClick={() => handleMoveToAuction(caseItem.id)} className="p-1 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"><Gavel className="w-3 h-3" /></button>
                                                </Tip>
                                            )}
                                            {!isDraft && (
                                                <Tip label="Assign lawyer / lender">
                                                    <button onClick={() => openAssignModal(caseItem.id)} className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><UserPlus className="w-3 h-3" /></button>
                                                </Tip>
                                            )}
                                            <Tip label={caseItem.is_archived ? 'Restore from archive' : 'Archive case'}>
                                                <button onClick={() => handleArchive(caseItem.id, caseItem.is_archived)} className={`p-1 rounded transition-colors ${caseItem.is_archived ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}>
                                                    {caseItem.is_archived ? <RotateCcw className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                                                </button>
                                            </Tip>
                                            <Tip label="Delete case">
                                                <button onClick={() => handleDelete(caseItem.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                                            </Tip>
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
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-gray-200">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                                <p className="text-sm font-semibold text-slate-800">Create New Case</p>
                                <button onClick={() => setShowNewCaseModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="px-4">
                                <SubmitCaseForm role="admin" onClose={() => setShowNewCaseModal(false)} onSuccess={() => { setShowNewCaseModal(false); loadCases() }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Move to Auction Modal */}
            {auctionModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center gap-1.5">
                                <Gavel className="w-3.5 h-3.5 text-indigo-600" />
                                <p className="text-sm font-semibold text-slate-800">Move Case to Auction</p>
                            </div>
                            <button onClick={() => setAuctionModal({ open: false, caseId: null })} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="px-4 py-4 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date & Time <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <input type="date" value={auctionForm.endDate} onChange={e => setAuctionForm(f => ({ ...f, endDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} className="flex-1 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                    <input type="time" value={auctionForm.endTime || '10:00'} onChange={e => setAuctionForm(f => ({ ...f, endTime: e.target.value }))} className="w-24 border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Reserve Price (AUD) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                    <input type="number" value={auctionForm.reservePrice} onChange={e => setAuctionForm(f => ({ ...f, reservePrice: e.target.value }))} placeholder="500000" min="1000" className="w-full border border-gray-200 rounded-md pl-6 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Minimum $1,000</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Min Bid Increment (AUD)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                    <input type="number" value={auctionForm.minIncrement} onChange={e => setAuctionForm(f => ({ ...f, minIncrement: e.target.value }))} placeholder="1000" min="100" className="w-full border border-gray-200 rounded-md pl-6 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                                <textarea value={auctionForm.notes} onChange={e => setAuctionForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Any notes…" className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
                            </div>
                            {auctionError && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{auctionError}</p>}
                        </div>
                        <div className="flex justify-end gap-2 px-4 pb-4">
                            <button onClick={() => setAuctionModal({ open: false, caseId: null })} className="px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSubmitAuction} disabled={isSubmittingAuction} className="px-3 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5">
                                <Gavel className="w-3.5 h-3.5" />
                                {isSubmittingAuction ? 'Creating…' : 'Move to Auction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Lawyer / Lender Modal */}
            {assignModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <p className="text-sm font-semibold text-slate-800">Assign Participants</p>
                            <button onClick={() => setAssignModal({ open: false, caseId: null })} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Lawyer</label>
                                <select value={selectedLawyer} onChange={(e) => setSelectedLawyer(e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="">— No change —</option>
                                    {lawyers.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name} ({l.email})</option>)}
                                </select>
                                {lawyers.length === 0 && <p className="text-sm text-gray-500 mt-1">No approved lawyers found</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Lender</label>
                                <select value={selectedLender} onChange={(e) => setSelectedLender(e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="">— No change —</option>
                                    {lenders.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name} ({l.email})</option>)}
                                </select>
                                {lenders.length === 0 && <p className="text-sm text-gray-500 mt-1">No approved lenders found</p>}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-4 pb-4">
                            <button onClick={() => setAssignModal({ open: false, caseId: null })} className="px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleAssign} disabled={isAssigning || (!selectedLawyer && !selectedLender)} className="px-3 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                                {isAssigning ? 'Assigning…' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
