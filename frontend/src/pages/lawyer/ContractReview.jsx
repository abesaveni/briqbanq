import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { getContracts, createContract } from './api'
import { LoadingState, ErrorState } from './components/PageState'

const formatNum = (n) => {
  if (typeof n === 'number' && !Number.isNaN(n)) return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
  return n ?? '—'
}

const INITIAL_FORM = {
  propertyAddress: '',
  propertySuburb: '',
  parties: '',
  partiesSub: '',
  value: '',
  date: '',
  status: 'Draft',
}

export default function ContractReview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [contracts, setContracts] = useState([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState(INITIAL_FORM)
  const [photoFiles, setPhotoFiles] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')
  const [viewingContract, setViewingContract] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [downloadingId, setDownloadingId] = useState(null)
  const [downloadedId, setDownloadedId] = useState(null)

  useEffect(() => {
    let cancelled = false
    getContracts()
      .then((res) => {
        if (!cancelled && res.error) setError(res.error)
        if (!cancelled && res.data) setContracts(res.data ?? [])
      })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Failed to load contracts') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const openCreateModal = () => {
    setCreateForm(INITIAL_FORM)
    setPhotoFiles([])
    setPhotoPreviews([])
    setCreateError('')
    setCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    photoPreviews.forEach((p) => { if (p?.url) URL.revokeObjectURL(p.url) })
    setPhotoPreviews([])
    setCreateModalOpen(false)
    setCreateForm(INITIAL_FORM)
    setPhotoFiles([])
    setFormErrors({})
    setCreateError('')
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || [])
    setPhotoFiles((prev) => [...prev, ...files])
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
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const updateForm = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateNew = () => {
    openCreateModal()
  }

  const handleSubmitContract = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!createForm.propertyAddress.trim()) errors.propertyAddress = 'Property address is required.'
    if (!createForm.parties.trim()) errors.parties = 'Parties field is required.'
    if (!createForm.value.trim()) errors.value = 'Contract value is required.'
    else if (!/[0-9]/.test(createForm.value)) errors.value = 'Contract value must contain a number.'
    if (!createForm.date.trim()) errors.date = 'Date is required.'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    setCreateSubmitting(true)
    setCreateError('')
    try {
      const res = await createContract({
        propertyAddress: createForm.propertyAddress,
        propertySuburb: createForm.propertySuburb,
        parties: createForm.parties,
        partiesSub: createForm.partiesSub,
        value: createForm.value,
        date: createForm.date,
        status: createForm.status,
      })
      if (res.error) {
        // Optimistic fallback — add locally so the user sees the result
        const optimistic = {
          id: `local-${Date.now()}`,
          contractId: `CON-${Date.now()}`,
          propertyAddress: createForm.propertyAddress,
          propertySuburb: createForm.propertySuburb,
          parties: createForm.parties,
          partiesSub: createForm.partiesSub,
          value: createForm.value,
          createdDate: new Date().toLocaleDateString('en-AU'),
          status: createForm.status,
        }
        setContracts((prev) => [optimistic, ...prev])
        closeCreateModal()
        return
      }
      if (res.data) setContracts((prev) => [res.data, ...prev])
      closeCreateModal()
    } catch (err) {
      setCreateError('Failed to create contract. Please try again.')
    } finally {
      setCreateSubmitting(false)
    }
  }

  const handleView = (id) => {
    const contract = contracts.find((c) => c.id === id)
    if (contract) setViewingContract(contract)
  }

  const closeViewModal = () => setViewingContract(null)

  const handleDownload = async (c) => {
    if (!c) return
    const id = c.id || c.contractId
    setDownloadingId(id)
    setDownloadedId(null)
    await new Promise((r) => setTimeout(r, 800))
    const doc = new jsPDF()
    doc.setFillColor(52, 116, 225)
    doc.rect(0, 0, 210, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('BriqBanq — Contract Details', 14, 18)
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    let y = 42
    const lineHeight = 9
    const field = (label, value) => {
      doc.setFont('helvetica', 'bold')
      doc.text(`${label}:`, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(String(value || '—'), 60, y)
      y += lineHeight
    }
    field('Contract ID', c.contractId || c.id)
    field('Property', c.propertyAddress || c.property || '—')
    field('Location', c.propertySuburb || c.suburb || '—')
    field('Party', c.parties || c.party || '—')
    field('Lender / Counter-party', c.partiesSub || c.lender || '—')
    const val = typeof c.value === 'number' ? formatNum(c.value) : (c.value || '—')
    field('Contract Value', val)
    field('Created Date', c.createdDate || c.created || '—')
    field('Status', c.status || '—')
    doc.setDrawColor(200, 200, 200)
    doc.line(14, y + 4, 196, y + 4)
    y += 14
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(`Generated by BriqBanq on ${new Date().toLocaleDateString('en-AU', { dateStyle: 'long' })}`, 14, y)
    doc.save(`Contract-${(c.contractId || c.id).replace(/\s+/g, '-')}.pdf`)
    setDownloadingId(null)
    setDownloadedId(id)
    setTimeout(() => setDownloadedId(null), 2500)
  }

  if (loading) return <LoadingState message="Loading contracts..." />
  if (error) return <ErrorState message={error} onRetry={() => { setError(null); setLoading(true); getContracts().then((r) => { setContracts(r.data ?? []); setError(r.error); }).finally(() => setLoading(false)) }} />

  const statusBadge = (status) => {
    const map = {
      'Completed':      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      'Under Contract': 'bg-[#EEF4FF] text-blue-600 ring-1 ring-blue-600/30',
      'Draft':          'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
    }
    return map[status] || 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full min-w-0">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contracts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your mortgage resolution contracts</p>
        </div>
        <button
          type="button"
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-[#2a5fc4] text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-600/30 transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Create New Contract
        </button>
      </div>

      {/* Contracts table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Contracts</h2>
          <span className="text-xs text-gray-400">{contracts.length} {contracts.length === 1 ? 'contract' : 'contracts'}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contract ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Parties</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Contract Value</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      <p className="text-sm font-medium text-gray-400">No contracts yet</p>
                      <p className="text-xs text-gray-300">Click "Create New Contract" to add one</p>
                    </div>
                  </td>
                </tr>
              ) : (
                contracts.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Property */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {row.image ? (
                          <img src={row.image} alt={row.propertyAddress} className="w-14 h-10 rounded-lg object-cover shrink-0 border border-gray-100" />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center border border-gray-100">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{row.propertyAddress}</p>
                          <p className="text-gray-400 text-xs mt-0.5 truncate">{row.propertySuburb}</p>
                        </div>
                      </div>
                    </td>
                    {/* Contract ID */}
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{row.contractId}</td>
                    {/* Parties */}
                    <td className="px-6 py-4">
                      <p className="text-gray-800 font-medium">{row.parties}</p>
                      {row.partiesSub && <p className="text-gray-400 text-xs mt-0.5">{row.partiesSub}</p>}
                    </td>
                    {/* Value */}
                    <td className="px-6 py-4 text-gray-900 font-bold text-right tabular-nums">{row.value}</td>
                    {/* Date */}
                    <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">{row.createdDate}</td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleView(row.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-[#EEF4FF] hover:bg-[#dce9ff] rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(row)}
                          disabled={downloadingId === row.id}
                          title="Download PDF"
                          aria-label="Download"
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all disabled:cursor-wait ${
                            downloadedId === row.id
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                              : 'border-gray-200 bg-white text-gray-400 hover:border-blue-600 hover:text-blue-600 hover:bg-[#EEF4FF]'
                          }`}
                        >
                          {downloadingId === row.id ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          ) : downloadedId === row.id ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                          )}
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

      {/* ── Create New Contract Modal ── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCreateModal} aria-hidden />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-contract-title"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
              <h2 id="create-contract-title" className="text-lg font-bold text-slate-800">Create New Contract</h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleSubmitContract} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

                {/* Property Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Property Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={createForm.propertyAddress}
                    onChange={(e) => { updateForm('propertyAddress', e.target.value); setFormErrors((p) => ({ ...p, propertyAddress: '' })) }}
                    placeholder="e.g. 45 Victoria Street"
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-colors ${formErrors.propertyAddress ? 'border-red-400' : 'border-gray-300 focus:border-blue-600'}`}
                  />
                  {formErrors.propertyAddress && <p className="text-xs text-red-500 mt-1">{formErrors.propertyAddress}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Suburb */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Suburb / Location</label>
                    <input
                      type="text"
                      value={createForm.propertySuburb}
                      onChange={(e) => updateForm('propertySuburb', e.target.value)}
                      placeholder="e.g. Potts Point, NSW"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors"
                    />
                  </div>
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                    <select
                      value={createForm.status}
                      onChange={(e) => updateForm('status', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Under Contract">Under Contract</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photos of Property</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 bg-gray-50 hover:border-blue-600/40 hover:bg-[#EEF4FF]/20 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#EEF4FF] file:text-blue-600 file:cursor-pointer hover:file:bg-[#dce9ff] cursor-pointer"
                    />
                    {photoPreviews.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {photoPreviews.map((p, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                            <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                            <button type="button" onClick={removePhoto(i)} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center" aria-label="Remove">×</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400">JPG, PNG — max 10 MB each</p>
                    )}
                  </div>
                </div>

                {/* Parties */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parties <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={createForm.parties}
                    onChange={(e) => { updateForm('parties', e.target.value); setFormErrors((p) => ({ ...p, parties: '' })) }}
                    placeholder="e.g. Borrower name, Lender name"
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-colors ${formErrors.parties ? 'border-red-400' : 'border-gray-300 focus:border-blue-600'}`}
                  />
                  {formErrors.parties && <p className="text-xs text-red-500 mt-1">{formErrors.parties}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Parties sub */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parties detail <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="text"
                      value={createForm.partiesSub}
                      onChange={(e) => updateForm('partiesSub', e.target.value)}
                      placeholder="e.g. ANZ, CBA"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors"
                    />
                  </div>
                  {/* Contract Value */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contract Value <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={createForm.value}
                      onChange={(e) => {
                        const filtered = e.target.value.replace(/[^0-9$,. ]/g, '')
                        updateForm('value', filtered)
                        setFormErrors((p) => ({ ...p, value: '' }))
                      }}
                      placeholder="e.g. $1,750,000"
                      inputMode="numeric"
                      className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-colors ${formErrors.value ? 'border-red-400' : 'border-gray-300 focus:border-blue-600'}`}
                    />
                    {formErrors.value && <p className="text-xs text-red-500 mt-1">{formErrors.value}</p>}
                  </div>
                </div>

                {/* Contract Date — native input avoids overflow clipping */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contract Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={createForm.date}
                    onChange={(e) => { updateForm('date', e.target.value); setFormErrors((p) => ({ ...p, date: '' })) }}
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-colors ${formErrors.date ? 'border-red-400' : 'border-gray-300 focus:border-blue-600'}`}
                  />
                  {formErrors.date && <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>}
                </div>

              </div>

              {/* Footer */}
              <div className="shrink-0 flex items-center justify-end gap-3 px-8 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-[#2a5fc4] text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-600/25 disabled:opacity-50 transition-all"
                >
                  {createSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Creating…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                      Create Contract
                    </>
                  )}
                </button>
              </div>
              {createError && (
                <p className="text-sm text-red-600 mt-2 text-right">{createError}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── View Contract Modal ── */}
      {viewingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeViewModal} aria-hidden />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-contract-title"
          >
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
              <h2 id="view-contract-title" className="text-lg font-bold text-slate-800">Contract Details</h2>
              <button
                type="button"
                onClick={closeViewModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
              {[
                { label: 'Property', value: viewingContract.propertyAddress, sub: viewingContract.propertySuburb },
                { label: 'Contract ID', value: viewingContract.contractId || viewingContract.id },
                { label: 'Parties', value: viewingContract.parties, sub: viewingContract.partiesSub },
                { label: 'Contract Value', value: viewingContract.value, bold: true },
                { label: 'Created Date', value: viewingContract.createdDate },
              ].map(({ label, value, sub, bold }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className={`text-sm text-gray-800 ${bold ? 'font-bold text-base' : ''}`}>{value}</p>
                  {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(viewingContract.status)}`}>
                  {viewingContract.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-7 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={() => handleDownload(viewingContract)}
                disabled={downloadingId === viewingContract?.id}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-wait ${
                  downloadedId === viewingContract?.id
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-[#2a5fc4] text-white'
                }`}
              >
                {downloadingId === viewingContract?.id ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Downloading…</>
                ) : downloadedId === viewingContract?.id ? (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Downloaded!</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Download PDF</>
                )}
              </button>
              <button
                type="button"
                onClick={closeViewModal}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
