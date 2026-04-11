import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { casesService, documentService } from '../../api/dataService'
import api from '../../services/api'
import RiskBadge from './components/RiskBadge'
import StatusBadge from './components/StatusBadge'
import {
  FileText, Upload, CheckCircle, Clock, XCircle,
  MapPin, DollarSign, Shield, Gavel,
  Download, Trash2, ArrowLeft, Loader2, MessageSquare,
  Activity as ActivityIcon, Home, Eye, AlertTriangle,
  ClipboardList, ChevronRight, Building2, Landmark,
  BarChart2, Layers, Info, Save
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { useAuth } from '../../context/AuthContext'
import CaseChat from '../../components/common/CaseChat'
import CaseActivityLog from '../../components/common/CaseActivityLog'
import CaseBidPanel from '../../components/common/CaseBidPanel'

// ─── Australian Lawyer Compliance Checklist ──────────────────────────────────

const COMPLIANCE_ITEMS = [
  {
    id: 'title_search',
    category: 'Title & Ownership',
    label: 'Title Search & Ownership Verification',
    description: 'Confirm registered proprietor matches borrower details. Search conducted via NSW LRS / Titles Queensland / relevant state authority.',
  },
  {
    id: 'certificate_of_title',
    category: 'Title & Ownership',
    label: 'Certificate of Title — Encumbrances Check',
    description: 'Verify clear title free of caveats, easements, covenants, or other encumbrances that may affect security value.',
  },
  {
    id: 'mortgage_registration',
    category: 'Title & Ownership',
    label: 'Mortgage Registration & Priority',
    description: 'Verify all existing registered mortgages. Confirm lender\'s priority position in case of enforcement.',
  },
  {
    id: 'ppsr',
    category: 'Regulatory Searches',
    label: 'PPSR Search (Personal Property Securities Register)',
    description: 'Search completed on the borrower entity/individual for any security interests registered under the PPSA 2009.',
  },
  {
    id: 'council_rates',
    category: 'Government Searches',
    label: 'Council Rates Search',
    description: 'Current council rate balance confirmed with local council. Any outstanding arrears identified and disclosed.',
  },
  {
    id: 'water_rates',
    category: 'Government Searches',
    label: 'Water & Drainage Search',
    description: 'Water and sewerage rates search completed. Outstanding charges identified. Water authority details confirmed.',
  },
  {
    id: 'land_tax',
    category: 'Government Searches',
    label: 'Land Tax Search',
    description: 'Land tax liability confirmed with state revenue office. Any land tax arrears or waivers documented.',
  },
  {
    id: 'strata_report',
    category: 'Property Condition',
    label: 'Strata / Owners Corporation Search',
    description: 'Where applicable: strata title search, review of owners corporation records, levies, special levies and by-laws.',
  },
  {
    id: 'building_pest',
    category: 'Property Condition',
    label: 'Building & Pest Inspection Report',
    description: 'Current building and pest inspection report reviewed. Material defects or infestations disclosed to all parties.',
  },
  {
    id: 'zoning',
    category: 'Planning & Zoning',
    label: 'Zoning & Planning Certificate (s10.7 or equivalent)',
    description: 'Section 10.7 Planning Certificate (NSW) or equivalent state document reviewed. Zoning, overlays, and development restrictions confirmed.',
  },
  {
    id: 'aml_kyc',
    category: 'Compliance & AML',
    label: 'AML/KYC Compliance Verification',
    description: 'Anti-money laundering and know-your-customer checks completed per the Anti-Money Laundering and Counter-Terrorism Financing Act 2006.',
  },
  {
    id: 'firb',
    category: 'Compliance & AML',
    label: 'FIRB Compliance (Foreign Investment Review Board)',
    description: 'If borrower or purchaser is a foreign person: FIRB approval obtained or exemption confirmed under FATA 1975.',
  },
  {
    id: 'default_notices',
    category: 'Enforcement',
    label: 'Default Notices — s57/s88 Verification',
    description: 'Section 57 (Real Property Act) or section 88 (Conveyancing Act) default notices reviewed for validity, service, and expiry compliance.',
  },
  {
    id: 'loan_agreement',
    category: 'Documentation',
    label: 'Loan Agreement & Security Documents Review',
    description: 'Original loan agreement, mortgage deed, and all security documentation reviewed for completeness and enforceability.',
  },
  {
    id: 'insurance',
    category: 'Documentation',
    label: 'Building Insurance Verification',
    description: 'Current building insurance policy confirmed. Lender noted as interested party. Policy not lapsed or cancelled.',
  },
]

const CHECKLIST_CATEGORIES = [...new Set(COMPLIANCE_ITEMS.map(i => i.category))]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (val) => val || '—'
const fmtCurrency = (val) => val ? `$${Number(val).toLocaleString('en-AU', { minimumFractionDigits: 0 })}` : '—'
const fmtDate = (val) => val ? new Date(val).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-emerald-600' : 'text-slate-800'}`}>{fmt(value)}</span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <Icon size={14} className="text-[#1B3A6B]" />
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── Rejection Modal ──────────────────────────────────────────────────────────

function RejectModal({ title, placeholder, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('')
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" style={{ zIndex: 10000 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle size={18} className="text-red-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        </div>
        <textarea
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
          rows={4}
          placeholder={placeholder}
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Approve Case Modal ───────────────────────────────────────────────────────

function ApproveCaseModal({ onConfirm, onClose, loading, checkedCount, totalCount }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" style={{ zIndex: 10000 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <CheckCircle size={18} className="text-[#1B3A6B]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Complete Legal Review</h3>
            <p className="text-xs text-slate-500 mt-0.5">Admin will be notified to take final action.</p>
          </div>
        </div>
        {checkedCount < totalCount && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>{totalCount - checkedCount} compliance item{totalCount - checkedCount > 1 ? 's' : ''}</strong> not yet checked. You can still submit — it will be recorded in your review.
            </p>
          </div>
        )}
        <p className="text-sm text-slate-600 mb-5">
          Confirm that you have completed your legal review. Your checklist and notes will be saved and submitted to admin for final approval or rejection.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1B3A6B] rounded-lg hover:bg-[#142d55] transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            Submit to Admin
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LawyerCaseDetail() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const { addNotification } = useNotifications()

  const [activeTab, setActiveTab] = useState('overview')
  const [caseItem, setCaseItem] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Action states
  const [startingReview, setStartingReview] = useState(false)
  const [completingReview, setCompletingReview] = useState(false)
  const [docActionLoading, setDocActionLoading] = useState(null) // docId
  const [downloadingDoc, setDownloadingDoc] = useState(null)

  // Modals
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [rejectDocModal, setRejectDocModal] = useState(null) // { id, name }

  // Checklist
  const [checklist, setChecklist] = useState(() =>
    Object.fromEntries(COMPLIANCE_ITEMS.map(i => [i.id, false]))
  )
  const [checklistNotes, setChecklistNotes] = useState('')
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error'
  const saveTimerRef = useRef(null)
  const isFirstLoad = useRef(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [caseRes, docsRes] = await Promise.all([
        casesService.getCaseById(caseId),
        documentService.getDocuments(caseId),
      ])
      if (caseRes.success) {
        setCaseItem(caseRes.data)
        // Restore saved checklist from backend
        const saved = caseRes.data?.metadata_json?.lawyer_review
        if (saved?.checklist) {
          setChecklist(prev => ({ ...prev, ...saved.checklist }))
        }
        if (saved?.notes) setChecklistNotes(saved.notes)
      }
      if (docsRes.success) setDocuments(docsRes.data || [])
    } catch (err) {
      console.error('Error fetching case details:', err)
    } finally {
      setLoading(false)
      isFirstLoad.current = false
    }
  }, [caseId])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-save checklist to backend with 800ms debounce
  useEffect(() => {
    if (isFirstLoad.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(async () => {
      try {
        await casesService.saveLawyerChecklist(caseId, checklist, checklistNotes)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(null), 2500)
      } catch {
        setSaveStatus('error')
      }
    }, 800)
    return () => clearTimeout(saveTimerRef.current)
  }, [checklist, checklistNotes, caseId])

  // ── Start Review ─────────────────────────────────────────────────────────────

  const handleStartReview = async () => {
    setStartingReview(true)
    try {
      const res = await casesService.startCaseReview(caseId)
      if (res.success) {
        addNotification({ type: 'success', title: 'Review Started', message: 'Case status updated to Under Review.' })
        setCaseItem(res.data)
      } else {
        addNotification({ type: 'error', title: 'Failed', message: res.error || 'Could not start review.' })
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.message })
    } finally {
      setStartingReview(false)
    }
  }

  // ── Complete Legal Review (submits back to admin) ─────────────────────────────

  const handleCompleteReview = async () => {
    setShowCompleteModal(false)
    setCompletingReview(true)
    try {
      // Save latest checklist state first, then mark as complete
      await casesService.saveLawyerChecklist(caseId, checklist, checklistNotes)
      const res = await casesService.completeLawyerReview(caseId)
      if (res.success) {
        addNotification({
          type: 'success',
          title: 'Review Submitted',
          message: 'Your legal review has been submitted. Admin has been notified to take action.',
        })
        setCaseItem(res.data)
      } else {
        addNotification({ type: 'error', title: 'Failed', message: res.error || 'Could not submit review.' })
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.message })
    } finally {
      setCompletingReview(false)
    }
  }

  // ── Document Approve ─────────────────────────────────────────────────────────

  const handleApproveDoc = async (docId) => {
    setDocActionLoading(docId)
    try {
      const res = await documentService.approveDocument(docId)
      if (res.success) {
        addNotification({ type: 'success', title: 'Document Approved', message: 'Document has been approved.' })
        fetchData()
      } else {
        addNotification({ type: 'error', title: 'Failed', message: res.error || 'Could not approve document.' })
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.message })
    } finally {
      setDocActionLoading(null)
    }
  }

  // ── Document Reject ──────────────────────────────────────────────────────────

  const handleRejectDoc = async (reason) => {
    if (!rejectDocModal) return
    setDocActionLoading(rejectDocModal.id)
    try {
      const res = await documentService.rejectDocument(rejectDocModal.id, reason)
      if (res.success) {
        addNotification({ type: 'success', title: 'Document Rejected', message: 'Document has been rejected.' })
        setRejectDocModal(null)
        fetchData()
      } else {
        addNotification({ type: 'error', title: 'Failed', message: res.error || 'Could not reject document.' })
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.message })
    } finally {
      setDocActionLoading(null)
    }
  }

  // ── Upload ───────────────────────────────────────────────────────────────────

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('case_id', caseId)
    formData.append('document_type', 'Lawyer Review Document')
    try {
      const res = await documentService.uploadDocument(caseId, formData)
      if (res.success) {
        addNotification({ type: 'success', title: 'Uploaded', message: 'Document attached to case.' })
        fetchData()
      } else {
        addNotification({ type: 'error', title: 'Upload Failed', message: res.error || 'Failed to upload document.' })
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.message })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // ── Authenticated download ────────────────────────────────────────────────────

  const handleAuthDownload = async (doc, openInTab = false) => {
    const url = doc.file_url || doc.file_path
    if (!url) {
      addNotification({ type: 'info', title: 'Not Available', message: 'File is not accessible.' })
      return
    }
    if (!url.startsWith('/api/')) {
      openInTab ? window.open(url, '_blank') : (() => { const a = document.createElement('a'); a.href = url; a.download = doc.document_name || 'document'; a.click() })()
      return
    }
    setDownloadingDoc(doc.id)
    try {
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: res.headers['content-type'] })
      const blobUrl = URL.createObjectURL(blob)
      if (openInTab) {
        window.open(blobUrl, '_blank')
      } else {
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = doc.document_name || doc.file_name || 'document'
        a.click()
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
    } catch (err) {
      addNotification({ type: 'error', title: 'Download Failed', message: err.message })
    } finally {
      setDownloadingDoc(null)
    }
  }

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    try {
      const res = await documentService.deleteDocument(docId)
      if (res.success) {
        addNotification({ type: 'success', title: 'Deleted', message: 'Document removed.' })
        fetchData()
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.message })
    }
  }

  // ── Loading / Not Found ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-[#1B3A6B] animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading case details…</p>
      </div>
    )
  }

  if (!caseItem) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-10">
        <button onClick={() => navigate('/lawyer/assigned-cases')} className="flex items-center gap-2 text-[#1B3A6B] font-semibold hover:opacity-80 transition-opacity text-sm">
          <ArrowLeft size={16} /> Back to Assigned Cases
        </button>
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
          <p className="text-gray-400 font-bold italic uppercase tracking-widest mb-2">Case Not Found</p>
          <p className="text-sm text-gray-500">The requested case could not be retrieved.</p>
        </div>
      </div>
    )
  }

  const meta = caseItem.metadata_json || {}
  // Show Start Review for SUBMITTED cases only
  const canStartReview = caseItem.status === 'SUBMITTED'
  // Allow completing review for any active case (admin may advance status while review is in progress)
  const INACTIVE_STATUSES = ['DRAFT', 'CLOSED', 'REJECTED']
  const canReview = !INACTIVE_STATUSES.includes(caseItem.status)
  const isApproved = caseItem.status === 'APPROVED'
  const isRejected = caseItem.status === 'REJECTED'
  const reviewSubmittedToAdmin = !!meta?.lawyer_review?.submitted_to_admin
  const checkedCount = Object.values(checklist).filter(Boolean).length
  const totalCount = COMPLIANCE_ITEMS.length

  // ── Tabs ──────────────────────────────────────────────────────────────────────

  const TABS = [
    { key: 'overview', label: 'Overview', icon: Info },
    { key: 'property', label: 'Property', icon: Home },
    { key: 'documents', label: 'Documents', icon: FileText, badge: documents.length || null },
    { key: 'legal', label: 'Legal Review', icon: ClipboardList },
    { key: 'bids', label: 'Bids', icon: Gavel },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'activity', label: 'Activity', icon: ActivityIcon },
  ]

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate('/lawyer/assigned-cases')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-1"
          >
            <ArrowLeft size={13} /> Back to Assigned Cases
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-slate-900">{caseItem.case_number || 'Case Details'}</h1>
            <StatusBadge status={caseItem.status} />
            <RiskBadge risk={caseItem.risk_level} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{caseItem.title || caseItem.property_address || 'Property Resolution Case'}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canStartReview && (
            <button
              onClick={handleStartReview}
              disabled={startingReview}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {startingReview ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
              Start Legal Review
            </button>
          )}
          {canReview && !reviewSubmittedToAdmin && (
            <button
              onClick={() => setShowCompleteModal(true)}
              disabled={completingReview}
              className="px-4 py-2 bg-[#1B3A6B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#142d55] transition-colors disabled:opacity-50"
            >
              {completingReview ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
              Complete Legal Review
            </button>
          )}
          {canReview && reviewSubmittedToAdmin && (
            <span className="px-3 py-1.5 bg-blue-50 text-[#1B3A6B] rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-blue-200">
              <CheckCircle size={13} /> Review Submitted to Admin
            </span>
          )}
          {isApproved && (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle size={13} /> Approved by Admin
            </span>
          )}
          {isRejected && (
            <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <XCircle size={13} /> Rejected by Admin
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <ClipboardList size={14} className="text-[#1B3A6B]" />
          <span className="text-xs font-semibold text-slate-700">Compliance</span>
        </div>
        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1B3A6B] transition-all duration-500 rounded-full"
            style={{ width: `${(checkedCount / totalCount) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-[#1B3A6B] shrink-0">{checkedCount}/{totalCount}</span>
        <span className="text-xs text-slate-400 shrink-0 hidden sm:block">items verified</span>
      </div>

      {/* Tab Nav */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors relative ${
                activeTab === tab.key
                  ? 'border-[#1B3A6B] text-[#1B3A6B] bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.badge != null && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Case Number" value={caseItem.case_number} />
                  <DetailRow label="Status" value={caseItem.status} />
                  <DetailRow label="Borrower" value={caseItem.borrower_name} />
                  <DetailRow label="Property Address" value={caseItem.property_address} />
                  <DetailRow label="Loan Amount" value={fmtCurrency(caseItem.loan_amount)} />
                  <DetailRow label="Security Value" value={fmtCurrency(caseItem.property_value)} highlight />
                  <DetailRow label="Estimated Value" value={fmtCurrency(caseItem.estimated_value)} />
                  <DetailRow label="LVR" value={caseItem.lvr ? `${caseItem.lvr}%` : '—'} />
                  <DetailRow label="Default Amount" value={fmtCurrency(meta.total_arrears)} />
                  <DetailRow label="Missed Payments" value={meta.missed_payments} />
                  <DetailRow label="Days in Default" value={meta.days_in_default} />
                  <DetailRow label="Created" value={fmtDate(caseItem.created_at)} />
                </div>
                {caseItem.description && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{caseItem.description}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="bg-[#1B3A6B] rounded-xl p-4 text-white">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                    <Shield size={16} className="text-blue-300" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">Legal Verification Status</h3>
                  <p className="text-xs text-blue-200 leading-relaxed mb-4">
                    As the assigned legal officer, verify all title searches, compliance items and documents before approving this case.
                  </p>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-blue-300">Compliance Checklist</span>
                    <span className="font-bold">{checkedCount}/{totalCount}</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-300 transition-all duration-700 rounded-full" style={{ width: `${(checkedCount / totalCount) * 100}%` }} />
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle size={13} className="text-amber-600" />
                    <span className="text-xs font-semibold text-amber-800">Australian Legal Requirements</span>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Verify title searches, encumbrances, council/water rates, PPSR, AML/KYC, and section 57 default notices before approving.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── PROPERTY TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'property' && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Location */}
              <SectionCard title="Location Details" icon={MapPin}>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Property Address" value={caseItem.property_address} />
                  <DetailRow label="Suburb" value={meta.suburb} />
                  <DetailRow label="State" value={meta.state} />
                  <DetailRow label="Postcode" value={meta.postcode} />
                </div>
              </SectionCard>

              {/* Property Features */}
              <SectionCard title="Property Features" icon={Building2}>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Property Type" value={caseItem.property_type} />
                  <DetailRow label="Floor Area" value={meta.floor_area ? `${meta.floor_area} m²` : (meta.land_size ? `${meta.land_size} m²` : '—')} />
                  <DetailRow label="Land Size" value={meta.land_size ? `${meta.land_size} m²` : '—'} />
                  <DetailRow label="Bedrooms" value={meta.bedrooms} />
                  <DetailRow label="Bathrooms" value={meta.bathrooms} />
                  <DetailRow label="Kitchens" value={meta.kitchens} />
                  <DetailRow label="Parking Spaces" value={meta.parking} />
                  <DetailRow label="Year Built" value={meta.year_built} />
                  <DetailRow label="Construction Type" value={meta.construction_type} />
                  <DetailRow label="Roof Type" value={meta.roof_type} />
                  <DetailRow label="Property Condition" value={meta.property_condition} />
                </div>
              </SectionCard>

              {/* Financial Details */}
              <SectionCard title="Financial Details" icon={DollarSign}>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Loan Amount" value={fmtCurrency(caseItem.loan_amount)} />
                  <DetailRow label="Estimated Value" value={fmtCurrency(caseItem.estimated_value)} highlight />
                  <DetailRow label="Security Value" value={fmtCurrency(caseItem.property_value)} highlight />
                  <DetailRow label="LVR" value={caseItem.lvr ? `${caseItem.lvr}%` : '—'} />
                  <DetailRow label="Original Loan Amount" value={fmtCurrency(meta.original_loan_amount)} />
                  <DetailRow label="Total Arrears" value={fmtCurrency(meta.total_arrears)} />
                  <DetailRow label="Missed Payments" value={meta.missed_payments} />
                  <DetailRow label="Default Rate" value={meta.default_rate ? `${meta.default_rate}%` : '—'} />
                  <DetailRow label="Days in Default" value={meta.days_in_default} />
                </div>
              </SectionCard>

              {/* Outgoings & Rates */}
              <SectionCard title="Outgoings & Rates" icon={Landmark}>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Council Rates" value={meta.council_rates ? fmtCurrency(meta.council_rates) : '—'} />
                  <DetailRow label="Water Rates" value={meta.water_rates ? fmtCurrency(meta.water_rates) : '—'} />
                  <DetailRow label="Strata Fees" value={meta.strata_fees ? fmtCurrency(meta.strata_fees) : '—'} />
                </div>
              </SectionCard>

              {/* Sales History & Valuation */}
              <SectionCard title="Sales History & Valuation" icon={BarChart2}>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Last Sale Price" value={meta.last_sale_price ? fmtCurrency(meta.last_sale_price) : '—'} />
                  <DetailRow label="Last Sale Date" value={meta.last_sale_date ? fmtDate(meta.last_sale_date) : '—'} />
                  <DetailRow label="Valuation Date" value={meta.valuation_date ? fmtDate(meta.valuation_date) : '—'} />
                  <DetailRow label="Valuation Provider" value={meta.valuation_provider} />
                </div>
              </SectionCard>

              {/* Loan Details */}
              <SectionCard title="Loan & Default Details" icon={Layers}>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Loan Purpose" value={caseItem.loan_purpose} />
                  <DetailRow label="Loan Term" value={caseItem.loan_term} />
                  <DetailRow label="Interest Rate" value={caseItem.interest_rate ? `${caseItem.interest_rate}%` : '—'} />
                  <DetailRow label="Lender Type" value={caseItem.lender_type} />
                  <DetailRow label="Case Created" value={fmtDate(caseItem.created_at)} />
                  <DetailRow label="Submitted At" value={fmtDate(caseItem.submitted_at)} />
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── DOCUMENTS TAB ────────────────────────────────────────────────── */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{documents.length} document{documents.length !== 1 ? 's' : ''} attached to this case</p>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3A6B] text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#142d55] transition-colors">
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  {uploading ? 'Uploading…' : 'Upload Document'}
                  <input type="file" className="sr-only" onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={uploading} />
                </label>
              </div>

              {documents.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                  <p className="text-sm font-medium text-slate-400">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {documents.map(doc => {
                    const docStatus = doc.status || doc.document_status
                    const isApprovedDoc = docStatus === 'APPROVED' || docStatus === 'approved'
                    const isRejectedDoc = docStatus === 'REJECTED' || docStatus === 'rejected'
                    const isLoadingThisDoc = docActionLoading === doc.id
                    const isDownloadingThisDoc = downloadingDoc === doc.id

                    return (
                      <div key={doc.id} className="py-3 flex items-center gap-3 hover:bg-slate-50 px-2 rounded-lg transition-colors -mx-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{doc.document_name || doc.file_name || 'Document'}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                            {doc.document_type || 'General'} • {fmtDate(doc.created_at)}
                          </p>
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0">
                          {isApprovedDoc ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                              <CheckCircle size={9} /> Approved
                            </span>
                          ) : isRejectedDoc ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
                              <XCircle size={9} /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                              <Clock size={9} /> Pending
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleAuthDownload(doc, true)}
                            disabled={isDownloadingThisDoc}
                            className="p-1.5 text-slate-400 hover:text-[#1B3A6B] hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            {isDownloadingThisDoc ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                          </button>
                          <button
                            onClick={() => handleAuthDownload(doc, false)}
                            className="p-1.5 text-slate-400 hover:text-[#1B3A6B] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download size={13} />
                          </button>

                          {canReview && !isApprovedDoc && (
                            <button
                              onClick={() => handleApproveDoc(doc.id)}
                              disabled={isLoadingThisDoc}
                              className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                              title="Approve document"
                            >
                              {isLoadingThisDoc ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                              Approve
                            </button>
                          )}
                          {canReview && !isRejectedDoc && (
                            <button
                              onClick={() => setRejectDocModal({ id: doc.id, name: doc.document_name || doc.file_name })}
                              disabled={isLoadingThisDoc}
                              className="px-2 py-1 text-[10px] font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                              title="Reject document"
                            >
                              <XCircle size={10} /> Reject
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── LEGAL REVIEW TAB ─────────────────────────────────────────────── */}
          {activeTab === 'legal' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Australian Legal Compliance Checklist</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Verify each item before approving the case for auction. Progress is saved automatically.</p>
                </div>
                <div className="flex items-center gap-3">
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Loader2 size={12} className="animate-spin" /> Saving…
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <Save size={12} /> Saved
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="flex items-center gap-1.5 text-xs text-red-500">
                      <AlertTriangle size={12} /> Save failed
                    </span>
                  )}
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#1B3A6B]">{checkedCount}<span className="text-sm font-normal text-slate-400">/{totalCount}</span></div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Verified</p>
                  </div>
                </div>
              </div>

              {CHECKLIST_CATEGORIES.map(category => (
                <div key={category} className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ChevronRight size={11} className="text-[#1B3A6B]" />
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {COMPLIANCE_ITEMS.filter(i => i.category === category).map(item => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          checklist[item.id]
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={checklist[item.id]}
                            onChange={e => setChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            checklist[item.id] ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'
                          }`}>
                            {checklist[item.id] && <CheckCircle size={10} className="text-white" strokeWidth={3} />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold ${checklist[item.id] ? 'text-emerald-800' : 'text-slate-800'}`}>
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Lawyer notes */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Legal Review Notes</label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                  rows={3}
                  placeholder="Add notes, observations, or caveats for this legal review (visible to all parties once saved)…"
                  value={checklistNotes}
                  onChange={e => setChecklistNotes(e.target.value)}
                />
              </div>

              {/* Final action */}
              <div className="pt-4 border-t border-slate-100">
                {canReview && !reviewSubmittedToAdmin && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        {checkedCount === totalCount
                          ? 'All compliance items verified. Ready to submit to admin.'
                          : `${totalCount - checkedCount} item${totalCount - checkedCount > 1 ? 's' : ''} still unchecked — you can still submit.`}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Submitting will notify admin to review your findings and take final action.</p>
                    </div>
                    <button
                      onClick={() => setShowCompleteModal(true)}
                      disabled={completingReview}
                      className="px-5 py-2 bg-[#1B3A6B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#142d55] transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {completingReview ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                      Complete &amp; Submit to Admin
                    </button>
                  </div>
                )}
                {canReview && reviewSubmittedToAdmin && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#1B3A6B] shrink-0" />
                    <p className="text-xs text-[#1B3A6B] font-semibold">Review submitted. Admin has been notified and will approve or reject the case.</p>
                  </div>
                )}
                {(isApproved || isRejected) && (
                  <div className={`rounded-xl p-3 flex items-center gap-2 ${isApproved ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    {isApproved ? <CheckCircle size={14} className="text-emerald-600 shrink-0" /> : <XCircle size={14} className="text-red-500 shrink-0" />}
                    <p className={`text-xs font-semibold ${isApproved ? 'text-emerald-700' : 'text-red-600'}`}>
                      {isApproved ? 'Case has been approved by admin.' : 'Case has been rejected by admin.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── BIDS TAB ─────────────────────────────────────────────────────── */}
          {activeTab === 'bids' && (
            <CaseBidPanel
              caseId={caseId}
              canBid={false}
              canClose={false}
              currentUser={{ name: authUser?.name, role: 'Lawyer' }}
            />
          )}

          {/* ── MESSAGES TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'messages' && (
            <CaseChat caseId={caseId} currentUser={{ name: authUser?.name, role: 'Lawyer' }} />
          )}

          {/* ── ACTIVITY TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'activity' && (
            <CaseActivityLog caseId={caseId} />
          )}
        </div>
      </div>

      {/* Modals */}
      {showCompleteModal && (
        <ApproveCaseModal
          checkedCount={checkedCount}
          totalCount={totalCount}
          loading={completingReview}
          onConfirm={handleCompleteReview}
          onClose={() => setShowCompleteModal(false)}
        />
      )}
      {rejectDocModal && (
        <RejectModal
          title={`Reject Document — ${rejectDocModal.name}`}
          placeholder="Provide reason for rejecting this document…"
          loading={docActionLoading === rejectDocModal.id}
          onConfirm={handleRejectDoc}
          onClose={() => setRejectDocModal(null)}
        />
      )}
    </div>
  )
}
