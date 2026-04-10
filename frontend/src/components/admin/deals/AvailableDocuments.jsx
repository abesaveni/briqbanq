import { FileText, Eye, Download, FolderOpen } from 'lucide-react'
import { generateBrandedPDF } from '../../../utils/pdfGenerator'

export default function AvailableDocuments({ documents }) {
    const docs = Array.isArray(documents) ? documents : []

    const getName = (doc) => doc.document_name || doc.name || 'Untitled Document'
    const getType = (doc) => doc.document_type || doc.type || doc.description || '—'
    const getUrl = (doc) => {
        const url = doc.file_url || doc.url || null
        // Only return if it looks like an actual URL (not a raw S3 key path)
        if (!url) return null
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url
        return null
    }

    const handleView = (doc) => {
        const url = getUrl(doc)
        if (url) window.open(url, '_blank')
    }

    const handleDownload = async (doc) => {
        const url = getUrl(doc)
        if (url) {
            const a = document.createElement('a')
            a.href = url
            a.download = doc.file_name || getName(doc)
            a.click()
            return
        }
        await generateBrandedPDF({
            title: getName(doc),
            subtitle: getType(doc),
            fileName: `${(getName(doc)).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
            infoItems: [
                { label: 'Document Name', value: getName(doc) },
                { label: 'Type', value: getType(doc) },
                { label: 'Date', value: doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-AU') : new Date().toLocaleDateString('en-AU') },
            ],
        })
    }

    return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 shadow-sm">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Available Documents</h3>
                    {docs.length > 0 && (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
                    )}
                </div>
            </div>

            {docs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                    <FolderOpen className="w-12 h-12 mb-3" />
                    <p className="text-sm font-bold text-gray-400">No documents available</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {docs.map((doc, idx) => (
                        <div key={doc.id || idx} className="flex items-center justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-2xl hover:border-indigo-100 hover:bg-white hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:text-indigo-600 border border-gray-100 transition-colors shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{getName(doc)}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{getType(doc)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                                <button
                                    onClick={() => handleView(doc)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 rounded-xl border border-gray-100 hover:text-gray-900 hover:shadow-sm transition-all"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                </button>
                                <button
                                    onClick={() => handleDownload(doc)}
                                    className="p-2 bg-white text-gray-400 rounded-xl border border-gray-100 hover:text-indigo-600 hover:shadow-sm transition-all"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
