// src/components/admin/case/DocumentsTab.jsx
import { FileText, Download, Loader2, Eye, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react'
import { useState, useEffect } from 'react'
import { generateBrandedPDF, generateInvestmentMemorandumPDF } from '../../../utils/pdfGenerator'
import { useCaseContext } from '../../../context/CaseContext'
import { documentService } from '../../../api/dataService'

const CATEGORIES = [
  { key: 'security', label: 'Security Documents', colour: 'bg-purple-50 border-purple-200' },
  { key: 'property', label: 'Property Documents', colour: 'bg-blue-50 border-blue-200' },
  { key: 'enforcement', label: 'Enforcement Documents', colour: 'bg-red-50 border-red-200' },
  { key: 'borrower', label: 'Borrower Documents', colour: 'bg-amber-50 border-amber-200' },
  { key: 'financial', label: 'Financial Documents', colour: 'bg-green-50 border-green-200' },
  { key: 'legal', label: 'Legal Documents', colour: 'bg-indigo-50 border-indigo-200' },
  { key: 'other', label: 'Other', colour: 'bg-gray-50 border-gray-200' },
]

function guessCategory(docType, docName) {
  const t = (docType + ' ' + docName).toLowerCase()
  if (/mortgage|ppsa|caveat|title|charge|security/i.test(t)) return 'security'
  if (/property|valuation|apprais|council|strata|insurance|floor|building/i.test(t)) return 'property'
  if (/default|notice|enforcement|demand|possession|writ|court|judgement/i.test(t)) return 'enforcement'
  if (/passport|licence|id |identity|borrower|kyc/i.test(t)) return 'borrower'
  if (/statement|account|loan|financial|income|tax|ato|arrears|payment/i.test(t)) return 'financial'
  if (/contract|agreement|deed|legal|settlement|discharge|transfer/i.test(t)) return 'legal'
  return 'other'
}

export default function DocumentsTab() {
    const { caseData } = useCaseContext()
    const [isGenerating, setIsGenerating] = useState({ im: false, flyer: false })
    const [caseDocs, setCaseDocs] = useState([])
    const [loadingDocs, setLoadingDocs] = useState(false)

    useEffect(() => {
        const caseId = caseData?._id || caseData?.id
        if (!caseId) return
        setLoadingDocs(true)
        documentService.getDocuments(caseId).then(res => {
            if (res.success) {
                const items = Array.isArray(res.data) ? res.data : (res.data?.items || [])
                setCaseDocs(items.map(d => {
                    const nameStr = d.file_name || d.document_name || d.name || 'Document'
                    const typeStr = d.document_type || d.type || ''
                    return {
                        id: d.id,
                        name: nameStr,
                        type: typeStr || 'Upload',
                        category: d.category || guessCategory(typeStr, nameStr),
                        uploadedBy: d.uploaded_by_name || d.uploader_name || '—',
                        source: d.source || '—',
                        version: d.doc_version || d.version || 1,
                        isVerified: d.is_verified || false,
                        date: d.created_at
                            ? new Date(d.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—',
                        status: d.status || 'Pending',
                        url: d.file_url || null,
                    }
                }))
            }
        }).catch(() => {}).finally(() => setLoadingDocs(false))
    }, [caseData?._id, caseData?.id])

    const fmtCurrency = (v) =>
        v != null ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v) : '—'

    const propertyImageUrl = caseData?.image || null
    const address = caseData?.property?.address || '—'
    const suburb = caseData?.property?.suburb || ''
    const postcode = caseData?.property?.postcode || ''
    const propertyType = caseData?.property?.type || 'Residential'
    const bedrooms = caseData?.property?.bedrooms ?? '—'
    const bathrooms = caseData?.property?.bathrooms ?? '—'
    const valuationAmount = caseData?.valuation?.amount
    const outstandingDebt = caseData?.loan?.outstandingDebt
    const interestRate = caseData?.loan?.interestRate
    const valuer = caseData?.valuation?.valuer || '—'
    const borrowerName = caseData?.borrower?.name || '—'
    const lvr = valuationAmount && outstandingDebt
        ? Math.round((parseFloat(outstandingDebt) / parseFloat(valuationAmount)) * 100)
        : null

    const handleGenerateIM = async () => {
        setIsGenerating(prev => ({ ...prev, im: true }))
        try {
            await generateInvestmentMemorandumPDF({
                title: `Investment Memorandum — ${caseData?.id || ''}`,
                location: [address, suburb, postcode].filter(Boolean).join(', '),
                address,
                suburb,
                image: propertyImageUrl,
                images: caseData?.images,
                type: propertyType,
                status: caseData?.status || '—',
                bedrooms,
                bathrooms,
                propertyValue: valuationAmount,
                outstandingDebt,
                interestRate,
                lvr,
                returnRate: interestRate,
            })
        } finally {
            setIsGenerating(prev => ({ ...prev, im: false }))
        }
    }

    const handleGenerateFlyer = async () => {
        setIsGenerating(prev => ({ ...prev, flyer: true }))
        try {
            await generateBrandedPDF({
                title: 'Marketing Flyer',
                subtitle: [address, suburb, postcode].filter(Boolean).join(', '),
                imageUrl: propertyImageUrl,
                fileName: `Marketing-Flyer-${caseData?.id || new Date().toISOString().split('T')[0]}.pdf`,
                description: `An investment opportunity backed by a ${propertyType.toLowerCase()} property${suburb ? ` in ${suburb}` : ''}. Secured by first mortgage with strong equity protection.`,
                infoItems: [
                    { label: 'Case ID', value: caseData?.id || '—' },
                    { label: 'Property Address', value: address },
                    { label: 'Property Type', value: propertyType },
                    { label: 'Status', value: caseData?.status || '—' },
                    { label: 'Property Value', value: fmtCurrency(valuationAmount) },
                    { label: 'Outstanding Debt', value: fmtCurrency(outstandingDebt) },
                    { label: 'LVR', value: lvr != null ? `${lvr}%` : '—' },
                    { label: 'Interest Rate', value: interestRate != null ? `${interestRate}%` : '—' },
                    { label: 'Bedrooms', value: bedrooms },
                    { label: 'Bathrooms', value: bathrooms },
                    { label: 'Borrower', value: borrowerName },
                    { label: 'Valuer', value: valuer },
                ],
            })
        } finally {
            setIsGenerating(prev => ({ ...prev, flyer: false }))
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-blue-900">Document Generator</p>
                    <p className="text-xs text-blue-600">Auto-generate professional PDFs using the latest case data</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Investment Memorandum */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Investment Memorandum</p>
                            <p className="text-xs text-gray-400 mt-0.5">Full professional prospectus for institutional investors</p>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateIM}
                        disabled={isGenerating.im}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
                    >
                        {isGenerating.im ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isGenerating.im ? 'Generating...' : 'Generate IM'}
                    </button>
                </div>

                {/* Marketing Flyer */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Marketing Flyer</p>
                            <p className="text-xs text-gray-400 mt-0.5">One-page executive summary for retail platforms</p>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateFlyer}
                        disabled={isGenerating.flyer}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
                    >
                        {isGenerating.flyer ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Download className="w-4 h-4 text-gray-400" />}
                        {isGenerating.flyer ? 'Generating...' : 'Generate Flyer'}
                    </button>
                </div>
            </div>

            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <FileText className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                    <span className="font-semibold">Note:</span> Document generation pulls the latest data including valuations, bids, and AI content. Save all changes before generating.
                </p>
            </div>

            {/* Uploaded Case Documents — categorized */}
            <div className="mt-2 space-y-4">
                <p className="text-sm font-semibold text-gray-800">Uploaded Documents</p>
                {loadingDocs ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                    </div>
                ) : caseDocs.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
                        No documents uploaded for this case yet.
                    </div>
                ) : (
                    CATEGORIES.map(cat => {
                        const docs = caseDocs.filter(d => d.category === cat.key)
                        if (!docs.length) return null
                        return (
                            <div key={cat.key} className={`rounded-xl border ${cat.colour} overflow-hidden`}>
                                <div className="px-4 py-2.5 flex items-center gap-2">
                                    <FolderOpen className="w-4 h-4 text-gray-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{cat.label}</span>
                                    <span className="ml-auto text-xs text-gray-400">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="bg-white divide-y divide-gray-100">
                                    {docs.map(doc => (
                                        <div key={doc.id} className="px-4 py-3 flex items-center gap-3">
                                            <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                    <span className="text-xs text-gray-400">{doc.date}</span>
                                                    {doc.source && doc.source !== '—' && (
                                                        <span className="text-xs text-gray-400">Source: {doc.source}</span>
                                                    )}
                                                    <span className="text-xs text-gray-400">v{doc.version}</span>
                                                    {doc.isVerified && (
                                                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                                            <CheckCircle className="w-3 h-3" /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    doc.status === 'Verified' || doc.isVerified ? 'bg-green-100 text-green-700' :
                                                    doc.status === 'Under Review' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-gray-100 text-gray-500'
                                                }`}>{doc.isVerified ? 'Verified' : doc.status}</span>
                                                {doc.url ? (
                                                    <>
                                                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors" title="Preview">
                                                            <Eye className="w-4 h-4" />
                                                        </a>
                                                        <a href={doc.url} download
                                                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors" title="Download">
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-300 italic">No preview</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
