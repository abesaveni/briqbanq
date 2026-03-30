// src/pages/admin/case-details/Documents.jsx
import { useState, useRef } from 'react'
import { useCaseContext } from '../../../context/CaseContext'
import { Upload, FileText, Eye, Download, Search, Loader2 } from 'lucide-react'
import { documentService } from '../../../api/dataService'

export default function Documents() {
    const { caseData, updateCase } = useCaseContext()
    const [search, setSearch] = useState('')
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const filtered = (caseData.documents || []).filter(doc =>
        !search ||
        (doc.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (doc.type || '').toLowerCase().includes(search.toLowerCase())
    )

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length || !caseData?._id) return
        setUploading(true)
        const added = []
        for (const file of files) {
            const formData = new FormData()
            formData.append('case_id', caseData._id)
            formData.append('document_name', file.name.replace(/\.[^.]+$/, ''))
            formData.append('document_type', 'Upload')
            formData.append('file', file)
            const res = await documentService.uploadDocument(caseData._id, formData)
            added.push({
                id: res.success ? res.data?.id : `up-${Date.now()}`,
                name: file.name,
                type: 'Upload',
                uploadedBy: 'Admin',
                file: res.data?.file_url || null,
                date: new Date().toLocaleDateString('en-AU'),
            })
        }
        updateCase({ documents: [...(caseData.documents || []), ...added] })
        setUploading(false)
        e.target.value = ''
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
                    <p className="text-sm text-gray-500 mt-0.5">All case-related documents and files</p>
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Upload File'}
                    <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="sr-only" onChange={handleUpload} />
                </label>
            </div>

            {/* Upload Zone */}
            <label className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50 hover:bg-white hover:border-indigo-300 transition-all cursor-pointer block">
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3">
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
                    <span className="text-xs text-gray-400">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {filtered.length === 0 ? (
                    <div className="py-16 text-center">
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
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => doc.file && window.open(doc.file, '_blank')}
                                                className={`p-1.5 rounded-lg transition-colors ${doc.file ? 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50' : 'text-gray-200 cursor-not-allowed'}`} 
                                                title="View"
                                                disabled={!doc.file}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <a 
                                                href={doc.file || '#'} 
                                                download 
                                                className={`p-1.5 rounded-lg transition-colors ${doc.file ? 'text-gray-400 hover:text-green-600 hover:bg-green-50' : 'text-gray-200 cursor-not-allowed pointer-events-none'}`} 
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
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
