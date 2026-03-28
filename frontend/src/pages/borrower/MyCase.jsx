import { useState, useMemo, useEffect } from 'react'
import Breadcrumb from './components/Breadcrumb'
import CaseHeader from './my-case/CaseHeader'
import ManageCaseModal from './my-case/ManageCaseModal'
import DashboardTab from './my-case/tabs/DashboardTab'
import FullDetailsTab from './my-case/tabs/FullDetailsTab'
import LawyerReviewTab from './my-case/tabs/LawyerReviewTab'
import PropertyTab from './my-case/tabs/PropertyTab'
import DocumentsTab from './my-case/tabs/DocumentsTab'
import InvestmentMemoTab from './my-case/tabs/InvestmentMemoTab'
import SettlementTab from './my-case/tabs/SettlementTab'
import BidsTab from './my-case/tabs/BidsTab'
import MessagesTab from './my-case/tabs/MessagesTab'
import { caseService, casesService, auctionService } from '../../api/dataService'
import { borrowerApi } from './api'
import { generateInvestmentMemorandumPDF } from '../../utils/pdfGenerator'

const EMPTY_CASE = { id: null, status: 'pending', borrower: '', lender: '', lawyer: '', riskLevel: '', property: { address: '', suburb: '', state: '', postcode: '', type: '', valuation: 0, bedrooms: 0, bathrooms: 0, valuationDate: '', valuer: '' }, financials: { outstandingPrincipal: 0, currentHighestBid: 0 } }
const EMPTY_SETTLEMENT_SUMMARY = { total: 0, completed: 0, inProgress: 0, notStarted: 0 }

const TAB_ICONS = {
  dashboard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  ),
  'full-details': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ),
  'lawyer-review': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
  ),
  property: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  ),
  documents: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
  ),
  'investment-memorandum': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  ),
  settlement: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  ),
  bids: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  messages: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
  ),
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'full-details', label: 'Full Details' },
  { id: 'lawyer-review', label: 'Lawyer Review' },
  { id: 'property', label: 'Property' },
  { id: 'documents', label: 'Documents' },
  { id: 'investment-memorandum', label: 'Investment Memorandum' },
  { id: 'settlement', label: 'Settlement' },
  { id: 'bids', label: 'Bids' },
  { id: 'messages', label: 'Messages' },
]

function transformRawCase(rawCase) {
  const meta = rawCase.metadata_json || {}
  const outstandingDebt = parseFloat(rawCase.outstanding_debt || rawCase.loan_amount) || 0
  const interestRate = parseFloat(rawCase.interest_rate) || 0
  const daysInDefault = parseInt(meta.days_in_default) || 0
  const propertyValue = parseFloat(rawCase.estimated_value || rawCase.property_value) || 0
  const arrearsAndInterest = interestRate > 0 && daysInDefault > 0
    ? Math.round(outstandingDebt * (interestRate / 100) * (daysInDefault / 365))
    : 0
  const equityAvailable = propertyValue > outstandingDebt ? Math.round(propertyValue - outstandingDebt) : 0
  const lvr = propertyValue > 0 ? Math.round((outstandingDebt / propertyValue) * 1000) / 10 : 0
  const daysActive = rawCase.created_at
    ? Math.floor((Date.now() - new Date(rawCase.created_at).getTime()) / 86400000)
    : 0
  const missedPayments = parseInt(meta.missed_payments) || 0
  return {
    ...EMPTY_CASE,
    id: rawCase.id,
    case_number: rawCase.case_number,
    status: rawCase.status,
    riskLevel: rawCase.risk_level || '',
    outstanding_debt: outstandingDebt,
    interest_rate: interestRate,
    estimated_value: propertyValue,
    metadata_json: meta,
    property_images: Array.isArray(meta.property_images) ? meta.property_images : (Array.isArray(rawCase.property_images) ? rawCase.property_images : []),
    created_at: rawCase.created_at,
    days_active: daysActive,
    missed_payments: missedPayments,
    caseCreated: rawCase.created_at ? new Date(rawCase.created_at).toLocaleString('en-AU') : '—',
    lastUpdated: rawCase.updated_at ? new Date(rawCase.updated_at).toLocaleString('en-AU') : '—',
    urgencyLevel: meta.case_urgency || '—',
    totalBids: rawCase.total_bids || 0,
    currentHighestBid: rawCase.current_highest_bid || 0,
    lvr,
    equityAvailable,
    borrower: {
      name: rawCase.borrower_name || (meta.first_name && meta.last_name ? `${meta.first_name} ${meta.last_name}` : meta.first_name || rawCase.borrower || ''),
      email: meta.email_address || '',
      phone: meta.phone_number || '',
      dateOfBirth: meta.date_of_birth || '',
      employmentStatus: meta.employment_status || '',
      employer: meta.employer || '',
      occupation: meta.occupation || '',
    },
    lender: rawCase.lender_name || meta.lender_name || '',
    lawyer: rawCase.lawyer_name || meta.borrower_lawyer_name || '',
    property: {
      address: rawCase.property_address || '',
      suburb: meta.suburb || '',
      state: meta.state || '',
      postcode: meta.postcode || '',
      type: rawCase.property_type || meta.type_of_security || '',
      valuation: propertyValue,
      bedrooms: parseInt(meta.bedrooms) || 0,
      bathrooms: parseInt(meta.bathrooms) || 0,
      parking: parseInt(meta.parking) || 0,
      valuationDate: meta.valuation_date || '',
      valuer: meta.valuer_name || meta.valuation_provider || '',
      yearBuilt: meta.year_built || '',
      floorArea: meta.floor_area ? `${meta.floor_area} m²` : '',
      condition: meta.property_condition || '',
      construction: meta.construction_type || '',
      zoning: meta.zoning || '',
      titleReference: meta.title_reference || '',
      lotPlan: meta.lot_plan || '',
      lga: meta.lga || '',
    },
    financials: {
      outstandingPrincipal: outstandingDebt,
      arrearsAndInterest,
      currentHighestBid: rawCase.current_highest_bid || 0,
      totalAmountOwed: outstandingDebt + arrearsAndInterest,
      expectedShortfall: outstandingDebt + arrearsAndInterest,
    },
    loanDetails: {
      originalLoanAmount: meta.original_loan_amount ? parseFloat(meta.original_loan_amount) : outstandingDebt,
      interestRate: interestRate ? `${interestRate}%` : '—',
      missedPayments: meta.missed_payments || daysInDefault > 0 ? (meta.missed_payments || Math.floor(daysInDefault / 30)) : 0,
      repaymentType: meta.repayment_type || '',
      defaultDate: meta.default_notice_date || '',
      loanStartDate: meta.loan_start_date || '',
      defaultReason: meta.reason_for_default || '',
      hardshipCircumstances: meta.hardship_circumstances || '',
    },
    lenderDetails: {
      name: meta.lender_name || rawCase.lender_name || '',
      contactPerson: meta.lender_contact || '',
      phone: meta.lender_phone || '',
      accountNumber: meta.loan_account_number || '',
      licenceType: meta.lender_licence_type || '',
      email: meta.lender_email || '',
      aclHolder: '',
      aclNumber: '',
    },
    ratesAndCharges: {
      councilRates: meta.council_rates ? parseFloat(meta.council_rates) : null,
      waterRates: meta.water_rates ? parseFloat(meta.water_rates) : null,
      strataFees: meta.strata_fees ? parseFloat(meta.strata_fees) : null,
      landTax: meta.land_tax ? parseFloat(meta.land_tax) : null,
    },
    environmentalRisk: {
      flood: meta.flood_risk || 'Low',
      bushfire: meta.bushfire_risk || 'Low',
    },
    avm: {
      mid: meta.avm_mid ? parseFloat(meta.avm_mid) : (propertyValue || null),
      low: meta.avm_low ? parseFloat(meta.avm_low) : null,
      high: meta.avm_high ? parseFloat(meta.avm_high) : null,
      lastSaleDate: meta.last_sale_date || '',
      lastSalePrice: meta.last_sale_price ? parseFloat(meta.last_sale_price) : null,
      confidence: meta.avm_confidence || '',
    },
  }
}

const STATUS_CONFIG = {
  active:        { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', border: 'border-l-emerald-500', dot: 'bg-emerald-500', label: 'Active' },
  approved:      { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', border: 'border-l-emerald-500', dot: 'bg-emerald-500', label: 'Approved' },
  pending:       { badge: 'bg-amber-100 text-amber-700 border-amber-200',       bar: 'bg-amber-400',   border: 'border-l-amber-400',   dot: 'bg-amber-400',   label: 'Pending' },
  submitted:     { badge: 'bg-blue-100 text-blue-700 border-blue-200',          bar: 'bg-blue-500',    border: 'border-l-blue-500',    dot: 'bg-blue-500',    label: 'Submitted' },
  'under review':{ badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',    bar: 'bg-indigo-500',  border: 'border-l-indigo-500',  dot: 'bg-indigo-500',  label: 'Under Review' },
  auction:       { badge: 'bg-purple-100 text-purple-700 border-purple-200',    bar: 'bg-purple-500',  border: 'border-l-purple-500',  dot: 'bg-purple-500',  label: 'Auction' },
  'in default':  { badge: 'bg-orange-100 text-orange-700 border-orange-200',    bar: 'bg-orange-500',  border: 'border-l-orange-500',  dot: 'bg-orange-500',  label: 'In Default' },
  closed:        { badge: 'bg-gray-100 text-gray-500 border-gray-200',          bar: 'bg-gray-400',    border: 'border-l-gray-400',    dot: 'bg-gray-400',    label: 'Closed' },
  rejected:      { badge: 'bg-red-100 text-red-700 border-red-200',             bar: 'bg-red-500',     border: 'border-l-red-500',     dot: 'bg-red-500',     label: 'Rejected' },
  settled:       { badge: 'bg-teal-100 text-teal-700 border-teal-200',          bar: 'bg-teal-500',    border: 'border-l-teal-500',    dot: 'bg-teal-500',    label: 'Settled' },
}
const getStatusCfg = (s) => STATUS_CONFIG[(s || '').toLowerCase()] || { badge: 'bg-gray-100 text-gray-500 border-gray-200', bar: 'bg-gray-400', border: 'border-l-gray-400', dot: 'bg-gray-400', label: s || 'Unknown' }

export default function MyCase() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showBorrowerStatusModal, setShowBorrowerStatusModal] = useState(false)
  const [showManageCaseModal, setShowManageCaseModal] = useState(false)
  const [caseData, setCaseData] = useState(EMPTY_CASE)
  const [allCases, setAllCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [loading, setLoading] = useState(true)

  const handleSelectCase = (rawCase) => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setCaseData(transformRawCase(rawCase))
    setSelectedCaseId(rawCase.id)
    setActiveTab('dashboard')
  }

  useEffect(() => {
    const fetchCase = async () => {
      setLoading(true)
      try {
        const res = await caseService.getMyCases()
        if (res.success && res.data && res.data.length > 0) {
          setAllCases(res.data)
          if (res.data.length === 1) {
            handleSelectCase(res.data[0])
          }
        }
      } catch (err) {
        console.error("Failed to fetch cases:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCase()
  }, [])

  // Fetch real bid count + highest bid for the selected case
  useEffect(() => {
    if (!selectedCaseId) return
    auctionService.getBidsByCase(selectedCaseId).then(res => {
      if (res.success) {
        const bids = Array.isArray(res.data) ? res.data : []
        const highest = bids.length > 0 ? Math.max(...bids.map(b => Number(b.amount) || 0)) : 0
        setCaseData(prev => ({ ...prev, totalBids: bids.length, currentHighestBid: highest }))
      }
    }).catch(() => {})
  }, [selectedCaseId])

  const c = caseData
  const addr = c.property
    ? [c.property.address, c.property.suburb, c.property.state, c.property.postcode].filter(Boolean).join(', ')
    : ''

  const propertyForHeader = useMemo(
    () =>
      c.property
        ? {
            address: c.property.address,
            suburb: c.property.suburb,
            state: c.property.state,
            postcode: c.property.postcode,
            location: [c.property.suburb, c.property.state, c.property.postcode].filter(Boolean).join(', '),
          }
        : null,
    [c.property]
  )

  const manageCaseData = useMemo(
    () => ({
      id: c.id,
      case_number: c.case_number,
      status: c.status,
      borrower: typeof c.borrower === 'object' ? c.borrower?.name : c.borrower,
      lender: typeof c.lender === 'object' ? c.lender?.name : c.lender,
      outstandingDebt: c.financials?.outstandingPrincipal ?? c.outstanding_debt ?? 0,
      interest_rate: c.interest_rate ?? 0,
      daysInDefault: c.metadata_json?.days_in_default ?? 0,
      property: {
        address: c.property?.address ?? '',
        location: [c.property?.suburb, c.property?.state, c.property?.postcode].filter(Boolean).join(', '),
        suburb: c.property?.suburb ?? '',
        postcode: c.property?.postcode ?? '',
        bedrooms: c.property?.bedrooms ?? 0,
        bathrooms: c.property?.bathrooms ?? 0,
        valuation: c.property?.valuation ?? 0,
      },
      propertyValuation: c.property?.valuation ?? 0,
      property_images: c.property_images ?? [],
      valuation: {
        amount: c.property?.valuation ?? 0,
        date: c.property?.valuationDate ?? '',
        valuer: c.property?.valuer ?? '',
      },
    }),
    [c.id, c.status, c.borrower, c.lender, c.property, c.financials, c.outstanding_debt, c.interest_rate, c.metadata_json, c.property_images]
  )

  const handleExportReport = async () => {
    try {
      await generateInvestmentMemorandumPDF({
        title: c?.property?.address || c?.id || 'Case Report',
        location: [c?.property?.suburb, c?.property?.state].filter(Boolean).join(', '),
        image: c?.image || null,
        propertyValue: c?.property?.valuation,
        outstandingDebt: c?.lender?.outstandingDebt ?? c?.financials?.outstandingPrincipal,
        lvr: c?.property?.lvr,
        type: c?.property?.type,
        status: c?.status,
        propertyDetails: {
          bedrooms: c?.property?.bedrooms,
          bathrooms: c?.property?.bathrooms,
          parking: c?.property?.parking,
          landSize: c?.property?.landArea,
        },
      })
    } catch (err) {
      console.error("Export error:", err)
    }
  }

  const handleManageCase = () => setShowManageCaseModal(true)
  const handleBorrowerStatus = () => setShowBorrowerStatusModal(true)
  const applyCaseDetailsToState = (payload) => {
    const d = payload?.caseDetails || {}
    setCaseData((prev) => {
      const next = { ...prev }
      if (d.caseNumber) next.id = d.caseNumber
      if (d.borrowerName != null) {
        next.borrower = typeof prev.borrower === 'object' && prev.borrower
          ? { ...prev.borrower, name: d.borrowerName }
          : d.borrowerName
      }
      if (d.lenderName != null) {
        next.lender = typeof prev.lender === 'object' && prev.lender
          ? { ...prev.lender, name: d.lenderName }
          : d.lenderName
      }
      const outDebt = d.outstandingDebt !== undefined && d.outstandingDebt !== '' ? Number(d.outstandingDebt) : undefined
      if (outDebt !== undefined && !Number.isNaN(outDebt)) {
        next.lender = typeof next.lender === 'object' && next.lender ? { ...next.lender, outstandingDebt: outDebt } : { name: next.lender, outstandingDebt: outDebt }
        if (next.financials) next.financials = { ...next.financials, outstandingPrincipal: outDebt }
      }
      if (d.address != null || d.suburb != null || d.postcode != null || d.bedrooms != null || d.bathrooms != null || d.valuationAmount != null || d.valuationDate != null || d.valuerName != null) {
        next.property = { ...(prev.property || {}) }
        if (d.address !== undefined) next.property.address = d.address
        if (d.suburb !== undefined) next.property.suburb = d.suburb
        if (d.postcode !== undefined) next.property.postcode = d.postcode
        if (d.bedrooms !== undefined && d.bedrooms !== '') next.property.bedrooms = !isNaN(Number(d.bedrooms)) ? Number(d.bedrooms) : prev.property?.bedrooms
        if (d.bathrooms !== undefined && d.bathrooms !== '') next.property.bathrooms = !isNaN(Number(d.bathrooms)) ? Number(d.bathrooms) : prev.property?.bathrooms
        if (d.valuationAmount !== undefined && d.valuationAmount !== '') next.property.valuation = Number(d.valuationAmount) || prev.property?.valuation
        if (d.valuationDate !== undefined) next.property.valuationDate = d.valuationDate
        if (d.valuerName !== undefined) next.property.valuer = d.valuerName
        if (next.property.suburb || next.property.state || next.property.postcode) {
          next.property.location = [next.property.suburb, next.property.state, next.property.postcode].filter(Boolean).join(', ')
        }
      }
      return next
    })
  }

  const handleManageCaseSave = async (payload) => {
    const d = payload?.caseDetails || {}
    try {
      const nameParts = (d.borrowerName || '').trim().split(/\s+/)
      await casesService.updateCase(c.id, {
        outstanding_debt: d.outstandingDebt ? parseFloat(d.outstandingDebt) : undefined,
        interest_rate: d.interestRate ? parseFloat(d.interestRate) : undefined,
        property_address: d.address || undefined,
        estimated_value: d.valuationAmount ? parseFloat(d.valuationAmount) : undefined,
        suburb: d.suburb || undefined,
        postcode: d.postcode || undefined,
        bedrooms: d.bedrooms ? parseInt(d.bedrooms) : undefined,
        bathrooms: d.bathrooms ? parseInt(d.bathrooms) : undefined,
        valuer_name: d.valuerName || undefined,
        // Names and additional fields stored in metadata
        metadata_json: {
          ...(d.borrowerName && {
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
          }),
          ...(d.lenderName && { lender_name: d.lenderName }),
          ...(d.valuationDate && { valuation_date: d.valuationDate }),
          ...(d.daysInDefault !== undefined && { days_in_default: parseInt(d.daysInDefault) || 0 }),
          ...(d.defaultRate && { default_rate: parseFloat(d.defaultRate) }),
        },
      })
    } catch {
      // API unavailable — still apply changes locally
    }
    applyCaseDetailsToState(payload)
  }

  const settlementData = useMemo(
    () => ({
      ...EMPTY_SETTLEMENT_SUMMARY,
      checklist: [],
      messages: [],
      readiness: 0,
      outstandingItems: [],
    }),
    []
  )

  const propertyTabData = useMemo(
    () =>
      c.property
        ? {
            address: c.property.address,
            location: [c.property.suburb, c.property.state, c.property.postcode].filter(Boolean).join(', '),
            type: c.property.type,
            bedrooms: c.property.bedrooms,
            bathrooms: c.property.bathrooms,
            parking: c.property.parking,
          }
        : null,
    [c.property]
  )

  const valuationTabData = useMemo(
    () =>
      c.property
        ? {
            amount: c.property.valuation,
            date: c.property.valuationDate,
            valuer: c.property.valuer,
          }
        : null,
    [c.property]
  )

  const bidsData = useMemo(() => c.bidHistory || [], [c.bidHistory])

  return (
    <div className="p-6 md:p-8 space-y-6">
      {loading && (
        <div className="fixed inset-0 z-[60] bg-white/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <span className="text-sm font-medium text-slate-600">Loading cases…</span>
            </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your mortgage resolution cases.</p>
        </div>
        {!selectedCaseId && allCases.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {allCases.length} case{allCases.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      <Breadcrumb
        items={[
          { label: 'Dashboard', path: '/borrower/dashboard', icon: 'home' },
          { label: 'My Cases', path: '/borrower/my-case' },
          ...(selectedCaseId ? [{ label: 'Case Details' }] : []),
        ]}
      />

      {/* Cases list — shown when no case is selected and multiple cases exist */}
      {!selectedCaseId && !loading && (
        <div>
          {allCases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              </div>
              <p className="text-gray-700 font-semibold text-lg">No cases found</p>
              <p className="text-sm text-gray-400 mt-1">You don't have any active mortgage cases yet.</p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Cases', value: allCases.length, color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200' },
                  { label: 'Active', value: allCases.filter(c => ['active','auction','approved'].includes((c.status||'').toLowerCase())).length, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                  { label: 'Pending Review', value: allCases.filter(c => ['pending','submitted','under review'].includes((c.status||'').toLowerCase())).length, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
                  { label: 'Closed', value: allCases.filter(c => ['closed','settled','rejected'].includes((c.status||'').toLowerCase())).length, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
                    <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                    <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Case cards — full-width list */}
              <div className="flex flex-col gap-4">
                {allCases.map((rawCase) => {
                  const meta = rawCase.metadata_json || {}
                  const address = rawCase.property_address || 'Property Address Not Set'
                  const suburb = meta.suburb || ''
                  const state = meta.state || ''
                  const postcode = meta.postcode || ''
                  const location = [suburb, state, postcode].filter(Boolean).join(', ')
                  const loanAmt = parseFloat(rawCase.outstanding_debt || rawCase.loan_amount) || 0
                  const propValue = parseFloat(rawCase.estimated_value || rawCase.property_value) || 0
                  const lvr = (propValue > 0 && loanAmt > 0) ? Math.min(Math.round((loanAmt / propValue) * 100), 100) : 0
                  const lvrRaw = propValue > 0 ? Math.round((loanAmt / propValue) * 100) : 0
                  const status = rawCase.status || 'pending'
                  const cfg = getStatusCfg(status)
                  const caseNum = rawCase.case_number || rawCase.id?.slice(0, 8)
                  const createdDate = rawCase.created_at ? new Date(rawCase.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
                  const riskLevel = rawCase.risk_level || meta.risk_level || ''
                  const riskColors = { High: 'text-red-600 bg-red-50 border-red-200', Medium: 'text-amber-600 bg-amber-50 border-amber-200', Low: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
                  const riskStyle = riskColors[riskLevel] || ''
                  const lenderName = rawCase.lender_name || meta.lender_name || ''
                  const propType = rawCase.property_type || meta.type_of_security || ''
                  const totalBids = rawCase.total_bids || 0
                  const lvrColor = lvrRaw > 80 ? 'text-red-600' : lvrRaw > 60 ? 'text-amber-600' : 'text-emerald-600'
                  const lvrBarColor = lvrRaw > 80 ? 'bg-red-500' : lvrRaw > 60 ? 'bg-amber-400' : 'bg-emerald-500'

                  return (
                    <button
                      key={rawCase.id}
                      type="button"
                      onClick={() => handleSelectCase(rawCase)}
                      className="bg-white rounded-2xl border border-gray-200 text-left hover:shadow-xl hover:border-gray-300 transition-all duration-200 group overflow-hidden w-full"
                    >
                      {/* Top status strip */}
                      <div className={`h-1.5 w-full ${cfg.bar}`} />

                      <div className="flex flex-col md:flex-row">
                        {/* LEFT — property info */}
                        <div className={`flex-1 p-5 border-b md:border-b-0 md:border-r border-gray-100`}>
                          {/* Case number + badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-xs font-mono font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                              #{caseNum}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cfg.badge}`}>
                              <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
                              {cfg.label}
                            </span>
                            {riskLevel && (
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${riskStyle}`}>
                                {riskLevel} Risk
                              </span>
                            )}
                            {totalBids > 0 && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                                {totalBids} Bid{totalBids !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          {/* Address block */}
                          <div className="flex items-start gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bar} bg-opacity-10`} style={{background: 'transparent'}} >
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            </div>
                            <div>
                              <p className="text-base font-bold text-gray-900 leading-snug">{address}</p>
                              {location && <p className="text-sm text-gray-500 mt-0.5">{location}</p>}
                              {propType && <p className="text-xs text-gray-400 mt-0.5">{propType}</p>}
                            </div>
                          </div>

                          {/* Lender + date */}
                          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
                            {lenderName && (
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                <span className="text-xs text-gray-500">{lenderName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span className="text-xs text-gray-500">Created {createdDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT — financials */}
                        <div className="flex flex-col justify-between p-5 md:w-80 shrink-0">
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Outstanding Debt</p>
                              <p className="text-lg font-bold text-gray-900">
                                {loanAmt > 0 ? `$${loanAmt.toLocaleString('en-AU')}` : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Property Value</p>
                              <p className="text-lg font-bold text-gray-900">
                                {propValue > 0 ? `$${propValue.toLocaleString('en-AU')}` : '—'}
                              </p>
                            </div>
                          </div>

                          {/* LVR */}
                          {lvrRaw > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium text-gray-400">Loan-to-Value Ratio (LVR)</span>
                                <span className={`text-sm font-bold ${lvrColor}`}>{lvrRaw}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${lvrBarColor}`}
                                  style={{ width: `${lvr}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* View button */}
                          <div className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white ${cfg.bar} group-hover:opacity-90 transition-opacity`}>
                            Open Case
                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Case detail — shown when a case is selected */}
      {selectedCaseId && (<>
      {allCases.length > 1 && (
        <button
          type="button"
          onClick={() => setSelectedCaseId(null)}
          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          All Cases
        </button>
      )}

      <CaseHeader
        caseId={c.id}
        status={c.status}
        riskLevel={c.riskLevel ? `${c.riskLevel} Risk` : 'Medium Risk'}
        property={propertyForHeader}
        borrower={typeof c.borrower === 'object' ? c.borrower?.name : c.borrower}
        lender={typeof c.lender === 'object' ? c.lender?.name : c.lender}
        outstandingDebt={c.financials?.outstandingPrincipal ?? c.outstanding_debt ?? 0}
        propertyValuation={c.property?.valuation ?? c.estimated_value ?? 0}
        onExportReport={handleExportReport}
        onManageCase={handleManageCase}
      />

      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Case tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); setActiveTab(tab.id); }}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {TAB_ICONS[tab.id]}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'dashboard' && <DashboardTab caseData={c} onBorrowerStatusClick={handleBorrowerStatus} />}
        {activeTab === 'full-details' && <FullDetailsTab caseData={c} />}
        {activeTab === 'lawyer-review' && <LawyerReviewTab caseId={c.id} />}
        {activeTab === 'property' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <PropertyTab data={propertyTabData} valuation={valuationTabData} />
          </div>
        )}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <DocumentsTab caseId={c.id} />
          </div>
        )}
        {activeTab === 'investment-memorandum' && (
          <InvestmentMemoTab caseId={c.id} />
        )}
        {activeTab === 'settlement' && (
          <SettlementTab
            settlement={settlementData}
            property={c.property ? { address: addr, location: c.property.suburb } : null}
            caseId={c.id}
          />
        )}
        {activeTab === 'bids' && <BidsTab caseId={c.id} />}
        {activeTab === 'messages' && (
          <MessagesTab caseId={c.id} messages={[]} />
        )}
      </div>

      <ManageCaseModal
        caseData={manageCaseData}
        isOpen={showManageCaseModal}
        onClose={() => setShowManageCaseModal(false)}
        onSave={handleManageCaseSave}
      />

      {showBorrowerStatusModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="borrower-status-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 id="borrower-status-title" className="text-lg font-semibold text-gray-900">
              Borrower Status
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Status: <strong className="text-emerald-600">Cooperative</strong>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              The borrower is engaging with the process and providing requested documentation. No escalation required.
            </p>
            <button
              type="button"
              onClick={() => setShowBorrowerStatusModal(false)}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </>)}
    </div>
  )
}