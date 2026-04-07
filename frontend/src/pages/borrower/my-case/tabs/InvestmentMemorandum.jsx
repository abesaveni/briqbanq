import { useState, useEffect } from 'react'
import { borrowerApi } from '../../api'
import { generateInvestmentMemorandumPDF } from '../../../../utils/pdfGenerator'
import HeaderControls from './investment-memorandum/HeaderControls'
import HeroSection from './investment-memorandum/HeroSection'
import ExecutiveSummary from './investment-memorandum/ExecutiveSummary'
import InvestmentHighlights from './investment-memorandum/InvestmentHighlights'
import PropertyGallery from './investment-memorandum/PropertyGallery'
import LoanDetails from './investment-memorandum/LoanDetails'
import PropertyDetails from './investment-memorandum/PropertyDetails'
import RiskAssessment from './investment-memorandum/RiskAssessment'
import InvestmentTerms from './investment-memorandum/InvestmentTerms'
import ContactInformation from './investment-memorandum/ContactInformation'
import ImportantDisclaimer from './investment-memorandum/ImportantDisclaimer'

/* ── Edit Modal ─────────────────────────────────────────── */
function EditMemoModal({ data, onSave, onClose }) {
  const [form, setForm] = useState({
    address:          data?.property?.fullAddress || data?.property?.address || '',
    propertyType:     data?.property?.type || '',
    bedrooms:         data?.property?.bedrooms ?? '',
    bathrooms:        data?.property?.bathrooms ?? '',
    parking:          data?.property?.parking ?? '',
    propertyValue:    data?.financials?.propertyValue ?? '',
    outstandingDebt:  data?.financials?.outstandingDebt ?? '',
    expectedReturn:   data?.financials?.expectedReturn ?? '',
    ltvRatio:         data?.financials?.ltvRatio ?? '',
    summaryText:      (data?.executiveSummary?.text || []).join('\n\n'),
    contactEmail:     data?.contact?.email || '',
    contactPhone:     data?.contact?.phone || '',
  })

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSave = () => {
    const updated = {
      ...data,
      property: {
        ...data.property,
        fullAddress: form.address,
        address:     form.address.split(',')[0]?.trim() || form.address,
        type:        form.propertyType,
        bedrooms:    Number(form.bedrooms) || 0,
        bathrooms:   Number(form.bathrooms) || 0,
        parking:     Number(form.parking) || 0,
      },
      financials: {
        ...data.financials,
        propertyValue:   Number(form.propertyValue) || data.financials?.propertyValue,
        outstandingDebt: Number(form.outstandingDebt) || data.financials?.outstandingDebt,
        expectedReturn:  Number(form.expectedReturn) || data.financials?.expectedReturn,
        ltvRatio:        Number(form.ltvRatio) || data.financials?.ltvRatio,
      },
      executiveSummary: {
        ...data.executiveSummary,
        text: form.summaryText.split('\n\n').filter(Boolean),
      },
      contact: {
        ...data.contact,
        email: form.contactEmail,
        phone: form.contactPhone,
      },
    }
    onSave(updated)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit Investment Memorandum</h2>
            <p className="text-xs text-gray-400 mt-0.5">Update the key details shown in the memorandum</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Property */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1 w-full">Property</legend>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Address</label>
              <input value={form.address} onChange={set('address')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Property Type</label>
                <select value={form.propertyType} onChange={set('propertyType')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                  {['Apartment','House','Townhouse','Villa','Unit','Land'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parking Spaces</label>
                <input type="number" min={0} value={form.parking} onChange={set('parking')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bedrooms</label>
                <input type="number" min={0} value={form.bedrooms} onChange={set('bedrooms')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bathrooms</label>
                <input type="number" min={0} value={form.bathrooms} onChange={set('bathrooms')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </fieldset>

          {/* Financials */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1 w-full">Financials</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Property Value ($)</label>
                <input type="number" min={0} value={form.propertyValue} onChange={set('propertyValue')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Outstanding Debt ($)</label>
                <input type="number" min={0} value={form.outstandingDebt} onChange={set('outstandingDebt')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expected Return (% p.a.)</label>
                <input type="number" step="0.1" min={0} value={form.expectedReturn} onChange={set('expectedReturn')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">LTV Ratio (%)</label>
                <input type="number" step="0.1" min={0} max={100} value={form.ltvRatio} onChange={set('ltvRatio')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </fieldset>

          {/* Executive Summary */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1 w-full">Executive Summary</legend>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Summary Text (separate paragraphs with a blank line)</label>
              <textarea value={form.summaryText} onChange={set('summaryText')} rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
            </div>
          </fieldset>

          {/* Contact */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1 w-full">Contact Information</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={form.contactEmail} onChange={set('contactEmail')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input value={form.contactPhone} onChange={set('contactPhone')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button type="button" onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

const normalizeMemo = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  const d = raw?.data !== undefined ? raw.data : raw
  if (!d || typeof d !== 'object') return null

  // Backend returns raw CaseResponse — map fields to memo shape
  if (!d.images && (d.metadata_json || d.property_address)) {
    const meta = d.metadata_json || {}
    // Use property_images from top-level (CaseResponse validator) or from metadata
    const rawImgs = (Array.isArray(d.property_images) && d.property_images.length > 0)
      ? d.property_images
      : (Array.isArray(meta.property_images) ? meta.property_images : [])
    const docHero = (d.documents || []).find(doc => (doc.document_type === 'Property Image' || doc.type === 'Property Image') && doc.file_url)?.file_url
    d.images = {
      hero: docHero || rawImgs[0] || null,
      thumbnails: rawImgs.slice(1, 5),
      gallery: rawImgs,
    }
  }
  if (!d.property && d.property_address) {
    const meta = d.metadata_json || {}
    d.property = {
      fullAddress: d.property_address,
      address: d.property_address.split(',')[0]?.trim() || d.property_address,
      suburb: meta.suburb || '',
      state: meta.state || '',
      postcode: meta.postcode || '',
      type: d.property_type || '',
      bedrooms: meta.bedrooms ?? 0,
      bathrooms: meta.bathrooms ?? 0,
      parking: meta.parking ?? 0,
      floorArea: meta.floor_area ? `${meta.floor_area} m²` : '',
    }
  }
  // Always (re)build financials so extended fields are populated
  {
    const meta = d.metadata_json || {}
    const pv = parseFloat(d.estimated_value) || 0
    const debt = parseFloat(d.outstanding_debt) || 0
    const rate = parseFloat(d.interest_rate) || 0
    const lvr = pv > 0 ? Math.round((debt / pv) * 1000) / 10 : 0
    d.financials = {
      ...(d.financials || {}),
      propertyValue: pv,
      outstandingDebt: debt,
      expectedReturn: rate,
      ltvRatio: lvr,
      originalLoanAmount: parseFloat(meta.original_loan_amount) || null,
      originalInterestRate: rate || null,
      defaultRate: parseFloat(meta.default_rate) || null,
    }
  }

  // Build defaultStatus from metadata
  if (!d.defaultStatus) {
    const meta = d.metadata_json || {}
    const daysInDefault = parseInt(meta.days_in_default) || null
    const totalArrears = parseFloat(meta.total_arrears) || null
    const missed = parseInt(meta.missed_payments) || null
    d.defaultStatus = {
      daysInDefault,
      daysInArrears: daysInDefault,
      arrearsAmount: totalArrears,
      missedPayments: missed,
    }
  }

  // Build valuation from metadata
  if (!d.valuation) {
    const meta = d.metadata_json || {}
    d.valuation = {
      currentValue: parseFloat(d.estimated_value) || null,
      valuationDate: meta.valuation_date || null,
      valuer: meta.valuation_provider || meta.valuer_name || null,
      method: meta.valuation_method || null,
    }
  }

  if (!d.contact) {
    const meta = d.metadata_json || {}
    d.contact = {
      email: meta.email_address || '',
      phone: meta.phone_number || '',
    }
  }
  return d
}

export default function InvestmentMemorandum({ caseId }) {
  const [memoData, setMemoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- reset loading/error at start of fetch */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    if (!caseId) {
      setLoading(false)
      return () => {}
    }

    borrowerApi
      .getInvestmentMemo(caseId)
      .then((res) => {
        if (cancelled) return
        const data = normalizeMemo(res)
        if (data) setMemoData(data)
        else setMemoData(null)
      })
      .catch((err) => {
        if (cancelled) return
        const isOffline = err?.code === 'ERR_NETWORK' || err?.isOffline
        if (!isOffline) setError(err?.message || 'Failed to load memorandum')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [caseId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDownloadPDF = async () => {
    if (caseId) {
      try {
        const res = await borrowerApi.generateInvestmentMemoPdf(caseId)
        if (res?.data instanceof Blob && res.data.size > 0) {
          const url = window.URL.createObjectURL(res.data)
          const a = document.createElement('a')
          a.href = url
          a.download = `Investment_Memo_${caseId}.pdf`
          a.click()
          window.URL.revokeObjectURL(url)
          return
        }
      } catch {
        // fall through to client-side generation
      }
    }
    // Client-side fallback using branded PDF generator
    const d = memoData
    await generateInvestmentMemorandumPDF({
      title: d?.property?.fullAddress || d?.property?.address || 'Investment Memorandum',
      location: d?.property?.suburb || '',
      image: d?.images?.hero || d?.property?.heroImage || (Array.isArray(d?.images) ? d.images[0] : null),
      propertyValue: d?.financials?.propertyValue,
      outstandingDebt: d?.financials?.outstandingDebt,
      lvr: d?.financials?.ltvRatio,
      expectedReturn: d?.financials?.expectedReturn,
      type: d?.property?.type,
      propertyDetails: {
        bedrooms: d?.property?.bedrooms,
        bathrooms: d?.property?.bathrooms,
        parking: d?.property?.parking,
        landSize: d?.property?.landSize,
        floorArea: d?.property?.floorArea,
      },
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEdit = () => setIsEditing(true)

  const handleSaveEdit = async (updated) => {
    setIsEditing(false)
    setMemoData(updated)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
    if (caseId) {
      try {
        await borrowerApi.updateInvestmentMemo(caseId, updated)
      } catch {
        // saved locally; backend sync optional
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" id="investment-memo-content">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!memoData) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center" id="investment-memo-content">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📄</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Investment Memorandum Available</h3>
        <p className="text-sm text-slate-600">The investment memorandum for this case is not yet available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-0" id="investment-memo-content">
      {isEditing && (
        <EditMemoModal
          data={memoData}
          onSave={handleSaveEdit}
          onClose={() => setIsEditing(false)}
        />
      )}
      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800 no-print">
          {error}
        </div>
      )}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800 no-print flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Memorandum updated successfully.
        </div>
      )}
      <HeaderControls onEdit={handleEdit} onPrint={handlePrint} onDownload={handleDownloadPDF} />

      <HeroSection
        urgencyBadge={memoData.urgencyBadge}
        address={memoData.property?.address}
        location={memoData.property?.fullAddress}
        heroImage={memoData.images?.hero}
        thumbnails={memoData.images?.thumbnails}
        propertyValue={memoData.financials?.propertyValue}
        outstandingDebt={memoData.financials?.outstandingDebt}
        expectedReturn={memoData.financials?.expectedReturn}
      />

      <ExecutiveSummary
        text={memoData.executiveSummary?.text}
        highlights={memoData.executiveSummary?.highlights}
      />

      <InvestmentHighlights highlights={memoData.investmentHighlights} />

      <PropertyGallery images={memoData.images?.gallery} />

      <LoanDetails financials={memoData.financials} defaultStatus={memoData.defaultStatus} />

      <PropertyDetails property={memoData.property} valuation={memoData.valuation} />

      <RiskAssessment risks={memoData.riskAssessment} />

      <InvestmentTerms terms={memoData.investmentTerms} />

      <ContactInformation contact={{ ...memoData.contact, caseNumber: memoData.caseId || caseId }} />

      <ImportantDisclaimer />
    </div>
  )
}
