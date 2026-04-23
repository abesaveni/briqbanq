import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { casesService, documentService } from '../../api/dataService'
import { toast } from 'react-toastify'
import {
  Shield, MapPin, Building2, FileText, Upload, CheckCircle,
  ChevronLeft, ChevronRight, Check, Users, Briefcase, DollarSign,
  Activity as ActivityIcon, Info, Plus, Trash2, AlertTriangle,
  Clock, Save, ChevronDown, ChevronUp, RefreshCw, X, Eye, Download
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Property' },
  { id: 2, label: 'Parties' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Documents' },
  { id: 5, label: 'Loan' },
  { id: 6, label: 'Features' },
  { id: 7, label: 'Legal' },
  { id: 8, label: 'NCCP' },
  { id: 9, label: 'Disclosure' },
  { id: 10, label: 'Review' },
  { id: 11, label: 'Submit' },
]

const SECURITY_TYPES = [
  'Registered Mortgage', 'Second Mortgage', 'Caveat', 'PPSA', 'Guarantee', 'Multiple', 'Other', 'Unknown'
]

const PROPERTY_TYPES = [
  'House', 'Unit / Apartment', 'Townhouse', 'Land', 'Commercial', 'Industrial', 'Rural', 'Unknown'
]

const PARTY_ROLES = [
  'Borrower', 'Co-Borrower', 'Guarantor', 'Trustee', 'Beneficiary',
  'Director', 'Shareholder', 'Security Provider', 'Mortgagor', 'Other'
]

const LENDER_DOCS = [
  { name: 'Loan Agreement', aliases: ['loan docs', 'facility agreement', 'credit contract'], category: 'financial' },
  { name: 'Mortgage Certificate', aliases: ['mortgage', 'mortgage doc'], category: 'security' },
  { name: 'Default Notice', aliases: ['notice of default', 'demand letter'], category: 'enforcement' },
  { name: 'Title Search', aliases: ['title', 'land title', 'certificate of title'], category: 'property' },
  { name: 'Valuation Report', aliases: ['valuation', 'appraisal', 'property valuation'], category: 'property' },
  { name: 'Council Rates Notice', aliases: ['rates', 'council rates'], category: 'property' },
  { name: 'Strata Certificate', aliases: ['strata', 'owners corp'], category: 'property' },
  { name: 'Insurance Policy', aliases: ['insurance', 'building insurance'], category: 'property' },
  { name: 'PPSR Search', aliases: ['ppsr', 'ppsa search'], category: 'security' },
  { name: 'Borrower ID', aliases: ['passport', 'licence', 'drivers licence', 'id doc'], category: 'borrower' },
  { name: 'Statement of Account', aliases: ['statement', 'account statement', 'loan statement'], category: 'financial' },
  { name: 'Discharge of Mortgage', aliases: ['discharge', 'mortgage discharge'], category: 'legal' },
]

const DISCLOSURE_ITEMS = [
  'Credit Guide (NCCP s126) *',
  'Quote / Fee Disclosure (NCCP s17) *',
  'Credit Proposal Disclosure (if broker involved)',
  'Credit Contract with Full Terms (NCCP s17) *',
  'Key Facts Sheet (for home loans) *',
  'All Fees, Interest & Comparison Rate Disclosed *',
]

const AUTOSAVE_DELAY = 2500 // ms

function makeId() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}` }

function newSecurity() {
  return {
    _id: makeId(), property_address: '', suburb: '', state: 'NSW', postcode: '',
    property_type: '', security_type: '', title_holder: '',
    estimated_value: '', existing_debt: '', priority_position: '',
    mortgage_registered: false, ppsa_registered: false, notes: '', collapsed: false,
  }
}

function newIndividual() {
  return {
    _id: makeId(), party_type: 'individual',
    first_name: '', last_name: '', dob: '', phone: '', email: '',
    residential_address: '', postal_address: '', occupation: '',
    employer: '', annual_income: '', tfn: '', credit_consent: false,
    roles: [], collapsed: false,
  }
}

function newCompany() {
  return {
    _id: makeId(), party_type: 'company',
    company_name: '', acn: '', abn: '', company_type: 'Proprietary (Pty Ltd)',
    registered_address: '', trading_address: '', industry: '',
    contact_person: '', contact_phone: '', contact_email: '',
    directors: [], shareholders: [], roles: [], collapsed: false,
  }
}

function newTrust() {
  return {
    _id: makeId(), party_type: 'trust',
    trust_name: '', trust_type: 'Family Trust', trust_abn: '', trust_tfn: '',
    trust_established_date: '', trustee_type: 'Individual Trustee', appointor: '',
    trustees: [], beneficiaries: [], roles: [], collapsed: false,
  }
}

const initialFormData = {
  // Meta
  caseId: null,
  workflow_status: 'draft',

  // Step 1 - Securities (array)
  securities: [newSecurity()],
  hasAdditionalSecurity: false,

  // Step 2 - Parties
  individuals: [newIndividual()],
  companies: [],
  trusts: [],

  // Step 3 - Payment
  paymentAuthorized: false,

  // Step 4 - Lender info
  lenderName: '', primaryContact: '', lenderEmail: '', lenderPhone: '', loanAccountNumber: '',

  // Step 5 - Loan details
  originalLoanAmount: '',
  loanStartDate: '', interestRate: '5.5', repaymentType: 'Principal & Interest',
  // Debt breakdown
  principal_outstanding: '', accrued_interest: '', default_interest: '',
  fees: '', legal_costs: '', total_arrears: '', total_payout: '',
  // Arrears
  missed_payments: '', days_in_arrears: '', arrears_start_date: '', last_payment_date: '',
  // Valuation
  valuationAmount: '', valuationDate: '', valuationProvider: '', forced_sale_estimate: '',
  // NCCP
  nccpSubject: false,
  // Recovery
  defaultReason: '', hardshipCircumstances: '',
  borrowerCooperation: 'Yes - Fully Cooperative', possessionStatus: 'Owner Occupied',
  urgency: 'Medium - Priority processing (14-30 days)', additionalNotes: '',

  // Step 6 - Property features
  yearBuilt: '', floorArea: '', condition: 'Good',
  numberOfBedrooms: '', numberOfBathrooms: '', numberOfParking: '',
  numberOfStoreys: '', constructionType: '', renovations: '', specialFeatures: '',

  // Step 7 - Parties (lawyers etc)
  borrowersLawyerName: '', borrowersLawyerFirm: '',
  borrowersLawyerEmail: '', borrowersLawyerPhone: '', borrowersLawyerLicense: '',
  lendersLawyerName: '', lendersLawyerFirm: '', lendersLawyerEmail: '', lendersLawyerPhone: '',
  realEstateAgentName: '', realEstateAgentFirm: '', realEstateAgentEmail: '', realEstateAgentPhone: '',

  // Step 9 - Disclosure
  licenceType: 'ACL Holder (Australian Credit Licence)',
  disclosureChecks: {},
  disclosedInterestRate: '6.50', disclosedComparisonRate: '6.75',
}

// ─── Input validation helpers ─────────────────────────────────────────────────

const onlyNumbers = (e) => {
  if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter','Home','End'].includes(e.key)) return
  if (!/^\d$/.test(e.key)) e.preventDefault()
}

const onlyDecimal = (e) => {
  if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter','Home','End'].includes(e.key)) return
  if (!/[\d.]/.test(e.key)) e.preventDefault()
  if (e.key === '.' && e.target.value.includes('.')) e.preventDefault()
}

const onlyPhone = (e) => {
  if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter','Home','End'].includes(e.key)) return
  if (!/[\d +\-()]/.test(e.key)) e.preventDefault()
}

// ─── Shared Style Helpers ─────────────────────────────────────────────────────

const inputCls = 'h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors w-full'
const selectCls = `${inputCls} appearance-none cursor-pointer`
const labelCls = 'text-sm font-medium text-slate-700 block mb-1'
const cardCls = 'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'
const cardHeaderCls = 'bg-gray-50 border-b border-gray-100 px-6 py-4 text-sm font-semibold text-slate-800 flex items-center justify-between'
const cardBodyCls = 'p-6 space-y-5'
const grid2 = 'grid grid-cols-1 md:grid-cols-2 gap-4'

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="ml-1 text-xs text-slate-400 font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  )
}

function StepBadge({ status }) {
  if (status === 'complete') return <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Complete</span>
  if (status === 'partial') return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Partial</span>
  return <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Not started</span>
}

function SectionCard({ title, icon: Icon, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cardCls}>
      <div className={cardHeaderCls}>
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-indigo-500" />}{title}
        </span>
        {collapsible && (
          <button type="button" onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-slate-600">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      {open && <div className={cardBodyCls}>{children}</div>}
    </div>
  )
}

// ─── Address Autocomplete (OpenStreetMap Nominatim) ────────────────────────────

function AddressAutocomplete({ value, onChange, onSelect, placeholder = 'Search property address' }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const search = useCallback(async (q) => {
    if (q.length < 3) { setSuggestions([]); return }
    setLoading(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=au&format=json&addressdetails=1&limit=6`
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
      const data = await res.json()
      setSuggestions(data)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e) => {
    const v = e.target.value
    setQuery(v)
    onChange(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 400)
  }

  const handleSelect = (item) => {
    const addr = item.address || {}
    const streetNum = addr.house_number || ''
    const road = addr.road || ''
    const street = [streetNum, road].filter(Boolean).join(' ')
    const suburb = addr.suburb || addr.town || addr.village || addr.city_district || ''
    const state = addr.state || ''
    const stateCode = {
      'New South Wales': 'NSW', 'Victoria': 'VIC', 'Queensland': 'QLD',
      'Western Australia': 'WA', 'South Australia': 'SA', 'Tasmania': 'TAS',
      'Australian Capital Territory': 'ACT', 'Northern Territory': 'NT',
    }[state] || state.toUpperCase().slice(0, 3)
    const postcode = addr.postcode || ''
    setQuery(street)
    setSuggestions([])
    onSelect({ street, suburb, state: stateCode, postcode })
  }

  return (
    <div className="relative">
      <input
        className={inputCls}
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && <RefreshCw className="absolute right-3 top-2.5 w-4 h-4 text-indigo-400 animate-spin" />}
      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 border-b border-slate-50 last:border-0"
              onClick={() => handleSelect(s)}
            >
              {s.display_name}
            </button>
          ))}
          <button type="button" className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-50" onClick={() => setSuggestions([])}>
            Enter manually
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Drag-and-drop Document Upload ────────────────────────────────────────────

function DocUploadZone({ onFiles }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handle = (files) => {
    if (!files?.length) return
    onFiles(Array.from(files))
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 transition-colors cursor-pointer ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="w-10 h-10 text-indigo-300" />
      <p className="text-sm font-medium text-slate-600">Drop files here or click to browse</p>
      <p className="text-xs text-slate-400">Multiple files supported — system will auto-match to document slots</p>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handle(e.target.files)} />
    </div>
  )
}

function autoMatch(fileName, docs) {
  const lower = fileName.toLowerCase().replace(/[_.-]/g, ' ')
  for (const doc of docs) {
    const allAliases = [doc.name.toLowerCase(), ...doc.aliases]
    if (allAliases.some(alias => lower.includes(alias))) {
      return { docName: doc.name, confidence: 'matched_automatically' }
    }
  }
  return { docName: null, confidence: 'needs_review' }
}

// ─── Auto-calc helpers ─────────────────────────────────────────────────────────

function calcDaysInArrears(arrearsStartDate) {
  if (!arrearsStartDate) return null
  const start = new Date(arrearsStartDate)
  const now = new Date()
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

function calcLVR(debt, value) {
  const d = parseFloat(debt)
  const v = parseFloat(value)
  if (!d || !v || v === 0) return null
  return ((d / v) * 100).toFixed(1)
}

function calcCompletion(formData) {
  const checks = [
    formData.securities[0]?.property_address,
    formData.securities[0]?.property_type,
    formData.individuals.length > 0 || formData.companies.length > 0 || formData.trusts.length > 0,
    formData.paymentAuthorized,
    formData.lenderName,
    formData.principal_outstanding || formData.total_payout,
    formData.missed_payments,
    formData.valuationAmount,
  ]
  const filled = checks.filter(Boolean).length
  return Math.round((filled / checks.length) * 100)
}

function calcStepStatus(formData, step) {
  const sec = formData.securities[0] || {}
  const hasParty = formData.individuals.length + formData.companies.length + formData.trusts.length > 0
  switch (step) {
    case 1:
      if (sec.property_address && sec.property_type && sec.security_type) return 'complete'
      if (sec.property_address || sec.property_type) return 'partial'
      return 'not_started'
    case 2: {
      const filledInd = formData.individuals.some(p => p.first_name || p.last_name || p.email)
      const filledCo = formData.companies.some(p => p.company_name || p.acn)
      const filledTr = formData.trusts.some(p => p.trust_name)
      if (filledInd || filledCo || filledTr) return 'complete'
      return 'not_started'
    }
    case 3:
      return formData.paymentAuthorized ? 'complete' : 'not_started'
    case 4:
      return formData.lenderName ? 'complete' : 'not_started'
    case 5:
      if (formData.principal_outstanding && formData.total_payout) return 'complete'
      if (formData.principal_outstanding || formData.total_arrears) return 'partial'
      return 'not_started'
    case 6: {
      const anyFilled = formData.yearBuilt || formData.floorArea || formData.numberOfBedrooms ||
                        formData.numberOfBathrooms || formData.numberOfParking || formData.constructionType ||
                        formData.numberOfStoreys || formData.renovations || formData.specialFeatures
      const coreFilled = formData.yearBuilt && formData.floorArea && formData.numberOfBedrooms
      if (coreFilled) return 'complete'
      if (anyFilled) return 'partial'
      return 'not_started'
    }
    case 7: {
      const s7 = formData.borrowersLawyerName || formData.lendersLawyerName || formData.realEstateAgentName
      if (formData.borrowersLawyerName && formData.lendersLawyerName) return 'complete'
      if (s7) return 'partial'
      return 'not_started'
    }
    case 8:
      return 'complete'
    case 9: {
      const checks = Object.values(formData.disclosureChecks || {})
      const allChecked = checks.length > 0 && checks.every(Boolean)
      if (allChecked && formData.disclosedInterestRate) return 'complete'
      if (formData.disclosedInterestRate || checks.some(Boolean)) return 'partial'
      return 'not_started'
    }
    case 10:
      return 'complete'
    case 11:
      return 'complete'
    default:
      return 'not_started'
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SubmitCaseForm({ role = 'lender', onClose, onSuccess }) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState(initialFormData)
  const [propertyImages, setPropertyImages] = useState([])
  const [imgDragging, setImgDragging] = useState(false)
  const [caseDocuments, setCaseDocuments] = useState([]) // [{file, docName, confidence}]
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [createdCaseId, setCreatedCaseId] = useState(null)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [isDirty, setIsDirty] = useState(false)

  const imageInputRef = useRef(null)
  const autosaveTimerRef = useRef(null)

  // ─── Warn on browser close/refresh when dirty ───────────────────────────────

  useEffect(() => {
    const handle = (e) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handle)
    return () => window.removeEventListener('beforeunload', handle)
  }, [isDirty])

  // ─── Scroll on step change ──────────────────────────────────────────────────

  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [currentStep])

  // ─── Autosave ───────────────────────────────────────────────────────────────

  const triggerAutosave = useCallback(() => {
    setIsDirty(true)
    clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      if (formData.caseId) saveDraft(false)
    }, AUTOSAVE_DELAY)
  }, [formData.caseId])

  // ─── Form update ────────────────────────────────────────────────────────────

  const update = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    triggerAutosave()
  }

  const updateFormData = (e) => {
    const { name, value, type, checked } = e.target
    update(name, type === 'checkbox' ? checked : value)
  }

  // Securities helpers
  const updateSecurity = (idx, field, value) => {
    setFormData(prev => {
      const arr = [...prev.securities]
      arr[idx] = { ...arr[idx], [field]: value }
      return { ...prev, securities: arr }
    })
    triggerAutosave()
  }

  const addSecurity = () => {
    setFormData(prev => ({ ...prev, securities: [...prev.securities, newSecurity()], hasAdditionalSecurity: true }))
  }

  const removeSecurity = (idx) => {
    setFormData(prev => ({ ...prev, securities: prev.securities.filter((_, i) => i !== idx) }))
  }

  const toggleSecurityCollapse = (idx) => {
    setFormData(prev => {
      const arr = [...prev.securities]
      arr[idx] = { ...arr[idx], collapsed: !arr[idx].collapsed }
      return { ...prev, securities: arr }
    })
  }

  // Party helpers
  const updateParty = (type, idx, field, value) => {
    setFormData(prev => {
      const arr = [...prev[type]]
      arr[idx] = { ...arr[idx], [field]: value }
      return { ...prev, [type]: arr }
    })
    triggerAutosave()
  }

  const addParty = (type) => {
    const maker = type === 'individuals' ? newIndividual : type === 'companies' ? newCompany : newTrust
    setFormData(prev => ({ ...prev, [type]: [...prev[type], maker()] }))
  }

  const removeParty = (type, idx) => {
    setFormData(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== idx) }))
  }

  const toggleRole = (type, idx, role) => {
    setFormData(prev => {
      const arr = [...prev[type]]
      const roles = arr[idx].roles || []
      arr[idx] = { ...arr[idx], roles: roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role] }
      return { ...prev, [type]: arr }
    })
    triggerAutosave()
  }

  const togglePartyCollapse = (type, idx) => {
    setFormData(prev => {
      const arr = [...prev[type]]
      arr[idx] = { ...arr[idx], collapsed: !arr[idx].collapsed }
      return { ...prev, [type]: arr }
    })
  }

  // Company nested lists
  const addNestedItem = (type, idx, field) => {
    setFormData(prev => {
      const arr = [...prev[type]]
      const list = [...(arr[idx][field] || []), { _id: makeId(), name: '', email: '' }]
      arr[idx] = { ...arr[idx], [field]: list }
      return { ...prev, [type]: arr }
    })
  }

  const updateNestedItem = (type, idx, field, itemIdx, itemField, value) => {
    setFormData(prev => {
      const arr = [...prev[type]]
      const list = [...(arr[idx][field] || [])]
      list[itemIdx] = { ...list[itemIdx], [itemField]: value }
      arr[idx] = { ...arr[idx], [field]: list }
      return { ...prev, [type]: arr }
    })
  }

  const removeNestedItem = (type, idx, field, itemIdx) => {
    setFormData(prev => {
      const arr = [...prev[type]]
      const list = (arr[idx][field] || []).filter((_, i) => i !== itemIdx)
      arr[idx] = { ...arr[idx], [field]: list }
      return { ...prev, [type]: arr }
    })
  }

  // ─── Auto-calc days in arrears ──────────────────────────────────────────────

  useEffect(() => {
    if (formData.arrears_start_date && !formData._daysManual) {
      const days = calcDaysInArrears(formData.arrears_start_date)
      if (days !== null) setFormData(prev => ({ ...prev, days_in_arrears: String(days) }))
    }
  }, [formData.arrears_start_date])

  // ─── Auto-calc total payout ─────────────────────────────────────────────────

  useEffect(() => {
    const fields = ['principal_outstanding', 'accrued_interest', 'default_interest', 'fees', 'legal_costs']
    const total = fields.reduce((sum, f) => sum + (parseFloat(formData[f]) || 0), 0)
    if (total > 0) setFormData(prev => ({ ...prev, total_payout: total.toFixed(2) }))
  }, [formData.principal_outstanding, formData.accrued_interest, formData.default_interest, formData.fees, formData.legal_costs])

  // ─── Image upload ───────────────────────────────────────────────────────────

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file), name: file.name }))
    setPropertyImages(prev => [...prev, ...newImages])
    toast.success(`${files.length} image${files.length !== 1 ? 's' : ''} added`)
    e.target.value = ''
  }

  const handleImageDrop = (fileList) => {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'))
    if (!files.length) return
    const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file), name: file.name }))
    setPropertyImages(prev => [...prev, ...newImages])
    toast.success(`${files.length} image${files.length !== 1 ? 's' : ''} added`)
  }

  const removeImage = (idx) => {
    setPropertyImages(prev => {
      const next = [...prev]
      URL.revokeObjectURL(next[idx].preview)
      next.splice(idx, 1)
      return next
    })
  }

  // ─── Document upload + auto-match ──────────────────────────────────────────

  const handleDroppedFiles = (files) => {
    const added = []
    const unmatched = []
    for (const file of files) {
      const { docName, confidence } = autoMatch(file.name, LENDER_DOCS)
      if (docName) {
        setCaseDocuments(prev => {
          const filtered = prev.filter(d => d.docName !== docName)
          return [...filtered, { file, docName, confidence }]
        })
        added.push(docName)
      } else {
        unmatched.push(file.name)
        setCaseDocuments(prev => [...prev, { file, docName: null, confidence: 'needs_review', fileName: file.name }])
      }
    }
    if (added.length) toast.success(`Auto-matched: ${added.join(', ')}`)
    if (unmatched.length) toast.info(`${unmatched.length} file(s) need manual assignment`)
  }

  const triggerDocUpload = (docName) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = e => {
      const file = e.target.files?.[0]
      if (!file) return
      setCaseDocuments(prev => {
        const filtered = prev.filter(d => d.docName !== docName)
        return [...filtered, { file, docName, confidence: 'verified' }]
      })
      toast.success(`"${docName}" — ${file.name} uploaded`)
    }
    input.click()
  }

  const reassignDoc = (fileIdx, newDocName) => {
    setCaseDocuments(prev => {
      const arr = [...prev]
      arr[fileIdx] = { ...arr[fileIdx], docName: newDocName, confidence: 'verified' }
      return arr
    })
  }

  const removeDoc = (fileIdx) => {
    setCaseDocuments(prev => prev.filter((_, i) => i !== fileIdx))
  }

  const uploadedSlots = new Set(caseDocuments.filter(d => d.docName).map(d => d.docName))

  // ─── Save Draft ─────────────────────────────────────────────────────────────

  const saveDraft = async (showToast = true) => {
    if (isSavingDraft) return
    setIsSavingDraft(true)
    try {
      const pct = calcCompletion(formData)
      const stepSt = {}
      STEPS.forEach(s => { stepSt[s.id] = calcStepStatus(formData, s.id) })

      const meta = buildMetadataJson()

      if (formData.caseId) {
        // Update existing draft via PUT /cases/{id}
        const primarySec = formData.securities[0] || {}
        const draftUpdate = {
          metadata_json: meta,
          property_address: primarySec.property_address || 'TBC',
          property_type: primarySec.property_type || 'Unknown',
        }
        const draftEstimate = parseFloat(primarySec.estimated_value)
        const draftDebt = parseFloat(formData.total_payout || formData.principal_outstanding)
        if (draftEstimate > 0) draftUpdate.estimated_value = draftEstimate
        if (draftDebt > 0) draftUpdate.outstanding_debt = draftDebt
        await casesService.updateCase(formData.caseId, draftUpdate)
      } else {
        // Create new draft case
        const primarySec = formData.securities[0] || {}
        const payload = {
          title: primarySec.property_address
            ? `${primarySec.property_address} – ${primarySec.suburb || ''} ${primarySec.state || ''}`.trim()
            : 'Draft Case',
          property_address: primarySec.property_address || 'TBC',
          property_type: primarySec.property_type || 'Unknown',
          estimated_value: parseFloat(primarySec.estimated_value) || 0,
          outstanding_debt: parseFloat(formData.total_payout || formData.principal_outstanding) || 0,
          interest_rate: parseFloat(formData.interestRate) || 0,
          metadata_json: meta,
          case_id_prefix: 'MIP',
        }
        const res = await casesService.createCase(payload)
        if (res.success && res.data?.id) {
          setFormData(prev => ({ ...prev, caseId: res.data.id }))
          setCreatedCaseId(res.data.id)
        }
      }

      const now = new Date()
      setLastSavedAt(now)
      setIsDirty(false)
      if (showToast) toast.success('Draft saved')
    } catch (err) {
      console.error('Draft save error:', err)
      if (showToast) toast.error('Could not save draft')
    } finally {
      setIsSavingDraft(false)
    }
  }

  // ─── Build metadata JSON ─────────────────────────────────────────────────────

  const buildMetadataJson = () => ({
    // Primary security (for backward compat)
    suburb: formData.securities[0]?.suburb || '',
    state: formData.securities[0]?.state || 'NSW',
    postcode: formData.securities[0]?.postcode || '',
    securities: formData.securities,
    parties: {
      individuals: formData.individuals,
      companies: formData.companies,
      trusts: formData.trusts,
    },
    lender_name: formData.lenderName,
    lender_institution: formData.lenderName,
    missed_payments: parseInt(formData.missed_payments) || 0,
    days_in_arrears: parseInt(formData.days_in_arrears) || 0,
    arrears_start_date: formData.arrears_start_date || null,
    last_payment_date: formData.last_payment_date || null,
    total_arrears: parseFloat(formData.total_arrears) || 0,
    default_notice_date: formData.defaultNoticeDate || null,
    default_reason: formData.defaultReason || null,
    valuation_date: formData.valuationDate || null,
    valuer_name: formData.valuationProvider || null,
    forced_sale_estimate: parseFloat(formData.forced_sale_estimate) || null,
    debt_breakdown: {
      principal_outstanding: parseFloat(formData.principal_outstanding) || null,
      accrued_interest: parseFloat(formData.accrued_interest) || null,
      default_interest: parseFloat(formData.default_interest) || null,
      fees: parseFloat(formData.fees) || null,
      legal_costs: parseFloat(formData.legal_costs) || null,
      total_arrears: parseFloat(formData.total_arrears) || null,
      total_payout: parseFloat(formData.total_payout) || null,
    },
    year_built: formData.yearBuilt,
    floor_area: formData.floorArea,
    condition: formData.condition,
    bedrooms: formData.numberOfBedrooms,
    bathrooms: formData.numberOfBathrooms,
    parking: formData.numberOfParking,
    storeys: formData.numberOfStoreys,
    construction_type: formData.constructionType,
    renovation_notes: formData.renovations,
    special_features: formData.specialFeatures,
    nccp_subject: formData.nccpSubject,
    licence_type: formData.licenceType,
    borrowers_lawyer: {
      name: formData.borrowersLawyerName, firm: formData.borrowersLawyerFirm,
      email: formData.borrowersLawyerEmail, phone: formData.borrowersLawyerPhone,
      license: formData.borrowersLawyerLicense,
    },
    lenders_lawyer: {
      name: formData.lendersLawyerName, firm: formData.lendersLawyerFirm,
      email: formData.lendersLawyerEmail, phone: formData.lendersLawyerPhone,
    },
    real_estate_agent: {
      name: formData.realEstateAgentName, firm: formData.realEstateAgentFirm,
      email: formData.realEstateAgentEmail, phone: formData.realEstateAgentPhone,
    },
    hardship_circumstances: formData.hardshipCircumstances,
    borrower_cooperation: formData.borrowerCooperation,
    possession_status: formData.possessionStatus,
    urgency: formData.urgency,
    additional_notes: formData.additionalNotes,
  })

  // ─── Validation ─────────────────────────────────────────────────────────────

  const stepValidation = {
    // Light: just check at least something is filled
    1: () => true, // always allow step 1 to proceed
    2: () => true, // parties optional in draft
    3: () => formData.paymentAuthorized,
    4: () => true,
    5: () => true,
    6: () => true,
    7: () => true,
    8: () => true,
    9: () => true,
    10: () => true,
    11: () => true,
  }

  const fullValidation = () => {
    const sec = formData.securities[0] || {}
    const errors = []
    if (!sec.property_address) errors.push('Property address is required')
    if (!sec.property_type) errors.push('Property type is required')
    if (!formData.paymentAuthorized) errors.push('Payment must be authorised')
    const hasParty = formData.individuals.length + formData.companies.length + formData.trusts.length > 0
    if (!hasParty) errors.push('At least one party is required')
    return errors
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const errors = fullValidation()
    if (errors.length) {
      toast.error(errors[0])
      return
    }
    setIsSubmitting(true)
    try {
      const primarySec = formData.securities[0] || {}
      const meta = buildMetadataJson()

      let caseId = formData.caseId

      if (!caseId) {
        const payload = {
          title: `${primarySec.property_address?.split(',')[0] || 'MIP Case'} – ${primarySec.suburb || ''} ${primarySec.state || ''}`.trim(),
          property_address: primarySec.property_address || 'TBC',
          property_type: primarySec.property_type || 'Unknown',
          estimated_value: parseFloat(primarySec.estimated_value) || 0,
          outstanding_debt: parseFloat(formData.total_payout || formData.principal_outstanding) || 0,
          interest_rate: parseFloat(formData.interestRate) || 0,
          metadata_json: meta,
          case_id_prefix: 'MIP',
        }
        const res = await casesService.createCase(payload)
        if (!res.success) { toast.error(res.error || 'Failed to create case'); return }
        caseId = res.data?.id
        setCreatedCaseId(caseId)
      } else {
        // Update existing draft
        const submitUpdate = {
          title: `${primarySec.property_address?.split(',')[0] || 'MIP Case'} – ${primarySec.suburb || ''}`.trim(),
          property_address: primarySec.property_address || 'TBC',
          property_type: primarySec.property_type || 'Unknown',
          metadata_json: meta,
        }
        const submitEstimate = parseFloat(primarySec.estimated_value)
        const submitDebt = parseFloat(formData.total_payout || formData.principal_outstanding)
        const submitRate = parseFloat(formData.interestRate)
        if (submitEstimate > 0) submitUpdate.estimated_value = submitEstimate
        if (submitDebt > 0) submitUpdate.outstanding_debt = submitDebt
        if (submitRate > 0) submitUpdate.interest_rate = submitRate
        await casesService.updateCase(caseId, submitUpdate)
      }

      // Upload property images
      for (const img of propertyImages) {
        await casesService.uploadCaseImage(caseId, img.file)
      }

      // Upload documents
      for (const doc of caseDocuments) {
        if (!doc.file) continue
        const fd = new FormData()
        fd.append('case_id', caseId)
        fd.append('document_name', doc.docName || doc.fileName || doc.file.name)
        fd.append('document_type', 'LENDER_DOC')
        fd.append('file', doc.file)
        await documentService.uploadDocument(caseId, fd)
      }

      // Advance to SUBMITTED
      await casesService.submitCaseActual(caseId)

      setSubmitSuccess(true)
      setIsDirty(false)
      toast.success('Case submitted successfully!')

      if (role === 'lender') { onSuccess ? onSuccess(caseId) : navigate('/lender/my-cases') }
      else if (role === 'admin') { onSuccess?.(caseId); navigate('/admin/case-management') }
      else if (role === 'lawyer') { onSuccess?.(caseId); onClose ? onClose() : navigate('/lawyer/assigned-cases') }
      else { onSuccess?.(caseId) }
    } catch (err) {
      console.error('Submit error:', err)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 11) handleSubmit()
    else setCurrentStep(s => Math.min(11, s + 1))
  }

  const handleBack = () => setCurrentStep(s => Math.max(1, s - 1))

  const handleStepClick = (stepId) => { if (stepId <= currentStep) setCurrentStep(stepId) }

  // ─── Step render ───────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {

      // ── Step 1: Property / Securities ──────────────────────────────────────
      case 1:
        return (
          <div className="space-y-6">
            {formData.securities.map((sec, idx) => (
              <div key={sec._id} className={cardCls}>
                <div className={cardHeaderCls}>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    Security {idx + 1} {sec.property_address ? `— ${sec.property_address.split(',')[0]}` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    {idx > 0 && (
                      <button type="button" onClick={() => removeSecurity(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button type="button" onClick={() => toggleSecurityCollapse(idx)} className="text-slate-400">
                      {sec.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {!sec.collapsed && (
                  <div className={cardBodyCls}>
                    <Field label="Property Address" hint="Search or enter manually">
                      <AddressAutocomplete
                        value={sec.property_address}
                        onChange={v => updateSecurity(idx, 'property_address', v)}
                        onSelect={({ street, suburb, state, postcode }) => {
                          updateSecurity(idx, 'property_address', street)
                          updateSecurity(idx, 'suburb', suburb)
                          updateSecurity(idx, 'state', state)
                          updateSecurity(idx, 'postcode', postcode)
                        }}
                      />
                    </Field>
                    <div className={grid2}>
                      <Field label="Suburb">
                        <input className={inputCls} value={sec.suburb} onChange={e => updateSecurity(idx, 'suburb', e.target.value)} />
                      </Field>
                      <Field label="State">
                        <select className={selectCls} value={sec.state} onChange={e => updateSecurity(idx, 'state', e.target.value)}>
                          {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </Field>
                      <Field label="Postcode">
                        <input className={inputCls} value={sec.postcode} maxLength={4} onChange={e => updateSecurity(idx, 'postcode', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                      </Field>
                      <Field label="Property Type">
                        <select className={selectCls} value={sec.property_type} onChange={e => updateSecurity(idx, 'property_type', e.target.value)}>
                          <option value="">Select...</option>
                          {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </Field>
                      <Field label="Security Type">
                        <select className={selectCls} value={sec.security_type} onChange={e => updateSecurity(idx, 'security_type', e.target.value)}>
                          <option value="">Select...</option>
                          {SECURITY_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </Field>
                      <Field label="Title Holder / Ownership">
                        <input className={inputCls} value={sec.title_holder} onChange={e => updateSecurity(idx, 'title_holder', e.target.value)} />
                      </Field>
                      <Field label="Estimated Value (A$)" hint="or Unknown">
                        <input className={inputCls} value={sec.estimated_value} placeholder="0" onChange={e => updateSecurity(idx, 'estimated_value', e.target.value.replace(/[^0-9.]/g, ''))} />
                      </Field>
                      <Field label="Existing Debt (A$)">
                        <input className={inputCls} value={sec.existing_debt} placeholder="0" onChange={e => updateSecurity(idx, 'existing_debt', e.target.value.replace(/[^0-9.]/g, ''))} />
                      </Field>
                      <Field label="Priority Position">
                        <select className={selectCls} value={sec.priority_position} onChange={e => updateSecurity(idx, 'priority_position', e.target.value)}>
                          <option value="">Select...</option>
                          {['First', 'Second', 'Third', 'Unknown'].map(p => <option key={p}>{p}</option>)}
                        </select>
                      </Field>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked={sec.mortgage_registered} onChange={e => updateSecurity(idx, 'mortgage_registered', e.target.checked)} />
                        Mortgage registered on title
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked={sec.ppsa_registered} onChange={e => updateSecurity(idx, 'ppsa_registered', e.target.checked)} />
                        PPSA registered
                      </label>
                    </div>
                    <Field label="Notes">
                      <textarea className={`${inputCls} h-16 py-2`} value={sec.notes} onChange={e => updateSecurity(idx, 'notes', e.target.value)} placeholder="Any additional notes about this security..." />
                    </Field>
                  </div>
                )}
              </div>
            ))}

            <button type="button" onClick={addSecurity}
              className="w-full border-2 border-dashed border-indigo-200 rounded-xl py-4 text-sm font-medium text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center gap-2 transition-colors">
              <Plus className="w-4 h-4" /> Add Another Security
            </button>

            {/* Property Images */}
            <SectionCard title="Property Images" icon={Upload}>
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              <div
                onClick={() => imageInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setImgDragging(true) }}
                onDragLeave={() => setImgDragging(false)}
                onDrop={e => { e.preventDefault(); setImgDragging(false); handleImageDrop(e.dataTransfer.files) }}
                className={`w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${imgDragging ? 'border-indigo-400 bg-indigo-50 text-indigo-500' : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500'}`}
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">Click or drag images here</span>
                <span className="text-xs">PNG, JPG, WEBP — multiple files supported</span>
              </div>
              {propertyImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {propertyImages.map((img, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-200">
                      <img src={img.preview} alt={img.name} className="w-full h-24 object-cover" />
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      <p className="text-[10px] text-slate-500 px-1 py-0.5 truncate">{img.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )

      // ── Step 2: Parties ───────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-6">
            {/* Individuals */}
            <SectionCard title={`Individuals (${formData.individuals.length})`} icon={Users}>
              {formData.individuals.map((ind, idx) => (
                <div key={ind._id} className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                  <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {ind.first_name || ind.last_name ? `${ind.first_name} ${ind.last_name}`.trim() : `Individual ${idx + 1}`}
                    </span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => removeParty('individuals', idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      <button type="button" onClick={() => togglePartyCollapse('individuals', idx)} className="text-slate-400">
                        {ind.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {!ind.collapsed && (
                    <div className="p-4 space-y-4">
                      <div className={grid2}>
                        <Field label="First Name"><input className={inputCls} value={ind.first_name} onChange={e => updateParty('individuals', idx, 'first_name', e.target.value)} /></Field>
                        <Field label="Last Name"><input className={inputCls} value={ind.last_name} onChange={e => updateParty('individuals', idx, 'last_name', e.target.value)} /></Field>
                        <Field label="Date of Birth"><input type="date" className={inputCls} value={ind.dob} onChange={e => updateParty('individuals', idx, 'dob', e.target.value)} /></Field>
                        <Field label="Phone"><input className={inputCls} value={ind.phone} onChange={e => updateParty('individuals', idx, 'phone', e.target.value)} onKeyDown={onlyPhone} placeholder="04XX XXX XXX" /></Field>
                        <Field label="Email"><input type="email" className={inputCls} value={ind.email} onChange={e => updateParty('individuals', idx, 'email', e.target.value)} /></Field>
                        <Field label="Occupation"><input className={inputCls} value={ind.occupation} onChange={e => updateParty('individuals', idx, 'occupation', e.target.value)} /></Field>
                        <Field label="Employer"><input className={inputCls} value={ind.employer} onChange={e => updateParty('individuals', idx, 'employer', e.target.value)} /></Field>
                        <Field label="Annual Income (A$)"><input className={inputCls} value={ind.annual_income} onChange={e => updateParty('individuals', idx, 'annual_income', e.target.value.replace(/[^0-9.]/g, ''))} /></Field>
                      </div>
                      <Field label="Residential Address"><input className={inputCls} value={ind.residential_address} onChange={e => updateParty('individuals', idx, 'residential_address', e.target.value)} /></Field>
                      <Field label="Postal Address (if different)"><input className={inputCls} value={ind.postal_address} onChange={e => updateParty('individuals', idx, 'postal_address', e.target.value)} /></Field>
                      {/* Roles */}
                      <div>
                        <label className={labelCls}>Roles in this Case</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {PARTY_ROLES.map(r => (
                            <button key={r} type="button"
                              onClick={() => toggleRole('individuals', idx, r)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${ind.roles?.includes(r) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Credit consent */}
                      {ind.roles?.some(r => ['Borrower', 'Co-Borrower', 'Guarantor'].includes(r)) && (
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" className="mt-0.5 w-4 h-4 rounded text-indigo-600" checked={ind.credit_consent} onChange={e => updateParty('individuals', idx, 'credit_consent', e.target.checked)} />
                          <span className="text-sm text-slate-600">
                            <span className="font-medium text-slate-800">Credit Check Consent</span> — I consent to a credit check being performed on this individual.
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addParty('individuals')}
                className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Individual
              </button>
            </SectionCard>

            {/* Companies */}
            <SectionCard title={`Companies (${formData.companies.length})`} icon={Building2}>
              {formData.companies.map((co, idx) => (
                <div key={co._id} className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                  <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{co.company_name || `Company ${idx + 1}`}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => removeParty('companies', idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      <button type="button" onClick={() => togglePartyCollapse('companies', idx)} className="text-slate-400">
                        {co.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {!co.collapsed && (
                    <div className="p-4 space-y-4">
                      <div className={grid2}>
                        <Field label="Company Name"><input className={inputCls} value={co.company_name} onChange={e => updateParty('companies', idx, 'company_name', e.target.value)} /></Field>
                        <Field label="ACN"><input className={inputCls} value={co.acn} onChange={e => updateParty('companies', idx, 'acn', e.target.value)} /></Field>
                        <Field label="ABN"><input className={inputCls} value={co.abn} onChange={e => updateParty('companies', idx, 'abn', e.target.value)} /></Field>
                        <Field label="Company Type">
                          <select className={selectCls} value={co.company_type} onChange={e => updateParty('companies', idx, 'company_type', e.target.value)}>
                            {['Proprietary (Pty Ltd)', 'Public', 'Partnership', 'Sole Trader'].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </Field>
                        <Field label="Industry"><input className={inputCls} value={co.industry} onChange={e => updateParty('companies', idx, 'industry', e.target.value)} /></Field>
                        <Field label="Contact Person"><input className={inputCls} value={co.contact_person} onChange={e => updateParty('companies', idx, 'contact_person', e.target.value)} /></Field>
                        <Field label="Contact Phone"><input className={inputCls} value={co.contact_phone} onChange={e => updateParty('companies', idx, 'contact_phone', e.target.value)} onKeyDown={onlyPhone} /></Field>
                        <Field label="Contact Email"><input className={inputCls} value={co.contact_email} onChange={e => updateParty('companies', idx, 'contact_email', e.target.value)} /></Field>
                      </div>
                      <Field label="Registered Address"><input className={inputCls} value={co.registered_address} onChange={e => updateParty('companies', idx, 'registered_address', e.target.value)} /></Field>
                      <Field label="Trading Address"><input className={inputCls} value={co.trading_address} onChange={e => updateParty('companies', idx, 'trading_address', e.target.value)} /></Field>
                      {/* Directors */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={labelCls}>Directors</label>
                          <button type="button" onClick={() => addNestedItem('companies', idx, 'directors')} className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add Director</button>
                        </div>
                        {(co.directors || []).map((d, di) => (
                          <div key={d._id} className="flex gap-2 mb-2">
                            <input className={inputCls} placeholder="Name" value={d.name} onChange={e => updateNestedItem('companies', idx, 'directors', di, 'name', e.target.value)} />
                            <input className={inputCls} placeholder="Email" value={d.email} onChange={e => updateNestedItem('companies', idx, 'directors', di, 'email', e.target.value)} />
                            <button type="button" onClick={() => removeNestedItem('companies', idx, 'directors', di)} className="px-2 text-red-400 hover:text-red-600">×</button>
                          </div>
                        ))}
                      </div>
                      {/* Shareholders */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={labelCls}>Shareholders</label>
                          <button type="button" onClick={() => addNestedItem('companies', idx, 'shareholders')} className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add Shareholder</button>
                        </div>
                        {(co.shareholders || []).map((s, si) => (
                          <div key={s._id} className="flex gap-2 mb-2">
                            <input className={inputCls} placeholder="Name" value={s.name} onChange={e => updateNestedItem('companies', idx, 'shareholders', si, 'name', e.target.value)} />
                            <input className={inputCls} placeholder="%" value={s.pct} onChange={e => updateNestedItem('companies', idx, 'shareholders', si, 'pct', e.target.value)} />
                            <button type="button" onClick={() => removeNestedItem('companies', idx, 'shareholders', si)} className="px-2 text-red-400 hover:text-red-600">×</button>
                          </div>
                        ))}
                      </div>
                      {/* Roles */}
                      <div>
                        <label className={labelCls}>Roles in this Case</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {PARTY_ROLES.map(r => (
                            <button key={r} type="button"
                              onClick={() => toggleRole('companies', idx, r)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${co.roles?.includes(r) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addParty('companies')} className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> Add Company</button>
            </SectionCard>

            {/* Trusts */}
            <SectionCard title={`Trusts (${formData.trusts.length})`} icon={Shield}>
              {formData.trusts.map((tr, idx) => (
                <div key={tr._id} className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                  <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{tr.trust_name || `Trust ${idx + 1}`}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => removeParty('trusts', idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      <button type="button" onClick={() => togglePartyCollapse('trusts', idx)} className="text-slate-400">
                        {tr.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {!tr.collapsed && (
                    <div className="p-4 space-y-4">
                      <div className={grid2}>
                        <Field label="Trust Name"><input className={inputCls} value={tr.trust_name} onChange={e => updateParty('trusts', idx, 'trust_name', e.target.value)} /></Field>
                        <Field label="Trust Type">
                          <select className={selectCls} value={tr.trust_type} onChange={e => updateParty('trusts', idx, 'trust_type', e.target.value)}>
                            {['Family Trust', 'Discretionary Trust', 'Unit Trust', 'Hybrid Trust', 'Bare Trust', 'Other'].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </Field>
                        <Field label="ABN"><input className={inputCls} value={tr.trust_abn} onChange={e => updateParty('trusts', idx, 'trust_abn', e.target.value)} /></Field>
                        <Field label="TFN"><input className={inputCls} value={tr.trust_tfn} onChange={e => updateParty('trusts', idx, 'trust_tfn', e.target.value)} /></Field>
                        <Field label="Date Established"><input type="date" className={inputCls} value={tr.trust_established_date} onChange={e => updateParty('trusts', idx, 'trust_established_date', e.target.value)} /></Field>
                        <Field label="Trustee Type">
                          <select className={selectCls} value={tr.trustee_type} onChange={e => updateParty('trusts', idx, 'trustee_type', e.target.value)}>
                            {['Individual Trustee', 'Company Trustee', 'Multiple Trustees'].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </Field>
                        <Field label="Appointor"><input className={inputCls} value={tr.appointor} onChange={e => updateParty('trusts', idx, 'appointor', e.target.value)} /></Field>
                      </div>
                      {/* Trustees */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={labelCls}>Trustees</label>
                          <button type="button" onClick={() => addNestedItem('trusts', idx, 'trustees')} className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add Trustee</button>
                        </div>
                        {(tr.trustees || []).map((t, ti) => (
                          <div key={t._id} className="flex gap-2 mb-2">
                            <input className={inputCls} placeholder="Name" value={t.name} onChange={e => updateNestedItem('trusts', idx, 'trustees', ti, 'name', e.target.value)} />
                            <input className={inputCls} placeholder="Type (Individual/Company)" value={t.type} onChange={e => updateNestedItem('trusts', idx, 'trustees', ti, 'type', e.target.value)} />
                            <button type="button" onClick={() => removeNestedItem('trusts', idx, 'trustees', ti)} className="px-2 text-red-400 hover:text-red-600">×</button>
                          </div>
                        ))}
                      </div>
                      {/* Beneficiaries */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={labelCls}>Beneficiaries</label>
                          <button type="button" onClick={() => addNestedItem('trusts', idx, 'beneficiaries')} className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add Beneficiary</button>
                        </div>
                        {(tr.beneficiaries || []).map((b, bi) => (
                          <div key={b._id} className="flex gap-2 mb-2">
                            <input className={inputCls} placeholder="Name" value={b.name} onChange={e => updateNestedItem('trusts', idx, 'beneficiaries', bi, 'name', e.target.value)} />
                            <select className={selectCls} value={b.type || ''} onChange={e => updateNestedItem('trusts', idx, 'beneficiaries', bi, 'type', e.target.value)}>
                              <option value="">Type</option>
                              {['Individual', 'Company', 'Trust', 'Class beneficiary'].map(t => <option key={t}>{t}</option>)}
                            </select>
                            <button type="button" onClick={() => removeNestedItem('trusts', idx, 'beneficiaries', bi)} className="px-2 text-red-400 hover:text-red-600">×</button>
                          </div>
                        ))}
                      </div>
                      {/* Roles */}
                      <div>
                        <label className={labelCls}>Roles in this Case</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {PARTY_ROLES.map(r => (
                            <button key={r} type="button"
                              onClick={() => toggleRole('trusts', idx, r)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tr.roles?.includes(r) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addParty('trusts')} className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> Add Trust</button>
            </SectionCard>
          </div>
        )

      // ── Step 3: Payment ────────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-6">
            <SectionCard title="Case Lodgement Fee" icon={DollarSign}>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-3">
                {[['Case Lodgement Fee', 'A$220.00'], ['GST (10%)', 'A$22.00'], ['InfoTrack Property Search', 'A$8.00']].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm"><span className="text-slate-600">{l}</span><span className="font-semibold">{v}</span></div>
                ))}
                <div className="border-t border-indigo-200 pt-3 flex justify-between">
                  <span className="font-semibold">Total</span><span className="text-lg font-bold text-indigo-700">A$250.00</span>
                </div>
              </div>
              {formData.paymentAuthorized ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div><p className="text-sm font-semibold text-green-800">Payment Authorised</p><p className="text-xs text-green-600">A$250.00 will be charged on submission.</p></div>
                </div>
              ) : (
                <button type="button" onClick={() => update('paymentAuthorized', true)}
                  className="w-full h-12 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" /> Confirm Payment — A$250.00
                </button>
              )}
            </SectionCard>
          </div>
        )

      // ── Step 4: Lender + Documents ─────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-6">
            <SectionCard title="Lender Information" icon={Briefcase}>
              <div className={grid2}>
                <Field label="Lender / Institution Name"><input className={inputCls} name="lenderName" value={formData.lenderName} onChange={updateFormData} /></Field>
                <Field label="Primary Contact"><input className={inputCls} name="primaryContact" value={formData.primaryContact} onChange={updateFormData} /></Field>
                <Field label="Email"><input type="email" className={inputCls} name="lenderEmail" value={formData.lenderEmail} onChange={updateFormData} /></Field>
                <Field label="Phone"><input className={inputCls} name="lenderPhone" value={formData.lenderPhone} onChange={updateFormData} onKeyDown={onlyPhone} /></Field>
                <Field label="Loan Account Number"><input className={inputCls} name="loanAccountNumber" value={formData.loanAccountNumber} onChange={updateFormData} /></Field>
              </div>
            </SectionCard>

            <SectionCard title="Document Upload" icon={Upload}>
              <DocUploadZone onFiles={handleDroppedFiles} />
              {caseDocuments.filter(d => !d.docName).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-amber-700 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Files needing manual assignment:</p>
                  {caseDocuments.filter(d => !d.docName).map((doc) => {
                    const origIdx = caseDocuments.indexOf(doc)
                    return (
                    <div key={origIdx} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-sm text-slate-700 flex-1 truncate">{doc.file?.name}</span>
                      <select className="text-xs border border-amber-200 rounded px-2 py-1 bg-white" onChange={e => reassignDoc(origIdx, e.target.value)}>
                        <option value="">Assign to...</option>
                        {LENDER_DOCS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                      </select>
                      <button type="button" onClick={() => removeDoc(origIdx)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                    )
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Document Slots" icon={FileText}>
              <div className="divide-y divide-gray-100 -mx-6 -mb-6">
                {LENDER_DOCS.map(doc => {
                  const uploaded = caseDocuments.find(d => d.docName === doc.name)
                  const confidence = uploaded?.confidence
                  return (
                    <div key={doc.name} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {uploaded
                          ? <CheckCircle className={`w-4 h-4 shrink-0 ${confidence === 'needs_review' ? 'text-amber-400' : 'text-green-500'}`} />
                          : <FileText className="w-4 h-4 text-slate-300 shrink-0" />}
                        <div>
                          <p className="text-sm text-slate-700">{doc.name}</p>
                          {uploaded && (
                            <p className={`text-xs ${confidence === 'needs_review' ? 'text-amber-600' : confidence === 'matched_automatically' ? 'text-blue-600' : 'text-green-600'}`}>
                              {confidence === 'needs_review' ? '⚠ Needs review' : confidence === 'matched_automatically' ? '⚡ Auto-matched' : '✓ Verified'}
                              {uploaded.file?.name ? ` — ${uploaded.file.name}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploaded && uploaded.file && (
                          <a
                            href={URL.createObjectURL(uploaded.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                            title="Preview file"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {uploaded && uploaded.file && (
                          <a
                            href={URL.createObjectURL(uploaded.file)}
                            download={uploaded.file.name}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {uploaded && (
                          <button type="button" onClick={() => removeDoc(caseDocuments.indexOf(uploaded))} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                        )}
                        <button type="button" onClick={() => triggerDocUpload(doc.name)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${uploaded ? 'border-green-200 text-green-600 bg-green-50' : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}>
                          {uploaded ? 'Replace' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          </div>
        )

      // ── Step 5: Loan Details ───────────────────────────────────────────────
      case 5:
        const lvr = calcLVR(formData.total_payout || formData.principal_outstanding, formData.securities[0]?.estimated_value)
        const equityBuffer = formData.securities[0]?.estimated_value && formData.total_payout
          ? (parseFloat(formData.securities[0].estimated_value) - parseFloat(formData.total_payout)).toFixed(2)
          : null
        return (
          <div className="space-y-6">
            <SectionCard title="Debt Breakdown" icon={DollarSign}>
              <div className={grid2}>
                <Field label="Principal Outstanding (A$)">
                  <input className={inputCls} name="principal_outstanding" value={formData.principal_outstanding} onChange={updateFormData} onKeyDown={onlyDecimal} placeholder="0" />
                </Field>
                <Field label="Accrued Interest (A$)">
                  <input className={inputCls} name="accrued_interest" value={formData.accrued_interest} onChange={updateFormData} onKeyDown={onlyDecimal} placeholder="0" />
                </Field>
                <Field label="Default Interest (A$)">
                  <input className={inputCls} name="default_interest" value={formData.default_interest} onChange={updateFormData} onKeyDown={onlyDecimal} placeholder="0" />
                </Field>
                <Field label="Fees (A$)">
                  <input className={inputCls} name="fees" value={formData.fees} onChange={updateFormData} onKeyDown={onlyDecimal} placeholder="0" />
                </Field>
                <Field label="Legal Costs (A$)">
                  <input className={inputCls} name="legal_costs" value={formData.legal_costs} onChange={updateFormData} onKeyDown={onlyDecimal} placeholder="0" />
                </Field>
                <Field label="Total Arrears (A$)">
                  <input className={inputCls} name="total_arrears" value={formData.total_arrears} onChange={updateFormData} onKeyDown={onlyDecimal} placeholder="0" />
                </Field>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Total Payout / Current Exposure</span>
                <span className="text-xl font-bold text-indigo-700">
                  {formData.total_payout ? `A$${parseFloat(formData.total_payout).toLocaleString('en-AU', { minimumFractionDigits: 2 })}` : 'A$0.00'}
                </span>
              </div>
              {lvr && (
                <div className="flex gap-4">
                  <div className="flex-1 bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">LVR (auto-calc)</p>
                    <p className={`text-xl font-bold ${parseFloat(lvr) > 80 ? 'text-red-600' : 'text-green-600'}`}>{lvr}%</p>
                  </div>
                  {equityBuffer && (
                    <div className="flex-1 bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500">Equity Buffer</p>
                      <p className={`text-xl font-bold ${parseFloat(equityBuffer) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        A${parseFloat(equityBuffer).toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Arrears Details" icon={Clock}>
              <div className={grid2}>
                <Field label="Missed Payments (count)">
                  <input className={inputCls} name="missed_payments" value={formData.missed_payments} onChange={updateFormData} onKeyDown={onlyNumbers} placeholder="3" />
                </Field>
                <Field label="Days in Arrears" hint="auto-calculated or override">
                  <input className={inputCls} name="days_in_arrears" value={formData.days_in_arrears}
                    onChange={e => { update('days_in_arrears', e.target.value); update('_daysManual', true) }}
                    onKeyDown={onlyNumbers}
                    placeholder="Auto from start date" />
                </Field>
                <Field label="Arrears Start Date">
                  <input type="date" className={inputCls} name="arrears_start_date" value={formData.arrears_start_date} onChange={updateFormData} />
                </Field>
                <Field label="Last Payment Date">
                  <input type="date" className={inputCls} name="last_payment_date" value={formData.last_payment_date} onChange={updateFormData} />
                </Field>
                <Field label="Default Notice Date">
                  <input type="date" className={inputCls} name="defaultNoticeDate" value={formData.defaultNoticeDate} onChange={updateFormData} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Loan Terms" icon={DollarSign}>
              <div className={grid2}>
                <Field label="Original Loan Amount (A$)">
                  <input className={inputCls} name="originalLoanAmount" value={formData.originalLoanAmount} onChange={updateFormData} onKeyDown={onlyDecimal} />
                </Field>
                <Field label="Loan Start Date">
                  <input type="date" className={inputCls} name="loanStartDate" value={formData.loanStartDate} onChange={updateFormData} />
                </Field>
                <Field label="Interest Rate (% p.a.)">
                  <input className={inputCls} name="interestRate" value={formData.interestRate} onChange={updateFormData} onKeyDown={onlyDecimal} />
                </Field>
                <Field label="Repayment Type">
                  <select className={selectCls} name="repaymentType" value={formData.repaymentType} onChange={updateFormData}>
                    {['Principal & Interest', 'Interest Only', 'Line of Credit'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Valuation & Recovery" icon={ActivityIcon}>
              <div className={grid2}>
                <Field label="Valuation Amount (A$)">
                  <input className={inputCls} name="valuationAmount" value={formData.valuationAmount} onChange={updateFormData} onKeyDown={onlyDecimal} />
                </Field>
                <Field label="Forced Sale Estimate (A$)">
                  <input className={inputCls} name="forced_sale_estimate" value={formData.forced_sale_estimate} onChange={updateFormData} onKeyDown={onlyDecimal} />
                </Field>
                <Field label="Valuation Date">
                  <input type="date" className={inputCls} name="valuationDate" value={formData.valuationDate} onChange={updateFormData} />
                </Field>
                <Field label="Valuation Provider">
                  <input className={inputCls} name="valuationProvider" value={formData.valuationProvider} onChange={updateFormData} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Default & Hardship" icon={AlertTriangle}>
              <div className="space-y-4">
                <Field label="Reason for Default">
                  <textarea className={`${inputCls} h-20 py-2`} name="defaultReason" value={formData.defaultReason} onChange={updateFormData} />
                </Field>
                <Field label="Hardship Circumstances">
                  <textarea className={`${inputCls} h-20 py-2`} name="hardshipCircumstances" value={formData.hardshipCircumstances} onChange={updateFormData} />
                </Field>
                <div className={grid2}>
                  <Field label="Borrower Cooperation">
                    <select className={selectCls} name="borrowerCooperation" value={formData.borrowerCooperation} onChange={updateFormData}>
                      {['Yes - Fully Cooperative', 'Partially Cooperative', 'Not Cooperative', 'No Contact'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Possession Status">
                    <select className={selectCls} name="possessionStatus" value={formData.possessionStatus} onChange={updateFormData}>
                      {['Owner Occupied', 'Tenanted', 'Vacant', 'Abandoned'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Case Urgency">
                    <select className={selectCls} name="urgency" value={formData.urgency} onChange={updateFormData}>
                      {['High - Urgent (1-7 days)', 'Medium - Priority processing (14-30 days)', 'Standard (30-60 days)'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Additional Notes">
                  <textarea className={`${inputCls} h-16 py-2`} name="additionalNotes" value={formData.additionalNotes} onChange={updateFormData} />
                </Field>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input type="checkbox" id="nccpSubject" name="nccpSubject" checked={formData.nccpSubject} onChange={updateFormData} className="w-4 h-4 rounded text-indigo-600" />
                <label htmlFor="nccpSubject" className="text-sm text-slate-600">This loan is subject to the NCCP Act</label>
              </div>
            </SectionCard>
          </div>
        )

      // ── Step 6: Property Features ──────────────────────────────────────────
      case 6:
        return (
          <div className="space-y-6">
            <SectionCard title="Property Features" icon={Building2}>
              <div className={grid2}>
                <Field label="Year Built"><input className={inputCls} name="yearBuilt" value={formData.yearBuilt} onChange={updateFormData} placeholder="1998" /></Field>
                <Field label="Floor Area (m²)"><input className={inputCls} name="floorArea" value={formData.floorArea} onChange={updateFormData} placeholder="180" /></Field>
                <Field label="Property Condition">
                  <select className={selectCls} name="condition" value={formData.condition} onChange={updateFormData}>
                    {['Excellent', 'Good', 'Fair', 'Poor', 'Unknown'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Bedrooms"><input className={inputCls} name="numberOfBedrooms" value={formData.numberOfBedrooms} onChange={updateFormData} /></Field>
                <Field label="Bathrooms"><input className={inputCls} name="numberOfBathrooms" value={formData.numberOfBathrooms} onChange={updateFormData} /></Field>
                <Field label="Parking Spaces"><input className={inputCls} name="numberOfParking" value={formData.numberOfParking} onChange={updateFormData} /></Field>
                <Field label="Storeys"><input className={inputCls} name="numberOfStoreys" value={formData.numberOfStoreys} onChange={updateFormData} /></Field>
                <Field label="Construction Type">
                  <select className={selectCls} name="constructionType" value={formData.constructionType} onChange={updateFormData}>
                    <option value="">Select or Unknown</option>
                    {['Brick', 'Brick Veneer', 'Timber Frame', 'Steel Frame', 'Concrete', 'Double Brick'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Recent Renovations"><textarea className={`${inputCls} h-20 py-2`} name="renovations" value={formData.renovations} onChange={updateFormData} /></Field>
              <Field label="Special Features"><textarea className={`${inputCls} h-20 py-2`} name="specialFeatures" value={formData.specialFeatures} onChange={updateFormData} placeholder="Pool, solar panels, granny flat..." /></Field>
            </SectionCard>
          </div>
        )

      // ── Step 7: Parties (lawyers/agents) ──────────────────────────────────
      case 7:
        return (
          <div className="space-y-6">
            <SectionCard title="Borrower's Lawyer" icon={Users} collapsible defaultOpen>
              <div className={grid2}>
                <Field label="Name"><input className={inputCls} name="borrowersLawyerName" value={formData.borrowersLawyerName} onChange={updateFormData} /></Field>
                <Field label="Law Firm"><input className={inputCls} name="borrowersLawyerFirm" value={formData.borrowersLawyerFirm} onChange={updateFormData} /></Field>
                <Field label="Email"><input type="email" className={inputCls} name="borrowersLawyerEmail" value={formData.borrowersLawyerEmail} onChange={updateFormData} /></Field>
                <Field label="Phone"><input className={inputCls} name="borrowersLawyerPhone" value={formData.borrowersLawyerPhone} onChange={updateFormData} /></Field>
                <Field label="Practising Certificate No."><input className={inputCls} name="borrowersLawyerLicense" value={formData.borrowersLawyerLicense} onChange={updateFormData} /></Field>
              </div>
            </SectionCard>
            <SectionCard title="Lender's Lawyer" icon={Users} collapsible defaultOpen>
              <div className={grid2}>
                <Field label="Name"><input className={inputCls} name="lendersLawyerName" value={formData.lendersLawyerName} onChange={updateFormData} /></Field>
                <Field label="Law Firm"><input className={inputCls} name="lendersLawyerFirm" value={formData.lendersLawyerFirm} onChange={updateFormData} /></Field>
                <Field label="Email"><input type="email" className={inputCls} name="lendersLawyerEmail" value={formData.lendersLawyerEmail} onChange={updateFormData} /></Field>
                <Field label="Phone"><input className={inputCls} name="lendersLawyerPhone" value={formData.lendersLawyerPhone} onChange={updateFormData} /></Field>
              </div>
            </SectionCard>
            <SectionCard title="Real Estate Agent" icon={Users} collapsible defaultOpen={false}>
              <div className={grid2}>
                <Field label="Agent Name"><input className={inputCls} name="realEstateAgentName" value={formData.realEstateAgentName} onChange={updateFormData} /></Field>
                <Field label="Agency Name"><input className={inputCls} name="realEstateAgentFirm" value={formData.realEstateAgentFirm} onChange={updateFormData} /></Field>
                <Field label="Email"><input type="email" className={inputCls} name="realEstateAgentEmail" value={formData.realEstateAgentEmail} onChange={updateFormData} /></Field>
                <Field label="Phone"><input className={inputCls} name="realEstateAgentPhone" value={formData.realEstateAgentPhone} onChange={updateFormData} /></Field>
              </div>
            </SectionCard>
          </div>
        )

      // ── Step 8: NCCP ───────────────────────────────────────────────────────
      case 8:
        if (!formData.nccpSubject) {
          return (
            <div className="py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <Info className="w-10 h-10 text-blue-500" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-2xl font-semibold text-slate-800">NCCP Not Applicable</h3>
                <p className="text-sm text-slate-500">This loan is not subject to NCCP. Continue to the Disclosure step.</p>
              </div>
              <button type="button" onClick={() => setCurrentStep(9)}
                className="h-12 px-10 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                Continue to Disclosure <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )
        }
        return (
          <div className="space-y-6">
            <SectionCard title="NCCP Compliance" icon={Shield}>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>This loan is subject to the National Consumer Credit Protection Act. Ensure all required disclosures and assessments are complete.</span>
              </div>
              <p className="text-sm text-slate-500">NCCP disclosure requirements will be surfaced in the Disclosure step. Ensure all NCCP-regulated documents are uploaded in Step 4.</p>
            </SectionCard>
          </div>
        )

      // ── Step 9: Disclosure ─────────────────────────────────────────────────
      case 9:
        return (
          <div className="space-y-6">
            <SectionCard title="Credit Licence Details" icon={Shield}>
              <Field label="Licence Type">
                <select className={selectCls} name="licenceType" value={formData.licenceType} onChange={updateFormData}>
                  {['ACL Holder (Australian Credit Licence)', 'Credit Representative', 'Exempt Person', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <div className={grid2}>
                <Field label="Disclosed Interest Rate (%)"><input className={inputCls} name="disclosedInterestRate" value={formData.disclosedInterestRate} onChange={updateFormData} /></Field>
                <Field label="Disclosed Comparison Rate (%)"><input className={inputCls} name="disclosedComparisonRate" value={formData.disclosedComparisonRate} onChange={updateFormData} /></Field>
              </div>
            </SectionCard>
            <SectionCard title="Disclosure Checklist" icon={CheckCircle}>
              <p className="text-sm text-slate-500">Confirm the following have been provided to the borrower:</p>
              <div className="space-y-3">
                {DISCLOSURE_ITEMS.map(item => (
                  <label key={item} className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={!!(formData.disclosureChecks?.[item])}
                      onChange={e => update('disclosureChecks', { ...(formData.disclosureChecks || {}), [item]: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </label>
                ))}
              </div>
            </SectionCard>
          </div>
        )

      // ── Step 10: Review ────────────────────────────────────────────────────
      case 10:
        const primarySec = formData.securities[0] || {}
        const totalParties = formData.individuals.length + formData.companies.length + formData.trusts.length
        return (
          <div className="space-y-6">
            <SectionCard title="Case Summary" icon={ActivityIcon}>
              <ReviewSection title="Primary Security" items={[
                ['Address', primarySec.property_address],
                ['Suburb / State', `${primarySec.suburb || ''} ${primarySec.state || ''} ${primarySec.postcode || ''}`],
                ['Property Type', primarySec.property_type],
                ['Security Type', primarySec.security_type],
                ['Securities total', formData.securities.length],
              ]} />
              <ReviewSection title="Parties" items={[
                ['Total parties', totalParties],
                ['Individuals', formData.individuals.length],
                ['Companies', formData.companies.length],
                ['Trusts', formData.trusts.length],
              ]} />
              <ReviewSection title="Debt Breakdown" items={[
                ['Principal Outstanding', formData.principal_outstanding ? `A$${parseFloat(formData.principal_outstanding).toLocaleString()}` : '—'],
                ['Total Arrears', formData.total_arrears ? `A$${parseFloat(formData.total_arrears).toLocaleString()}` : '—'],
                ['Total Payout', formData.total_payout ? `A$${parseFloat(formData.total_payout).toLocaleString()}` : '—'],
                ['Days in Arrears', formData.days_in_arrears || '—'],
                ['Missed Payments', formData.missed_payments || '—'],
                ['Valuation', formData.valuationAmount ? `A$${parseFloat(formData.valuationAmount).toLocaleString()}` : '—'],
              ]} />
              <ReviewSection title="Lender" items={[
                ['Lender Name', formData.lenderName || '—'],
                ['Contact', formData.primaryContact || '—'],
                ['Email', formData.lenderEmail || '—'],
              ]} />
            </SectionCard>
            <SectionCard title="Attachments" icon={Upload}>
              <div className="flex gap-6 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> {propertyImages.length} property image{propertyImages.length !== 1 ? 's' : ''}</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> {caseDocuments.length} document{caseDocuments.length !== 1 ? 's' : ''} uploaded</p>
              </div>
            </SectionCard>
          </div>
        )

      // ── Step 11: Submit ────────────────────────────────────────────────────
      case 11:
        if (submitSuccess) {
          return (
            <div className="py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-slate-800">Case Submitted!</h3>
                <p className="text-slate-500 mt-2">Case <strong>{createdCaseId}</strong> is now pending review.</p>
              </div>
            </div>
          )
        }
        return (
          <div className="space-y-6">
            <SectionCard title="Ready to Submit" icon={CheckCircle}>
              <p className="text-sm text-slate-600">You are about to submit this MIP case to BrickBanq for review. All details will be locked after submission.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Once submitted, the compliance team will review your case. You will be notified of any updates.</span>
              </div>
              {fullValidation().length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
                  <p className="font-semibold mb-1">Required before submission:</p>
                  <ul className="list-disc ml-4 space-y-0.5">{fullValidation().map(e => <li key={e}>{e}</li>)}</ul>
                </div>
              )}
            </SectionCard>
          </div>
        )

      default: return null
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const completionPct = calcCompletion(formData)
  let stepContent = null
  try { stepContent = renderStep() } catch (err) {
    stepContent = <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-mono">{String(err)}</div>
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-6">
      {/* Header */}
      <div className="mb-4 px-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submit New MIP Case</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              formData.workflow_status === 'submitted' ? 'bg-green-100 text-green-700'
              : formData.workflow_status === 'in_progress' ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600'
            }`}>
              Status: {formData.workflow_status === 'draft' ? 'Draft' : formData.workflow_status === 'in_progress' ? 'In Progress' : 'Submitted'}
            </span>
            {lastSavedAt && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Last saved {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
            {isSavingDraft && <span className="text-xs text-indigo-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Saving...</span>}
            {isDirty && !isSavingDraft && <span className="text-xs text-amber-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Unsaved changes</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onClose && (
            <button type="button" onClick={onClose} className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 px-1">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Completion</span><span>{completionPct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 overflow-x-auto pb-2 mb-8">
        {STEPS.map((s, idx) => {
          const isCompleted = currentStep > s.id
          const isCurrent = currentStep === s.id
          const stepSt = calcStepStatus(formData, s.id)
          return (
            <div key={s.id} className="flex items-center shrink-0">
              <div className="flex flex-col items-center">
                <button type="button" onClick={() => handleStepClick(s.id)}
                  disabled={s.id > currentStep}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    isCurrent ? 'bg-indigo-600 border-indigo-600 text-white'
                    : isCompleted ? 'bg-indigo-50 border-indigo-600 text-indigo-600 hover:bg-indigo-100 cursor-pointer'
                    : 'bg-white border-slate-300 text-slate-400 cursor-default'
                  }`}>
                  {isCompleted ? '✓' : s.id}
                </button>
                <span className={`text-[10px] mt-1 whitespace-nowrap font-medium ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {s.label}
                </span>
                <StepBadge status={stepSt} />
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mx-1 mt-[-22px] ${currentStep > s.id ? 'bg-indigo-400' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="mb-10">{stepContent}</div>

      {/* Navigation — standardised: Previous | Save Draft | Save and Continue */}
      {!submitSuccess && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-6 px-1">
          <button type="button" onClick={handleBack} disabled={currentStep === 1 || isSubmitting}
            className={`flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 transition-colors ${currentStep === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => saveDraft(true)} disabled={isSavingDraft || isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-indigo-200 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" />
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </button>

            <button type="button" onClick={handleNext} disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Submitting...' : currentStep === 11 ? 'Submit Case' : 'Save and Continue'}
              {!isSubmitting && currentStep !== 11 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function ReviewSection({ title, items }) {
  return (
    <div className="mb-5 last:mb-0">
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm border-b border-gray-50 pb-1.5">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">{value ?? '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
