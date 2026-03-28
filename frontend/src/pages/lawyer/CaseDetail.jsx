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
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/lawyer/assigned-cases')}
            className="flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors mb-2 text-sm"
          >
            <ArrowLeft size={16} />
            Back to Assigned Cases
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            {caseItem.case_number || "Case Details"}
            <StatusBadge status={caseItem.status} />
          </h1>
          <p className="text-sm text-slate-500 font-medium">Review and verify legal documents for this property resolution.</p>
        </div>

        {caseItem.status === 'UNDER_REVIEW' && (
          <button
            onClick={handleCompleteReview}
            disabled={completing}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {completing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            Complete Legal Review
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield size={20} className="text-indigo-600" />
                Case Information
              </h2>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-8">
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
            <div className="px-8 pb-8">
               <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                  <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                    <span className="font-bold">Lawyer Note:</span> Please verify all title searches and insurance policies before marking this review as complete. Upload any additional legal findings to the document repository.
                  </p>
               </div>
            </div>
          </div>

          {/* Document Management */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                Case Documents
              </h2>
              <label className="cursor-pointer">
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </div>
              </label>
            </div>
            <div className="p-4">
              {documents.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="text-sm font-medium">No documents have been uploaded yet.</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-indigo-600 transition-colors shadow-sm">
                          {doc.document_type === 'Property Image' ? <MapPin size={20} /> : <FileText size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{doc.document_name || doc.file_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {doc.document_type || 'General'} • {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleView(doc)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                          title="View"
                        >
                          <Download size={18} className="rotate-180" />
                        </button>
                        <button 
                          onClick={() => handleDownload(doc)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                          title="Download"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
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
        <div className="space-y-8">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Shield size={24} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold italic uppercase tracking-tight">Legal Verification</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    As the assigned legal officer, you are responsible for certifying the validity of the property security and ensuring all compliance requirements are met before the case proceeds to auction.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest">Verification Status</span>
                    <span className="font-bold text-indigo-400">{caseItem.status === 'APPROVED' ? 'COMPLETE' : 'PENDING'}</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000" 
                      style={{ width: caseItem.status === 'APPROVED' ? '100%' : '60%' }}
                    />
                  </div>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-16 -translate-y-16 blur-2xl"></div>
           </div>
        </div>
      </div>

      {/* Tabbed section: Messages & Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { key: 'documents', label: 'Documents', icon: FileText },
            { key: 'bids', label: 'Bids', icon: Gavel },
            { key: 'messages', label: 'Messages', icon: MessageSquare },
            { key: 'activity', label: 'Activity', icon: ActivityIcon },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === tab.key
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeSection === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Case Documents</h3>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-indigo-700 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                  <input type="file" className="sr-only" onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.png" />
                </label>
              </div>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No documents yet</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.document_name || doc.file_name}</p>
                          <p className="text-xs text-gray-400">{doc.document_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleView(doc)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
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

function DetailBox({ icon, label, value, color = "text-slate-900" }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
        {icon} {label}
      </p>
      <p className={`text-base font-bold tracking-tight ${color}`}>
        {value || "—"}
      </p>
    </div>
  )
}
