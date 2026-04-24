import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from './components/Breadcrumb'
import DatePicker from '../../components/common/DatePicker'
import { kycService } from '../../api/dataService'
import { useNotifications } from '../../context/NotificationContext'

const EMPTY_FORM = { firstName: '', lastName: '', dob: '', address: '', company: '', abn: '' }

export default function IdentityVerification() {
  const navigate = useNavigate()
  const { refetch: refetchNotifications } = useNotifications()
  const [kycRecord, setKycRecord] = useState(null)   // backend KYC record
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Derive status from backend record
  const status = kycRecord?.status?.toUpperCase()
  const isApproved = status === 'APPROVED'
  const isPending = status === 'SUBMITTED' || status === 'UNDER_REVIEW'
  const isRejected = status === 'REJECTED'
  const showForm = !isPending && !isApproved

  // Fetch existing KYC record on mount
  useEffect(() => {
    kycService.getMyKYC()
      .then(res => {
        const records = Array.isArray(res.data) ? res.data : []
        const latest = records[records.length - 1] || null
        setKycRecord(latest)
        // Pre-fill form from metadata if rejected
        if (latest?.metadata_json) {
          const m = latest.metadata_json
          setForm({
            firstName: m.first_name || '',
            lastName: m.last_name || '',
            dob: m.dob || '',
            address: m.address || '',
            company: m.company || '',
            abn: m.abn || '',
          })
          if (m.original_file_name) setFileName(m.original_file_name)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (submitError) setSubmitError('')
  }, [form.firstName, form.lastName, form.dob, form.address, fileName]) // eslint-disable-line

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setFileName(f.name) }
  }

  const handleClearFile = () => {
    setFile(null)
    setFileName('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    const required = [form.firstName?.trim(), form.lastName?.trim(), form.dob?.trim(), form.address?.trim()]
    if (required.some((v) => !v)) {
      setSubmitError('Please fill in First Name, Last Name, Date of Birth, and Address.')
      return
    }
    if (!file && !fileName) {
      setSubmitError('Please upload a government ID (PDF, JPG or PNG).')
      return
    }
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('first_name', form.firstName.trim())
      formData.append('last_name', form.lastName.trim())
      formData.append('dob', form.dob.trim())
      formData.append('address', form.address.trim())
      if (form.company?.trim()) formData.append('company', form.company.trim())
      if (form.abn?.trim()) formData.append('abn', form.abn.trim())
      if (file instanceof File) formData.append('id_document', file)

      const res = await kycService.submitKYCForm(formData)
      if (res.success) {
        setKycRecord(res.data)
        setFile(null)
        setFileName('')
        setForm(EMPTY_FORM)
        // Pull fresh notifications so the "KYC Submitted" notification shows immediately
        setTimeout(refetchNotifications, 1000)
      } else {
        setSubmitError(res.error || 'Submission failed. Please try again.')
      }
    } catch (err) {
      setSubmitError(err?.message || 'Submission failed. Please try again or contact support.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitAgain = async () => {
    setKycRecord(null)
    setForm(EMPTY_FORM)
    setFileName('')
    setFile(null)
    setSubmitError('')
  }

  const handleBackToDashboard = () => navigate('/borrower/dashboard')
  const handleContactSupport = () => {
    window.location.href = 'mailto:support@brickbanq.com?subject=Identity%20Verification%20Support'
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[200px]">
        <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Complete your KYC to access the platform</p>
      </div>

      <Breadcrumb items={[
        { label: 'Dashboard', path: '/borrower/dashboard' },
        { label: 'Identity Verification' },
      ]} />

      {/* Status steps */}
      <div className="flex flex-wrap justify-center items-center gap-2 mb-8">
        {[
          { step: 1, label: 'Personal Details', sublabel: 'Fill in your info', done: isPending || isApproved },
          { step: 2, label: 'Under Review', sublabel: 'Admin reviews', done: isApproved, active: isPending },
          { step: 3, label: 'Verified', sublabel: 'Access granted', done: isApproved },
        ].map((s, i, arr) => (
          <div key={s.step} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                s.done ? 'bg-emerald-500 text-white' : s.active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s.done ? '✓' : s.step}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500">{s.sublabel}</p>
              </div>
            </div>
            {i < arr.length - 1 && <div className={`w-8 h-0.5 shrink-0 ${s.done ? 'bg-indigo-600' : 'bg-gray-200'}`} aria-hidden />}
          </div>
        ))}
      </div>

      {/* Rejected banner */}
      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-4xl mx-auto flex items-start gap-3">
          <span className="text-red-500 text-lg">✗</span>
          <div>
            <p className="text-sm font-semibold text-red-800">Verification Rejected</p>
            {kycRecord?.rejection_reason && (
              <p className="text-sm text-red-700 mt-1">Reason: {kycRecord.rejection_reason}</p>
            )}
            <p className="text-sm text-red-600 mt-1">Please correct the details below and resubmit.</p>
          </div>
        </div>
      )}

      {/* Submission form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900">Identity Verification</h2>
          <p className="text-sm text-gray-500 mt-1">Complete your KYC verification to access the platform</p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value.replace(/[^a-zA-Z\s''-]/g, '') }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value.replace(/[^a-zA-Z\s''-]/g, '') }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <DatePicker
                  value={form.dob}
                  onChange={(dateStr) => setForm((f) => ({ ...f, dob: dateStr }))}
                  placeholderText="DD/MM/YYYY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  placeholder="Street, City, State, Postcode"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ABN (Optional)</label>
                <input
                  type="text"
                  placeholder="65 XXX XXX XXX"
                  value={form.abn}
                  onChange={(e) => setForm((f) => ({ ...f, abn: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Government ID *</label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-gray-50'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) { setFile(f); setFileName(f.name) }
                }}
              >
                <span className="text-3xl text-gray-400 block mb-2">☁️</span>
                <p className="text-sm text-gray-600">Drag and drop your ID here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
                <label className="mt-2 inline-block border border-gray-300 bg-white text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                  Choose File
                  <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                </label>
                {fileName && (
                  <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center justify-center gap-2 flex-wrap">
                    <span>Selected: {fileName}</span>
                    <button type="button" onClick={handleClearFile} className="text-red-600 hover:text-red-700 text-xs font-medium underline">
                      Clear
                    </button>
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">Accepted formats: PDF, JPG, PNG (max 50MB)</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="font-semibold text-blue-800 flex items-center gap-2">ℹ Acceptable Documents</p>
                <ul className="text-sm text-blue-800 mt-1 list-disc list-inside">
                  <li>Driver&apos;s License (front and back)</li>
                  <li>Passport (photo page)</li>
                  <li>National ID Card</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">Ensure all text is clearly visible and the document is uncropped.</p>
              </div>
            </div>
          </form>

          {submitError && <p className="text-sm text-red-600 mt-2">{submitError}</p>}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              aria-label="Submit identity verification for admin review"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting…
                </>
              ) : (
                isRejected ? 'Resubmit for Review' : 'Submit for Review'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pending review state */}
      {isPending && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" aria-hidden />
            Verification is pending
          </div>
          <p className="text-lg font-semibold text-gray-900">Under Review</p>
          <p className="text-sm text-gray-600">
            Your identity verification has been submitted. An admin will review your documents and approve your verification. This status will remain until approval is complete.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={handleBackToDashboard} className="border border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50">
              Back to Dashboard
            </button>
            <button type="button" onClick={handleSubmitAgain} className="border border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50">
              Submit again
            </button>
            <button type="button" onClick={handleContactSupport} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
              Contact Support
            </button>
          </div>
        </div>
      )}

      {/* Approved state */}
      {isApproved && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold">
            <span className="text-emerald-600">✓</span> Verified
          </div>
          <p className="text-lg font-semibold text-gray-900">Identity Verified</p>
          <p className="text-sm text-gray-600">Your identity has been approved. You have full access to the platform.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={handleBackToDashboard} className="border border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50">
              Back to Dashboard
            </button>
            <button type="button" onClick={handleContactSupport} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
              Contact Support
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
