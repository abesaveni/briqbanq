import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import StatCard from './components/StatCard'
import ProgressBar from './components/ProgressBar'
import DocumentUpload from '../../components/common/DocumentUpload'
import { borrowerService, documentService } from '../../api/dataService'

const formatNum = (n) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

export default function BorrowerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [documents, setDocuments] = useState([])
  const [caseData, setCaseData] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadTargetDoc, setUploadTargetDoc] = useState(null)
  const activeCaseIdRef = useRef(null)

  const fetchDocuments = (caseId) => {
    if (!caseId) return
    borrowerService.getCaseDocuments(caseId)
      .then((docRes) => {
        const list = docRes.success ? docRes.data : null
        const items = Array.isArray(list) ? list : (list?.items || [])
        setDocuments(items.map((d) => ({
          id: d.id,
          title: d.document_name || d.file_name || d.title || d.name || 'Document',
          status: 'uploaded',
          uploadedDate: d.created_at
            ? new Date(d.created_at).toLocaleDateString('en-AU')
            : '',
          url: d.file_url || d.url || null,
        })))
      })
      .catch(() => {})
  }

  useEffect(() => {
    borrowerService.getMyCase()
      .then((res) => {
        const raw = res.data
        if (!raw) return
        const meta = raw.metadata_json || {}
        const outstandingDebt = parseFloat(raw.outstanding_debt) || 0
        const interestRate = parseFloat(raw.interest_rate) || 0
        const daysInDefault = parseInt(meta.days_in_default) || 0
        const propertyValue = parseFloat(raw.estimated_value) || 0
        const arrearsAndInterest = interestRate > 0 && daysInDefault > 0
          ? Math.round(outstandingDebt * (interestRate / 100) * (daysInDefault / 365))
          : 0
        const totalAmountOwed = outstandingDebt + arrearsAndInterest
        const caseId = raw.id
        activeCaseIdRef.current = caseId
        setCaseData({
          id: caseId,
          case_number: raw.case_number,
          status: raw.status,
          outstanding_debt: outstandingDebt,
          interest_rate: interestRate,
          estimated_value: propertyValue,
          metadata_json: meta,
          created_at: raw.created_at,
          property_address: raw.property_address || '',
          property: {
            address: raw.property_address || '',
            suburb: meta.suburb || '',
            state: meta.state || '',
            postcode: meta.postcode || '',
            valuation: propertyValue,
          },
          financials: {
            originalLoanAmount: outstandingDebt,
            outstandingPrincipal: outstandingDebt,
            arrearsAndInterest,
            sellingCostsEst: 0,
            totalAmountOwed,
            currentHighestBid: 0,
            expectedShortfall: totalAmountOwed > 0 ? totalAmountOwed : 0,
          },
          auction: null,
          timeline_events: [],
        })
        // Fetch documents for this case
        if (caseId) {
          fetchDocuments(caseId)
          // Fetch timeline events
          borrowerService.getTimeline()
            .then((tlRes) => {
              const events = tlRes.success ? tlRes.data : null
              if (Array.isArray(events) && events.length > 0) {
                setCaseData((prev) => ({ ...prev, timeline_events: events }))
              }
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  const c = caseData || {}
  const fin = c.financials || {}
  const addressLine1 = c.property?.address || c.property_address || '—'
  const addressLine2 = c.property ? `${c.property.suburb || ''}, ${c.property.state || ''}` : (c.property_suburb || '')
  const nextMilestoneDate = c.auction?.endDate || c.auction_end_date
    ? new Date(c.auction?.endDate || c.auction_end_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const activeBidders = c.auction?.activeBidders ?? c.active_bidders ?? 0
  const currentBid = fin.currentHighestBid ?? c.current_highest_bid ?? 0
  const pendingDocCount = documents.filter((d) => d.status === 'pending').length

  const supportSectionRef = useRef(null)
  const [showSupportModal, setShowSupportModal] = useState(false)

  const handleViewAuction = () => navigate('/borrower/auction')
  const handleViewLiveAuction = () => navigate('/borrower/auction')
  const handleUploadDocument = () => {
    setUploadTargetDoc(null)
    setShowUpload(true)
  }
  const handleSupportResources = () => setShowSupportModal(true)
  const [showFaqModal, setShowFaqModal] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState(null)
  const handleContactSupport = () => setShowFaqModal(true)
  const handleDownloadDocument = (doc) => () => {
    const blob = new Blob([`Document: ${doc.title}\nUploaded: ${doc.uploadedDate}\n\n(This is a placeholder download.)`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  const handleUploadPendingDocument = (doc) => () => {
    setUploadTargetDoc(doc)
    setShowUpload(true)
  }

  const handleUploadSuccess = () => {
    setTimeout(() => setShowUpload(false), 2000)
    setTimeout(() => fetchDocuments(activeCaseIdRef.current), 500)
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-full">
      {/* Page title - Figma: "Dashboard" + subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(' ')[0] || "User"}</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your mortgage resolution case</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/borrower/new-case')}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] transition-transform shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Case
        </button>
      </div>

      {/* My Case Dashboard card - Figma: #1B2433 bg, #232C3D cards, exact fonts and accent colors */}
      <div className="rounded-xl p-5 text-white" style={{ backgroundColor: '#1B2433' }}>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#232C3D' }} aria-hidden>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">My Case Dashboard</h2>
              <p className="text-base font-normal text-white mt-1" style={{ opacity: 1 }}>Case Number: {c.case_number || c.id || '—'}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto sm:min-w-[220px]">
            <button
              type="button"
              onClick={handleViewAuction}
              className="flex items-center justify-center gap-2 bg-white text-black border border-gray-300 text-base font-normal px-4 py-2.5 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 active:scale-[0.98] transition-transform min-h-[44px] w-full"
            >
              <svg className="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View My Auction
            </button>
            <button
              type="button"
              onClick={handleSupportResources}
              className="flex items-center justify-center gap-2 min-h-[44px] bg-white text-black border border-gray-300 text-base font-normal px-4 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 active:scale-[0.98] transition-transform w-full"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Support
            </button>
          </div>
        </div>
        {/* Four info cards - Figma: #232C3D bg, label #A0A6AD, icons: blue/green/yellow/green */}
        <div className="mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg px-4 py-3.5" style={{ backgroundColor: '#232C3D' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal" style={{ color: '#A0A6AD' }}>Property</span>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="#7CC6FE" viewBox="0 0 24 24"><path stroke="#7CC6FE" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <p className="text-lg font-bold text-white mt-2">{addressLine1}</p>
            <p className="text-sm font-normal text-white mt-0.5">{addressLine2}</p>
          </div>
          <div className="rounded-lg px-4 py-3.5" style={{ backgroundColor: '#232C3D' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal" style={{ color: '#A0A6AD' }}>Case Status</span>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="#00FF7F" viewBox="0 0 24 24"><path stroke="#00FF7F" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h18v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            </div>
            <p className="text-lg font-bold text-white mt-2">{({'DRAFT':'Draft','SUBMITTED':'Submitted','UNDER_REVIEW':'Under Review','APPROVED':'Approved','LISTED':'Listed','AUCTION':'In Auction','FUNDED':'Funded','CLOSED':'Closed','REJECTED':'Rejected'})[c.status] || c.status || 'Active'}</p>
            <div className="w-full h-2 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: '#4B5563' }}>
              <div className="h-full rounded-full" style={{ width: '75%', backgroundColor: '#00FF7F' }} />
            </div>
          </div>
          <div className="rounded-lg px-4 py-3.5" style={{ backgroundColor: '#232C3D' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal" style={{ color: '#A0A6AD' }}>Next Milestone</span>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="#FFD700" viewBox="0 0 24 24"><path stroke="#FFD700" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-lg font-bold text-white mt-2">Auction End</p>
            <p className="text-sm font-normal mt-0.5" style={{ color: '#FFD700' }}>{nextMilestoneDate}</p>
          </div>
          <div className="rounded-lg px-4 py-3.5" style={{ backgroundColor: '#232C3D' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal" style={{ color: '#A0A6AD' }}>Current Bid</span>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="#00FF7F" viewBox="0 0 24 24"><path stroke="#00FF7F" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-lg font-bold text-white mt-2">{formatNum(currentBid)}</p>
            <p className="text-sm font-normal mt-0.5" style={{ color: '#00FF7F' }}>{activeBidders} active bidders</p>
          </div>
        </div>
      </div>

      {/* Alert Banners - only shown when there is real data */}
      {(c.auction || pendingDocCount > 0) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {c.auction && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-wrap items-start gap-3">
          <span className="text-blue-600 text-lg shrink-0" aria-hidden>ℹ️</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-blue-800">Auction Ending Soon</p>
            <p className="text-sm text-blue-800 mt-0.5">
              Your property auction ends in {nextMilestoneDate}. Current bid is {formatNum(currentBid)} with {activeBidders} active bidders.
            </p>
            <button
              type="button"
              onClick={handleViewLiveAuction}
              className="mt-2 min-h-[44px] px-4 py-2 bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] transition-transform"
            >
              View Live Auction
            </button>
          </div>
        </div>
        )}
        {pendingDocCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-wrap items-start gap-3">
          <span className="text-amber-600 text-lg shrink-0" aria-hidden>⚠️</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-800">Outstanding Document Required</p>
            <p className="text-sm text-amber-800 mt-0.5">
              You have {pendingDocCount} pending document{pendingDocCount > 1 ? 's' : ''} required for your case.
            </p>
            <button
              type="button"
              onClick={handleUploadDocument}
              className="mt-2 min-h-[44px] px-4 py-2 bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 active:scale-[0.98] transition-transform"
            >
              Upload Document
            </button>
          </div>
        </div>
        )}
      </div>
      )}

      {/* Stat cards - 4 in a row, exact Figma styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Property Value"
          value={c.property?.valuation ? formatNum(c.property.valuation) : '—'}
          sub="Independent valuation"
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />
        <StatCard
          label="Outstanding Balance"
          value={fin.outstandingPrincipal != null ? formatNum(fin.outstandingPrincipal) : '—'}
          sub={
            <span className="text-sm text-red-500">
              Inc. {fin.arrearsAndInterest != null ? formatNum(fin.arrearsAndInterest) : '—'} arrears
            </span>
          }
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Current Highest Bid"
          value={fin.currentHighestBid != null ? formatNum(fin.currentHighestBid) : '—'}
          valueColor="text-emerald-600"
          sub={`${activeBidders} active bidders`}
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h18v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          }
        />
        <StatCard
          label="Expected Shortfall"
          value={fin.expectedShortfall != null ? formatNum(fin.expectedShortfall) : '—'}
          valueColor="text-amber-600"
          sub="Based on current bid"
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Tabs - pill style: active = indigo bg white text, inactive = white/dark gray */}
      <div className="border-b border-gray-200 pb-0">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 border-b-0 -mb-px hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              activeTab === 'timeline'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 border-b-0 -mb-px hover:bg-gray-50'
            }`}
          >
            Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              activeTab === 'documents'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 border-b-0 -mb-px hover:bg-gray-50'
            }`}
          >
            Documents
            {pendingDocCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500 text-white">
                {pendingDocCount} pending
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Breakdown</h2>
            <div className="space-y-0">
              <div className="flex justify-between items-center py-3 border-b border-gray-100 text-sm">
                <span className="text-gray-700">Original Loan Amount</span>
                <span className="font-medium text-gray-900">{fin.originalLoanAmount != null ? formatNum(fin.originalLoanAmount) : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100 text-sm">
                <span className="text-gray-700">Outstanding Principal</span>
                <span className="font-medium text-gray-900">{fin.outstandingPrincipal != null ? formatNum(fin.outstandingPrincipal) : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100 text-sm">
                <span className="text-gray-700">Arrears & Interest</span>
                <span className="font-medium text-red-500">{fin.arrearsAndInterest != null ? formatNum(fin.arrearsAndInterest) : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100 text-sm">
                <span className="text-gray-700">Selling Costs (est.)</span>
                <span className="font-medium text-gray-900">{fin.sellingCostsEst != null ? formatNum(fin.sellingCostsEst) : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100 text-sm">
                <span className="text-gray-700">Total Amount Owed</span>
                <span className="font-bold text-gray-900">{fin.totalAmountOwed != null ? formatNum(fin.totalAmountOwed) : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100 text-sm bg-emerald-50/50">
                <span className="text-gray-700">Current Highest Bid</span>
                <span className="font-medium text-emerald-600">{fin.currentHighestBid != null ? formatNum(fin.currentHighestBid) : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3 text-sm bg-amber-50/50">
                <span className="text-gray-700">Expected Shortfall</span>
                <span className="font-medium text-amber-600">{fin.expectedShortfall != null ? formatNum(fin.expectedShortfall) : '—'}</span>
              </div>
            </div>
          </div>

          <div ref={supportSectionRef} id="support-section" className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              Your Rights & Support
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Financial Hardship:</strong> If you're experiencing financial hardship, you may be eligible for assistance programs or payment arrangements.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Legal Advice:</strong> We recommend seeking independent legal advice about your rights and obligations.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Free Resources:</strong> National Debt Helpline: 1800 007 007 (free financial counselling)
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                type="button"
                onClick={handleSupportResources}
                className="min-h-[44px] inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 active:scale-[0.98] transition-transform"
              >
                <span className="text-gray-500">?</span>
                Support Resources
              </button>
              <button
                type="button"
                onClick={handleContactSupport}
                className="min-h-[44px] inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 active:scale-[0.98] transition-transform"
              >
                <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Support
              </button>
            </div>
          </div>
        </>
      )}

      {/* Timeline tab - vertical timeline, green/grey line, icons */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {(c.timeline_events || c.timelineEvents || []).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No timeline events yet.</p>
          )}
          <div className="relative">
            {(c.timeline_events || c.timelineEvents || []).map((event, index) => {
              const isLast = index === (c.timeline_events || c.timelineEvents || []).length - 1
              const isCompleted = event.completed
              return (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {event.icon === 'check' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {event.icon === 'document' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {event.icon === 'chart' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h18v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      )}
                      {event.icon === 'clock' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {event.icon === 'dollar' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 mt-2 flex-shrink-0 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        style={{ height: 48, width: 2 }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-wrap justify-between gap-2 pt-0.5 pb-8">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                    </div>
                    {event.date && (
                      <p className="text-sm text-gray-500 shrink-0">{event.date}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Documents tab - green cards (uploaded) + yellow card (pending) */}
      {activeTab === 'documents' && (
        <div id="dashboard-documents-section" className="space-y-4">
          {documents.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">No documents uploaded yet.</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) =>
            (doc.status === 'uploaded' || !doc.status) ? (
              <div
                key={doc.id}
                className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{doc.title}</p>
                    <p className="text-sm text-gray-600">Uploaded {doc.uploadedDate}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadDocument(doc)}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shrink-0 flex items-center justify-center"
                  aria-label={`Download ${doc.title}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                key={doc.id}
                className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{doc.title}</p>
                    <p className="text-sm text-gray-600">{doc.requirement}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUploadPendingDocument(doc)}
                  className="min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] transition-transform"
                >
                  Upload
                </button>
              </div>
            )
          )}
          </div>
        </div>
      )}


      {/* Document Upload Modal */}
      {showUpload && (
        <DocumentUpload
          documentLabel={uploadTargetDoc?.title ?? 'Settlement Statement'}
          onSuccess={handleUploadSuccess}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* Contact Support Modal */}
      {showFaqModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="faq-modal-title"
          onClick={(e) => e.target === e.currentTarget && setShowFaqModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowFaqModal(false)}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 id="faq-modal-title" className="text-sm font-semibold text-gray-900">Contact Support</h2>
              <button type="button" onClick={() => setShowFaqModal(false)} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Close">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Contact options */}
            <div className="px-4 py-4 space-y-2">
              <p className="text-xs text-gray-500 mb-3">Our team typically responds within one business day.</p>

              <a href="mailto:support@briqbanq.com?subject=Dashboard%20Support" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Email Support</p>
                  <p className="text-xs text-gray-500">support@briqbanq.com</p>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Debt Helpline</p>
                  <p className="text-xs text-gray-500">1800 007 007 · Free &amp; confidential</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">AFCA Disputes</p>
                  <p className="text-xs text-gray-500">1800 931 678 · afca.org.au</p>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4">
              <button type="button" onClick={() => setShowFaqModal(false)} className="w-full py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Resources Modal */}
      {showSupportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-modal-title"
          onClick={(e) => e.target === e.currentTarget && setShowSupportModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowSupportModal(false)}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 id="support-modal-title" className="text-sm font-semibold text-gray-900">Support Resources</h2>
              <button type="button" onClick={() => setShowSupportModal(false)} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Close">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-4 py-3 space-y-1.5">
              <p className="text-xs text-gray-500 mb-2">Free &amp; confidential services available to you.</p>
              {[
                { name: 'National Debt Helpline',  phone: '1800 007 007', url: 'https://ndh.org.au',             color: 'bg-blue-50 text-blue-600' },
                { name: 'MoneySmart (ASIC)',        phone: null,           url: 'https://moneysmart.gov.au',      color: 'bg-teal-50 text-teal-600' },
                { name: 'AFCA Disputes',            phone: '1800 931 678', url: 'https://afca.org.au',            color: 'bg-amber-50 text-amber-600' },
                { name: 'Legal Aid NSW',            phone: null,           url: 'https://www.legalaid.nsw.gov.au', color: 'bg-violet-50 text-violet-600' },
                { name: 'Beyond Blue',              phone: '1300 22 4636', url: 'https://beyondblue.org.au',      color: 'bg-green-50 text-green-600' },
              ].map((r) => (
                <div key={r.name} className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${r.color.split(' ')[0]}`} style={{ background: 'currentColor' }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{r.name}</p>
                      {r.phone && <p className="text-xs text-gray-500">{r.phone}</p>}
                    </div>
                  </div>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline shrink-0 ml-3">Visit →</a>
                </div>
              ))}
            </div>

            <div className="px-4 pb-4 pt-2">
              <button type="button" onClick={() => setShowSupportModal(false)} className="w-full py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
