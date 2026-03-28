import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from './components/Breadcrumb'
import useCountdown from '../../hooks/useCountdown'
import { auctionService, casesService, documentService } from '../../api/dataService'
import { jsPDF } from 'jspdf'

const EMPTY_AUCTION_ROOM = { auction: { endDate: null, minimumBid: 0, activeBidders: 0 }, financials: { currentHighestBid: 0 }, propertyImages: [], bidHistory: [], documents: [] }

const formatAud = (n) =>
  n == null ? 'A$0' : new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
const formatShort = (n) => {
  if (n == null) return 'A$0'
  if (n >= 1000000) return `A$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `A$${(n / 1000).toFixed(0)}K`
  return formatAud(n)
}

const MEDIA_TABS = [
  { id: '3d', label: '3D Tour', icon: '📐' },
  { id: '2d', label: '2D Floorplan', icon: '📏' },
  { id: 'virtual', label: 'Virtual Tour', icon: '🎥' },
  { id: 'rendered', label: 'Rendered', icon: '🖼️' },
]

export default function AuctionRoom() {
  const navigate = useNavigate()
  const [data, setData] = useState(EMPTY_AUCTION_ROOM)
  const [liveCase, setLiveCase] = useState(null)
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState(null)
  const [approveSuccess, setApproveSuccess] = useState(false)

  useEffect(() => {
    // Fetch borrower's own cases and find the one in LISTED/AUCTION state
    casesService.getMyCases()
      .then(async (res) => {
        const cases = Array.isArray(res.data) ? res.data : (res.data?.items || [])
        const live = cases.find(c => ['AUCTION', 'LISTED', 'LIVE'].includes(c.status?.toUpperCase()))
        if (live) {
          setLiveCase(live)

          // Fetch the auction record for this case to get the real end time and status
          let auctionEndTime = null
          let auctionStatus = null
          try {
            const auctionRes = await auctionService.getAuctionById(live.id) // _get_auction_or_404
            if (auctionRes.success) {
              const auction = auctionRes.data
              auctionEndTime = auction.scheduled_end || auction.actual_end || null
              auctionStatus = auction.status || null
            }
          } catch (_) {}

          setData((prev) => ({
            ...prev,
            ...live,
            caseNumber: live.case_number || live.id?.slice(0, 8),
            address: live.property_address,
            status: live.status,
            auctionStatus,
            auction: {
              endDate: auctionEndTime || live.end_time || live.auction_end || null,
              minimumBid: Number(live.outstanding_debt) || 0,
              activeBidders: live.active_bidders || 0,
            },
            financials: {
              currentHighestBid: Number(live.current_highest_bid) || 0,
              propertyValue: Number(live.estimated_value) || 0,
              outstandingDebt: Number(live.outstanding_debt) || 0,
            },
            propertyImages: live.property_images || live.images || [],
            bidHistory: [],
          }))

          // Load documents for this case
          const docsRes = await documentService.getDocuments(live.id)
          if (docsRes.success) {
            const docItems = Array.isArray(docsRes.data) ? docsRes.data : (docsRes.data?.items || [])
            setData((prev) => ({
              ...prev,
              availableDocuments: docItems.map((d) => ({
                id: d.id,
                title: d.document_name || d.file_name || d.name || 'Document',
                description: `${d.document_type || 'Upload'} · Uploaded ${d.created_at ? new Date(d.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}`,
              })),
            }))
          }

          // Load bids for this case
          const bidsRes = await auctionService.getBidsByCase(live.id)
          if (bidsRes.success && Array.isArray(bidsRes.data)) {
            const bids = bidsRes.data
            const highestBid = bids[0]
            setData((prev) => ({
              ...prev,
              bidHistory: bids,
              financials: {
                ...prev.financials,
                currentHighestBid: highestBid ? Number(highestBid.amount) : prev.financials.currentHighestBid,
              },
            }))
            setBidHistory(bids)
          }
        }
      })
      .catch(() => {})
  }, [])
  const [imageIndex, setImageIndex] = useState(0)
  const [mediaTab, setMediaTab] = useState('3d')
  const [bidHistory, setBidHistory] = useState([])
  const [viewingDocument, setViewingDocument] = useState(null)
  const [downloadingDocId, setDownloadingDocId] = useState(null)
  const liveCaseId = liveCase?.id || null

  const endDate = data.auction?.endDate ? new Date(data.auction.endDate) : null
  const countdown = useCountdown(endDate || new Date(0))
  const currentBid = data.financials?.currentHighestBid || 0
  const resolveImageUrl = (url) => {
    if (!url) return '/placeholder-property.jpg'
    if (url.startsWith('http')) return url
    return url
  }
  const images = data.propertyImages?.length
    ? data.propertyImages.map(resolveImageUrl)
    : ['/placeholder-property.jpg']
  const winningBid = bidHistory.find(b => b.status === 'WINNING' || b.status === 'WON') || bidHistory[0]

  // Poll bid history every 15s so borrower sees new bids in near-real-time
  useEffect(() => {
    if (!liveCaseId) return
    const pollBids = async () => {
      const bidsRes = await auctionService.getBidsByCase(liveCaseId)
      if (bidsRes.success && Array.isArray(bidsRes.data)) {
        setBidHistory(bidsRes.data)
        const highest = bidsRes.data[0]
        setData((prev) => ({
          ...prev,
          financials: {
            ...prev.financials,
            currentHighestBid: highest ? Number(highest.amount) : prev.financials.currentHighestBid,
          },
        }))
      }
    }
    const interval = setInterval(pollBids, 15000)
    return () => clearInterval(interval)
  }, [liveCaseId])

  useEffect(() => {
    if (!viewingDocument) return
    const onEscape = (e) => { if (e.key === 'Escape') handleCloseDocumentView() }
    document.addEventListener('keydown', onEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = ''
    }
  }, [viewingDocument])

  const handlePrevImage = () => setImageIndex((i) => (i - 1 + images.length) % images.length)
  const handleNextImage = () => setImageIndex((i) => (i + 1) % images.length)

  const docBlobUrlsRef = useRef({})

  const generateDocumentPdf = (doc) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const margin = 20

    // Header bar
    pdf.setFillColor(79, 70, 229)
    pdf.rect(0, 0, pageW, 22, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(13)
    pdf.setFont('helvetica', 'bold')
    pdf.text('BriqBanq — Mortgage Resolution Platform', margin, 14)

    // Document title
    pdf.setTextColor(30, 30, 30)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text(doc.title, margin, 38)

    // Divider
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, 42, pageW - margin, 42)

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 49)
    pdf.text(`Case Reference: ${liveCase?.case_number || '—'}  |  Property: ${liveCase?.property_address || '—'}`, margin, 55)

    let y = 68

    const sectionTitle = (label) => {
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(79, 70, 229)
      pdf.text(label, margin, y)
      y += 2
      pdf.setDrawColor(79, 70, 229)
      pdf.line(margin, y, pageW - margin, y)
      y += 6
      pdf.setTextColor(30, 30, 30)
    }

    const row = (label, value) => {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(80, 80, 80)
      pdf.text(label, margin, y)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(30, 30, 30)
      pdf.text(String(value), margin + 55, y)
      y += 7
    }

    const bodyText = (text) => {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(50, 50, 50)
      const lines = pdf.splitTextToSize(text, pageW - margin * 2)
      pdf.text(lines, margin, y)
      y += lines.length * 5.5 + 4
    }

    if (doc.title === 'Loan Agreement') {
      sectionTitle('Parties')
      row('Lender:', 'National Mortgage Bank Ltd (ABN 12 345 678 900)')
      row('Borrower:', 'Madhu Munigala')
      row('Borrower ABN:', '98 765 432 100')
      y += 3
      sectionTitle('Loan Details')
      row('Loan Amount:', 'A$980,000')
      row('Interest Rate:', '6.25% p.a. (variable)')
      row('Term:', '25 years')
      row('Repayment Type:', 'Principal & Interest')
      row('Start Date:', '15 January 2021')
      row('Security:', liveCase?.property_address || '—')
      y += 3
      sectionTitle('Default & Enforcement')
      row('Default Date:', '10 October 2025')
      row('Arrears:', 'A$18,500')
      row('Notice Issued:', '01 November 2025')
      y += 3
      sectionTitle('Terms & Conditions')
      bodyText('This agreement is governed by the laws of New South Wales, Australia. The borrower acknowledges receipt of the loan and agrees to repay the principal and interest as scheduled. In the event of default, the lender reserves the right to enforce the mortgage security in accordance with applicable legislation, including the Real Property Act 1900 and National Consumer Credit Protection Act 2009.')
    } else if (doc.title === 'Property Valuation') {
      sectionTitle('Property Details')
      row('Address:', liveCase?.property_address || '—')
      row('Property Type:', 'Residential — Apartment')
      row('Lot & DP:', 'Lot 8 DP 123456')
      row('Land Area:', '142 m²')
      row('Floor Area:', '190 m²')
      row('Year Built:', '1995')
      row('Condition:', 'Good')
      y += 3
      sectionTitle('Valuation Summary')
      row('Valuation Date:', '15 January 2026')
      row('Market Value:', 'A$1,250,000')
      row('Valuation Method:', 'Direct Comparison')
      row('Valuer:', 'Preston Rowe Paterson Pty Ltd')
      row('Licence No.:', 'V-12345 (NSW)')
      y += 3
      sectionTitle('Comparable Sales')
      row('43 Victoria St:', 'A$1,210,000 (Dec 2025)')
      row('51 Victoria St:', 'A$1,280,000 (Nov 2025)')
      row('12 Macleay St:', 'A$1,195,000 (Oct 2025)')
      y += 3
      sectionTitle('Valuer\'s Comments')
      bodyText('The property is a well-maintained residential apartment in a sought-after harbourside suburb. Recent renovations including a new kitchen and bathroom have positively influenced value. Market conditions remain stable with consistent buyer demand in the Potts Point precinct.')
    } else if (doc.title === 'Title Search') {
      sectionTitle('Title Information')
      row('Title Reference:', 'Folio 8/123456')
      row('Local Government:', 'City of Sydney Council')
      row('Estate:', 'Fee Simple')
      row('Registered Owner:', 'Madhu Munigala')
      row('Search Date:', '10 February 2026')
      y += 3
      sectionTitle('Encumbrances & Interests')
      row('Mortgage:', 'National Mortgage Bank Ltd — Reg. No. AM 987654')
      row('Covenant:', 'No adverse covenants noted')
      row('Easements:', 'Nil')
      row('Caveats:', 'Nil')
      row('PPSR Interests:', 'Nil registered against property')
      y += 3
      sectionTitle('Zoning')
      row('Zone:', 'R1 General Residential')
      row('Floor Space Ratio:', '0.5:1')
      row('Height Limit:', '8.5 m')
      y += 3
      sectionTitle('Search Notes')
      bodyText('This title search has been conducted as at the date noted above. All interests registered on the title have been accurately reported. Parties should conduct their own further searches as required prior to settlement.')
    } else {
      sectionTitle('Policy Details')
      row('Policy Number:', 'HBI-2026-004521')
      row('Insurer:', 'NRMA Insurance Ltd')
      row('Insured:', 'Madhu Munigala')
      row('Property:', liveCase?.property_address || '—')
      row('Sum Insured:', 'A$1,500,000 (building replacement)')
      row('Commencement:', '1 January 2026')
      row('Expiry:', '31 December 2026')
      row('Premium:', 'A$2,400 p.a. (paid)')
      y += 3
      sectionTitle('Cover Summary')
      row('Building:', 'Full replacement value')
      row('Storm & Flood:', 'Included')
      row('Fire:', 'Included')
      row('Public Liability:', 'A$20,000,000')
      row('Excess:', 'A$500 per claim')
      y += 3
      sectionTitle('Special Conditions')
      bodyText('This policy is noted in favour of National Mortgage Bank Ltd as mortgagee in accordance with standard mortgage interest conditions. The insurer must notify the mortgagee of any cancellation or material change to this policy. Claims are subject to full policy terms and conditions.')
    }

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(160, 160, 160)
    pdf.text('This is a sample document for demonstration purposes only. BriqBanq Mortgage Resolution Platform — Confidential.', margin, 285)

    return pdf.output('bloburl')
  }

  const handleViewDocument = (doc) => () => {
    if (!docBlobUrlsRef.current[doc.title]) {
      docBlobUrlsRef.current[doc.title] = generateDocumentPdf(doc)
    }
    setViewingDocument({ ...doc, viewUrl: docBlobUrlsRef.current[doc.title] })
  }
  const handleCloseDocumentView = () => setViewingDocument(null)

  const handleDownloadDocument = async (doc) => {
    const id = doc.id ?? doc.title
    setDownloadingDocId(id)
    const filename = `${(doc.title || 'document').replace(/\s+/g, '-')}`
    try {
      if (doc.downloadUrl) {
        const res = await fetch(doc.downloadUrl)
        if (!res.ok) throw new Error('Download failed')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.${(doc.type || 'pdf').toLowerCase()}`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 200)
      } else {
        const isPdf = (doc.type || 'PDF').toLowerCase() === 'pdf'
        let blob
        if (isPdf) {
          try {
            const pdfInstance = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
            const blobUrl = generateDocumentPdf(doc)
            const res = await fetch(blobUrl)
            if (res.ok) blob = await res.blob()
          } catch { /* ignore */ }
        }
        if (!blob) {
          const text = `\n${doc.title}\n${'='.repeat(Math.min(60, (doc.title || '').length))}\n\n${doc.description || ''}\n\nGenerated from Brickbanq Auction Room.\nDate: ${new Date().toLocaleString('en-AU')}\n`
          blob = new Blob([text], { type: 'text/plain' })
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.${blob.type?.includes('pdf') ? 'pdf' : 'txt'}`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 200)
      }
    } catch (err) {
      console.error('Download failed', err)
      const blob = new Blob([`${doc.title}\n\n${doc.description || ''}\n\n(Download failed; saving as text.)`], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.txt`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 200)
    } finally {
      setDownloadingDocId(null)
    }
  }

  const address = liveCase?.property_address || data.address || 'Property Address Not Set'
  const location = liveCase?.property_type || ''

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-full max-w-[1600px] mx-auto">
      {/* Header + breadcrumb + LIVE badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Breadcrumb
            items={[
              { label: 'Dashboard', path: '/borrower/dashboard' },
              { label: 'Borrower', path: '/borrower/dashboard' },
              { label: 'Live Auction' },
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900">Auction Room</h1>
        </div>
        {(data.auctionStatus || data.status) && (
          <button
            type="button"
            className={`px-4 py-2 text-white font-semibold rounded-lg text-sm uppercase tracking-wide ${
              data.auctionStatus === 'LIVE' ? 'bg-red-600 hover:bg-red-700'
              : data.auctionStatus === 'SCHEDULED' ? 'bg-amber-500 hover:bg-amber-600'
              : data.auctionStatus === 'PAUSED' ? 'bg-gray-500 hover:bg-gray-600'
              : data.auctionStatus === 'ENDED' ? 'bg-slate-500 hover:bg-slate-600'
              : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {data.auctionStatus === 'LIVE' ? 'Live Auction'
              : data.auctionStatus === 'SCHEDULED' ? 'Auction Scheduled'
              : data.auctionStatus === 'PAUSED' ? 'Auction Paused'
              : data.auctionStatus === 'ENDED' ? 'Auction Ended'
              : 'In Auction'}
          </button>
        )}
      </div>

      {/* Hero: property media + countdown */}
      <div className="relative rounded-xl overflow-hidden bg-gray-900 shadow-xl">
        <div className="flex flex-col lg:flex-row">
          <div className="relative flex-1 min-h-[280px] lg:min-h-[360px]">
            <img
              src={images[imageIndex]}
              alt="Property"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-gray-800 shadow"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-gray-800 shadow"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
              <p className="font-semibold">{address}</p>
              <p className="text-sm opacity-90">{location}</p>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 rounded-lg p-1">
              {MEDIA_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMediaTab(tab.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 ${
                    mediaTab === tab.id ? 'bg-white text-gray-900' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:w-48 shrink-0 bg-red-600 flex flex-col items-center justify-center p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider">Auction Ends In</p>
            <div className="mt-2 font-mono text-2xl font-bold tabular-nums">
              {!endDate ? (
                <span className="text-sm font-medium opacity-80">Pending</span>
              ) : countdown.status === 'Ended' ? (
                'Ended'
              ) : (
                <>
                  <span>{String(countdown.days ?? 0).padStart(2, '0')}d </span>
                  <span>{String(countdown.hours ?? 0).padStart(2, '0')}</span>
                  <span className="opacity-70">:</span>
                  <span>{String(countdown.minutes ?? 0).padStart(2, '0')}</span>
                  <span className="opacity-70">:</span>
                  <span>{String(countdown.seconds ?? 0).padStart(2, '0')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6 stat cards */}
      {(() => {
        const propVal = data.financials?.propertyValue || 0
        const debt = data.financials?.outstandingDebt || 0
        const lvr = propVal > 0 ? ((debt / propVal) * 100).toFixed(1) : '—'
        const interestRate = liveCase?.interest_rate
        const totalBidders = bidHistory.length
        return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { title: 'Total Bidders', value: totalBidders, sub: 'People have placed their bids', bg: 'bg-red-50', border: 'border-red-100' },
          { title: 'Property Value', value: formatShort(propVal), sub: 'Estimated property value', bg: 'bg-amber-50', border: 'border-amber-100' },
          { title: 'Interest Rate', value: interestRate != null ? `${interestRate}%` : '—', sub: 'Loan interest rate p.a.', bg: 'bg-blue-50', border: 'border-blue-100' },
          { title: 'Loan-To-Value', value: propVal > 0 ? `${lvr}%` : '—', sub: 'Outstanding debt / Property value', bg: 'bg-purple-50', border: 'border-purple-100' },
          { title: 'Outstanding Debt', value: formatShort(debt), sub: 'Total outstanding loan amount', bg: 'bg-green-50', border: 'border-green-100' },
          { title: 'Current High Bid', value: currentBid > 0 ? formatShort(currentBid) : 'No bids yet', sub: 'Highest bid placed so far', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        ].map((card) => (
          <div key={card.title} className={`rounded-xl border p-4 ${card.bg} ${card.border}`}>
            <p className="text-xs font-medium text-gray-600">{card.title}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>
        )
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Estimated Property Value</p>
                <p className="text-lg font-bold text-gray-900">{formatAud(data.financials?.propertyValue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Outstanding Debt</p>
                <p className="text-lg font-bold text-gray-900">{formatAud(data.financials?.outstandingDebt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Interest Rate</p>
                <p className="text-lg font-bold text-gray-900">{liveCase?.interest_rate != null ? `${liveCase.interest_rate}% p.a.` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tenure</p>
                <p className="text-lg font-bold text-gray-900">{liveCase?.tenure != null ? `${liveCase.tenure} months` : '—'}</p>
              </div>
            </div>
            {currentBid > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900">
                Current highest bid: <strong>{formatAud(currentBid)}</strong>. Approve the winning bid when you are ready to close the auction.
              </div>
            )}
            {currentBid === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                No bids have been placed yet. Your property is live in the auction marketplace.
              </div>
            )}
          </div>

          {/* Property Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <span className="text-gray-500">Property Type:</span><span className="font-medium text-gray-900">{liveCase?.property_type || '—'}</span>
              <span className="text-gray-500">Address:</span><span className="font-medium text-gray-900">{liveCase?.property_address || '—'}</span>
              <span className="text-gray-500">Case Reference:</span><span className="font-medium text-gray-900">{liveCase?.case_number || liveCase?.id?.slice(0, 8)?.toUpperCase() || '—'}</span>
              <span className="text-gray-500">Status:</span><span className="font-medium text-gray-900">{liveCase?.status || '—'}</span>
              <span className="text-gray-500">Description:</span><span className="font-medium text-gray-900 col-span-1">{liveCase?.description || '—'}</span>
            </div>
          </div>

          {/* Mortgage & Financial */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mortgage & Financial Information</h2>
            <p className="text-sm text-gray-600 mb-4">
              The current outstanding loan amount is {formatAud(data.financials?.outstandingDebt || 0)}.
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ['Interest Rate', liveCase?.interest_rate != null ? `${liveCase.interest_rate}% p.a.` : '—'],
                ['Outstanding Debt', formatAud(data.financials?.outstandingDebt)],
                ['Estimated Value', formatAud(data.financials?.propertyValue)],
                ['Tenure', liveCase?.tenure != null ? `${liveCase.tenure} months` : '—'],
                ['Borrower Name', liveCase?.borrower_name || '—'],
              ].map(([label, val]) => (
                <React.Fragment key={label}>
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{val}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Verification & Due Diligence */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification & Due Diligence</h2>
            <ul className="space-y-2 mb-6">
              {(data.verificationDueDiligence || []).map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </span>
                  <span>{item.label} ({item.status})</span>
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium text-gray-700 mb-3">Additional Due Diligence</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {(data.dueDiligenceGrid || []).map((item) => (
                <div key={item.label} className="border rounded-lg p-3 flex items-center gap-2">
                  {item.status === 'Completed' ? (
                    <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </span>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all"
                  style={{ width: `${data.dueDiligenceProgress ?? 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700">Due Diligence Complete {data.dueDiligenceProgress ?? 100}%</span>
            </div>
            <span className="text-sm text-indigo-600 mt-1 inline-block">Contact your case manager for the due diligence report.</span>
          </div>

          {/* Available Documents */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Documents</h2>
            <div className="space-y-3">
              {(data.availableDocuments || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No documents uploaded yet.</p>
              ) : (data.availableDocuments || []).map((doc) => (
                <div key={doc.id ?? doc.title} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{doc.title}</p>
                    <p className="text-xs text-gray-500">{doc.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleViewDocument(doc)} className="px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50">
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadDocument(doc)}
                      disabled={downloadingDocId === (doc.id ?? doc.title)}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Download ${doc.title}`}
                    >
                      {downloadingDocId === (doc.id ?? doc.title) ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Approve Bid + Bid History + Summary */}
        <div className="space-y-6 sticky top-4 self-start">
          {/* Approve Highest Bid Panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Highest Bid</h2>
            {currentBid > 0 ? (
              <>
                <p className="text-3xl font-bold text-green-600 mb-1">{formatAud(currentBid)}</p>
                {winningBid?.bidder_name && (
                  <p className="text-sm text-gray-500 mb-4">By <strong>{winningBid.bidder_name}</strong></p>
                )}
                {approveSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 font-medium">
                    Bid approved! Auction closed. Email notifications have been sent to all parties.
                  </div>
                ) : (
                  <>
                    {approveError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-3">
                        {approveError}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={approving || !winningBid}
                      onClick={async () => {
                        if (!winningBid) return
                        if (!window.confirm(`Approve the bid of ${formatAud(currentBid)} from ${winningBid.bidder_name || 'this bidder'}? This will close the auction and notify all parties.`)) return
                        setApproving(true)
                        setApproveError(null)
                        const res = await auctionService.approveBid(winningBid.id)
                        setApproving(false)
                        if (res.success) {
                          setApproveSuccess(true)
                        } else {
                          setApproveError(res.error || 'Failed to approve bid')
                        }
                      }}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg"
                    >
                      {approving ? 'Approving…' : 'Approve Highest Bid & Close Auction'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      This will close the auction and send email notifications to all bidders, admin, and yourself.
                    </p>
                  </>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-sm">No bids have been placed yet. Your property is live in the auction marketplace.</p>
            )}
          </div>

          {/* Bid History */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 p-5 pb-3">Bid History ({bidHistory.length})</h2>
            <div className="max-h-[320px] overflow-y-auto p-2">
              {bidHistory.length === 0 ? (
                <p className="text-sm text-gray-500 p-4">No bids yet.</p>
              ) : (
                <ul className="space-y-1">
                  {bidHistory.map((bid, i) => (
                    <li key={bid.id || i} className="flex items-start justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{formatAud(Number(bid.amount))}</p>
                        <p className="text-xs text-gray-600">{bid.bidder_name || 'Bidder'}</p>
                        <p className="text-xs text-gray-400">{bid.created_at ? new Date(bid.created_at).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                      </div>
                      <span className={`ml-2 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${bid.status === 'WINNING' || bid.status === 'WON' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {bid.status === 'WINNING' ? 'Highest' : bid.status === 'WON' ? 'Won' : 'Outbid'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Summary</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
              <span className="text-gray-500">Property Value:</span>
              <span className="font-medium text-gray-900">{formatShort(data.financials?.propertyValue || 0)}</span>
              <span className="text-gray-500">Outstanding Debt:</span>
              <span className="font-medium text-gray-900">{formatShort(data.financials?.outstandingDebt || 0)}</span>
              <span className="text-gray-500">LVR:</span>
              <span className="font-medium text-gray-900">
                {data.financials?.propertyValue > 0
                  ? `${((data.financials.outstandingDebt / data.financials.propertyValue) * 100).toFixed(1)}%`
                  : '—'}
              </span>
            </div>
            <button type="button" onClick={() => navigate('/borrower/my-case')} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg">
              View Case Details
            </button>
          </div>
        </div>
      </div>

      {/* Document preview modal */}
      {viewingDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="document-preview-title"
          onClick={(e) => e.target === e.currentTarget && handleCloseDocumentView()}
          onKeyDown={(e) => e.key === 'Escape' && handleCloseDocumentView()}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 id="document-preview-title" className="text-lg font-semibold text-gray-900">
                {viewingDocument.title}
              </h2>
              <button
                type="button"
                onClick={handleCloseDocumentView}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 p-4">
              <iframe
                src={viewingDocument.viewUrl}
                title={viewingDocument.title}
                className="w-full h-[70vh] rounded-lg border border-gray-200"
              />
              {viewingDocument.description && (
                <p className="text-sm text-gray-500 mt-2">{viewingDocument.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
