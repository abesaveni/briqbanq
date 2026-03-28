import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import StatusPill from './components/StatusPill'
import GlobalDatePicker from '../../components/common/GlobalDatePicker'
import { contractService } from '../../api/dataService'

const formatNum = (n) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

const STATUS_OPTIONS = ['Draft', 'Under Contract', 'Pending', 'Completed', 'Cancelled']

function generateContractId() {
  const n = Math.floor(Math.random() * 900) + 100
  return `MIP-2026-${String(n).padStart(3, '0')}`
}

export default function Contracts() {
  const [contracts, setContracts] = useState([])

  useEffect(() => {
    contractService.getContracts()
      .then((res) => setContracts(res.data || res || []))
      .catch(() => {})
  }, [])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [viewingContract, setViewingContract] = useState(null)
  const [formData, setFormData] = useState({
    propertyAddress: '',
    propertySuburb: '',
    party: '',
    lender: '',
    contractValue: '',
    status: 'Draft',
    date: new Date().toISOString().split('T')[0],
  })
  const [, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [errors, setErrors] = useState({})

  const handleCreateNew = () => {
    setFormData({
      propertyAddress: '',
      propertySuburb: '',
      party: '',
      lender: '',
      contractValue: '',
      status: 'Draft',
      date: new Date().toISOString().split('T')[0],
    })
    setPhotos([])
    setPhotoPreviews([])
    setErrors({})
    setShowCreateForm(true)
  }

  const handleCloseForm = () => {
    photoPreviews.forEach((p) => { if (p?.url) URL.revokeObjectURL(p.url) })
    setPhotoPreviews([])
    setPhotos([])
    setShowCreateForm(false)
    setErrors({})
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || [])
    setPhotos((prev) => [...prev, ...files])
    const newPreviews = files.map((file) => ({ url: URL.createObjectURL(file), name: file.name }))
    setPhotoPreviews((prev) => [...prev, ...newPreviews])
    e.target.value = ''
  }

  const removePhoto = (index) => () => {
    setPhotoPreviews((prev) => {
      const next = prev.filter((_, i) => i !== index)
      const removed = prev[index]
      if (removed?.url) URL.revokeObjectURL(removed.url)
      return next
    })
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const next = {}
    if (!formData.propertyAddress?.trim()) next.propertyAddress = 'Property address is required'
    if (!formData.party?.trim()) next.party = 'Party is required'
    if (!formData.contractValue?.trim()) next.contractValue = 'Contract value is required'
    else if (Number(formData.contractValue) <= 0 || isNaN(Number(formData.contractValue))) next.contractValue = 'Enter a valid amount'
    if (!formData.date?.trim()) next.date = 'Date is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const value = Math.round(Number(formData.contractValue))
    const newContract = {
      id: generateContractId(),
      property: formData.propertyAddress.trim(),
      suburb: (formData.propertySuburb || '').trim() || '—',
      party: formData.party.trim(),
      lender: (formData.lender || '').trim() || '—',
      value,
      created: new Date(formData.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: formData.status,
    }
    setContracts((prev) => [newContract, ...prev])
    handleCloseForm()
  }

  const handleView = (c) => () => setViewingContract(c)
  const handleCloseView = () => setViewingContract(null)

  const handleDownload = (c) => () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Contract Details', 14, 20)
    doc.setFontSize(11)
    let y = 36
    const lineHeight = 8
    doc.text(`Contract ID: ${c.id}`, 14, y); y += lineHeight
    doc.text(`Property: ${c.property}`, 14, y); y += lineHeight
    doc.text(`Location: ${c.suburb}`, 14, y); y += lineHeight
    doc.text(`Party: ${c.party}`, 14, y); y += lineHeight
    doc.text(`Lender: ${c.lender}`, 14, y); y += lineHeight
    doc.text(`Contract Value: ${formatNum(c.value)}`, 14, y); y += lineHeight
    doc.text(`Created Date: ${c.created}`, 14, y); y += lineHeight
    doc.text(`Status: ${c.status}`, 14, y)
    doc.save(`Contract-${c.id}.pdf`)
  }

  const totalContracts = contracts.length
  const underContract = contracts.filter((c) => c.status === 'Under Contract').length
  const completed = contracts.filter((c) => c.status === 'Completed').length
  const pending = contracts.filter((c) => c.status === 'Pending' || c.status === 'Draft').length

  const propertyColors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-sky-500',
    'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  ]
  const getPropertyColor = (id) => propertyColors[id.charCodeAt(id.length - 1) % propertyColors.length]

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your property contracts</p>
        </div>
        <button
          type="button"
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Contract
        </button>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalContracts}</p>
            <p className="text-xs text-gray-500 font-medium">Total Contracts</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">{underContract}</p>
            <p className="text-xs text-gray-500 font-medium">Under Contract</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{completed}</p>
            <p className="text-xs text-gray-500 font-medium">Completed</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
            <p className="text-xs text-gray-500 font-medium">Pending / Draft</p>
          </div>
        </div>
      </div>

      {/* Contracts table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50/60">
          <h2 className="text-sm font-semibold text-gray-900">All Contracts <span className="ml-1.5 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">{totalContracts}</span></h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Property</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Contract ID</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Parties</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Contract Value</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Created Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">No contracts yet</p>
                      <button type="button" onClick={handleCreateNew} className="mt-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium">Create your first contract</button>
                    </div>
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${getPropertyColor(c.id)} flex items-center justify-center shrink-0`}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.property}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{c.suburb}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{c.id}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{c.party}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.lender}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-900">{formatNum(c.value)}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.created}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={handleView(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white text-gray-700 text-xs font-medium rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                          title="View contract"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <button
                          type="button"
                          onClick={handleDownload(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white text-gray-700 text-xs font-medium rounded-lg hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                          title="Download PDF"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Contract Modal */}
      {viewingContract && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onClick={handleCloseView}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Coloured header banner */}
            <div className={`${getPropertyColor(viewingContract.id)} px-6 py-5 flex items-start justify-between gap-3`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Contract Details</h2>
                  <p className="text-white/70 text-sm font-mono">{viewingContract.id}</p>
                </div>
              </div>
              <button type="button" onClick={handleCloseView} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">
              <dl className="space-y-4">
                <div className="flex items-start gap-3 py-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Property</dt>
                    <dd className="text-sm font-semibold text-gray-900 mt-0.5">{viewingContract.property}</dd>
                    <dd className="text-xs text-gray-500">{viewingContract.suburb}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Parties</dt>
                    <dd className="text-sm font-semibold text-gray-900 mt-0.5">{viewingContract.party}</dd>
                    <dd className="text-xs text-gray-500">{viewingContract.lender}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contract Value</dt>
                    <dd className="text-lg font-bold text-emerald-600 mt-0.5">{formatNum(viewingContract.value)}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Created Date</dt>
                    <dd className="text-sm font-semibold text-gray-900 mt-0.5">{viewingContract.created}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Status</dt>
                    <dd><StatusPill status={viewingContract.status} /></dd>
                  </div>
                </div>
              </dl>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button type="button" onClick={handleCloseView} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Close</button>
              <button
                type="button"
                onClick={() => { handleDownload(viewingContract)(); handleCloseView() }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Create Contract Form */}
      {showCreateForm && (
        <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col">
          {/* Indigo header bar */}
          <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Create New Contract</h2>
                <p className="text-indigo-200 text-xs">Fill in the details below</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseForm}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form id="create-contract-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Property Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.propertyAddress}
                    onChange={(e) => setFormData((f) => ({ ...f, propertyAddress: e.target.value }))}
                    placeholder="e.g. 45 Victoria Street"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.propertyAddress ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.propertyAddress && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.propertyAddress}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Suburb / Location</label>
                  <input
                    type="text"
                    value={formData.propertySuburb}
                    onChange={(e) => setFormData((f) => ({ ...f, propertySuburb: e.target.value }))}
                    placeholder="e.g. Potts Point, NSW"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Property Photos</label>
                  <div className="border-2 border-dashed border-indigo-200 rounded-lg p-5 text-center bg-indigo-50/40 hover:bg-indigo-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="contract-photos"
                    />
                    <label htmlFor="contract-photos" className="cursor-pointer block">
                      <svg className="w-8 h-8 text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-indigo-600 text-sm font-medium">Click to upload</span>
                      <span className="text-gray-500 text-sm"> or drag and drop</span>
                      <span className="text-gray-400 text-xs block mt-0.5">JPG, PNG (max 10MB each)</span>
                    </label>
                  </div>
                  {photoPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {photoPreviews.map((p, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-indigo-200 shadow-sm">
                          <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                          <button type="button" onClick={removePhoto(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow" aria-label="Remove">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Contract Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Party (Buyer / Name) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.party}
                      onChange={(e) => setFormData((f) => ({ ...f, party: e.target.value }))}
                      placeholder="e.g. Emma Rodriguez"
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.party ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                    {errors.party && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.party}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Lender</label>
                    <input
                      type="text"
                      value={formData.lender}
                      onChange={(e) => setFormData((f) => ({ ...f, lender: e.target.value }))}
                      placeholder="e.g. ANZ"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contract Value (A$) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">A$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.contractValue}
                      onChange={(e) => setFormData((f) => ({ ...f, contractValue: e.target.value }))}
                      placeholder="1750000"
                      className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.contractValue ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                  </div>
                  {errors.contractValue && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.contractValue}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Date <span className="text-red-500">*</span></label>
                    <GlobalDatePicker
                      value={formData.date}
                      onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
                    />
                    {errors.date && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.date}</p>}
                  </div>
                </div>
              </div>
            </div>
          </form>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0 bg-white shadow-sm">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-contract-form"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium text-white shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Create Contract
            </button>
          </div>
        </div>
      )}
    </div>
  )
}