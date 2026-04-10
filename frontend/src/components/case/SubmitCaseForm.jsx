import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { casesService, documentService } from '../../api/dataService'
import { toast } from 'react-toastify'
import {
  Shield, MapPin, Building2, FileText, Upload, CheckCircle,
  ChevronLeft, ChevronRight, Check, Users, Briefcase, DollarSign,
  Activity as ActivityIcon, Info
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Property' },
  { id: 2, label: 'Entity' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Lender' },
  { id: 5, label: 'Loan' },
  { id: 6, label: 'Features' },
  { id: 7, label: 'Parties' },
  { id: 8, label: 'NCCP*' },
  { id: 9, label: 'Disclosure' },
  { id: 10, label: 'Review' },
  { id: 11, label: 'Submit' },
]

const LENDER_DOCS = [
  'Loan Agreement',
  'Mortgage Certificate',
  'Default Notice',
  'Title Search',
  'Valuation Report',
  'Council Rates Notice',
  'Strata Certificate',
  'Insurance Policy',
  'PPSR Search',
  'Borrower ID',
  'Statement of Account',
  'Discharge of Mortgage',
]

const DISCLOSURE_ITEMS = [
  'Credit Guide (NCCP s126) *',
  'Quote / Fee Disclosure (NCCP s17) *',
  'Credit Proposal Disclosure (if broker involved)',
  'Credit Contract with Full Terms (NCCP s17) *',
  'Key Facts Sheet (for home loans) *',
  'All Fees, Interest & Comparison Rate Disclosed *',
]

const initialFormData = {
  // Property
  propertyAddress: '',
  suburb: '',
  state: 'NSW',
  postcode: '',
  propertyType: 'House',
  intendedLoanAmount: '',
  securityType: 'Registered Mortgage (Real Property)',
  mortgageRegistered: false,
  ppsaCompliance: false,

  // Entity
  entityType: 'Personal',
  companyName: '',
  acn: '',
  abn: '',
  companyType: 'Proprietary (Pty Ltd)',
  trustName: '',
  trustType: 'Family Trust',
  trustAbn: '',
  trustDate: '',
  firstName: '',
  lastName: '',
  dob: '',
  personalPhone: '',
  personalEmail: '',
  residentialAddress: '',
  postalAddress: '',
  occupation: '',
  employer: '',
  employmentStatus: '',
  annualIncome: '',
  tfn: '',
  directors: [],
  shareholders: [],
  trustees: [],
  guarantors: [],
  creditConsent: false,

  // Payment
  paymentAuthorized: false,

  // Lender
  lenderName: '',
  primaryContact: '',
  lenderEmail: '',
  lenderPhone: '',
  loanAccountNumber: '',

  // Loan
  outstandingDebt: '',
  originalLoanAmount: '',
  loanStartDate: '',
  interestRate: '5.5',
  repaymentType: 'Principal & Interest',
  missedPayments: '',
  totalArrears: '',
  defaultNoticeDate: '',
  valuationAmount: '',
  valuationDate: '',
  valuationProvider: '',
  nccpSubject: false,

  // Features
  yearBuilt: '',
  floorArea: '',
  condition: 'Good',
  numberOfBedrooms: '',
  numberOfBathrooms: '',
  numberOfParking: '',
  numberOfStoreys: '',
  constructionType: '',
  renovations: '',
  specialFeatures: '',

  // Parties
  borrowersLawyerName: '',
  borrowersLawyerFirm: '',
  borrowersLawyerEmail: '',
  borrowersLawyerPhone: '',
  borrowersLawyerLicense: '',
  lendersLawyerName: '',
  lendersLawyerFirm: '',
  lendersLawyerEmail: '',
  lendersLawyerPhone: '',
  realEstateAgentName: '',
  realEstateAgentFirm: '',
  realEstateAgentEmail: '',
  realEstateAgentPhone: '',

  // Review
  defaultReason: '',
  hardshipCircumstances: '',
  borrowerCooperation: 'Yes - Fully Cooperative',
  possessionStatus: 'Owner Occupied',
  urgency: 'Medium - Priority processing (14-30 days)',
  additionalNotes: '',

  // Disclosure
  licenceType: 'ACL Holder (Australian Credit Licence)',
  disclosureChecks: {},
  disclosedInterestRate: '6.50',
  disclosedComparisonRate: '6.75',
}

// ─── Shared Style Helpers ─────────────────────────────────────────────────────

const inputCls = 'h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors w-full'
const selectCls = `${inputCls} appearance-none cursor-pointer`
const labelCls = 'text-sm font-medium text-slate-700 block mb-1'
const cardCls = 'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'
const cardHeaderCls = 'bg-gray-50 border-b border-gray-100 px-6 py-4 text-sm font-semibold text-slate-800'
const cardBodyCls = 'p-6 space-y-5'
const grid2 = 'grid grid-cols-1 md:grid-cols-2 gap-4'

function Field({ label, required, children }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SubmitCaseForm({ role = 'lender', onClose, onSuccess }) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState(initialFormData)
  const [propertyImages, setPropertyImages] = useState([])   // [{file, preview, name}]
  const [caseDocuments, setCaseDocuments] = useState([])     // [{file, docName, docType}]
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [createdCaseId, setCreatedCaseId] = useState(null)

  const imageInputRef = useRef(null)
  const docInputRef = useRef(null)
  const pendingDocRef = useRef(null)

  useEffect(() => {
    // Blur any focused button so the browser doesn't auto-scroll back to it
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [currentStep])

  // ─── Form update helpers ───────────────────────────────────────────────────

  const updateFormData = (e) => {
    const { name, value, type, checked } = e.target
    let v = value

    const intFields = ['missedPayments', 'numberOfStoreys', 'loanAccountNumber']
    const currencyFields = ['outstandingDebt', 'originalLoanAmount', 'totalArrears',
      'valuationAmount', 'annualIncome', 'floorArea', 'intendedLoanAmount']
    const rateFields = ['interestRate', 'disclosedInterestRate', 'disclosedComparisonRate']
    const phoneFields = ['personalPhone', 'lenderPhone', 'borrowersLawyerPhone',
      'lendersLawyerPhone', 'realEstateAgentPhone']
    const nameFields = ['borrowersLawyerName', 'lendersLawyerName', 'realEstateAgentName', 'lenderName']

    if (intFields.includes(name)) v = v.replace(/[^0-9]/g, '')
    else if (currencyFields.includes(name)) v = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    else if (rateFields.includes(name)) v = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    else if (phoneFields.includes(name)) v = v.replace(/[^0-9\s+\-()/]/g, '').slice(0, 15)
    else if (nameFields.includes(name)) v = v.replace(/[^a-zA-Z\s\-'.&]/g, '')
    else if (name === 'postcode') v = v.replace(/[^0-9]/g, '').slice(0, 4)
    else if (name === 'yearBuilt') v = v.replace(/[^0-9]/g, '').slice(0, 4)

    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : v }))
  }

  const setFormValue = (name, value) => setFormData(prev => ({ ...prev, [name]: value }))

  // ─── Validation ────────────────────────────────────────────────────────────

  const canContinue = () => {
    if (currentStep === 1) return !!(formData.propertyAddress && formData.suburb)
    if (currentStep === 2) return !!(formData.creditConsent)
    if (currentStep === 3) return !!(formData.paymentAuthorized)
    return true
  }

  // ─── Image upload ──────────────────────────────────────────────────────────

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file), name: file.name }))
    setPropertyImages(prev => [...prev, ...newImages])
    toast.success(files.length === 1 ? `Image "${files[0].name}" added` : `${files.length} images added`)
    e.target.value = ''
  }

  const removeImage = (idx) => {
    setPropertyImages(prev => {
      const next = [...prev]
      URL.revokeObjectURL(next[idx].preview)
      next.splice(idx, 1)
      return next
    })
  }

  // ─── Document upload ───────────────────────────────────────────────────────

  const triggerDocUpload = (docName) => {
    pendingDocRef.current = docName
    docInputRef.current?.click()
  }

  const handleDocSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const docName = pendingDocRef.current
    setCaseDocuments(prev => {
      const filtered = prev.filter(d => d.docName !== docName)
      return [...filtered, { file, docName, docType: 'LENDER_DOC' }]
    })
    toast.success(`"${docName}" — ${file.name} ready`)
    e.target.value = ''
    pendingDocRef.current = null
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        title: `${formData.propertyAddress?.split(',')[0] || 'MIP Case'} – ${formData.suburb || ''} ${formData.state || ''}`.trim(),
        property_address: formData.propertyAddress,
        suburb: formData.suburb,
        state: formData.state,
        postcode: formData.postcode,
        property_type: formData.propertyType,
        intended_loan_amount: parseFloat(formData.intendedLoanAmount) || 0,
        outstanding_debt: parseFloat(formData.outstandingDebt) || 0,
        original_loan_amount: parseFloat(formData.originalLoanAmount) || 0,
        estimated_value: parseFloat(formData.valuationAmount) || 0,
        interest_rate: parseFloat(formData.interestRate) || 0,
        missed_payments: parseInt(formData.missedPayments) || 0,
        total_arrears: parseFloat(formData.totalArrears) || 0,
        loan_start_date: formData.loanStartDate || null,
        default_notice_date: formData.defaultNoticeDate || null,
        valuation_date: formData.valuationDate || null,
        valuation_provider: formData.valuationProvider || null,
        repayment_type: formData.repaymentType,
        lender_name: formData.lenderName,
        lender_phone: formData.lenderPhone,
        lender_email: formData.lenderEmail,
        loan_account_number: formData.loanAccountNumber,
        entity_type: formData.entityType,
        borrower_name: formData.entityType === 'Personal'
          ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
          : (formData.companyName || formData.trustName || ''),
        borrower_email: formData.personalEmail || '',
        borrower_phone: formData.personalPhone || '',
        default_reason: formData.defaultReason,
        hardship_circumstances: formData.hardshipCircumstances,
        borrower_cooperation: formData.borrowerCooperation,
        possession_status: formData.possessionStatus,
        urgency: formData.urgency,
        additional_notes: formData.additionalNotes,
        metadata_json: {
          // Address components (not DB columns — stored here so detail view can read them)
          suburb: formData.suburb,
          state: formData.state,
          postcode: formData.postcode,
          // Lender institution name (DB lender_name is the assigned user's name, not the firm)
          lender_name: formData.lenderName,
          // Loan / arrears data
          missed_payments: parseInt(formData.missedPayments) || 0,
          total_arrears: parseFloat(formData.totalArrears) || 0,
          default_notice_date: formData.defaultNoticeDate || null,
          default_reason: formData.defaultReason || null,
          // Valuation
          valuation_date: formData.valuationDate || null,
          valuer_name: formData.valuationProvider || null,
          // Property features
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
          borrower_name: formData.entityType === 'Personal'
            ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
            : (formData.companyName || formData.trustName || ''),
          borrowers_lawyer: {
            name: formData.borrowersLawyerName,
            firm: formData.borrowersLawyerFirm,
            email: formData.borrowersLawyerEmail,
            phone: formData.borrowersLawyerPhone,
            license: formData.borrowersLawyerLicense,
          },
          lenders_lawyer: {
            name: formData.lendersLawyerName,
            firm: formData.lendersLawyerFirm,
            email: formData.lendersLawyerEmail,
            phone: formData.lendersLawyerPhone,
          },
          real_estate_agent: {
            name: formData.realEstateAgentName,
            firm: formData.realEstateAgentFirm,
            email: formData.realEstateAgentEmail,
            phone: formData.realEstateAgentPhone,
          },
        },
        case_id_prefix: 'MIP',
      }

      const res = await casesService.createCase(payload)
      if (res.success) {
        const caseId = res.data?.id || res.data?.case_number || 'NEW'
        setCreatedCaseId(caseId)

        // Upload property images
        for (const img of propertyImages) {
          await casesService.uploadCaseImage(caseId, img.file)
        }

        // Upload documents
        for (const doc of caseDocuments) {
          const fd = new FormData()
          fd.append('case_id', caseId)
          fd.append('document_name', doc.docName)
          fd.append('document_type', doc.docType || 'UPLOAD')
          fd.append('file', doc.file)
          await documentService.uploadDocument(caseId, fd)
        }

        // Advance status from DRAFT → SUBMITTED so admin can see it
        await casesService.submitCaseActual(caseId)

        setSubmitSuccess(true)
        toast.success('Case submitted successfully!')

        // Role-based navigation after success
        if (role === 'lender') {
          if (onSuccess) onSuccess(caseId)
          else navigate('/lender/my-cases')
        } else if (role === 'admin') {
          onSuccess?.(caseId)
          navigate('/admin/case-management')
        } else if (role === 'lawyer') {
          onSuccess?.(caseId)
          if (onClose) onClose()
          else navigate('/lawyer/assigned-cases')
        } else {
          onSuccess?.(caseId)
        }
      } else {
        toast.error(res.error || 'Failed to submit case. Please try again.')
      }
    } catch (err) {
      console.error('Case submit error:', err)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 11) {
      handleSubmit()
    } else {
      setCurrentStep(s => Math.min(11, s + 1))
    }
  }

  const handleBack = () => setCurrentStep(s => Math.max(1, s - 1))

  // Allow jumping back to any already-visited step (no data loss)
  const handleStepClick = (stepId) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId)
    }
  }

  // ─── Step render ───────────────────────────────────────────────────────────

  const uploadedSlots = new Set(caseDocuments.map(d => d.docName))

  const renderStep = () => {
    switch (currentStep) {
      // ── Step 1: Property ───────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-6">
            <div className={cardCls}>
              <div className={cardHeaderCls}><MapPin className="inline w-4 h-4 mr-2 text-indigo-500" />Property Details</div>
              <div className={cardBodyCls}>
                <div className={grid2}>
                  <Field label="Property Address" required>
                    <input className={inputCls} name="propertyAddress" value={formData.propertyAddress} onChange={updateFormData} placeholder="123 Main Street" />
                  </Field>
                  <Field label="Suburb" required>
                    <input className={inputCls} name="suburb" value={formData.suburb} onChange={updateFormData} placeholder="Sydney" />
                  </Field>
                  <Field label="State">
                    <select className={selectCls} name="state" value={formData.state} onChange={updateFormData}>
                      {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Postcode">
                    <input className={inputCls} name="postcode" value={formData.postcode} onChange={updateFormData} placeholder="2000" maxLength={4} />
                  </Field>
                  <Field label="Property Type">
                    <select className={selectCls} name="propertyType" value={formData.propertyType} onChange={updateFormData}>
                      {['House','Unit / Apartment','Townhouse','Land','Commercial','Industrial','Rural'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Intended Loan Amount (A$)">
                    <input className={inputCls} name="intendedLoanAmount" value={formData.intendedLoanAmount} onChange={updateFormData} placeholder="500000" />
                  </Field>
                  <Field label="Security Type">
                    <select className={selectCls} name="securityType" value={formData.securityType} onChange={updateFormData}>
                      {['Registered Mortgage (Real Property)','Caveat','Charge','PPSR Security Interest'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <input type="checkbox" id="mortgageRegistered" name="mortgageRegistered" checked={formData.mortgageRegistered} onChange={updateFormData} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="mortgageRegistered" className="text-sm text-slate-600">Mortgage is registered on title</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="ppsaCompliance" name="ppsaCompliance" checked={formData.ppsaCompliance} onChange={updateFormData} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="ppsaCompliance" className="text-sm text-slate-600">PPSA security interest registered</label>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className={cardCls}>
              <div className={cardHeaderCls}><Upload className="inline w-4 h-4 mr-2 text-indigo-500" />Property Images</div>
              <div className={cardBodyCls}>
                <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                <button type="button" onClick={() => imageInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-medium">Click to upload property images</span>
                  <span className="text-xs">PNG, JPG, WEBP — select multiple files at once</span>
                </button>
                {propertyImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {propertyImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                        <img src={img.preview} alt={img.name} className="w-full h-24 object-cover" />
                        <button type="button" onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        <p className="text-[10px] text-slate-500 px-1 py-0.5 truncate">{img.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      // ── Step 2: Entity ─────────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-6">
            <div className={cardCls}>
              <div className={cardHeaderCls}><Building2 className="inline w-4 h-4 mr-2 text-indigo-500" />Entity Type</div>
              <div className={cardBodyCls}>
                <div className="flex gap-3 flex-wrap">
                  {['Personal','Company','Trust'].map(type => (
                    <button type="button" key={type}
                      onClick={() => setFormValue('entityType', type)}
                      className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${formData.entityType === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {formData.entityType === 'Personal' && (
              <div className={cardCls}>
                <div className={cardHeaderCls}>Personal Details</div>
                <div className={cardBodyCls}>
                  <div className={grid2}>
                    <Field label="First Name"><input className={inputCls} name="firstName" value={formData.firstName} onChange={updateFormData} /></Field>
                    <Field label="Last Name"><input className={inputCls} name="lastName" value={formData.lastName} onChange={updateFormData} /></Field>
                    <Field label="Date of Birth"><input type="date" className={inputCls} name="dob" value={formData.dob} onChange={updateFormData} /></Field>
                    <Field label="Phone"><input className={inputCls} name="personalPhone" value={formData.personalPhone} onChange={updateFormData} placeholder="04XX XXX XXX" /></Field>
                    <Field label="Email"><input type="email" className={inputCls} name="personalEmail" value={formData.personalEmail} onChange={updateFormData} /></Field>
                    <Field label="Occupation"><input className={inputCls} name="occupation" value={formData.occupation} onChange={updateFormData} /></Field>
                    <Field label="Employer"><input className={inputCls} name="employer" value={formData.employer} onChange={updateFormData} /></Field>
                    <Field label="Annual Income (A$)"><input className={inputCls} name="annualIncome" value={formData.annualIncome} onChange={updateFormData} /></Field>
                  </div>
                  <Field label="Residential Address"><input className={inputCls} name="residentialAddress" value={formData.residentialAddress} onChange={updateFormData} /></Field>
                  <Field label="Postal Address (if different)"><input className={inputCls} name="postalAddress" value={formData.postalAddress} onChange={updateFormData} /></Field>
                </div>
              </div>
            )}

            {formData.entityType === 'Company' && (
              <div className={cardCls}>
                <div className={cardHeaderCls}>Company Details</div>
                <div className={cardBodyCls}>
                  <div className={grid2}>
                    <Field label="Company Name"><input className={inputCls} name="companyName" value={formData.companyName} onChange={updateFormData} /></Field>
                    <Field label="ACN"><input className={inputCls} name="acn" value={formData.acn} onChange={updateFormData} /></Field>
                    <Field label="ABN"><input className={inputCls} name="abn" value={formData.abn} onChange={updateFormData} /></Field>
                    <Field label="Company Type">
                      <select className={selectCls} name="companyType" value={formData.companyType} onChange={updateFormData}>
                        {['Proprietary (Pty Ltd)','Public','Partnership','Sole Trader'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </Field>
                  </div>
                  {/* Directors */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={labelCls}>Directors</span>
                      <button type="button" onClick={() => setFormValue('directors', [...(formData.directors||[]), {id: Date.now(), name:'', email:''}])}
                        className="text-xs text-indigo-600 font-medium hover:underline">+ Add Director</button>
                    </div>
                    {(formData.directors||[]).map((d,i) => (
                      <div key={d.id} className="flex gap-2 mb-2">
                        <input className={inputCls} placeholder="Name" value={d.name} onChange={e => {
                          const list = [...formData.directors]; list[i] = {...d, name: e.target.value}; setFormValue('directors', list)
                        }} />
                        <input className={inputCls} placeholder="Email" value={d.email} onChange={e => {
                          const list = [...formData.directors]; list[i] = {...d, email: e.target.value}; setFormValue('directors', list)
                        }} />
                        <button type="button" onClick={() => setFormValue('directors', formData.directors.filter(x => x.id !== d.id))}
                          className="px-2 text-red-400 hover:text-red-600 text-lg">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {formData.entityType === 'Trust' && (
              <div className={cardCls}>
                <div className={cardHeaderCls}>Trust Details</div>
                <div className={cardBodyCls}>
                  <div className={grid2}>
                    <Field label="Trust Name"><input className={inputCls} name="trustName" value={formData.trustName} onChange={updateFormData} /></Field>
                    <Field label="Trust Type">
                      <select className={selectCls} name="trustType" value={formData.trustType} onChange={updateFormData}>
                        {['Family Trust','Discretionary Trust','Unit Trust','Hybrid Trust'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Trust ABN"><input className={inputCls} name="trustAbn" value={formData.trustAbn} onChange={updateFormData} /></Field>
                    <Field label="Trust Establishment Date"><input type="date" className={inputCls} name="trustDate" value={formData.trustDate} onChange={updateFormData} /></Field>
                  </div>
                  {/* Trustees */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={labelCls}>Trustees</span>
                      <button type="button" onClick={() => setFormValue('trustees', [...(formData.trustees||[]), {id: Date.now(), name:'', email:''}])}
                        className="text-xs text-indigo-600 font-medium hover:underline">+ Add Trustee</button>
                    </div>
                    {(formData.trustees||[]).map((d,i) => (
                      <div key={d.id} className="flex gap-2 mb-2">
                        <input className={inputCls} placeholder="Name" value={d.name} onChange={e => {
                          const list = [...formData.trustees]; list[i] = {...d, name: e.target.value}; setFormValue('trustees', list)
                        }} />
                        <input className={inputCls} placeholder="Email" value={d.email} onChange={e => {
                          const list = [...formData.trustees]; list[i] = {...d, email: e.target.value}; setFormValue('trustees', list)
                        }} />
                        <button type="button" onClick={() => setFormValue('trustees', formData.trustees.filter(x => x.id !== d.id))}
                          className="px-2 text-red-400 hover:text-red-600 text-lg">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className={cardCls}>
              <div className={cardBodyCls}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="creditConsent" name="creditConsent" checked={formData.creditConsent} onChange={updateFormData}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="creditConsent" className="text-sm text-slate-600 leading-relaxed">
                    <span className="font-medium text-slate-800">Credit Check Consent <span className="text-red-500">*</span></span><br />
                    I consent to a credit check being performed on the entity / individual named above for the purposes of this mortgage in possession case.
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      // ── Step 3: Payment ────────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-6">
            <div className={cardCls}>
              <div className={cardHeaderCls}><DollarSign className="inline w-4 h-4 mr-2 text-indigo-500" />Case Lodgement Fee</div>
              <div className={cardBodyCls}>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Case Lodgement Fee</span>
                    <span className="font-semibold text-slate-800">A$220.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">GST (10%)</span>
                    <span className="font-semibold text-slate-800">A$22.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">InfoTrack Property Search</span>
                    <span className="font-semibold text-slate-800">A$8.00</span>
                  </div>
                  <div className="border-t border-indigo-200 pt-3 flex justify-between">
                    <span className="font-semibold text-slate-800">Total</span>
                    <span className="text-lg font-bold text-indigo-700">A$250.00</span>
                  </div>
                </div>

                {formData.paymentAuthorized ? (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mt-2">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">Payment Authorised</p>
                      <p className="text-xs text-green-600">A$250.00 will be charged upon case submission.</p>
                    </div>
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => setFormValue('paymentAuthorized', true)}
                    className="w-full mt-2 h-12 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    Confirm Payment — A$250.00
                  </button>
                )}

                <p className="text-xs text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" /> Secured by 256-bit SSL encryption
                </p>
              </div>
            </div>
          </div>
        )

      // ── Step 4: Lender Details ─────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-6">
            <input ref={docInputRef} type="file" className="hidden" onChange={handleDocSelect} />
            <div className={cardCls}>
              <div className={cardHeaderCls}><Briefcase className="inline w-4 h-4 mr-2 text-indigo-500" />Lender Information</div>
              <div className={cardBodyCls}>
                <div className={grid2}>
                  <Field label="Lender / Institution Name"><input className={inputCls} name="lenderName" value={formData.lenderName} onChange={updateFormData} /></Field>
                  <Field label="Primary Contact"><input className={inputCls} name="primaryContact" value={formData.primaryContact} onChange={updateFormData} /></Field>
                  <Field label="Email"><input type="email" className={inputCls} name="lenderEmail" value={formData.lenderEmail} onChange={updateFormData} /></Field>
                  <Field label="Phone"><input className={inputCls} name="lenderPhone" value={formData.lenderPhone} onChange={updateFormData} placeholder="02 XXXX XXXX" /></Field>
                  <Field label="Loan Account Number"><input className={inputCls} name="loanAccountNumber" value={formData.loanAccountNumber} onChange={updateFormData} /></Field>
                </div>
              </div>
            </div>

            <div className={cardCls}>
              <div className={cardHeaderCls}><FileText className="inline w-4 h-4 mr-2 text-indigo-500" />Lender Documents</div>
              <div className="divide-y divide-gray-100">
                {LENDER_DOCS.map(doc => (
                  <div key={doc} className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {uploadedSlots.has(doc)
                        ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        : <FileText className="w-4 h-4 text-slate-300 shrink-0" />}
                      <span className="text-sm text-slate-700">{doc}</span>
                    </div>
                    <button type="button" onClick={() => triggerDocUpload(doc)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${uploadedSlots.has(doc) ? 'border-green-200 text-green-600 bg-green-50' : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}>
                      {uploadedSlots.has(doc) ? 'Replace' : 'Upload'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      // ── Step 5: Loan Details ───────────────────────────────────────────────
      case 5:
        return (
          <div className="space-y-6">
            <div className={cardCls}>
              <div className={cardHeaderCls}><DollarSign className="inline w-4 h-4 mr-2 text-indigo-500" />Loan Details</div>
              <div className={cardBodyCls}>
                <div className={grid2}>
                  <Field label="Outstanding Debt (A$)"><input className={inputCls} name="outstandingDebt" value={formData.outstandingDebt} onChange={updateFormData} placeholder="450000" /></Field>
                  <Field label="Original Loan Amount (A$)"><input className={inputCls} name="originalLoanAmount" value={formData.originalLoanAmount} onChange={updateFormData} /></Field>
                  <Field label="Loan Start Date"><input type="date" className={inputCls} name="loanStartDate" value={formData.loanStartDate} onChange={updateFormData} /></Field>
                  <Field label="Interest Rate (% p.a.)"><input className={inputCls} name="interestRate" value={formData.interestRate} onChange={updateFormData} placeholder="5.5" /></Field>
                  <Field label="Repayment Type">
                    <select className={selectCls} name="repaymentType" value={formData.repaymentType} onChange={updateFormData}>
                      {['Principal & Interest','Interest Only','Line of Credit'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Missed Payments (count)"><input className={inputCls} name="missedPayments" value={formData.missedPayments} onChange={updateFormData} placeholder="3" /></Field>
                  <Field label="Total Arrears (A$)"><input className={inputCls} name="totalArrears" value={formData.totalArrears} onChange={updateFormData} /></Field>
                  <Field label="Default Notice Date"><input type="date" className={inputCls} name="defaultNoticeDate" value={formData.defaultNoticeDate} onChange={updateFormData} /></Field>
                  <Field label="Valuation Amount (A$)"><input className={inputCls} name="valuationAmount" value={formData.valuationAmount} onChange={updateFormData} /></Field>
                  <Field label="Valuation Date"><input type="date" className={inputCls} name="valuationDate" value={formData.valuationDate} onChange={updateFormData} /></Field>
                  <Field label="Valuation Provider"><input className={inputCls} name="valuationProvider" value={formData.valuationProvider} onChange={updateFormData} /></Field>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <input type="checkbox" id="nccpSubject" name="nccpSubject" checked={formData.nccpSubject} onChange={updateFormData} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="nccpSubject" className="text-sm text-slate-600">This loan is subject to the NCCP Act</label>
                </div>
              </div>
            </div>
          </div>
        )

      // ── Step 6: Property Features ──────────────────────────────────────────
      case 6:
        return (
          <div className="space-y-6">
            <div className={cardCls}>
              <div className={cardHeaderCls}><Building2 className="inline w-4 h-4 mr-2 text-indigo-500" />Property Features</div>
              <div className={cardBodyCls}>
                <div className={grid2}>
                  <Field label="Year Built"><input className={inputCls} name="yearBuilt" value={formData.yearBuilt} onChange={updateFormData} placeholder="1998" /></Field>
                  <Field label="Floor Area (m²)"><input className={inputCls} name="floorArea" value={formData.floorArea} onChange={updateFormData} placeholder="180" /></Field>
                  <Field label="Property Condition">
                    <select className={selectCls} name="condition" value={formData.condition} onChange={updateFormData}>
                      {['Excellent','Good','Fair','Poor'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Bedrooms"><input className={inputCls} name="numberOfBedrooms" value={formData.numberOfBedrooms} onChange={updateFormData} placeholder="3" /></Field>
                  <Field label="Bathrooms"><input className={inputCls} name="numberOfBathrooms" value={formData.numberOfBathrooms} onChange={updateFormData} placeholder="2" /></Field>
                  <Field label="Parking Spaces"><input className={inputCls} name="numberOfParking" value={formData.numberOfParking} onChange={updateFormData} placeholder="2" /></Field>
                  <Field label="Storeys"><input className={inputCls} name="numberOfStoreys" value={formData.numberOfStoreys} onChange={updateFormData} placeholder="2" /></Field>
                  <Field label="Construction Type">
                    <select className={selectCls} name="constructionType" value={formData.constructionType} onChange={updateFormData}>
                      <option value="">Select...</option>
                      {['Brick','Brick Veneer','Timber Frame','Steel Frame','Concrete','Double Brick'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Recent Renovations"><textarea className={`${inputCls} h-20 py-2`} name="renovations" value={formData.renovations} onChange={updateFormData} placeholder="Describe any recent renovations..." /></Field>
                <Field label="Special Features"><textarea className={`${inputCls} h-20 py-2`} name="specialFeatures" value={formData.specialFeatures} onChange={updateFormData} placeholder="Pool, solar panels, granny flat..." /></Field>
              </div>
            </div>
          </div>
        )

      // ── Step 7: Parties ────────────────────────────────────────────────────
      case 7:
        return (
          <div className="space-y-6">
            <div className={cardCls}>
              <div className={cardHeaderCls}><Users className="inline w-4 h-4 mr-2 text-indigo-500" />Borrower's Lawyer</div>
              <div className={cardBodyCls}>
                <div className={grid2}>
                  <Field label="Name"><input className={inputCls} name="borrowersLawyerName" value={formData.borrowersLawyerName} onChange={updateFormData} /></Field>
                  <Field label="Law Firm"><input className={inputCls} name="borrowersLawyerFirm" value={formData.borrowersLawyerFirm} onChange={updateFormData} /></Field>
                  <Field label="Email"><input type="email" className={inputCls} name="borrowersLawyerEmail" value={formData.borrowersLawyerEmail} onChange={updateFormData} /></Field>
                  <Field label="Phone"><input className={inputCls} name="borrowersLawyerPhone" value={formData.borrowersLawyerPhone} onChange={updateFormData} /></Field>
                  <Field label="Practising Certificate No."><input className={inputCls} name="borrowersLawyerLicense" value={formData.borrowersLawyerLicense} onChange={updateFormData} /></Field>
                </div>
              </div>
            </div>

            <div className={cardCls}>
              <div className={cardHeaderCls}><Users className="inline w-4 h-4 mr-2 text-indigo-500" />Lender's Lawyer</div>
              <div className={cardBodyCls}>
                <div className={grid2}>
                  <Field label="Name"><input className={inputCls} name="lendersLawyerName" value={formData.lendersLawyerName} onChange={updateFormData} /></Field>
                  <Field label="Law Firm"><input className={inputCls} name="lendersLawyerFirm" value={formData.lendersLawyerFirm} onChange={updateFormData} /></Field>
                  <Field label="Email"><input type="email" className={inputCls} name="lendersLawyerEmail" value={formData.lendersLawyerEmail} onChange={updateFormData} /></Field>
                  <Field label="Phone"><input className={inputCls} name="lendersLawyerPhone" value={formData.lendersLawyerPhone} onChange={updateFormData} /></Field>
                </div>
              </div>
            </div>

            <div className={cardCls}>
              <div className={cardHeaderCls}><Users className="inline w-4 h-4 mr-2 text-indigo-500" />Real Estate Agent</div>
              <div className={cardBodyCls}>
                <div className={grid2}>
                  <Field label="Agent Name"><input className={inputCls} name="realEstateAgentName" value={formData.realEstateAgentName} onChange={updateFormData} /></Field>
                  <Field label="Agency Name"><input className={inputCls} name="realEstateAgentFirm" value={formData.realEstateAgentFirm} onChange={updateFormData} /></Field>
                  <Field label="Email"><input type="email" className={inputCls} name="realEstateAgentEmail" value={formData.realEstateAgentEmail} onChange={updateFormData} /></Field>
                  <Field label="Phone"><input className={inputCls} name="realEstateAgentPhone" value={formData.realEstateAgentPhone} onChange={updateFormData} /></Field>
                </div>
              </div>
            </div>
          </div>
        )

      // ── Step 8: NCCP (skipped) ─────────────────────────────────────────────
      case 8:
        return (
          <div className="py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <Info className="w-10 h-10 text-blue-500" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-2xl font-semibold text-slate-800">Step Skipped</h3>
              <p className="text-sm text-slate-500 leading-relaxed">NCCP Assessment is not required as this loan is not subject to NCCP regulation. Continue to the Disclosure step.</p>
            </div>
            <button type="button" onClick={() => setCurrentStep(9)}
              className="h-12 px-10 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
              Continue to Disclosure <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )

      // ── Step 9: Disclosure ─────────────────────────────────────────────────
      case 9:
        return (
          <div className="space-y-6">
            <div className={cardCls}>
              <div className={cardHeaderCls}><Shield className="inline w-4 h-4 mr-2 text-indigo-500" />Credit Licence Details</div>
              <div className={cardBodyCls}>
                <Field label="Licence Type">
                  <select className={selectCls} name="licenceType" value={formData.licenceType} onChange={updateFormData}>
                    {['ACL Holder (Australian Credit Licence)','Credit Representative','Exempt Person','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <div className={grid2}>
                  <Field label="Disclosed Interest Rate (%)"><input className={inputCls} name="disclosedInterestRate" value={formData.disclosedInterestRate} onChange={updateFormData} /></Field>
                  <Field label="Disclosed Comparison Rate (%)"><input className={inputCls} name="disclosedComparisonRate" value={formData.disclosedComparisonRate} onChange={updateFormData} /></Field>
                </div>
              </div>
            </div>

            <div className={cardCls}>
              <div className={cardHeaderCls}><CheckCircle className="inline w-4 h-4 mr-2 text-indigo-500" />Disclosure Checklist</div>
              <div className={cardBodyCls}>
                <p className="text-sm text-slate-500 mb-4">Confirm the following documents / disclosures have been provided to the borrower:</p>
                <div className="space-y-3">
                  {DISCLOSURE_ITEMS.map(item => (
                    <div key={item} className="flex items-start gap-3">
                      <input type="checkbox" id={`disc_${item}`}
                        checked={!!(formData.disclosureChecks?.[item])}
                        onChange={e => setFormValue('disclosureChecks', {...(formData.disclosureChecks||{}), [item]: e.target.checked})}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <label htmlFor={`disc_${item}`} className="text-sm text-slate-700">{item}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      // ── Step 10: Review ────────────────────────────────────────────────────
      case 10:
        return (
          <div className="space-y-6">
            <div className={cardCls}>
              <div className={cardHeaderCls}><ActivityIcon className="inline w-4 h-4 mr-2 text-indigo-500" />Case Summary</div>
              <div className={cardBodyCls}>
                <ReviewSection title="Property" items={[
                  ['Address', formData.propertyAddress],
                  ['Suburb / State', `${formData.suburb} ${formData.state} ${formData.postcode}`],
                  ['Property Type', formData.propertyType],
                  ['Security Type', formData.securityType],
                  ['Intended Loan Amount', formData.intendedLoanAmount ? `A$${formData.intendedLoanAmount}` : '—'],
                ]} />
                <ReviewSection title="Entity" items={[
                  ['Entity Type', formData.entityType],
                  ['Name', formData.entityType === 'Personal' ? `${formData.firstName} ${formData.lastName}` : (formData.companyName || formData.trustName || '—')],
                  ['Email', formData.personalEmail || '—'],
                  ['Phone', formData.personalPhone || '—'],
                ]} />
                <ReviewSection title="Lender" items={[
                  ['Lender Name', formData.lenderName || '—'],
                  ['Contact', formData.primaryContact || '—'],
                  ['Email', formData.lenderEmail || '—'],
                  ['Account Number', formData.loanAccountNumber || '—'],
                ]} />
                <ReviewSection title="Loan" items={[
                  ['Outstanding Debt', formData.outstandingDebt ? `A$${formData.outstandingDebt}` : '—'],
                  ['Original Loan', formData.originalLoanAmount ? `A$${formData.originalLoanAmount}` : '—'],
                  ['Interest Rate', formData.interestRate ? `${formData.interestRate}%` : '—'],
                  ['Repayment Type', formData.repaymentType],
                  ['Missed Payments', formData.missedPayments || '—'],
                  ['Total Arrears', formData.totalArrears ? `A$${formData.totalArrears}` : '—'],
                  ['Default Notice Date', formData.defaultNoticeDate || '—'],
                ]} />
                <ReviewSection title="Features" items={[
                  ['Year Built', formData.yearBuilt || '—'],
                  ['Floor Area', formData.floorArea ? `${formData.floorArea} m²` : '—'],
                  ['Condition', formData.condition],
                  ['Bedrooms', formData.numberOfBedrooms || '—'],
                  ['Bathrooms', formData.numberOfBathrooms || '—'],
                  ['Construction', formData.constructionType || '—'],
                ]} />
              </div>
            </div>

            <div className={cardCls}>
              <div className={cardBodyCls}>
                <Field label="Reason for Default">
                  <textarea className={`${inputCls} h-20 py-2`} name="defaultReason" value={formData.defaultReason} onChange={updateFormData} placeholder="Describe the reason for default..." />
                </Field>
                <Field label="Hardship Circumstances">
                  <textarea className={`${inputCls} h-20 py-2`} name="hardshipCircumstances" value={formData.hardshipCircumstances} onChange={updateFormData} />
                </Field>
                <div className={grid2}>
                  <Field label="Borrower Cooperation">
                    <select className={selectCls} name="borrowerCooperation" value={formData.borrowerCooperation} onChange={updateFormData}>
                      {['Yes - Fully Cooperative','Partially Cooperative','Not Cooperative','No Contact'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Possession Status">
                    <select className={selectCls} name="possessionStatus" value={formData.possessionStatus} onChange={updateFormData}>
                      {['Owner Occupied','Tenanted','Vacant','Abandoned'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Case Urgency">
                    <select className={selectCls} name="urgency" value={formData.urgency} onChange={updateFormData}>
                      {['High - Urgent (1-7 days)','Medium - Priority processing (14-30 days)','Standard (30-60 days)'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Additional Notes">
                  <textarea className={`${inputCls} h-20 py-2`} name="additionalNotes" value={formData.additionalNotes} onChange={updateFormData} />
                </Field>
              </div>
            </div>
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
                <p className="text-slate-500 mt-2">Case <strong>{createdCaseId}</strong> has been created and is pending review.</p>
              </div>
            </div>
          )
        }
        return (
          <div className="space-y-6">
            <div className={cardCls}>
              <div className={cardHeaderCls}><CheckCircle className="inline w-4 h-4 mr-2 text-green-500" />Ready to Submit</div>
              <div className={cardBodyCls}>
                <p className="text-sm text-slate-600">You are about to submit this MIP case to BrickBanq for review. Please ensure all details are correct before proceeding.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex gap-2 mt-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Once submitted, the case will be reviewed by our compliance team. You will be notified of any updates via email.</span>
                </div>
                <div className="space-y-2 text-sm text-slate-600 mt-2">
                  <p className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Property: {formData.propertyAddress}, {formData.suburb}</p>
                  <p className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> {propertyImages.length} property image{propertyImages.length !== 1 ? 's' : ''} attached</p>
                  <p className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> {caseDocuments.length} document{caseDocuments.length !== 1 ? 's' : ''} uploaded</p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  let stepContent = null
  try { stepContent = renderStep() } catch (err) {
    stepContent = <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-mono">{String(err)}</div>
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-6">
      {/* Header */}
      <div className="mb-6 px-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submit New MIP Case</h1>
          <div className="flex items-center gap-1.5 mt-1 text-indigo-600">
            <ActivityIcon className="w-3.5 h-3.5" strokeWidth={3} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Powered by InfoTrack — Property & Identity Verification</span>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose}
            className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1 shrink-0 self-start sm:self-center">
            <ChevronLeft className="w-4 h-4" /> Back to Cases
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 overflow-x-auto pb-2 mb-8">
        {STEPS.map((s, idx) => {
          const isCompleted = currentStep > s.id
          const isCurrent = currentStep === s.id
          const isClickable = isCompleted
          return (
            <div key={s.id} className="flex items-center shrink-0">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleStepClick(s.id)}
                  disabled={!isClickable}
                  title={isCompleted ? `Go back to step ${s.id}: ${s.label}` : undefined}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    isCurrent ? 'bg-indigo-600 border-indigo-600 text-white'
                    : isCompleted ? 'bg-indigo-50 border-indigo-600 text-indigo-600 hover:bg-indigo-100 cursor-pointer'
                    : 'bg-white border-slate-300 text-slate-400 cursor-default'
                  }`}
                >
                  {isCompleted ? '✓' : s.id}
                </button>
                <span className={`text-[10px] mt-1 whitespace-nowrap font-medium ${
                  isCurrent ? 'text-indigo-600' : isCompleted ? 'text-indigo-500' : 'text-slate-400'
                }`}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mx-1 mt-[-12px] ${currentStep > s.id ? 'bg-indigo-400' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="mb-10">
        {stepContent}
      </div>

      {/* Navigation */}
      {!submitSuccess && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-6 px-1">
          <button type="button" onClick={handleBack} disabled={currentStep === 1 || isSubmitting}
            className={`flex items-center gap-1.5 px-5 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 transition-colors ${currentStep === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Step {currentStep} of {STEPS.length}</span>
          <button type="button" onClick={handleNext} disabled={!canContinue() || isSubmitting}
            className="flex items-center gap-1.5 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? 'Submitting...' : currentStep === 11 ? 'Submit Case' : 'Next'}
            {!isSubmitting && currentStep !== 11 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Helper sub-components ─────────────────────────────────────────────────────

function ReviewSection({ title, items }) {
  return (
    <div className="mb-5 last:mb-0">
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm border-b border-gray-50 pb-1.5">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">{value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
