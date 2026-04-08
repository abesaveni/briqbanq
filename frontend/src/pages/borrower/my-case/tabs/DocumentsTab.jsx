import { useState, useRef, useEffect } from 'react'
import { documentService } from '../../../../api/dataService'

const TYPE_COLORS = {
  Legal:       'bg-blue-100 text-blue-700',
  Valuation:   'bg-purple-100 text-purple-700',
  Inspection:  'bg-orange-100 text-orange-700',
  Financial:   'bg-green-100 text-green-700',
  Insurance:   'bg-pink-100 text-pink-700',
  Rates:       'bg-yellow-100 text-yellow-700',
  Upload:      'bg-indigo-100 text-indigo-700',
}

const STATUS_COLORS = {
  Verified:       'bg-green-100 text-green-700',
  'Under Review': 'bg-amber-100 text-amber-700',
  Pending:        'bg-gray-100 text-gray-600',
}

function FileIcon({ name = '', size = 8 }) {
  const ext = name.split('.').pop()?.toLowerCase()
  const cls = `w-${size} h-${size}`
  if (ext === 'pdf') return (
    <svg className={`${cls} text-red-500`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z"/>
      <path d="M8.5 17.5h-1v-5h1.8c1.2 0 1.9.7 1.9 1.7 0 1.1-.7 1.8-1.9 1.8H8.5v1.5zm0-2.6h.8c.6 0 .9-.3.9-.8s-.3-.8-.9-.8h-.8v1.6zm5.2 2.6h-1.6v-5h1.6c1.6 0 2.6.9 2.6 2.5s-1 2.5-2.6 2.5zm-.6-1h.5c1 0 1.6-.5 1.6-1.5S14.6 14 13.6 14h-.5v3zm4.6 1h-1v-5h3v1h-2v1.2h1.8v1H15.7v1.8z"/>
    </svg>
  )
  if (ext === 'doc' || ext === 'docx') return (
    <svg className={`${cls} text-blue-500`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z"/>
      <path d="M9 17H7v-5h2c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2zm-1-1h1c.6 0 1-.4 1-1v-1c0-.6-.4-1-1-1H8v3zm4.5 1l-1.5-5h1.1l1 3.5 1-3.5H16l-1.5 5h-1z"/>
    </svg>
  )
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return (
    <svg className={`${cls} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  )
  return (
    <svg className={`${cls} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  )
}

function getExt(name = '') {
  return name.split('.').pop()?.toLowerCase() || ''
}

function isImage(name) {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(getExt(name))
}

function isPdf(name) {
  return getExt(name) === 'pdf'
}

/* ---------- View modal ---------- */
function DocViewModal({ doc, onClose }) {
  const [objectUrl, setObjectUrl] = useState(null)

  useEffect(() => {
    if (doc?._localFile) {
      const url = URL.createObjectURL(doc._localFile)
      setObjectUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [doc])

  if (!doc) return null

  const hasRealFile = !!doc._localFile || !!doc.file
  const fileUrl = doc._localFile ? objectUrl : doc.file
  const extName = doc._fileName || doc.name
  const ext = getExt(extName)

  const handleDownload = () => {
    const url = doc._localFile ? objectUrl : doc.file
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      a.click()
    }
  }

  const handleOpenNewTab = () => {
    if (fileUrl) window.open(fileUrl, '_blank')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
        style={{ maxWidth: hasRealFile && (isPdf(extName) || isImage(extName)) ? 860 : 520, maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 bg-gray-900 flex-shrink-0">
          <FileIcon name={extName} size={5} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{doc.name}</p>
            <p className="text-xs text-gray-400">{doc.size || '—'} · {doc.date}</p>
          </div>
          <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[doc.status] || STATUS_COLORS.Pending}`}>
            {doc.status || 'Pending'}
          </span>
          {hasRealFile && (isPdf(extName) || isImage(extName)) && (
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="flex-shrink-0 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              Open
            </button>
          )}
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Document preview area */}
        <div className="flex-1 overflow-auto bg-gray-100 min-h-0">
          {hasRealFile && isPdf(extName) && fileUrl && (
            <iframe
              src={fileUrl}
              title={doc.name}
              className="w-full h-full border-0"
              style={{ minHeight: 520 }}
            />
          )}
          {hasRealFile && isImage(extName) && fileUrl && (
            <div className="flex items-center justify-center p-6 min-h-[400px]">
              <img
                src={fileUrl}
                alt={doc.name}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
          {hasRealFile && !isPdf(extName) && !isImage(extName) && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center min-h-[300px]">
              <FileIcon name={extName} size={16} />
              <p className="mt-4 text-sm font-semibold text-gray-700">{doc.name}</p>
              <p className="text-xs text-gray-400 mt-1 mb-6">Preview not available for .{ext} files</p>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download to view
              </button>
            </div>
          )}

          {/* Mock / pre-existing document: simulated paper preview */}
          {!hasRealFile && (
            <div className="p-8">
              <div className="bg-white rounded-xl shadow-md overflow-hidden mx-auto" style={{ maxWidth: 560 }}>
                {/* Letterhead */}
                <div className="bg-blue-800 px-8 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                    <span className="text-sm font-bold text-white tracking-wide">BriqBanq</span>
                  </div>
                  <span className="text-xs text-blue-200 font-medium">CONFIDENTIAL</span>
                </div>
                {/* Document body */}
                <div className="px-8 py-6 space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Document</p>
                    <p className="text-base font-bold text-gray-900">{doc.name.replace(/\.[^.]+$/, '')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      ['Uploaded by', doc.uploadedBy || '—'],
                      ['Date', doc.date || '—'],
                      ['Type', doc.type || '—'],
                      ['Status', doc.status || '—'],
                    ].map(([lbl, val]) => (
                      <div key={lbl}>
                        <p className="text-xs text-gray-400">{lbl}</p>
                        <p className="font-medium text-gray-800">{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 space-y-2">
                    {[88, 72, 95, 60, 82, 55, 78].map((w, i) => (
                      <div key={i} className="h-2.5 bg-gray-100 rounded-full" style={{ width: `${w}%` }}/>
                    ))}
                  </div>
                  <div className="pt-4 space-y-3">
                    {['Section 1 — Overview', 'Section 2 — Key Terms', 'Section 3 — Obligations'].map((s, i) => (
                      <div key={i}>
                        <p className="text-xs font-bold text-gray-700 mb-1">{s}</p>
                        <div className="space-y-1.5">
                          {[65, 90, 75].map((w, j) => (
                            <div key={j} className="h-2 bg-gray-100 rounded-full" style={{ width: `${w}%` }}/>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Signature block */}
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-8">
                  <div>
                    <div className="border-b border-gray-400 h-8 mb-1"/>
                    <p className="text-xs text-gray-500">Authorised Signatory</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 h-8 mb-1"/>
                    <p className="text-xs text-gray-500">Borrower</p>
                  </div>
                </div>
                <div className="px-8 py-2 border-t border-gray-100 flex justify-between">
                  <span className="text-xs text-gray-400">BriqBanq Pty Ltd — ABN 12 345 678 901</span>
                  <span className="text-xs text-gray-400">Page 1</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex gap-2 flex-wrap text-xs text-gray-500">
            <span className={`px-2.5 py-1 rounded-full font-semibold ${TYPE_COLORS[doc.type] || TYPE_COLORS.Upload}`}>{doc.type || 'Upload'}</span>
            <span>Uploaded by {doc.uploadedBy || '—'}</span>
            <span>·</span>
            <span>{doc.date}</span>
          </div>
          <div className="flex gap-2 ml-auto">
            {hasRealFile && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Main component ---------- */
export default function DocumentsTab({ caseId, onDocumentUploaded }) {
  const [docs, setDocs] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [viewDoc, setViewDoc] = useState(null)
  const [filter, setFilter] = useState('All')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!caseId) return
    setLoadingDocs(true)
    documentService.getDocuments(caseId).then(res => {
      if (res.success) {
        const items = Array.isArray(res.data) ? res.data : (res.data?.items || [])
          setDocs(items.map(d => ({
            id: d.id,
            name: d.document_name || d.file_name || d.name || 'Document',
            _fileName: d.file_name || d.document_name || d.name || '',
            type: d.document_type || d.type || 'Upload',
            uploadedBy: d.uploaded_by_name || d.uploader_name || 'Borrower',
            date: d.created_at
              ? new Date(d.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—',
            size: d.file_size
              ? d.file_size > 1_048_576
                ? `${(d.file_size / 1_048_576).toFixed(1)} MB`
                : `${Math.round(d.file_size / 1024)} KB`
              : '—',
            status: d.status || 'Pending',
            file: d.file_url || null,
          })))
      }
    }).catch(() => {}).finally(() => setLoadingDocs(false))
  }, [caseId])

  const allTypes = ['All', ...Array.from(new Set(docs.map(d => d.type || 'Upload')))]
  const filtered = filter === 'All' ? docs : docs.filter(d => (d.type || 'Upload') === filter)

  const addFiles = async (files) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const uploaded = []
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('case_id', caseId)
      formData.append('document_name', file.name.replace(/\.[^.]+$/, ''))
      formData.append('document_type', 'Upload')
      formData.append('file', file)
      const res = await documentService.uploadDocument(caseId, formData)
      uploaded.push({
        id: res.success ? res.data?.id : `up-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        type: 'Upload',
        uploadedBy: 'You',
        date: new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
        size: file.size > 1_048_576
          ? `${(file.size / 1_048_576).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`,
        status: 'Pending',
        _localFile: file,
      })
    }
    setDocs(prev => [...prev, ...uploaded])
    setUploading(false)
    if (onDocumentUploaded) onDocumentUploaded()
  }

  const handleDownload = async (doc) => {
    if (doc._localFile) {
      const url = URL.createObjectURL(doc._localFile)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } else if (doc.id && !doc.id.startsWith('up-')) {
      // Backend document — fetch signed/local URL then download
      const res = await documentService.getDocumentUrl(doc.id).catch(() => null)
      const downloadUrl = res?.success ? res.data?.download_url : null
      if (downloadUrl) {
        const fullUrl = downloadUrl
        const a = document.createElement('a')
        a.href = fullUrl
        a.download = doc.name
        a.target = '_blank'
        a.click()
      }
    }
  }

  const handleDelete = (id) => {
    setDocs(prev => prev.filter(d => d.id !== id))
    if (viewDoc?.id === id) setViewDoc(null)
  }

  if (loadingDocs) return (
    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
      <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Loading documents…
    </div>
  )

  return (
    <div className="space-y-6">
      {viewDoc && <DocViewModal doc={viewDoc} onClose={() => setViewDoc(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Case Documents</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {docs.length} document{docs.length !== 1 ? 's' : ''} attached to this case
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Upload Document
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={e => { addFiles(e.target.files); e.target.value = '' }}
      />

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer select-none ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'
        }`}
        onDrop={e => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files) }}
        onDragOver={e => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${dragActive ? 'bg-blue-100' : 'bg-white border-2 border-gray-200'}`}>
            {uploading ? (
              <svg className="w-7 h-7 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <svg className={`w-7 h-7 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            )}
          </div>
          {uploading ? (
            <p className="text-sm font-medium text-blue-600">Uploading…</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                {dragActive ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
              </p>
              <p className="text-xs text-gray-400">PDF, DOC, DOCX, JPG, PNG — up to 10 MB each</p>
            </>
          )}
        </div>
      </div>

      {/* Filter pills */}
      {allTypes.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {allTypes.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                filter === t
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 bg-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Document table */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <p className="text-sm">No documents yet. Upload your first document above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Document</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Uploaded By</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0"><FileIcon name={doc._fileName || doc.name} size={8} /></div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.size || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[doc.type] || TYPE_COLORS.Upload}`}>
                      {doc.type || 'Upload'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{doc.uploadedBy || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">{doc.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[doc.status] || STATUS_COLORS.Pending}`}>
                      {doc.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* View — always available */}
                      <button
                        type="button"
                        onClick={() => setViewDoc(doc)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                      {/* Download — for uploaded files and backend documents */}
                      {(doc._localFile || (doc.id && !doc.id.startsWith('up-'))) && (
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                          </svg>
                        </button>
                      )}
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
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
  )
}
