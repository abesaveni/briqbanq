/**
 * DocumentUpload — Reusable PDF-only document upload component.
 *
 * Props:
 *   onSuccess(fileName)  — called after a successful upload
 *   onClose()            — called when the modal is dismissed
 *   documentLabel        — label shown above the uploader (e.g. "Settlement Statement")
 *   caseId               — (optional) forwarded to the API if provided
 */

import { useRef, useState } from 'react'
import axios from 'axios'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPE = 'application/pdf'
const UPLOAD_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') +
  '/api/v1/documents/simple-upload'

export default function DocumentUpload({ onSuccess, onClose, documentLabel = 'Document', caseId }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(f) {
    if (!f) return 'No file selected.'
    if (f.type !== ALLOWED_TYPE) return 'Only PDF files are allowed.'
    if (f.size > MAX_SIZE_BYTES) return 'File size must be below 5 MB.'
    return ''
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0] ?? null
    setSuccess('')
    const msg = validate(f)
    setError(msg)
    setFile(msg ? null : f)
    // reset so the same file can be re-selected after fixing an error
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0] ?? null
    setSuccess('')
    const msg = validate(f)
    setError(msg)
    setFile(msg ? null : f)
  }

  // ── Upload ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!file) return
    const msg = validate(file)
    if (msg) { setError(msg); return }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    if (caseId) formData.append('case_id', caseId)

    try {
      const token = localStorage.getItem('authToken')
      const res = await axios.post(UPLOAD_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const fileName = res.data?.file_name ?? file.name
      setSuccess(`"${fileName}" uploaded successfully!`)
      setFile(null)
      onSuccess?.(fileName)
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Upload failed. Please try again.'
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setLoading(false)
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const fileSizeLabel = file ? `${(file.size / 1024).toFixed(1)} KB` : ''

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-upload-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      {/* ── Card ── */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 id="doc-upload-title" className="text-base font-bold text-gray-900">Upload Document</h2>
              <p className="text-xs text-gray-500">{documentLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Helper text */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
            <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-700">
              Please upload a <strong>PDF document</strong>. Maximum file size allowed is <strong>5 MB</strong>.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors select-none
              ${file ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40'}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-indigo-700 text-center break-all">{file.name}</p>
                <p className="text-xs text-gray-500">{fileSizeLabel} · PDF</p>
                <p className="text-xs text-indigo-500 mt-1">Click to change file</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Click to select or drag &amp; drop</p>
                <p className="text-xs text-gray-500">PDF files only · Max 5 MB</p>
              </>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
              <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-emerald-700 font-medium">{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!file || loading}
            onClick={handleSubmit}
            className={`flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${!file || loading
                ? 'bg-indigo-200 text-white cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]'}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading…
              </>
            ) : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
