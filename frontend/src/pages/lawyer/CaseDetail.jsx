import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { casesService, documentService } from '../../api/dataService'
import RiskBadge from './components/RiskBadge'
import StatusBadge from './components/StatusBadge'
import {
  FileText, Upload, CheckCircle, Clock,
  MapPin, DollarSign, User, Shield, Gavel,
  Download, Trash2, ArrowLeft, Loader2, MessageSquare, Activity as ActivityIcon
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { useAuth } from '../../context/AuthContext'
import CaseChat from '../../components/common/CaseChat'
import CaseActivityLog from '../../components/common/CaseActivityLog'
import CaseBidPanel from '../../components/common/CaseBidPanel'

export default function CaseDetail() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [activeSection, setActiveSection] = useState('documents')
  const { addNotification } = useNotifications()
  
  const [caseItem, setCaseItem] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [completing, setCompleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [caseRes, docsRes] = await Promise.all([
        casesService.getCaseById(caseId),
        documentService.getDocuments(caseId)
      ])
      
      if (caseRes.success) setCaseItem(caseRes.data)
      if (docsRes.success) setDocuments(docsRes.data || [])
    } catch (err) {
      console.error("Error fetching case details:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [caseId])

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
        addNotification({
          type: 'success',
          title: 'Document Uploaded',
          message: 'The review document has been attached to the case.'
        })
        // Refresh docs
        const docsRes = await documentService.getDocuments(caseId)
        if (docsRes.success) setDocuments(docsRes.data || [])
      } else {
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message: res.error || 'Failed to upload document.'
        })
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.message })
    } finally {
      setUploading(false)
    }
  }

  const handleCompleteReview = async () => {
    if (!window.confirm("Mark this case as review completed? This will update the status to APPROVED.")) return
    
    setCompleting(true)
    try {
      const res = await casesService.updateCaseStatus(caseId, 'APPROVED')
      if (res.success) {
        addNotification({
          type: 'success',
          title: 'Review Completed',
          message: 'Case status has been updated to APPROVED.'
        })
        setCaseItem(res.data)
      } else {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: res.error || 'Failed to update status.'
        })
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.message })
    } finally {
      setCompleting(false)
    }
  }

  const handleView = (doc) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank')
    } else {
      addNotification({ type: 'info', title: 'File not available', message: 'The document file is not accessible at this time.' })
    }
  }

  const handleDownload = (doc) => {
    if (doc.file_url) {
      const a = document.createElement('a')
      a.href = doc.file_url
      a.download = doc.document_name || doc.file_name || 'document'
      a.click()
    } else {
      addNotification({ type: 'info', title: 'File not available', message: 'The document file is not accessible at this time.' })
    }
  }

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return
    
    try {
      const res = await documentService.deleteDocument(docId)
      if (res.success) {
        addNotification({ type: 'success', title: 'Deleted', message: 'Document removed successfully.' })
        fetchData()
      } else {
        addNotification({ type: 'error', title: 'Error', message: res.error || 'Failed to delete.' })
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.message })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-gray-500 font-medium tracking-tight">Loading case details...</p>
      </div>
    )
  }

  if (!caseItem) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-10">
        <button 
          onClick={() => navigate('/lawyer/assigned-cases')}
          className="flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Assigned Cases
        </button>
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
          <p className="text-gray-400 font-bold italic uppercase tracking-widest mb-4">Case Not Found</p>
          <p className="text-sm text-gray-500">The requested case could not be retrieved from the server.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate('/lawyer/assigned-cases')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-1"
          >
            <ArrowLeft size={13} />
            Back to Assigned Cases
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-semibold text-slate-900">
              {caseItem.case_number || "Case Details"}
            </h1>
            <StatusBadge status={caseItem.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Review and verify legal documents for this property resolution.</p>
        </div>

        {caseItem.status === 'UNDER_REVIEW' && (
          <button
            onClick={handleCompleteReview}
            disabled={completing}
            className="px-4 py-2 bg-[#1B3A6B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#142d55] transition-colors disabled:opacity-50"
          >
            {completing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Complete Legal Review
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Shield size={15} className="text-[#1B3A6B]" />
                Case Information
              </h2>
            </div>
            <div className="p-4 grid md:grid-cols-2 gap-4">
              <DetailBox icon={<User size={16} />} label="Borrower Name" value={caseItem.borrower_name} />
              <DetailBox icon={<MapPin size={16} />} label="Property Address" value={caseItem.property_address} />
              <DetailBox icon={<DollarSign size={16} />} label="Loan Amount" value={caseItem.loan_amount ? `$${Number(caseItem.loan_amount).toLocaleString()}` : "TBD"} />
              <DetailBox icon={<Shield size={16} />} label="Security Value" value={caseItem.property_value ? `$${Number(caseItem.property_value).toLocaleString()}` : "TBD"} color="text-emerald-600" />
              <DetailBox icon={<Clock size={16} />} label="Created At" value={caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"} />
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Shield size={12} /> Risk Level
                </p>
                <div className="pt-1">
                  <RiskBadge risk={caseItem.risk_level} />
                </div>
              </div>
            </div>
            <div className="px-4 pb-4">
               <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <span className="font-semibold">Note:</span> Verify all title searches and insurance policies before marking review as complete.
                  </p>
               </div>
            </div>
          </div>

          {/* Document Management */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <FileText size={15} className="text-[#1B3A6B]" />
                Case Documents
              </h2>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${uploading ? 'bg-slate-100 text-slate-400' : 'bg-[#1B3A6B] text-white hover:bg-[#142d55]'}`}>
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </div>
              </label>
            </div>
            <div className="p-3">
              {documents.length === 0 ? (
                <div className="py-8 text-center text-slate-300">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium text-slate-400">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-2.5 hover:bg-slate-50 px-1 rounded-lg transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#1B3A6B]/10 group-hover:text-[#1B3A6B] transition-colors">
                          {doc.document_type === 'Property Image' ? <MapPin size={13} /> : <FileText size={13} />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{doc.document_name || doc.file_name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                            {doc.document_type || 'General'} • {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleView(doc)} className="p-1.5 text-slate-300 hover:text-[#1B3A6B] hover:bg-slate-100 rounded transition-colors" title="View">
                          <Download size={13} className="rotate-180" />
                        </button>
                        <button onClick={() => handleDownload(doc)} className="p-1.5 text-slate-300 hover:text-[#1B3A6B] hover:bg-slate-100 rounded transition-colors" title="Download">
                          <Download size={13} />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-[#1B3A6B] rounded-xl p-4 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                <Shield size={16} className="text-blue-300" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Legal Verification</h3>
              <p className="text-xs text-blue-200 leading-relaxed">
                As the assigned legal officer, certify property security validity and ensure compliance before the case proceeds.
              </p>
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-blue-300 font-medium">Verification Status</span>
                  <span className="font-semibold text-white">{caseItem.status === 'APPROVED' ? 'COMPLETE' : 'PENDING'}</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-300 transition-all duration-700"
                    style={{ width: caseItem.status === 'APPROVED' ? '100%' : '60%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed section: Messages & Activity */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {[
            { key: 'documents', label: 'Documents', icon: FileText },
            { key: 'bids', label: 'Bids', icon: Gavel },
            { key: 'messages', label: 'Messages', icon: MessageSquare },
            { key: 'activity', label: 'Activity', icon: ActivityIcon },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeSection === tab.key
                  ? 'border-[#1B3A6B] text-[#1B3A6B] bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeSection === 'documents' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-800">Case Documents</h3>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3A6B] text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-[#142d55] transition-colors">
                  <Upload className="w-3 h-3" />
                  Upload
                  <input type="file" className="sr-only" onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.png" />
                </label>
              </div>
              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No documents yet</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-800">{doc.document_name || doc.file_name}</p>
                          <p className="text-[10px] text-slate-400">{doc.document_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleView(doc)} className="p-1.5 text-slate-400 hover:text-[#1B3A6B] hover:bg-blue-50 rounded transition-colors">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeSection === 'bids' && (
            <CaseBidPanel
              caseId={caseId}
              canBid={true}
              canClose={false}
              currentUser={{ name: authUser?.name, role: 'Lawyer' }}
            />
          )}
          {activeSection === 'messages' && (
            <CaseChat caseId={caseId} currentUser={{ name: authUser?.name, role: 'Lawyer' }} />
          )}
          {activeSection === 'activity' && (
            <CaseActivityLog caseId={caseId} />
          )}
        </div>
      </div>
    </div>
  )
}

function DetailBox({ icon, label, value, color = "text-slate-800" }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
        {icon} {label}
      </p>
      <p className={`text-sm font-semibold ${color}`}>
        {value || "—"}
      </p>
    </div>
  )
}
