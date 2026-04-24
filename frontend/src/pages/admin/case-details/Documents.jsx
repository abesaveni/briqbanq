// src/pages/admin/case-details/Documents.jsx
import { useState, useRef } from 'react'
import { useCaseContext } from '../../../context/CaseContext'
import { Upload, FileText, Eye, Download, Search, Loader2, Trash2, AlertCircle } from 'lucide-react'
import { documentService } from '../../../api/dataService'

const mapDoc = d => ({
    id: d.id,
    name: d.document_name || d.file_name || d.filename || d.name || 'Document',
    type: d.document_type || d.type || 'Document',
    uploadedBy: d.uploaded_by_name || d.uploader_name || 'Admin',
    date: d.created_at ? new Date(d.created_at).toLocaleDateString('en-AU') : new Date().toLocaleDateString('en-AU'),
    file: d.file_url || null,
    status: d.status || 'UPLOADED',
})

export default function Documents() {
    const { caseData, updateCase } = useCaseContext()
    const [search, setSearch] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [deletingId, setDeletingId] = useState(null)
    const fileInputRef = useRef(null)

    const allDocs = caseData.documents || []

    const filtered = allDocs.filter(doc =>
        !search ||
        (doc.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (doc.type || '').toLowerCase().includes(search.toLowerCase())
    )

    const handleDelete = async (doc) => {
        const key = String(doc.id || doc.name)
        const snapshot = allDocs
        updateCase({ documents: allDocs.filter(d => String(d.id || d.name) !== key) })
        setDeletingId(key)
        try {
            await documentService.deleteDocument(doc.id)
            // Re-fetch after delete so state matches backend
            const docsRes = await documentService.getDocuments(caseData._id)
            if (docsRes.success) {
                const raw = Array.isArray(docsRes.data) ? docsRes.data : (docsRes.data?.items || [])
                updateCase({ documents: raw.map(mapDoc) })
            }
        } catch {
            updateCase({ documents: snapshot })
        }
        setDeletingId(null)
    }

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length || !caseData?._id) return
        setUploading(true)
        setUploadError('')
        let anyFailed = false
        for (const file of files) {
            const formData = new FormData()
            formData.append('case_id', caseData._id)
            formData.append('document_name', file.name.replace(/\.[^.]+$/, ''))
            formData.append('document_type', 'Upload')
            formData.append('file', file)
            const res = await documentService.uploadDocument(caseData._id, formData)
            if (!res.success) anyFailed = true
        }
        // Re-fetch from backend so persisted docs are always shown (cache was cleared by upload)
        const docsRes = await documentService.getDocuments(caseData._id)
        if (docsRes.success) {
            const raw = Array.isArray(docsRes.data) ? docsRes.data : (docsRes.data?.items || [])
            updateCase({ documents: raw.map(mapDoc) })
        }
        if (anyFailed) setUploadError('One or more files failed to upload. Check the file type or size.')
        setUploading(false)
        e.target.value = ''
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">Documents</h2>
                    <p className="text-xs text-gray-500 mt-0.5">All case-related documents and files</p>
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Upload File'}
                    <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="sr-only" onChange={handleUpload} />
                </label>
            </div>

            {uploadError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {uploadError}
                </div>
            )}

            {/* Upload Zone */}
            <label className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center bg-gray-50 hover:bg-white hover:border-indigo-300 transition-all cursor-pointer block">
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center mx-auto mb-2">
                    {uploading ? <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /> : <Upload className="w-5 h-5 text-gray-400" />}
                </div>
                <p className="text-sm font-medium text-gray-900">{uploading ? 'Uploading...' : 'Drag and drop files here'}</p>
                <p className="text-xs text-gray-400 mt-1">or <span className="text-indigo-600 font-medium">browse to upload</span> · PDF, DOC, PNG supported</p>
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="sr-only" onChange={handleUpload} />
            </label>

            {/* Documents Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search documents..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
                </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="py-10 text-center">
                        <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-400">
                            {caseData.documents.length === 0 ? 'No documents uploaded yet' : 'No documents match your search'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((doc, idx) => (
                                <tr key={doc.id || idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                            {doc.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{doc.uploadedBy}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{doc.date}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => doc.file && window.open(doc.file, '_blank')}
                                                className={`p-1.5 rounded-lg transition-colors ${doc.file ? 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50' : 'text-gray-200 cursor-not-allowed'}`}
                                                title="View"
                                                disabled={!doc.file}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {doc.file ? (
                                                <a
                                                    href={doc.file}
                                                    download
                                                    className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-green-600 hover:bg-green-50"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            ) : (
                                                <span className="p-1.5 rounded-lg text-gray-200 cursor-not-allowed" title="File not available">
                                                    <Download className="w-4 h-4" />
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleDelete(doc)}
                                                disabled={deletingId === String(doc.id || doc.name)}
                                                className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Delete"
                                            >
                                                {deletingId === String(doc.id || doc.name)
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Trash2 className="w-4 h-4" />
                                                }
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
        </div>
    )
}
