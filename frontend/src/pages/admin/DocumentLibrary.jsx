import { useState, useRef, useEffect } from 'react'
import { FileText, FolderOpen, Star, Upload, Download, Eye, Share2, Trash2, File, Search, X, CheckCircle } from 'lucide-react'
import AdminStatCard from '../../components/admin/AdminStatCard'
import { documentService } from '../../api/dataService'
import { generateBrandedPDF } from '../../utils/pdfGenerator'

export default function DocumentLibrary() {
    const [documents, setDocuments] = useState([])

    useEffect(() => {
        documentService.getAllDocuments()
            .then((res) => {
                const raw = Array.isArray(res.data) ? res.data : (res.data?.items || [])
                const mapped = raw.map(d => ({
                    id: d.id,
                    name: d.document_name || d.file_name || d.name || 'Untitled',
                    type: (d.file_name || d.document_name || d.name || '').split('.').pop()?.toLowerCase() || 'pdf',
                    size: d.file_size ? `${(d.file_size / 1024).toFixed(1)} KB` : '—',
                    fileSizeBytes: d.file_size || 0,
                    category: d.document_type || d.category || 'Contract',
                    uploader: d.uploaded_by_name || d.uploader || 'Admin',
                    date: d.created_at ? new Date(d.created_at).toLocaleDateString('en-AU') : '—',
                    createdAt: d.created_at || null,
                    caseNumber: d.case_number || null,
                    starred: false,
                    url: d.file_url || null,
                    status: d.status || 'Available',
                }))
                if (mapped.length) setDocuments(mapped)
            })
            .catch(() => {})
    }, [])
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('All Categories')
    const [typeFilter, setTypeFilter] = useState('All Types')
    const [showStarred, setShowStarred] = useState(false)
    const [viewDoc, setViewDoc] = useState(null)
    const [copiedId, setCopiedId] = useState(null)
    const [shareToast, setShareToast] = useState(null)
    const fileInputRef = useRef(null)

    const toggleStar = (id) => {
        setDocuments(documents.map(doc => doc.id === id ? { ...doc, starred: !doc.starred } : doc))
    }

    const deleteDoc = (id) => {
        if (window.confirm('Delete this document?')) {
            setDocuments(documents.filter(d => d.id !== id))
            if (viewDoc?.id === id) setViewDoc(null)
        }
    }

    const handleUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const newDoc = {
            id: Date.now(),
            name: file.name,
            type: file.name.split('.').pop().toLowerCase(),
            size: `${(file.size / 1024).toFixed(1)} KB`,
            category: 'Contract',
            uploader: 'Admin',
            date: new Date().toLocaleDateString('en-AU'),
            starred: false,
        }
        setDocuments(prev => [newDoc, ...prev])
    }

    const handleDownload = async (doc) => {
        const openUrl = (url) => {
            const a = document.createElement('a')
            a.href = url
            a.download = doc.name || 'document'
            a.rel = 'noopener noreferrer'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        }
        if (doc.url) {
            openUrl(doc.url)
            return
        }
        if (doc.id) {
            try {
                const res = await documentService.getDocumentUrl(doc.id)
                if (res.success && res.data?.download_url) {
                    openUrl(res.data.download_url)
                    return
                }
            } catch {}
        }
        await generateBrandedPDF({
            title: doc.name || 'Document',
            subtitle: doc.category || '',
            fileName: `${(doc.name || 'document').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
            infoItems: [
                { label: 'Document Name', value: doc.name || '—' },
                { label: 'Category', value: doc.category || '—' },
                { label: 'Type', value: doc.type || '—' },
                { label: 'Size', value: doc.size || '—' },
                { label: 'Uploaded', value: doc.date || '—' },
                { label: 'Status', value: doc.status || 'Available' },
            ],
        })
    }

    const handleShare = (doc) => {
        const url = `https://brickbanq.com/docs/${doc.id}`
        const copyFallback = () => {
            const ta = document.createElement('textarea')
            ta.value = url
            ta.style.position = 'fixed'
            ta.style.opacity = '0'
            document.body.appendChild(ta)
            ta.focus()
            ta.select()
            try { document.execCommand('copy') } catch (_) {}
            document.body.removeChild(ta)
        }
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url).catch(copyFallback)
        } else {
            copyFallback()
        }
        setCopiedId(doc.id)
        setShareToast('Link copied to clipboard!')
        setTimeout(() => { setCopiedId(null); setShareToast(null) }, 2500)
    }

    const getCategoryColor = (category) => {
        const colors = {
            Contract: 'bg-indigo-100 text-indigo-700',
            Valuation: 'bg-blue-100 text-blue-700',
            Inspection: 'bg-green-100 text-green-700',
            Kyc: 'bg-amber-100 text-amber-700',
            KYC: 'bg-amber-100 text-amber-700',
        }
        return colors[category] || 'bg-gray-100 text-gray-700'
    }

    const getFileIcon = (type) => {
        if (type === 'pdf') return FileText
        if (type === 'zip') return File
        return FileText
    }

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.caseNumber && doc.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (doc.uploader && doc.uploader.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesCategory = categoryFilter === 'All Categories' || doc.category === categoryFilter
        const matchesType = typeFilter === 'All Types' || doc.type?.toLowerCase() === typeFilter.toLowerCase()
        const matchesStarred = !showStarred || doc.starred
        return matchesSearch && matchesCategory && matchesType && matchesStarred
    })

    const starredCount = documents.filter(d => d.starred).length
    const thisWeekCount = documents.filter(d => {
        if (!d.createdAt) return false
        return (Date.now() - new Date(d.createdAt).getTime()) < 7 * 86400000
    }).length
    const totalBytes = documents.reduce((sum, d) => sum + (d.fileSizeBytes || 0), 0)
    const storageLabel = totalBytes >= 1_048_576
        ? `${(totalBytes / 1_048_576).toFixed(1)} MB`
        : totalBytes >= 1024
        ? `${(totalBytes / 1024).toFixed(0)} KB`
        : totalBytes > 0 ? `${totalBytes} B` : '—'

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div>
                <h1 className="text-sm font-semibold text-slate-900">Document Library</h1>
                <p className="text-[10px] text-slate-400 mt-0.5">Platform document management and compliance storage</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-3">
                <AdminStatCard label="Total Documents" value={documents.length.toString()} icon={FileText} iconBg="bg-blue-100" iconColor="text-blue-600" />
                <AdminStatCard label="Storage Used" value={storageLabel} icon={FolderOpen} iconBg="bg-green-100" iconColor="text-green-600" />
                <AdminStatCard label="Starred" value={starredCount.toString()} icon={Star} iconBg="bg-amber-100" iconColor="text-amber-600" />
                <AdminStatCard label="This Week" value={thisWeekCount.toString()} icon={Upload} iconBg="bg-indigo-100" iconColor="text-indigo-600" />
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-slate-200 rounded pl-8 pr-3 py-1.5 text-[11px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-slate-200 rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-indigo-500"
                >
                    <option>All Categories</option>
                    <option>Contract</option>
                    <option>Valuation</option>
                    <option>Inspection</option>
                    <option>KYC</option>
                </select>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="border border-slate-200 rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-indigo-500"
                >
                    <option>All Types</option>
                    <option>PDF</option>
                    <option>ZIP</option>
                    <option>DOCX</option>
                </select>
                <button
                    onClick={() => setShowStarred(!showStarred)}
                    className={`border rounded px-2.5 py-1.5 text-[11px] flex items-center gap-1 transition-colors ${showStarred ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                    <Star className="w-3.5 h-3.5 flex-shrink-0" /> Starred
                </button>
                <button
                    onClick={() => { setSearchTerm(''); setCategoryFilter('All Categories'); setTypeFilter('All Types'); setShowStarred(false) }}
                    className="border border-slate-200 rounded px-3 py-1.5 text-[11px] hover:bg-slate-50 text-slate-600 font-medium"
                >
                    Clear
                </button>
                <button
                    onClick={() => handleDownload({ name: 'All Documents' })}
                    className="border border-slate-200 rounded px-2.5 py-1.5 text-[11px] hover:bg-slate-50 flex items-center gap-1"
                >
                    <Download className="w-3.5 h-3.5 flex-shrink-0" /> Export
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                >
                    <Upload className="w-3.5 h-3.5 flex-shrink-0" /> Upload
                </button>
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-lg border border-slate-100">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-[11px] font-semibold text-slate-700">All Documents ({filteredDocuments.length})</h2>
                    <span className="text-[10px] text-slate-400">{filteredDocuments.length} of {documents.length}</span>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredDocuments.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-[11px]">No documents match your filters.</div>
                    ) : (
                        filteredDocuments.map((doc) => {
                            const Icon = getFileIcon(doc.type)
                            return (
                                <div key={doc.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {/* Icon */}
                                        <div className="w-7 h-7 rounded bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-[11px] font-medium text-slate-900 truncate">{doc.name}</h3>
                                                <div className="flex gap-1.5 flex-shrink-0">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getCategoryColor(doc.category)}`}>
                                                        {doc.category}
                                                    </span>
                                                    {doc.caseNumber && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                                            {doc.caseNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                                <button onClick={() => toggleStar(doc.id)}>
                                                    <Star className={`w-3 h-3 inline-block ${doc.starred ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                                                </button>
                                                {doc.size} · {doc.uploader} · {doc.date}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-1 flex-shrink-0 items-center">
                                            <button onClick={() => setViewDoc(doc)} title="View" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                                                <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                                            </button>
                                            <button onClick={() => handleDownload(doc)} title="Download" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                                <Download className="w-3.5 h-3.5 flex-shrink-0" />
                                            </button>
                                            <button onClick={() => handleShare(doc)} title={copiedId === doc.id ? 'Copied!' : 'Share'} className={`p-1.5 rounded transition-colors ${copiedId === doc.id ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}>
                                                <Share2 className="w-3.5 h-3.5 flex-shrink-0" />
                                            </button>
                                            <button onClick={() => deleteDoc(doc.id)} title="Delete" className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                <div className="flex items-start gap-2.5">
                    <FolderOpen className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-[11px] font-semibold text-slate-800 mb-1">Document Management</h3>
                        <p className="text-[10px] text-slate-600 mb-2">All documents are encrypted and stored securely per Australian compliance requirements.</p>
                        <ul className="text-[10px] text-slate-600 space-y-0.5">
                            <li>• Maximum file size: 50MB per document</li>
                            <li>• Supported formats: PDF, DOCX, XLSX, images (JPG, PNG)</li>
                            <li>• Version control and audit trail maintained</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* View Document Modal */}
            {viewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setViewDoc(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold text-gray-900">Document Details</h2>
                            <button onClick={() => setViewDoc(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><FileText className="w-6 h-6 text-red-600" /></div>
                                <div>
                                    <p className="font-bold text-gray-900">{viewDoc.name}</p>
                                    <p className="text-xs text-gray-500">{viewDoc.size} · {viewDoc.type?.toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <p className="text-gray-500 text-xs font-medium mb-1">Category</p>
                                    <p className="font-bold text-gray-900">{viewDoc.category}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <p className="text-gray-500 text-xs font-medium mb-1">Uploaded By</p>
                                    <p className="font-bold text-gray-900">{viewDoc.uploader}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <p className="text-gray-500 text-xs font-medium mb-1">Date</p>
                                    <p className="font-bold text-gray-900">{viewDoc.date}</p>
                                </div>
                                {viewDoc.caseNumber && (
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <p className="text-gray-500 text-xs font-medium mb-1">Case Number</p>
                                        <p className="font-bold text-gray-900">{viewDoc.caseNumber}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                            <button onClick={() => { handleDownload(viewDoc); setViewDoc(null) }} className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 flex items-center gap-1.5 transition-colors">
                                <Download size={14} /> Download
                            </button>
                            <button onClick={() => { handleShare(viewDoc); setViewDoc(null) }} className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
                                <Share2 size={14} /> Share
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share toast */}
            {shareToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" /> {shareToast}
                </div>
            )}
        </div>
    )
}
