import { useState, useEffect } from 'react'
import { FileText, Image as ImageIcon, Sparkles, Download, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import DatePicker from '../../../components/common/DatePicker'
import { caseService } from '../../../api/dataService'

/** Reusable number spinner: displays value with − / + buttons */
function NumberSpinner({ value, onChange, min = 0, max = 9999, step = 1, prefix = '', suffix = '' }) {
  const num = parseFloat(value) || 0
  const dec = step < 1 ? String(step).split('.')[1]?.length || 2 : 0

  const decrement = () => {
    const next = Math.max(min, parseFloat((num - step).toFixed(dec)))
    onChange(String(next))
  }
  const increment = () => {
    const next = Math.min(max, parseFloat((num + step).toFixed(dec)))
    onChange(String(next))
  }

  return (
    <div className="flex items-center w-full border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
      <button
        type="button"
        onClick={decrement}
        className="flex-shrink-0 px-3 py-2.5 text-gray-500 hover:bg-gray-100 border-r border-gray-300 text-lg leading-none select-none transition-colors"
      >
        −
      </button>
      <div className="flex-1 flex items-center justify-center gap-0.5 py-2.5 text-sm font-semibold text-gray-900 bg-white select-none">
        {prefix && <span className="text-gray-500 text-xs">{prefix}</span>}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(e.target.value)}
          className="w-16 text-center text-sm font-semibold text-gray-900 bg-transparent border-0 outline-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-gray-500 text-xs">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={increment}
        className="flex-shrink-0 px-3 py-2.5 text-gray-500 hover:bg-gray-100 border-l border-gray-300 text-lg leading-none select-none transition-colors"
      >
        +
      </button>
    </div>
  )
}

const TABS = [
  { id: 'case-details', label: 'Case Details', icon: FileText },
  { id: 'property-images', label: 'Property Images', icon: ImageIcon },
  { id: 'ai-content', label: 'AI Content', icon: Sparkles },
  { id: 'documents', label: 'Documents', icon: Download },
]

/** Parse location "Potts Point, NSW 2011" into suburb and postcode */
function parseLocation(location) {
  if (!location || typeof location !== 'string') return { suburb: '', postcode: '' }
  const parts = location.split(',').map((p) => p.trim())
  const last = parts[parts.length - 1] || ''
  const postcodeMatch = last.match(/(\d+)/)
  const postcode = postcodeMatch ? postcodeMatch[1] : ''
  const suburb = parts.length > 1 ? parts[0] : ''
  return { suburb, postcode }
}

/** Format date for input[type="text"] display e.g. 15 Jan 2026 -> 01/15/2026 */
function toDateInputValue(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return String(dateStr)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const y = d.getFullYear()
  return `${m}/${day}/${y}`
}

export default function ManageCaseModal({ caseData, isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('case-details')
  const [caseDetails, setCaseDetails] = useState({})
  const [propertyImages, setPropertyImages] = useState([])
  const [aiContent, setAiContent] = useState({
    marketingDescription: '',
    investmentHighlights: '',
    locationMarketNotes: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false)
  const [aiSuggestMessage, setAiSuggestMessage] = useState(null)
  const [aiGenerateLoading, setAiGenerateLoading] = useState(null) // 'marketingDescription' | 'investmentHighlights' | 'locationMarketNotes'
  const [generateImLoading, setGenerateImLoading] = useState(false)
  const [generateFlyerLoading, setGenerateFlyerLoading] = useState(false)
  const [existingImages, setExistingImages] = useState([])
  const [imagesLoading, setImagesLoading] = useState(false)

  const caseId = caseData?.id || ''
  const { suburb, postcode } = parseLocation(caseData?.property?.location)

  // Statuses where borrower cannot edit
  const LOCKED_STATUSES = ['APPROVED', 'LISTED', 'AUCTION', 'FUNDED', 'CLOSED']
  const isReadOnly = LOCKED_STATUSES.includes(caseData?.status)

  useEffect(() => {
    if (!isOpen || !caseData) return
    setSaveError(null)
    setCaseDetails({
      caseNumber: caseData.case_number || caseData.caseNumber || (caseData.id || '').slice(0, 8).toUpperCase() || '',
      borrowerName: caseData.borrower || '',
      lenderName: caseData.lender || '',
      outstandingDebt: String(caseData.outstandingDebt ?? ''),
      interestRate: String(caseData.interest_rate ?? ''),
      defaultRate: '8.25',
      daysInDefault: String(caseData.daysInDefault ?? '0'),
      address: caseData.property?.address || '',
      suburb: caseData.property?.suburb || suburb || '',
      postcode: caseData.property?.postcode || postcode || '',
      bedrooms: caseData.property?.bedrooms != null ? String(caseData.property.bedrooms) : '0',
      bathrooms: caseData.property?.bathrooms != null ? String(caseData.property.bathrooms) : '0',
      valuationAmount: String(caseData.valuation?.amount ?? caseData.propertyValuation ?? ''),
      valuationDate: toDateInputValue(caseData.valuation?.date),
      valuerName: caseData.valuation?.valuer || '',
    })
    setAiContent({
      marketingDescription: '',
      investmentHighlights: '',
      locationMarketNotes: '',
    })
    setPropertyImages([])
    setAiSuggestMessage(null)
    setActiveTab('case-details')
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sync form when modal opens or case id changes
  }, [isOpen, caseData?.id, caseData?.borrower, caseData?.lender, caseData?.outstandingDebt, caseData?.interest_rate, caseData?.daysInDefault, caseData?.property?.address, caseData?.property?.suburb, caseData?.property?.postcode, caseData?.property?.bedrooms, caseData?.property?.bathrooms, caseData?.valuation?.amount, caseData?.valuation?.date, caseData?.valuation?.valuer, suburb, postcode])

  // Fetch existing property images from backend when modal opens
  useEffect(() => {
    if (!isOpen || !caseId) return
    setImagesLoading(true)
    caseService.getCaseImages(caseId)
      .then((res) => {
        if (res.success) {
          const imgs = res.data?.images ?? []
          setExistingImages(imgs)
        }
      })
      .catch(() => {})
      .finally(() => setImagesLoading(false))
  }, [isOpen, caseId])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    onClose?.()
  }

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleClose()
  }

  const handleSave = async () => {
    setSaveError(null)
    setSaveSuccess(false)
    setIsSaving(true)
    try {
      // Upload any newly added image files to backend
      if (propertyImages.length > 0 && caseId) {
        const uploaded = []
        for (const file of propertyImages) {
          if (file instanceof File) {
            const res = await caseService.uploadCaseImage(caseId, file)
            if (res.success && res.data?.url) uploaded.push(res.data.url)
          }
        }
        if (uploaded.length > 0) {
          setExistingImages((prev) => [...prev, ...uploaded])
          setPropertyImages([])
        }
      }
      await onSave?.({
        caseDetails,
        propertyImages,
        aiContent,
      })
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
        handleClose()
      }, 1200)
    } catch (err) {
      console.error('Save failed', err)
      setSaveError(err?.message || 'Save failed. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const updateCaseDetail = (field, value) => {
    setCaseDetails((prev) => ({ ...prev, [field]: value }))
  }

  const updateAiContent = (field, value) => {
    setAiContent((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    setPropertyImages((prev) => [...prev, ...files])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer?.files || [])
    setPropertyImages((prev) => [...prev, ...files])
  }

  const handleDragOver = (e) => e.preventDefault()

  const handleAiSuggestImages = async () => {
    setAiSuggestLoading(true)
    setAiSuggestMessage(null)
    try {
      await new Promise((r) => setTimeout(r, 1200))
      setAiSuggestMessage('AI suggested 3 property images. Add them via Upload Images or drag-and-drop.')
    } finally {
      setAiSuggestLoading(false)
    }
  }

  const handleAiGenerate = async (field) => {
    setAiGenerateLoading(field)
    try {
      await new Promise((r) => setTimeout(r, 800))
      const placeholders = {
        marketingDescription: `Professional marketing description for ${caseData?.property?.address || 'this property'}. Prime location, strong investment potential.`,
        investmentHighlights: 'Key selling points: strong rental demand, quality finishes, transport links, growth suburb.',
        locationMarketNotes: `${caseData?.property?.location || 'Suburb'} – local amenities, schools, and market trends.`,
      }
      setAiContent((prev) => ({ ...prev, [field]: placeholders[field] || prev[field] }))
    } finally {
      setAiGenerateLoading(null)
    }
  }

const handleGenerateIM = async () => {
    setGenerateImLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const shortId = caseDetails.caseNumber || (caseId || '').slice(0, 12) || 'N/A'
      const W = doc.internal.pageSize.getWidth()
      // Header
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, W, 38, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20); doc.setFont('helvetica', 'bold')
      doc.text('BrickBanq', 14, 16)
      doc.setFontSize(10); doc.setFont('helvetica', 'normal')
      doc.text('Investment Memorandum', 14, 24)
      doc.text(`Case: ${shortId}   Date: ${new Date().toLocaleDateString('en-AU')}`, 14, 31)
      let yPos = 46
      // Use first existing image or first newly uploaded file
      const firstImgUrl = existingImages[0]
      const firstImgFile = propertyImages[0]
      let imgData = caseDetails.propertyImage || null
      if (!imgData && firstImgUrl) {
        try {
          const resp = await fetch(firstImgUrl.startsWith('/') ? `http://localhost:8000${firstImgUrl}` : firstImgUrl)
          const blob = await resp.blob()
          imgData = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob) })
        } catch {}
      } else if (!imgData && firstImgFile) {
        imgData = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(firstImgFile) })
      }
      if (imgData) {
        try { doc.addImage(imgData, 'JPEG', 14, yPos, W - 28, 55); yPos += 60 } catch {}
      }
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(14); doc.setFont('helvetica', 'bold')
      doc.text('Property Details', 14, yPos + 6); yPos += 12
      doc.setFontSize(10)
      const rows = [
        ['Address', `${caseDetails.address || ''}, ${caseDetails.suburb || ''} ${caseDetails.postcode || ''}`],
        ['Borrower', caseDetails.borrowerName || '—'],
        ['Lender', caseDetails.lenderName || '—'],
        ['Property Value', `A$${Number(caseDetails.valuationAmount || 0).toLocaleString()}`],
        ['Outstanding Debt', `A$${Number(caseDetails.outstandingDebt || 0).toLocaleString()}`],
        ['Case Status', caseDetails.status || '—'],
      ]
      rows.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold'); doc.text(label + ':', 14, yPos)
        doc.setFont('helvetica', 'normal'); doc.text(String(val), 70, yPos); yPos += 7
      })
      doc.setFillColor(15, 23, 42); doc.rect(0, 282, W, 15, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(8)
      doc.text('BrickBanq | Confidential Investment Memorandum | Generated ' + new Date().toLocaleString('en-AU'), 14, 291)
      doc.save(`Investment-Memorandum-${shortId}.pdf`)
    } catch (err) { console.error('PDF generation failed', err) }
    finally { setGenerateImLoading(false) }
  }

const handleGenerateFlyer = async () => {
    setGenerateFlyerLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const shortId = caseDetails.caseNumber || (caseId || '').slice(0, 12) || 'N/A'
      const W = doc.internal.pageSize.getWidth()
      doc.setFillColor(5, 150, 105); doc.rect(0, 0, W, 45, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22); doc.setFont('helvetica', 'bold')
      doc.text('Property Marketing Flyer', 14, 18)
      doc.setFontSize(11); doc.setFont('helvetica', 'normal')
      doc.text(`${caseDetails.address || ''}, ${caseDetails.suburb || ''} ${caseDetails.postcode || ''}`, 14, 28)
      doc.text(`Case: ${shortId}`, 14, 36)
      let yPos = 52
      // Use first existing image or first newly uploaded file
      const firstImgUrl = existingImages[0]
      const firstImgFile = propertyImages[0]
      let imgData = caseDetails.propertyImage || null
      if (!imgData && firstImgUrl) {
        try {
          const resp = await fetch(firstImgUrl.startsWith('/') ? `http://localhost:8000${firstImgUrl}` : firstImgUrl)
          const blob = await resp.blob()
          imgData = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob) })
        } catch {}
      } else if (!imgData && firstImgFile) {
        imgData = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(firstImgFile) })
      }
      if (imgData) {
        try { doc.addImage(imgData, 'JPEG', 14, yPos, W - 28, 60); yPos += 65 } catch {}
      }
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(13); doc.setFont('helvetica', 'bold')
      doc.text('Property Summary', 14, yPos + 6); yPos += 13
      doc.setFontSize(10)
      const items = [
        ['Estimated Value', `A$${Number(caseDetails.valuationAmount || 0).toLocaleString()}`],
        ['Property Type', caseDetails.propertyType || '—'],
        ['Status', caseDetails.status || '—'],
      ]
      items.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold'); doc.text(label + ':', 14, yPos)
        doc.setFont('helvetica', 'normal'); doc.text(String(val), 70, yPos); yPos += 7
      })
      doc.setFillColor(5, 150, 105); doc.rect(0, 282, W, 15, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(8)
      doc.text('BrickBanq | Property Marketing Summary | ' + new Date().toLocaleDateString('en-AU'), 14, 291)
      doc.save(`Marketing-Flyer-${shortId}.pdf`)
    } catch (err) { console.error('Flyer PDF failed', err) }
    finally { setGenerateFlyerLoading(false) }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleBackdrop}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={handleBackdrop}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-case-title"
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col my-auto min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h2 id="manage-case-title" className="text-lg font-semibold text-gray-900">
                Manage Case · {caseDetails.caseNumber || (caseId || '').slice(0, 8).toUpperCase()}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {caseDetails.address || 'Update case details, images, and AI content'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-gray-50/30">
            {activeTab === 'case-details' && (
              <div className="space-y-4 max-w-full">
                {isReadOnly && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    This case has been approved and can no longer be edited.
                  </div>
                )}
                <section className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Case Number</label>
                      <input
                        type="text"
                        value={caseDetails.caseNumber}
                        onChange={(e) => !isReadOnly && updateCaseDetail('caseNumber', e.target.value)}
                        readOnly={isReadOnly}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${isReadOnly ? 'bg-gray-50 cursor-default' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Borrower Name</label>
                      <input
                        type="text"
                        value={caseDetails.borrowerName}
                        onChange={(e) => !isReadOnly && updateCaseDetail('borrowerName', e.target.value.replace(/[^a-zA-Z\s''-]/g, ''))}
                        readOnly={isReadOnly}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${isReadOnly ? 'bg-gray-50 cursor-default' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Lender Name</label>
                      <input
                        type="text"
                        value={caseDetails.lenderName}
                        onChange={(e) => !isReadOnly && updateCaseDetail('lenderName', e.target.value)}
                        readOnly={isReadOnly}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${isReadOnly ? 'bg-gray-50 cursor-default' : ''}`}
                      />
                    </div>
                  </div>
                </section>
                <section className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Loan Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        <span className="inline-flex items-center gap-1">
                          Outstanding Debt
                          <span className="inline-flex w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs items-center justify-center cursor-help" title="Outstanding loan balance">i</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={caseDetails.outstandingDebt}
                        onChange={(e) => !isReadOnly && updateCaseDetail('outstandingDebt', e.target.value)}
                        readOnly={isReadOnly}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${isReadOnly ? 'bg-gray-50 cursor-default' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Interest Rate (%)</label>
                      <NumberSpinner
                        value={caseDetails.interestRate}
                        onChange={(v) => !isReadOnly && updateCaseDetail('interestRate', v)}
                        min={0}
                        max={30}
                        step={0.25}
                        suffix="%"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Default Rate (%)</label>
                      <NumberSpinner
                        value={caseDetails.defaultRate}
                        onChange={(v) => !isReadOnly && updateCaseDetail('defaultRate', v)}
                        min={0}
                        max={50}
                        step={0.25}
                        suffix="%"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Days in Default</label>
                      <NumberSpinner
                        value={caseDetails.daysInDefault}
                        onChange={(v) => !isReadOnly && updateCaseDetail('daysInDefault', v)}
                        min={0}
                        max={3650}
                        step={1}
                        suffix="d"
                      />
                    </div>
                  </div>
                </section>
                <section className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Property Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                      <input
                        type="text"
                        value={caseDetails.address}
                        onChange={(e) => !isReadOnly && updateCaseDetail('address', e.target.value)}
                        readOnly={isReadOnly}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${isReadOnly ? 'bg-gray-50 cursor-default' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Suburb</label>
                      <input
                        type="text"
                        value={caseDetails.suburb}
                        onChange={(e) => !isReadOnly && updateCaseDetail('suburb', e.target.value)}
                        readOnly={isReadOnly}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${isReadOnly ? 'bg-gray-50 cursor-default' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Postcode</label>
                      <input
                        type="text"
                        value={caseDetails.postcode}
                        onChange={(e) => !isReadOnly && updateCaseDetail('postcode', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        readOnly={isReadOnly}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${isReadOnly ? 'bg-gray-50 cursor-default' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Bedrooms</label>
                      <NumberSpinner
                        value={caseDetails.bedrooms}
                        onChange={(v) => !isReadOnly && updateCaseDetail('bedrooms', v)}
                        min={0}
                        max={20}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Bathrooms</label>
                      <NumberSpinner
                        value={caseDetails.bathrooms}
                        onChange={(v) => !isReadOnly && updateCaseDetail('bathrooms', v)}
                        min={0}
                        max={20}
                        step={1}
                      />
                    </div>
                  </div>
                </section>
                <section className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Valuation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Valuation Amount</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={caseDetails.valuationAmount}
                        onChange={(e) => !isReadOnly && updateCaseDetail('valuationAmount', e.target.value)}
                        readOnly={isReadOnly}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${isReadOnly ? 'bg-gray-50 cursor-default' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Valuation Date</label>
                      <DatePicker
                        value={caseDetails.valuationDate}
                        onChange={(dateStr) => !isReadOnly && updateCaseDetail('valuationDate', dateStr)}
                        placeholderText="MM/DD/YYYY"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Valuer Name</label>
                      <input
                        type="text"
                        value={caseDetails.valuerName}
                        onChange={(e) => !isReadOnly && updateCaseDetail('valuerName', e.target.value.replace(/[^a-zA-Z\s''-]/g, ''))}
                        readOnly={isReadOnly}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${isReadOnly ? 'bg-gray-50 cursor-default' : ''}`}
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'property-images' && (
              <div className="space-y-4 max-w-full">
                <section className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Property Images</h3>
                  {!isReadOnly && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      <button
                        type="button"
                        onClick={handleAiSuggestImages}
                        disabled={aiSuggestLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span>✨</span>
                        {aiSuggestLoading ? 'Suggesting…' : 'AI Suggest Images'}
                      </button>
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 cursor-pointer">
                        <span>↑</span>
                        Upload Images
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={handleFileSelect}
                        />
                      </label>
                    </div>
                  )}
                  {/* Existing images from backend */}
                  {imagesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading images…
                    </div>
                  ) : existingImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {existingImages.map((url, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          <img
                            src={url.startsWith('/') ? `http://localhost:8000${url}` : url}
                            alt={`Property image ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {i === 0 && (
                            <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">Cover</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {/* New files pending upload */}
                  {!isReadOnly && (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center bg-gray-50/50 min-h-[160px] flex flex-col items-center justify-center"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <div className="w-12 h-12 mb-3 text-gray-400 flex items-center justify-center text-3xl">🖼️</div>
                      {propertyImages.length === 0 && !aiSuggestMessage ? (
                        <>
                          <p className="text-sm text-gray-500 mb-1">{existingImages.length > 0 ? 'Add more images' : 'No images uploaded yet'}</p>
                          <p className="text-xs text-gray-400 mb-3">Drag & drop or click to upload</p>
                          <label className="inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer">
                            Click to upload
                            <input type="file" accept="image/*" multiple className="sr-only" onChange={handleFileSelect} />
                          </label>
                        </>
                      ) : aiSuggestMessage ? (
                        <p className="text-sm text-gray-700 mb-3">{aiSuggestMessage}</p>
                      ) : null}
                      {propertyImages.length > 0 && (
                        <p className="text-sm text-green-700 font-medium">{propertyImages.length} new image(s) ready to upload — click Save Changes</p>
                      )}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'ai-content' && (
              <div className="space-y-4 max-w-full">
                <section className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg mb-4">
                    <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-indigo-900">AI Content Generator</p>
                      <p className="text-xs text-indigo-600">Generate professional marketing content and investment highlights</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Marketing Description</label>
                      <div className="flex gap-3 items-start">
                        <textarea
                          value={aiContent.marketingDescription}
                          onChange={(e) => updateAiContent('marketingDescription', e.target.value)}
                          placeholder="Professional marketing description..."
                          rows={4}
                          className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[88px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAiGenerate('marketingDescription')}
                          disabled={aiGenerateLoading !== null}
                          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span>✨</span>
                          {aiGenerateLoading === 'marketingDescription' ? 'Generating…' : 'AI Generate'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Investment Highlights</label>
                      <div className="flex gap-3 items-start">
                        <textarea
                          value={aiContent.investmentHighlights}
                          onChange={(e) => updateAiContent('investmentHighlights', e.target.value)}
                          placeholder="Key selling points..."
                          rows={4}
                          className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[88px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAiGenerate('investmentHighlights')}
                          disabled={aiGenerateLoading !== null}
                          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span>✨</span>
                          {aiGenerateLoading === 'investmentHighlights' ? 'Generating…' : 'AI Generate'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Location & Market Notes</label>
                      <div className="flex gap-3 items-start">
                        <textarea
                          value={aiContent.locationMarketNotes}
                          onChange={(e) => updateAiContent('locationMarketNotes', e.target.value)}
                          placeholder="Suburb information..."
                          rows={4}
                          className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[88px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAiGenerate('locationMarketNotes')}
                          disabled={aiGenerateLoading !== null}
                          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span>✨</span>
                          {aiGenerateLoading === 'locationMarketNotes' ? 'Generating…' : 'AI Generate'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4 max-w-full">
                <section className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Document Generator</p>
                      <p className="text-xs text-blue-600">Generate professional PDFs using the latest case data</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Investment Memorandum</p>
                          <p className="text-xs text-gray-400 mt-0.5">Full professional prospectus</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateIM}
                        disabled={generateImLoading}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {generateImLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {generateImLoading ? 'Generating…' : 'Generate IM'}
                      </button>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Marketing Flyer</p>
                          <p className="text-xs text-gray-400 mt-0.5">Single-page executive summary</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateFlyer}
                        disabled={generateFlyerLoading}
                        className="flex items-center justify-center gap-2 w-full py-2 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        {generateFlyerLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Download className="w-4 h-4 text-gray-400" />}
                        {generateFlyerLoading ? 'Generating…' : 'Generate Flyer'}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
            <div className="h-5">
              {saveError && (
                <span className="flex items-center gap-1.5 text-sm text-red-500">
                  <AlertCircle className="w-4 h-4" /> {saveError}
                </span>
              )}
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> Changes saved successfully!
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || saveSuccess}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
