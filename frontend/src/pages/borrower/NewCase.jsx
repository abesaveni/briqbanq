import DatePicker from '../../components/common/DatePicker'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { casesService as caseService, documentService } from '../../api/dataService'
import {
  validateFirstName, validateLastName, validateEmail, validateAuPhone,
  validateAuPostcode, validateAuState, validateABN, validateACN,
  validateStreetAddress, validateSuburb, validateCurrency,
} from '../../utils/auValidation'

const STEPS = [
  { id: 1, label: 'Property' },
  { id: 2, label: 'Entity' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Lender' },
  { id: 5, label: 'Loan' },
  { id: 6, label: 'Features' },
  { id: 7, label: 'Parties' },
  { id: 8, label: 'NCCP' },
  { id: 9, label: 'Disclosure' },
  { id: 10, label: 'Review' },
  { id: 11, label: 'Submit' },
]


const initialFormData = {
  streetAddress: '',
  suburb: '',
  state: '',
  postcode: '',
  propertyType: '',
  intendedLoanAmount: '',
  typeOfSecurity: '',
  mortgageOnTitle: false,
  mortgagePriority: '',
  securityAgreementDate: '',
  descriptionSecuredProperty: '',
  confirmPPSA: false,
  lenderName: 'Commonwealth Bank of Australia', // Kept as default if needed, or set to empty
  lenderContact: '',
  lenderEmail: '',
  lenderPhone: '',
  loanAccountNumber: '',
  outstandingDebt: '',
  originalLoanAmount: '',
  loanStartDate: '',
  repaymentType: 'Principal & Interest',
  interestRate: '',
  missedPayments: '',
  totalArrears: '',
  defaultNoticeDate: '',
  currentValuation: '',
  valuationProvider: 'Preston Roose Paterson',
  valuationDate: '',
  yearBuilt: '',
  floorArea: '',
  numberOfStoreys: '',
  numberOfBedrooms: '',
  numberOfBathrooms: '',
  numberOfKitchens: '',
  numberOfParking: '',
  constructionType: '',
  roofType: '',
  propertyCondition: 'Good',
  recentRenovations: '',
  specialFeatures: '',
  councilRates: '',
  waterRates: '',
  strataFees: '',
  landTax: '',
  insuranceProvider: '',
  sumInsured: '',
  insuranceExpiry: '',
  lastSalePrice: '',
  lastSaleDate: '',
  priorSalePrice: '',
  priorSaleDate: '',
  borrowerLawyerName: '',
  borrowerLawyerEmail: '',
  borrowerLawyerLicense: '',
  borrowerLawFirm: '',
  borrowerLawyerPhone: '',
  reasonForDefault: '',
  hardshipCircumstances: '',
  borrowerCooperation: 'Yes - Fully Cooperative',
  possessionStatus: 'Owner Occupied',
  additionalNotes: '',
  caseUrgency: 'Medium - Priority processing (14-30 days)',
  cardholderName: '',
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  billingAddress: '',
  billingPostcode: '',
  // Step 2 Entity
  entityType: 'Personal',
  companyName: '',
  abn: '',
  acn: '',
  registrationDate: '',
  companyType: 'Proprietary (Pty Ltd)',
  trustName: '',
  trustType: 'Family Trust',
  trustABN: '',
  trustEstablishmentDate: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  phoneNumber: '',
  emailAddress: '',
  residentialAddress: '',
  postalAddress: '',
  occupation: '',
  employer: '',
  employmentStatus: '',
  annualIncome: '',
  directorsCount: 0,
  shareholdersCount: 0,
  trusteesCount: 0,
  guarantorsCount: 0,
  creditCheckConsent: false,
  paymentAuthorized: false,
  paymentMethod: 'Credit Card',
  lenderLicenceType: '',
  creditGuide: false,
  creditContract: false,
  tenure: '12',
  disclosureKeyFacts: false,
  disclosureFeesCharges: false,
  disclosureContractCopy: false,
  disclosureBorrowerConsent: false,
  disclosureFinalConfirmation: false,
}

const LENDER_DOCS = [
  { title: 'Original Loan Agreement*', desc: 'Original executed loan contract, terms and conditions, signed agreements.' },
  { title: 'Loan Variations & Amendments*', desc: 'Any variations, amendments, modifications to original loan terms.' },
  { title: 'Bank Statements (Last 6 Months)*', desc: 'Recent bank statements showing loan account activity, payments, arrears.' },
  { title: 'Payout Letter*', desc: "Lender's payout figure, discharge costs, settlement instructions." },
  { title: 'Formal Credit Approvals*', desc: 'Original credit approval, assessment documents, lending criteria.' },
  { title: 'Registered Mortgage Documents*', desc: 'Registered mortgage, vesting notices, priority notices.' },
  { title: 'Security Documents*', desc: 'General security agreements, guarantees, additional security.' },
  { title: 'Insurance Certificate', desc: "Lender's mortgage insurance (LMI), building insurance certificates." },
  { title: 'Loan Account History*', desc: 'Repayment history, payment and schedule, interest calculations.' },
  { title: 'Arrears Summary*', desc: 'Detailed arrears breakdown, missed payments, default notices issued.' },
  { title: 'Legal Advice Signed*', desc: 'Signed legal advice documents, solicitor letters, legal representation confirmation.' },
  { title: 'Privacy Consent Signed*', desc: 'Signed privacy consent forms, authorization to share information, disclosure agreements.' },
]

export default function NewCase() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Scroll to top whenever step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])
  const [formData, setFormData] = useState(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [propertyValidating, setPropertyValidating] = useState(false)
  const [propertyValidated, setPropertyValidated] = useState(false)
  const [directors, setDirectors] = useState([])
  const [shareholders, setShareholders] = useState([])
  const [trustees, setTrustees] = useState([])
  const [guarantors, setGuarantors] = useState([])
  const [runningChecks, setRunningChecks] = useState(false)
  const [checksComplete, setChecksComplete] = useState(false)
  const [uploadedLenderDocs, setUploadedLenderDocs] = useState(() => ({ level: 'none' })) // Using object to store { title: filename }
  const [valuationUploaded, setValuationUploaded] = useState('') // Store filename
  const [insuranceUploaded, setInsuranceUploaded] = useState('') // Store filename
  const [supportingDocs, setSupportingDocs] = useState({ title: '', certificate: '', report: '' }) // Store filenames
  const [draftCaseId, setDraftCaseId] = useState(null)  // case created as DRAFT on step 1
  const fileInputRef = useRef(null)
  const uploadContextRef = useRef(null)
  const pendingDocFilesRef = useRef({})
  const [runAnalysisLoading, setRunAnalysisLoading] = useState(false)
  const [runAnalysisResult, setRunAnalysisResult] = useState(null)
  const [pendingTrustee, setPendingTrustee] = useState(null)
  const [pendingGuarantor, setPendingGuarantor] = useState(null)
  const [errors, setErrors] = useState({})
  const [showGlobalError, setShowGlobalError] = useState(false)
  const [propertyImages, setPropertyImages] = useState([]) // { file, preview, name }
  const imageInputRef = useRef(null)

  const update = (key, value) => {
    const nameFields = ['firstName', 'lastName', 'trustName', 'trusteeName', 'companyName', 'borrowerLawyerName']
    const phoneFields = ['phoneNumber', 'lenderPhone', 'borrowerLawyerPhone']
    const postcodeFields = ['postcode', 'billingPostcode']
    const currencyFields = ['intendedLoanAmount', 'annualIncome', 'outstandingDebt', 'originalLoanAmount',
      'totalArrears', 'councilRates', 'waterRates', 'strataFees', 'landTax', 'sumInsured',
      'lastSalePrice', 'priorSalePrice', 'currentValuation', 'bankAccountNumber']
    const intFields = ['loanAccountNumber', 'missedPayments']
    const rateFields = ['interestRate', 'comparisonRate']
    let filtered = value
    if (nameFields.includes(key)) {
      filtered = value.replace(/[^a-zA-Z\s''-]/g, '')
    } else if (phoneFields.includes(key)) {
      filtered = value.replace(/[^0-9+\-()\s]/g, '').slice(0, 15)
    } else if (postcodeFields.includes(key)) {
      filtered = value.replace(/[^0-9]/g, '').slice(0, 4)
    } else if (currencyFields.includes(key)) {
      filtered = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    } else if (intFields.includes(key)) {
      filtered = value.replace(/[^0-9]/g, '')
    } else if (rateFields.includes(key)) {
      filtered = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    } else if (key === 'yearBuilt') {
      filtered = value.replace(/[^0-9]/g, '').slice(0, 4)
    } else if (key === 'floorArea') {
      filtered = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    }
    setFormData((prev) => ({ ...prev, [key]: filtered }))
    // Clear error for this field when updated
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const addError = (errors, key, fn, value) => {
    const e = fn(value)
    if (e) errors[key] = e
  }

  const validateStep = (s) => {
    const newErrors = {}
    if (s === 1) {
      addError(newErrors, 'streetAddress', validateStreetAddress, formData.streetAddress)
      addError(newErrors, 'suburb', validateSuburb, formData.suburb)
      if (!formData.state) newErrors.state = 'State is required'
      const pcErr = validateAuPostcode(formData.postcode, formData.state)
      if (pcErr) newErrors.postcode = pcErr
      if (!formData.propertyType) newErrors.propertyType = 'Property type is required'
      addError(newErrors, 'intendedLoanAmount', (v) => validateCurrency(v, 'Loan amount', 10000), formData.intendedLoanAmount)
      if (!formData.typeOfSecurity) newErrors.typeOfSecurity = 'Type of security is required'
      if (!formData.mortgageOnTitle) newErrors.mortgageOnTitle = 'Confirmation of registration is required'
      if (!formData.mortgagePriority) newErrors.mortgagePriority = 'Mortgage priority is required'
      if (!formData.confirmPPSA) newErrors.confirmPPSA = 'PPSA confirmation is required'
    } else if (s === 2) {
      if (!formData.entityType) newErrors.entityType = 'Entity type is required'
      if (formData.entityType === 'Personal') {
        addError(newErrors, 'firstName', validateFirstName, formData.firstName)
        addError(newErrors, 'lastName', validateLastName, formData.lastName)
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
        addError(newErrors, 'phoneNumber', validateAuPhone, formData.phoneNumber)
        addError(newErrors, 'emailAddress', validateEmail, formData.emailAddress)
        addError(newErrors, 'residentialAddress', validateStreetAddress, formData.residentialAddress)
        if (!formData.occupation) newErrors.occupation = 'Occupation is required'
      } else if (formData.entityType === 'Company') {
        if (!formData.companyName) newErrors.companyName = 'Company name is required'
        const acnErr = validateACN(formData.acn)
        if (acnErr) newErrors.acn = acnErr
        if (formData.abn) { const abnErr = validateABN(formData.abn); if (abnErr) newErrors.abn = abnErr }
        if (directors.length === 0) newErrors.directors = 'At least one director is required'
        if (shareholders.length === 0) newErrors.shareholders = 'At least one shareholder is required'
      } else if (formData.entityType === 'Trust') {
        if (!formData.trustName) newErrors.trustName = 'Trust name is required'
        if (formData.trustABN) { const abnErr = validateABN(formData.trustABN); if (abnErr) newErrors.trustABN = abnErr }
        if (trustees.length === 0) newErrors.trustees = 'At least one trustee is required'
      }
      if (!formData.creditCheckConsent) newErrors.creditCheckConsent = 'Consent is required'
    } else if (s === 3) {
      if (!checksComplete) newErrors.checks = 'Please run all checks before proceeding'
      if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required'
      if (formData.paymentMethod === 'Credit Card') {
        if (!formData.cardholderName) newErrors.cardholderName = 'Cardholder name is required'
        if (!formData.cardNumber) newErrors.cardNumber = 'Card number is required'
        if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required'
        else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) newErrors.expiryDate = 'Enter expiry as MM/YY'
        if (!formData.cvv) newErrors.cvv = 'CVV is required'
        else if (!/^\d{3,4}$/.test(formData.cvv)) newErrors.cvv = 'CVV must be 3 or 4 digits'
      } else if (formData.paymentMethod === 'Bank Transfer') {
        if (!formData.bankAccountName) newErrors.bankAccountName = 'Account name is required'
        if (!formData.bankBsb) newErrors.bankBsb = 'BSB is required'
        if (!formData.bankAccountNumber) newErrors.bankAccountNumber = 'Account number is required'
        if (!formData.bankName) newErrors.bankName = 'Bank name is required'
      }
      const billingPcErr = validateAuPostcode(formData.billingPostcode)
      if (billingPcErr) newErrors.billingPostcode = billingPcErr
      if (!formData.paymentAuthorized) newErrors.paymentAuthorized = 'Payment authorization is required'
    } else if (s === 4) {
      if (!formData.lenderContact) newErrors.lenderContact = 'Lender contact is required'
      addError(newErrors, 'lenderEmail', validateEmail, formData.lenderEmail)
      addError(newErrors, 'lenderPhone', validateAuPhone, formData.lenderPhone)
      if (!formData.loanAccountNumber) newErrors.loanAccountNumber = 'Loan account number is required'
      const missingDocs = LENDER_DOCS.filter(d => d.title.endsWith('*') && !uploadedLenderDocs[d.title])
      if (missingDocs.length > 0) newErrors.lenderDocs = 'Please upload all required documents'
    } else if (s === 5) {
      addError(newErrors, 'outstandingDebt', (v) => validateCurrency(v, 'Outstanding debt', 0), formData.outstandingDebt)
      addError(newErrors, 'originalLoanAmount', (v) => validateCurrency(v, 'Original loan amount', 0), formData.originalLoanAmount)
      if (!formData.interestRate) {
        newErrors.interestRate = 'Interest rate is required'
      } else {
        const rate = parseFloat(formData.interestRate)
        if (isNaN(rate) || rate < 0 || rate >= 1000) {
          newErrors.interestRate = 'Enter a valid rate (0–999.99)'
        }
      }
      if (!formData.missedPayments) newErrors.missedPayments = 'Number of missed payments is required'
      addError(newErrors, 'currentValuation', (v) => validateCurrency(v, 'Current valuation', 0), formData.currentValuation)
      if (!valuationUploaded) newErrors.valuationReport = 'Valuation report is required'
    } else if (s === 7) {
      addError(newErrors, 'borrowerLawyerName', (v) => validateFirstName(v) ? 'Lawyer name: ' + validateFirstName(v) : null, formData.borrowerLawyerName)
      if (!formData.borrowerLawyerName) newErrors.borrowerLawyerName = 'Lawyer name is required'
      if (!formData.borrowerLawFirm) newErrors.borrowerLawFirm = 'Law firm is required'
      addError(newErrors, 'borrowerLawyerEmail', validateEmail, formData.borrowerLawyerEmail)
      addError(newErrors, 'borrowerLawyerPhone', validateAuPhone, formData.borrowerLawyerPhone)
      if (!formData.borrowerLawyerLicense) newErrors.borrowerLawyerLicense = 'Lawyer license is required'
    } else if (s === 8) {
      if (!formData.lenderLicenceType) newErrors.lenderLicenceType = 'Licence type is required'
      if (!formData.creditGuide) newErrors.creditGuide = 'Credit guide confirmation is required'
      if (!formData.creditContract) newErrors.creditContract = 'Credit contract confirmation is required'
    } else if (s === 9) {
      if (!formData.disclosureKeyFacts) newErrors.disclosureKeyFacts = 'You must confirm the Key Facts Sheet was provided'
      if (!formData.disclosureFeesCharges) newErrors.disclosureFeesCharges = 'You must confirm all fees and charges were disclosed'
      if (!formData.disclosureContractCopy) newErrors.disclosureContractCopy = 'You must confirm the borrower received a copy of the contract'
      if (!formData.disclosureBorrowerConsent) newErrors.disclosureBorrowerConsent = 'Borrower consent confirmation is required'
      if (!formData.disclosureFinalConfirmation) newErrors.disclosureFinalConfirmation = 'You must check the final confirmation before proceeding'
    } else if (s === 10) {
      if (!formData.reasonForDefault) newErrors.reasonForDefault = 'Reason for default is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Build the complete metadata payload from current formData + dynamic arrays
  const buildMetadata = (fd) => ({
    // Property location
    suburb: fd.suburb,
    postcode: fd.postcode,
    state: fd.state,
    street_address: fd.streetAddress,
    type_of_security: fd.typeOfSecurity,
    mortgage_on_title: fd.mortgageOnTitle,
    mortgage_priority: fd.mortgagePriority,
    security_agreement_date: fd.securityAgreementDate,
    description_secured_property: fd.descriptionSecuredProperty,
    intended_loan_amount: parseFloat(fd.intendedLoanAmount) || 0,
    // Property features
    year_built: fd.yearBuilt,
    floor_area: fd.floorArea,
    number_of_storeys: fd.numberOfStoreys,
    bedrooms: parseInt(fd.numberOfBedrooms) || 0,
    bathrooms: parseInt(fd.numberOfBathrooms) || 0,
    kitchens: parseInt(fd.numberOfKitchens) || 0,
    parking: parseInt(fd.numberOfParking) || 0,
    construction_type: fd.constructionType,
    roof_type: fd.roofType,
    property_condition: fd.propertyCondition,
    recent_renovations: fd.recentRenovations,
    special_features: fd.specialFeatures,
    // Rates & charges
    council_rates: parseFloat(fd.councilRates) || 0,
    water_rates: parseFloat(fd.waterRates) || 0,
    strata_fees: parseFloat(fd.strataFees) || 0,
    land_tax: parseFloat(fd.landTax) || 0,
    insurance_provider: fd.insuranceProvider,
    sum_insured: parseFloat(fd.sumInsured) || 0,
    insurance_expiry: fd.insuranceExpiry,
    // Sales history
    last_sale_price: parseFloat(fd.lastSalePrice) || 0,
    last_sale_date: fd.lastSaleDate,
    prior_sale_price: parseFloat(fd.priorSalePrice) || 0,
    prior_sale_date: fd.priorSaleDate,
    // Valuation
    valuation_provider: fd.valuationProvider,
    valuation_date: fd.valuationDate,
    // Lender
    lender_name: fd.lenderName,
    lender_contact: fd.lenderContact,
    lender_email: fd.lenderEmail,
    lender_phone: fd.lenderPhone,
    loan_account_number: fd.loanAccountNumber,
    lender_licence_type: fd.lenderLicenceType,
    // Loan
    original_loan_amount: parseFloat(fd.originalLoanAmount) || 0,
    loan_start_date: fd.loanStartDate,
    repayment_type: fd.repaymentType,
    missed_payments: parseInt(fd.missedPayments) || 0,
    total_arrears: parseFloat(fd.totalArrears) || 0,
    default_notice_date: fd.defaultNoticeDate,
    days_in_default: fd.defaultNoticeDate
      ? (() => {
          // Parse YYYY-MM-DD as local date to avoid UTC midnight off-by-one
          const [y, m, d] = fd.defaultNoticeDate.split('-').map(Number)
          const local = new Date(y, m - 1, d)
          return isNaN(local.getTime()) ? 0 : Math.floor((Date.now() - local.getTime()) / 86400000)
        })()
      : 0,
    default_rate: (parseFloat(fd.totalArrears) > 0 && parseFloat(fd.outstandingDebt) > 0)
      ? parseFloat(((parseFloat(fd.totalArrears) / parseFloat(fd.outstandingDebt)) * 100).toFixed(2))
      : 0,
    // Entity
    entity_type: fd.entityType,
    company_name: fd.companyName,
    abn: fd.abn,
    acn: fd.acn,
    registration_date: fd.registrationDate,
    company_type: fd.companyType,
    trust_name: fd.trustName,
    trust_type: fd.trustType,
    trust_abn: fd.trustABN,
    trust_establishment_date: fd.trustEstablishmentDate,
    first_name: fd.firstName,
    last_name: fd.lastName,
    date_of_birth: fd.dateOfBirth,
    phone_number: fd.phoneNumber,
    email_address: fd.emailAddress,
    residential_address: fd.residentialAddress,
    postal_address: fd.postalAddress,
    occupation: fd.occupation,
    employer: fd.employer,
    employment_status: fd.employmentStatus,
    annual_income: parseFloat(fd.annualIncome) || 0,
    directors_count: directors.length,
    shareholders_count: shareholders.length,
    trustees_count: trustees.length,
    guarantors_count: guarantors.length,
    directors,
    shareholders,
    trustees,
    guarantors,
    // Lawyer
    borrower_lawyer_name: fd.borrowerLawyerName,
    borrower_lawyer_email: fd.borrowerLawyerEmail,
    borrower_lawyer_license: fd.borrowerLawyerLicense,
    borrower_law_firm: fd.borrowerLawFirm,
    borrower_lawyer_phone: fd.borrowerLawyerPhone,
    // Hardship
    reason_for_default: fd.reasonForDefault,
    hardship_circumstances: fd.hardshipCircumstances,
    borrower_cooperation: fd.borrowerCooperation,
    possession_status: fd.possessionStatus,
    additional_notes: fd.additionalNotes,
    case_urgency: fd.caseUrgency,
    // NCCP
    credit_guide: fd.creditGuide,
    credit_contract: fd.creditContract,
    // Disclosure
    disclosure_key_facts: fd.disclosureKeyFacts,
    disclosure_fees_charges: fd.disclosureFeesCharges,
    disclosure_contract_copy: fd.disclosureContractCopy,
    disclosure_borrower_consent: fd.disclosureBorrowerConsent,
    disclosure_final_confirmation: fd.disclosureFinalConfirmation,
  })

  const handleNext = () => {
    if (!validateStep(step)) {
      setShowGlobalError(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setShowGlobalError(false)
    setErrors({})

    if (step === 11) {
      // Final submission — upload files then submit (DRAFT → SUBMITTED)
      // Guard: ensure the user still has a valid session token
      const sessionToken = localStorage.getItem('token')
      if (!sessionToken) {
        setErrors({ submit: 'Your session has expired. Please save your progress and log in again.' })
        return
      }
      setSubmitting(true)
      const performSubmission = async () => {
        try {
          let caseId = draftCaseId

          if (!caseId) {
            // No draft exists yet — create with all real data in one shot
            const ev = parseFloat(formData.currentValuation)
            const od = parseFloat(formData.outstandingDebt)
            const createRes = await caseService.createCase({
              title: `${formData.streetAddress}, ${formData.suburb}` || 'Mortgage Resolution Case',
              description: formData.reasonForDefault || 'New borrower case submission',
              property_address: `${formData.streetAddress}, ${formData.suburb}, ${formData.state} ${formData.postcode}`,
              property_type: formData.propertyType || 'Other',
              estimated_value: ev > 0 ? ev : 1,
              outstanding_debt: od > 0 ? od : 1,
              interest_rate: parseFloat(formData.interestRate) || 0,
              tenure: parseInt(formData.tenure) || 12,
              metadata_json: buildMetadata(formData),
            })
            if (!createRes.success) {
              setErrors({ submit: createRes.error || 'Failed to create case. Please try again.' })
              setSubmitting(false)
              return
            }
            caseId = createRes.data.id
            setDraftCaseId(caseId)
          } else {
            // Finalise the existing draft with all real values before submit
            const finalUpdateRes = await caseService.updateCase(caseId, {
              title: `${formData.streetAddress}, ${formData.suburb}` || 'Mortgage Resolution Case',
              description: formData.reasonForDefault || 'New borrower case submission',
              property_address: `${formData.streetAddress}, ${formData.suburb}, ${formData.state} ${formData.postcode}`,
              property_type: formData.propertyType || 'Other',
              estimated_value: parseFloat(formData.currentValuation) || undefined,
              outstanding_debt: parseFloat(formData.outstandingDebt) || undefined,
              interest_rate: parseFloat(formData.interestRate) || undefined,
              tenure: parseInt(formData.tenure) || 12,
              metadata_json: buildMetadata(formData),
            })
            if (!finalUpdateRes.success) {
              console.warn('Final update failed:', finalUpdateRes.error)
              // Continue anyway — metadata is saved, only structural fields may be stale
            }
          }

          // Upload property images in parallel
          const imageUploads = propertyImages.map(img => 
            caseService.uploadCaseImage(caseId, img.file)
          );
          await Promise.allSettled(imageUploads);

          // Upload case documents in parallel
          const docUploads = Object.entries(pendingDocFilesRef.current).map(([key, docInfo]) => {
            const fd = new FormData();
            fd.append('case_id', caseId);
            fd.append('document_name', docInfo.name.replace(/\.[^.]+$/, ''));
            fd.append('document_type', docInfo.docType);
            fd.append('file', docInfo.file);
            return documentService.uploadDocument(caseId, fd);
          });
          await Promise.allSettled(docUploads);

          // Submit DRAFT → SUBMITTED
          const submitRes = await caseService.submitCaseActual(caseId)
          if (submitRes.success) {
            setSubmitting(false)
            navigate('/borrower/my-case')
          } else {
            const rawErr = submitRes.error || 'Unable to submit the case. Please try again.'
            // Don't show raw Pydantic/validation JSON to the user
            const friendlyErr = rawErr.startsWith('[') || rawErr.startsWith('{')
              ? 'Your session may have expired. Please refresh the page and log in again.'
              : rawErr
            setErrors({ submit: friendlyErr })
            setSubmitting(false)
          }
        } catch (err) {
          setErrors({ submit: 'Could not connect to the platform server.' })
          setSubmitting(false)
        }
      }
      performSubmission()
      return
    }

    // --- Steps 1–10: save to backend then advance ---
    const saveAndAdvance = async () => {
      const fd = formData

      if (step === 1 && !draftCaseId) {
        // Step 1 → 2: create the draft case for the first time
        const createRes = await caseService.createCase({
          title: `${fd.streetAddress}, ${fd.suburb}` || 'Mortgage Resolution Case',
          description: 'Draft case — in progress',
          property_address: `${fd.streetAddress}, ${fd.suburb}, ${fd.state} ${fd.postcode}`,
          property_type: fd.propertyType || 'Other',
          estimated_value: 1,           // placeholder — updated at step 5
          outstanding_debt: 1,          // placeholder — updated at step 5
          interest_rate: 0,
          tenure: 12,
          metadata_json: buildMetadata(fd),
        })

        if (createRes.success) {
          setDraftCaseId(createRes.data.id)
        } else {
          // Non-blocking: show a warning but still advance (data will be saved at final submit)
          console.warn('Draft create failed at step 1:', createRes.error)
        }
        setStep((s) => Math.min(11, s + 1))
        return
      }

      if (draftCaseId) {
        // Steps 2–10: update metadata on the existing draft (non-blocking)
        // Step 5 also saves structural financial fields
        const updatePayload = { metadata_json: buildMetadata(fd) }
        if (step === 5) {
          const od = parseFloat(fd.outstandingDebt)
          const ev = parseFloat(fd.currentValuation)
          const ir = parseFloat(fd.interestRate)
          if (od > 0) updatePayload.outstanding_debt = od
          if (ev > 0) updatePayload.estimated_value = ev
          if (ir > 0) updatePayload.interest_rate = ir
        }
        caseService.updateCase(draftCaseId, updatePayload).catch(() => {})
      }

      setStep((s) => Math.min(11, s + 1))
    }

    saveAndAdvance()
  }

  const handlePrev = () => {
    setStep((s) => Math.max(1, s - 1))
    setShowGlobalError(false)
    setErrors({})
  }

  const handleValidateProperty = () => {
    setPropertyValidating(true)
    setTimeout(() => {
      setPropertyValidating(false)
      setPropertyValidated(true)
    }, 1500)
  }

  const addDirector = () => {
    const n = directors.length + 1
    setDirectors((prev) => [...prev, { id: Date.now(), name: `Director ${n}` }])
    update('directorsCount', n)
  }
  const addShareholder = () => {
    const n = shareholders.length + 1
    setShareholders((prev) => [...prev, { id: Date.now(), name: `Shareholder ${n}` }])
    update('shareholdersCount', n)
  }
  const addTrustee = () => {
    setPendingTrustee({ trusteeType: 'Individual Trustee', name: '' })
  }
  const saveTrustee = () => {
    if (!pendingTrustee) return
    const { trusteeType, name } = pendingTrustee
    setTrustees((prev) => [...prev, { id: Date.now(), trusteeType: trusteeType || 'Individual Trustee', name: name || 'Unnamed Trustee' }])
    update('trusteesCount', trustees.length + 1)
    setPendingTrustee(null)
  }
  const cancelTrustee = () => setPendingTrustee(null)
  const removeTrustee = (id) => {
    setTrustees((prev) => {
      const next = prev.filter((x) => x.id !== id)
      update('trusteesCount', next.length)
      return next
    })
  }

  const addGuarantor = () => {
    setPendingGuarantor({ guarantorType: 'Individual', name: '', dateOfBirth: '', phone: '', email: '' })
  }
  const saveGuarantor = () => {
    if (!pendingGuarantor) return
    const { guarantorType, name, dateOfBirth, phone, email } = pendingGuarantor
    setGuarantors((prev) => [
      ...prev,
      { id: Date.now(), guarantorType: guarantorType || 'Individual', name: name || 'Unnamed Guarantor', dateOfBirth: dateOfBirth || '', phone: phone || '', email: email || '' },
    ])
    update('guarantorsCount', guarantors.length + 1)
    setPendingGuarantor(null)
  }
  const cancelGuarantor = () => setPendingGuarantor(null)
  const removeGuarantor = (id) => {
    setGuarantors((prev) => {
      const next = prev.filter((x) => x.id !== id)
      update('guarantorsCount', next.length)
      return next
    })
  }

  const triggerUpload = (context) => {
    uploadContextRef.current = context
    fileInputRef.current?.click()
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const context = uploadContextRef.current
    if (!context) return

    // 5MB validation
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'File size must be less than 5 MB.'
      setErrors((prev) => ({ ...prev, [context.field || 'upload']: errorMsg }))
      setShowGlobalError(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      e.target.value = ''
      return
    }

    // Success - clear errors and update state
    setErrors((prev) => {
      const next = { ...prev }
      delete next[context.field || 'upload']
      return next
    })

    if (context.type === 'lender') {
      setUploadedLenderDocs((prev) => ({ ...prev, [context.title]: file.name }))
      pendingDocFilesRef.current[`lender_${context.title}`] = { file, name: file.name, docType: 'Legal' }
    } else if (context.type === 'valuation') {
      setValuationUploaded(file.name)
      pendingDocFilesRef.current['valuation'] = { file, name: file.name, docType: 'Valuation' }
    } else if (context.type === 'insurance') {
      setInsuranceUploaded(file.name)
      pendingDocFilesRef.current['insurance'] = { file, name: file.name, docType: 'Insurance' }
    } else if (context.type === 'supporting') {
      setSupportingDocs((prev) => ({ ...prev, [context.key]: file.name }))
      pendingDocFilesRef.current[`supporting_${context.key}`] = { file, name: file.name, docType: 'Legal' }
    }

    e.target.value = '' // Clear selection for next upload
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const valid = files.filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024)
    const newImages = valid.map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name }))
    setPropertyImages(prev => [...prev, ...newImages])
    e.target.value = ''
  }

  const removePropertyImage = (idx) => {
    setPropertyImages(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleRunAnalysis = () => {
    setRunAnalysisLoading(true)
    setRunAnalysisResult(null)
    setTimeout(() => {
      setRunAnalysisLoading(false)
      setRunAnalysisResult('Compliance check complete. No issues detected. All required disclosures and consent flags are in order. Data verification passed.')
    }, 1800)
  }

  const handleRunAllChecks = () => {
    setRunningChecks(true)
    setTimeout(() => {
      setRunningChecks(false)
      setChecksComplete(true)
    }, 2000)
  }

  const lenderDocsCompleted = Object.keys(uploadedLenderDocs).length - 1 // -1 for level: 'none'

  return (
    <div className="space-y-5 max-w-4xl mx-auto w-full min-w-0 pb-4">
      {/* Demo banner - light blue, dark blue text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 flex gap-2">
        <span className="shrink-0 text-blue-600" aria-hidden>ℹ</span>
        <span><strong>Development/Demo Mode Active.</strong> Property detections are pre-accepted in this demo environment to allow testing and exploration. In production, users must complete the full Professional declarations page before creating cases.</span>
      </div>

      {/* Header: title, subtitle, Back to Cases (link style) */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 id="submit-case-title" className="text-xl sm:text-2xl font-bold text-slate-900">
            Submit New Case
          </h1>
          <p className="text-sm text-slate-500 mt-1">Complete property & identity verification for your mortgage resolution case</p>
        </div>
        <button type="button" onClick={() => navigate('/borrower/dashboard')} className="text-indigo-600 text-sm font-medium hover:underline shrink-0 self-start sm:self-center flex items-center gap-1">
          <span>←</span> Back to Dashboard
        </button>
      </div>

      {/* Stepper - Step 1 blue, others grey; connectors */}
      <div className="overflow-x-auto">
        <div className="flex items-start gap-0 min-w-max pb-1">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center shrink-0">
              <div className="flex flex-col items-center">
                <button type="button" onClick={() => setStep(s.id)} className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${step === s.id ? 'bg-indigo-600 border-indigo-600 text-white' : step > s.id ? 'bg-indigo-100 border-indigo-200 text-indigo-700 hover:bg-indigo-200' : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'}`} aria-label={`Go to step ${s.id}: ${s.label}`}>
                  {step > s.id ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : s.id}
                </button>
                <span className={`text-xs mt-1.5 whitespace-nowrap max-w-[4.5rem] text-center font-medium ${step === s.id ? 'text-indigo-600' : step > s.id ? 'text-indigo-600' : 'text-slate-500'}`}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-4 sm:w-6 h-0.5 mx-0.5 mt-4 shrink-0 ${step > s.id ? 'bg-indigo-200' : 'bg-slate-200'}`} aria-hidden />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">*Step skipped (NCCP does not apply to this loan)</p>
      </div>

      {/* Global Error Banner */}
      {(showGlobalError || errors.submit) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-red-500 shrink-0 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-bold text-red-800">{errors.submit ? 'Submission Error' : 'Please fill all required fields.'}</p>
            <p className="text-sm text-red-700 mt-0.5">{errors.submit || 'Some mandatory information is missing or incorrect in the current step.'}</p>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {step === 1 && (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Property Details - light blue card, subtle border */}
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-lg">🏠</span>
                Property Details
              </h2>
              <p className="text-sm text-slate-500 mt-1">Enter property address for RP Data validation</p>
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Property Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Street Address *</label>
                    <input type="text" value={formData.streetAddress} onChange={(e) => update('streetAddress', e.target.value)} className={`w-full border ${errors.streetAddress ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600`} placeholder="Street address" />
                    {errors.streetAddress && <p className="mt-1 text-xs text-red-500">{errors.streetAddress}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Suburb *</label>
                    <input type="text" value={formData.suburb} onChange={(e) => update('suburb', e.target.value)} className={`w-full border ${errors.suburb ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm bg-white`} placeholder="Suburb" />
                    {errors.suburb && <p className="mt-1 text-xs text-red-500">{errors.suburb}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                    <select value={formData.state} onChange={(e) => update('state', e.target.value)} className={`w-full border ${errors.state ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm bg-white`}>
                      <option value="">Select state</option>
                      <option>NSW</option>
                      <option>VIC</option>
                      <option>QLD</option>
                      <option>WA</option>
                      <option>SA</option>
                      <option>TAS</option>
                      <option>ACT</option>
                      <option>NT</option>
                    </select>
                    {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Postcode *</label>
                    <input type="text" value={formData.postcode} onChange={(e) => update('postcode', e.target.value)} className={`w-full border ${errors.postcode ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm bg-white`} placeholder="Postcode" />
                    {errors.postcode && <p className="mt-1 text-xs text-red-500">{errors.postcode}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Property Type *</label>
                    <select value={formData.propertyType} onChange={(e) => update('propertyType', e.target.value)} className={`w-full border ${errors.propertyType ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm bg-white`}>
                      <option value="">Select type</option>
                      <option>House</option>
                      <option>Apartment</option>
                      <option>Townhouse</option>
                      <option>Land</option>
                    </select>
                    {errors.propertyType && <p className="mt-1 text-xs text-red-500">{errors.propertyType}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Intended Loan Amount (A$) *</label>
                    <input type="text" value={formData.intendedLoanAmount} onChange={(e) => update('intendedLoanAmount', e.target.value)} className={`w-full border ${errors.intendedLoanAmount ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm bg-white`} placeholder="Amount" />
                    {errors.intendedLoanAmount && <p className="mt-1 text-xs text-red-500">{errors.intendedLoanAmount}</p>}
                  </div>
                </div>
                <button type="button" onClick={handleValidateProperty} disabled={propertyValidating} className="mt-5 w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2">
                  {propertyValidating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Validating…
                    </>
                  ) : propertyValidated ? (
                    <>
                      <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Property validated
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      Validate & Pull Property Data
                    </>
                  )}
                </button>
                {propertyValidated && <p className="mt-2 text-sm text-green-600">Address verified. Property data loaded for {formData.streetAddress}, {formData.suburb}.</p>}
              </div>
            </section>

            {/* Security Requirements (PPSA) - purple accent header */}
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full border-2 border-violet-600 flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-violet-600" /></span>
                Security Requirements (PPSA Compliance)
              </h2>
              <p className="text-sm text-slate-500 mt-1">Personal Property Securities Act 2009 - Ensure security interests are properly registered</p>
              {/* PPSA warning - light yellow, yellow icon */}
              <div className="mt-4 p-4 bg-amber-100 border border-amber-300 rounded-lg flex gap-3">
                <span className="text-amber-600 shrink-0 text-lg" aria-hidden>⚠</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">PPSA Compliance Required</p>
                  <p className="text-sm text-amber-800 mt-0.5">Under the Personal Property Securities Act 2009, all security interests in personal property must be registered on the PPSR to be enforceable against third parties. For real property mortgages, registration on title is required.</p>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type of Security *</label>
                  <select value={formData.typeOfSecurity} onChange={(e) => update('typeOfSecurity', e.target.value)} className={`w-full border ${errors.typeOfSecurity ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-violet-600 focus:border-violet-600`}>
                    <option value="">Select type</option>
                    <option value="Registered Mortgage">Registered Mortgage</option>
                    <option value="General Security Agreement">General Security Agreement</option>
                    <option value="Security over Specific Goods">Security over Specific Goods</option>
                    <option value="Purchase Money Security Interests">Purchase Money Security Interests</option>
                    <option value="Unsecured">Unsecured</option>
                  </select>
                  {errors.typeOfSecurity && <p className="mt-1 text-xs text-red-500">{errors.typeOfSecurity}</p>}
                </div>
                {/* Registered Mortgage Requirements = checkbox + description */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.mortgageOnTitle} onChange={(e) => update('mortgageOnTitle', e.target.checked)} className={`rounded ${errors.mortgageOnTitle ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} text-violet-600 mt-0.5 shrink-0 focus:ring-violet-600`} />
                    <div>
                      <span className={`text-sm font-medium ${errors.mortgageOnTitle ? 'text-red-700' : 'text-slate-700'}`}>Mortgage Registered on Title *</span>
                      <p className="text-xs text-slate-500 mt-0.5">Confirm that the mortgage is registered on the Certificate of Title at the relevant Land Titles Office (Real Property Act).</p>
                    </div>
                  </label>
                  {errors.mortgageOnTitle && <p className="mt-1 text-xs text-red-500">{errors.mortgageOnTitle}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mortgage Priority *</label>
                  <select value={formData.mortgagePriority} onChange={(e) => update('mortgagePriority', e.target.value)} className={`w-full border ${errors.mortgagePriority ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-violet-600 focus:border-violet-600`}>
                    <option value="">Select priority</option>
                    <option value="First Mortgage">First Mortgage</option>
                    <option value="Second">Second</option>
                    <option value="Third">Third</option>
                    <option value="Subordinated">Subordinated</option>
                  </select>
                  {errors.mortgagePriority && <p className="mt-1 text-xs text-red-500">{errors.mortgagePriority}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Security Agreement Date</label>
                  <DatePicker value={formData.securityAgreementDate} onChange={(val) => update('securityAgreementDate', val)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-violet-600 focus:border-violet-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description of Secured Property</label>
                  <textarea value={formData.descriptionSecuredProperty} onChange={(e) => update('descriptionSecuredProperty', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-violet-600 focus:border-violet-600" rows={3} placeholder="Describe the property or assets that are subject to the security interest..." />
                </div>
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.confirmPPSA} onChange={(e) => update('confirmPPSA', e.target.checked)} className={`rounded ${errors.confirmPPSA ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} text-violet-600 mt-0.5 shrink-0 focus:ring-violet-600`} />
                    <div>
                      <span className={`text-sm font-medium ${errors.confirmPPSA ? 'text-red-700' : 'text-violet-700'}`}>I confirm PPSA compliance for this security interest *</span>
                      <p className="text-xs text-slate-500 mt-0.5">I confirm that all security interests have been properly perfected according to PPSA requirements, including registration where required, and all necessary searches have been conducted.</p>
                    </div>
                  </label>
                  {errors.confirmPPSA && <p className="mt-1 text-xs text-red-500">{errors.confirmPPSA}</p>}
                </div>
              </div>
            </section>

            {/* Property Images Upload */}
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">📸</span>
                Property Photos
                <span className="text-xs font-normal text-slate-400">(optional — shown in auction room)</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1 mb-4">Upload photos of the property. These will be visible to investors during the auction.</p>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />

              <div className="flex flex-wrap gap-3">
                {propertyImages.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePropertyImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-xs gap-1"
                >
                  <span className="text-2xl">+</span>
                  <span>Add Photo</span>
                </button>
              </div>
              {propertyImages.length > 0 && (
                <p className="text-xs text-emerald-600 mt-2">{propertyImages.length} photo{propertyImages.length > 1 ? 's' : ''} ready to upload</p>
              )}
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Main heading */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </span>
                Borrower Details & Entity Structure
              </h2>
              <p className="text-sm text-slate-500 mt-1">Define the borrowing entity and all related parties</p>
            </div>

            <section>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                Borrowing Entity Type
              </h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">Select the type of entity borrowing the funds</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <button type="button" onClick={() => update('entityType', 'Personal')} className={`rounded-lg border-2 p-4 text-left transition-colors ${formData.entityType === 'Personal' ? 'border-blue-500 bg-blue-50' : errors.entityType ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <span className={`block w-9 h-9 rounded-full flex items-center justify-center mb-3 ${formData.entityType === 'Personal' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <span className={`block font-semibold ${formData.entityType === 'Personal' ? 'text-blue-700' : 'text-slate-900'}`}>Personal</span>
                  <span className={`block text-sm mt-0.5 ${formData.entityType === 'Personal' ? 'text-blue-600' : 'text-slate-500'}`}>Individual borrower</span>
                </button>
                <button type="button" onClick={() => update('entityType', 'Company')} className={`rounded-lg border-2 p-4 text-left transition-colors ${formData.entityType === 'Company' ? 'border-violet-600 bg-violet-50' : errors.entityType ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <span className={`block w-9 h-9 rounded-full flex items-center justify-center mb-3 ${formData.entityType === 'Company' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </span>
                  <span className={`block font-semibold ${formData.entityType === 'Company' ? 'text-violet-700' : 'text-slate-900'}`}>Company</span>
                  <span className={`block text-sm mt-0.5 ${formData.entityType === 'Company' ? 'text-violet-600' : 'text-slate-500'}`}>Corporate entity</span>
                </button>
                <button type="button" onClick={() => update('entityType', 'Trust')} className={`rounded-lg border-2 p-4 text-left transition-colors ${formData.entityType === 'Trust' ? 'border-orange-600 bg-orange-50' : errors.entityType ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <span className={`block w-9 h-9 rounded-full flex items-center justify-center mb-3 ${formData.entityType === 'Trust' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </span>
                  <span className={`block font-semibold ${formData.entityType === 'Trust' ? 'text-orange-700' : 'text-slate-900'}`}>Trust</span>
                  <span className={`block text-sm mt-0.5 ${formData.entityType === 'Trust' ? 'text-orange-600' : 'text-slate-500'}`}>Trust structure</span>
                </button>
              </div>
              {errors.entityType && <p className="mt-2 text-xs text-red-500">{errors.entityType}</p>}
            </section>

            {/* Company Details - when Company selected */}
            {formData.entityType === 'Company' && (
              <section className="rounded-lg border border-violet-100 bg-slate-50 p-4 sm:p-5">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </span>
                  Company Details
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name *</label>
                    <input type="text" value={formData.companyName} onChange={(e) => update('companyName', e.target.value)} className={`w-full border ${errors.companyName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white`} placeholder="ABC Pty Ltd" />
                    {errors.companyName && <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">ABN</label>
                    <input type="text" value={formData.abn} onChange={(e) => update('abn', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white" placeholder="12 345 678 901" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">ACN *</label>
                    <input type="text" value={formData.acn} onChange={(e) => update('acn', e.target.value)} className={`w-full border ${errors.acn ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white`} placeholder="123 456 789" />
                    {errors.acn && <p className="mt-1 text-xs text-red-500">{errors.acn}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Registration Date</label>
                    <DatePicker value={formData.registrationDate} onChange={(val) => update('registrationDate', val)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Type</label>
                    <select value={formData.companyType} onChange={(e) => update('companyType', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white">
                      <option value="Proprietary (Pty Ltd)">Proprietary (Pty Ltd)</option>
                      <option value="Public">Public</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* Directors - when Company */}
            {formData.entityType === 'Company' && (
              <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </span>
                      Directors ({formData.directorsCount})
                    </h3>
                    <p className={`text-sm ${errors.directors ? 'text-red-600' : 'text-slate-500'} mt-1`}>{errors.directors || 'All directors must be verified'}</p>
                  </div>
                  <button type="button" onClick={addDirector} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center gap-2 shrink-0">
                    <span>+</span> Add Director
                  </button>
                </div>
                {directors.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {directors.map((d) => (
                      <li key={d.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-slate-200 text-sm">
                        <span className="font-medium text-slate-700">{d.name}</span>
                        <button type="button" onClick={() => { setDirectors((p) => { const next = p.filter((x) => x.id !== d.id); update('directorsCount', next.length); return next; }); }} className="text-red-600 hover:underline text-xs">Remove</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 mt-4">No directors added yet. Click &apos;Add Director&apos; to begin.</p>
                )}
              </section>
            )}

            {/* Shareholders - when Company */}
            {formData.entityType === 'Company' && (
              <section className="rounded-lg border border-emerald-200 bg-green-50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </span>
                      Shareholders with 25%+ Ownership ({formData.shareholdersCount})
                    </h3>
                    <p className={`text-sm ${errors.shareholders ? 'text-red-600' : 'text-slate-500'} mt-1`}>{errors.shareholders || 'AML/CTF Act requires verification of beneficial owners with 25%+ shareholding'}</p>
                  </div>
                  <button type="button" onClick={addShareholder} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center gap-2 shrink-0">
                    <span>+</span> Add Shareholder
                  </button>
                </div>
                {shareholders.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {shareholders.map((s) => (
                      <li key={s.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-slate-200 text-sm">
                        <span className="font-medium text-slate-700">{s.name}</span>
                        <button type="button" onClick={() => { setShareholders((p) => { const next = p.filter((x) => x.id !== s.id); update('shareholdersCount', next.length); return next; }); }} className="text-red-600 hover:underline text-xs">Remove</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 mt-4">No shareholders added yet. Click &apos;Add Shareholder&apos; to begin.</p>
                )}
              </section>
            )}

            {/* Trust Details - when Trust selected */}
            {formData.entityType === 'Trust' && (
              <section className="rounded-lg border border-orange-200 bg-orange-50 p-4 sm:p-5">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </span>
                  Trust Details
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Trust Name *</label>
                    <input type="text" value={formData.trustName} onChange={(e) => update('trustName', e.target.value)} className={`w-full border ${errors.trustName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white`} placeholder="Smith Family Trust" />
                    {errors.trustName && <p className="mt-1 text-xs text-red-500">{errors.trustName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Trust Type</label>
                    <select value={formData.trustType} onChange={(e) => update('trustType', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white">
                      <option value="Family Trust">Family Trust</option>
                      <option value="Unit Trust">Unit Trust</option>
                      <option value="Discretionary Trust">Discretionary Trust</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">ABN (if registered)</label>
                    <input type="text" value={formData.trustABN} onChange={(e) => update('trustABN', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white" placeholder="12 345 678 900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Establishment Date</label>
                    <DatePicker value={formData.trustEstablishmentDate} onChange={(val) => update('trustEstablishmentDate', val)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white" />
                  </div>
                </div>
              </section>
            )}

            {/* Trustees - when Trust */}
            {formData.entityType === 'Trust' && (
              <section className="rounded-lg border border-violet-100 bg-violet-50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      </span>
                      Trustees ({trustees.length})
                    </h3>
                    <p className={`text-sm ${errors.trustees ? 'text-red-600' : 'text-slate-500'} mt-1`}>{errors.trustees || 'All trustees must be verified (can be individuals or companies)'}</p>
                  </div>
                  {!pendingTrustee && (
                    <button type="button" onClick={addTrustee} className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700 flex items-center gap-2 shrink-0">
                      <span>+</span> Add Trustee
                    </button>
                  )}
                </div>
                {pendingTrustee && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-violet-600/30 space-y-3">
                    <h4 className="text-sm font-medium text-slate-700">New trustee – fill type and name, then save</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Trustee Type *</label>
                        <select
                          value={pendingTrustee.trusteeType}
                          onChange={(e) => setPendingTrustee((p) => ({ ...p, trusteeType: e.target.value }))}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
                        >
                          <option value="Individual Trustee">Individual Trustee</option>
                          <option value="Company Trustee">Company Trustee</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                        <input
                          type="text"
                          value={pendingTrustee.name}
                          onChange={(e) => setPendingTrustee((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Full name or company name"
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={saveTrustee} className="px-3 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700">
                        Save Trustee
                      </button>
                      <button type="button" onClick={cancelTrustee} className="px-3 py-1.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {trustees.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {trustees.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-2 px-3 bg-white rounded border border-slate-200 text-sm">
                        <span className="font-medium text-slate-700">{t.trusteeType || 'Trustee'}: {t.name}</span>
                        <button type="button" onClick={() => removeTrustee(t.id)} className="text-red-600 hover:underline text-xs shrink-0">Remove</button>
                      </li>
                    ))}
                  </ul>
                ) : !pendingTrustee && (
                  <p className="text-sm text-slate-500 mt-4">No trustees added yet. Click &apos;Add Trustee&apos; to begin.</p>
                )}
              </section>
            )}

            {/* Personal Details - when Personal selected */}
            {formData.entityType === 'Personal' && (
              <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  Personal Details
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name *</label>
                    <input type="text" value={formData.firstName} onChange={(e) => update('firstName', e.target.value)} className={`w-full border ${errors.firstName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white`} />
                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name *</label>
                    <input type="text" value={formData.lastName} onChange={(e) => update('lastName', e.target.value)} className={`w-full border ${errors.lastName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white`} />
                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth *</label>
                    <DatePicker value={formData.dateOfBirth} onChange={(val) => update('dateOfBirth', val)} className="" />
                    {errors.dateOfBirth && <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number *</label>
                    <input type="text" value={formData.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} className={`w-full border ${errors.phoneNumber ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white`} />
                    {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                    <input type="email" value={formData.emailAddress} onChange={(e) => update('emailAddress', e.target.value)} className={`w-full border ${errors.emailAddress ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white`} />
                    {errors.emailAddress && <p className="mt-1 text-xs text-red-500">{errors.emailAddress}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Residential Address *</label>
                    <input type="text" value={formData.residentialAddress} onChange={(e) => update('residentialAddress', e.target.value)} className={`w-full border ${errors.residentialAddress ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white`} />
                    {errors.residentialAddress && <p className="mt-1 text-xs text-red-500">{errors.residentialAddress}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Postal Address (if different)</label>
                    <input type="text" value={formData.postalAddress} onChange={(e) => update('postalAddress', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Occupation *</label>
                    <input type="text" value={formData.occupation} onChange={(e) => update('occupation', e.target.value)} className={`w-full border ${errors.occupation ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white`} />
                    {errors.occupation && <p className="mt-1 text-xs text-red-500">{errors.occupation}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Employer</label>
                    <input type="text" value={formData.employer} onChange={(e) => update('employer', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Employment Status</label>
                    <select value={formData.employmentStatus} onChange={(e) => update('employmentStatus', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white">
                      <option value="">Select status</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Self-employed">Self-employed</option>
                      <option value="Casual">Casual</option>
                      <option value="Unemployed">Unemployed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Annual Income (A$)</label>
                    <input type="text" value={formData.annualIncome} onChange={(e) => update('annualIncome', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-white" />
                  </div>
                </div>
              </section>
            )}

            {/* Guarantors - always shown */}
            <section className="rounded-lg border border-emerald-200 bg-green-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </span>
                    Guarantors ({guarantors.length})
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Add any guarantors (optional - can be individuals or companies)</p>
                </div>
                {!pendingGuarantor && (
                  <button type="button" onClick={addGuarantor} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center gap-2 shrink-0">
                    <span>+</span> Add Guarantor
                  </button>
                )}
              </div>
              {pendingGuarantor && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-green-600/30 space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">New guarantor – fill type, name and details, then save</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Guarantor Type *</label>
                      <select
                        value={pendingGuarantor.guarantorType}
                        onChange={(e) => setPendingGuarantor((p) => ({ ...p, guarantorType: e.target.value }))}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
                      >
                        <option value="Individual">Individual</option>
                        <option value="Company">Company</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                      <input
                        type="text"
                        value={pendingGuarantor.name}
                        onChange={(e) => setPendingGuarantor((p) => ({ ...p, name: e.target.value.replace(/[^a-zA-Z\s''-]/g, '') }))}
                        placeholder="Full name or company name"
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label>
                      <DatePicker
                        value={pendingGuarantor.dateOfBirth}
                        onChange={(val) => setPendingGuarantor((p) => ({ ...p, dateOfBirth: val }))}
                        placeholderText="MM/DD/YYYY"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                      <input
                        type="text"
                        value={pendingGuarantor.phone}
                        onChange={(e) => setPendingGuarantor((p) => ({ ...p, phone: e.target.value.replace(/[^0-9+\-()\s]/g, '') }))}
                        placeholder="0400 000 000"
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={pendingGuarantor.email}
                        onChange={(e) => setPendingGuarantor((p) => ({ ...p, email: e.target.value }))}
                        placeholder="email@example.com"
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={saveGuarantor} className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
                      Save Guarantor
                    </button>
                    <button type="button" onClick={cancelGuarantor} className="px-3 py-1.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {guarantors.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {guarantors.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 py-2 px-3 bg-white rounded border border-slate-200 text-sm">
                      <span className="font-medium text-slate-700">{g.guarantorType || 'Guarantor'}: {g.name}</span>
                      <button type="button" onClick={() => removeGuarantor(g.id)} className="text-red-600 hover:underline text-xs shrink-0">Remove</button>
                    </li>
                  ))}
                </ul>
              ) : !pendingGuarantor && (
                <p className="text-sm text-slate-500 mt-4">No guarantors added. Click &apos;Add Guarantor&apos; if required.</p>
              )}
            </section>

            {/* Credit Check Requirements (NCCP & Privacy Act) */}
            <section className="rounded-lg border border-red-200 bg-white p-4 sm:p-5">
              <h3 className="text-base font-semibold text-red-600 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <span className="text-lg leading-none" aria-hidden>!</span>
                </span>
                Credit Check Requirements (NCCP & Privacy Act)
              </h3>
              <p className="text-sm text-red-500 mt-1">National Consumer Credit Protection Act 2009 & Privacy Act 1988 - Obtain explicit consent before accessing credit information</p>

              <div className="mt-4 p-4 rounded-lg border border-red-300 bg-red-50">
                <div className="flex gap-3">
                  <span className="text-red-500 shrink-0 text-lg font-bold" aria-hidden>!</span>
                  <div>
                    <p className="text-sm font-bold text-red-800">MANDATORY PRIVACY ACT COMPLIANCE</p>
                    <p className="text-sm text-red-700 mt-1">Under the Privacy Act 1988 (Australian Privacy Principles) and Credit Reporting Code, you MUST obtain explicit written consent from the borrower before accessing their credit report from any credit reporting body (CRB). Failure to obtain consent is a breach of the Privacy Act and may result in penalties.</p>
                    <p className="text-sm font-medium text-red-800 mt-2">Credit checks cannot be run until all consents below are confirmed.</p>
                  </div>
                </div>
              </div>

               <div className={`mt-4 p-4 rounded-lg border ${errors.creditCheckConsent ? 'border-red-500 bg-red-50' : 'border-red-300 bg-white'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.creditCheckConsent} onChange={(e) => update('creditCheckConsent', e.target.checked)} className={`rounded ${errors.creditCheckConsent ? 'border-red-500 ring-1 ring-red-500' : 'border-red-300'} text-red-600 mt-0.5 shrink-0 focus:ring-red-500`} />
                  <div>
                    <span className={`text-sm font-medium ${errors.creditCheckConsent ? 'text-red-700' : 'text-red-700'}`}>Credit Check Consent Obtained from Borrower *</span>
                    <p className="text-sm text-slate-700 mt-2">I confirm that I have obtained explicit, informed, written consent from the borrower to:</p>
                    <ul className="list-disc list-inside text-sm text-slate-700 mt-2 space-y-1">
                      <li>Access their credit report from a credit reporting body (CRB)</li>
                      <li>Use credit information for the purpose of assessing this credit application</li>
                      <li>Disclose credit information to credit providers and other permitted parties</li>
                      <li>Understand that the credit check will be recorded on their credit file</li>
                    </ul>
                    <p className="text-xs text-red-600 mt-2">Privacy Act 1988 & Australian Privacy Principles (APP) 2 & 6.1</p>
                  </div>
                </label>
                {errors.creditCheckConsent && <p className="mt-2 text-xs text-red-500 font-bold">{errors.creditCheckConsent}</p>}
              </div>

              <div className="mt-4 p-4 rounded-lg border border-amber-300 bg-amber-50">
                <div className="flex gap-3">
                  <span className="text-amber-600 shrink-0 text-lg" aria-hidden>⚠</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Credit Check Consent Required</p>
                    <p className="text-sm text-slate-700 mt-1">You must tick the consent checkbox above and complete all required fields before credit checks can be initiated in Step 11.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 3 && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">$ Payment & Automated Verification</h2>
            <p className="text-sm text-slate-500">Complete payment - all searches will run automatically</p>

            {/* Automated Verification Package - blue card with Total Cost right */}
            <div className="bg-indigo-600 text-white rounded-lg p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-white">Automated Verification Package</h3>
                  <p className="text-sm text-indigo-100 mt-1">Complete property valuation, InfoTrack checks & KYC screening</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-indigo-200">Total Cost</p>
                  <p className="text-3xl font-bold text-white">$186.00</p>
                  <p className="text-xs text-indigo-200">incl. GST</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-indigo-500">
                <p className="text-sm font-medium text-white mb-2">Package Includes:</p>
                <ul className="space-y-2 text-sm text-indigo-100">
                  {[
                    { label: 'RP Data AVM Valuation', price: '$45.00' },
                    { label: 'InfoTrack Title Search', price: '$28.50' },
                    { label: 'InfoTrack Ownership Verification', price: '$22.00' },
                    { label: 'InfoTrack Encumbrance Check', price: '$25.00' },
                    { label: 'InfoTrack Zoning Certificate', price: '$35.00' },
                    { label: 'GreenID Identity Verification', price: '$12.50' },
                    { label: 'AUSTRAC Sanctions Screening', price: '$8.00' },
                    { label: 'PEP & RCA Screening', price: '$10.00' },
                  ].map(({ label, price }) => (
                    <li key={label} className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-xs">✓</span>{label}</span>
                      <span className="font-medium text-white">{price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Instant Automated Processing - purple */}
            <div className={`bg-purple-600 text-white rounded-lg p-5 ${errors.checks ? 'ring-4 ring-offset-2 ring-red-500' : ''}`}>
              <h3 className="font-semibold text-white">Instant Automated Processing:</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-purple-100">
                {['Complete property AVM valuation from RP Data', 'Full title search and ownership verification', 'Encumbrances, caveats & zoning checks', 'GreenID + DVS identity verification', 'AUSTRAC sanctions & PEP screening', 'All reports automatically sent to you', 'Automatically attached to Credit Risk'].map((item) => (
                  <li key={item} className="flex items-center gap-2">• {item}</li>
                ))}
              </ul>
              <button type="button" onClick={handleRunAllChecks} disabled={runningChecks} className="mt-4 px-4 py-2 bg-white text-purple-700 text-sm font-medium rounded-md hover:bg-purple-50 disabled:opacity-70 flex items-center gap-2">
                {runningChecks ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Running checks…
                  </>
                ) : checksComplete ? (
                  <>
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Checks complete
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    Run All Checks Now - $186.00
                  </>
                )}
              </button>
              {errors.checks && <p className="mt-2 text-sm text-red-200 font-bold">{errors.checks}</p>}
              <p className="text-xs text-purple-200 mt-3">By proceeding, you authorise Drove to charge $186.00 (inc. GST) to your account for automated verification services.</p>
            </div>

            {/* Transparent Pricing */}
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg flex gap-2">
              <span className="text-slate-500 shrink-0">◆</span>
              <div>
                <p className="font-medium text-slate-800">Transparent Pricing</p>
                <p className="text-sm text-slate-600 mt-0.5">All costs are listed at actual provider rates with no markup. RP Data AVM $45, InfoTrack searches $100, and KYC checks $50.</p>
              </div>
            </div>

            {/* Onboarding & Verification Costs */}
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">Onboarding & Verification Costs</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {[
                  { label: 'InfoTrack Property Search', sub: 'Title, ownership, encumbrances, zoning', price: 'A$85.00' },
                  { label: 'InfoTrack KYC/GreenID Verification', sub: 'Identity, Sanctions & PEP screening', price: 'A$45.00' },
                  { label: 'Platform Onboarding Fee', sub: 'Case setup and processing', price: 'A$120.00' },
                ].map(({ label, sub, price }) => (
                  <li key={label} className="flex justify-between items-start gap-4">
                    <span><span className="font-medium">{label}</span>{sub && <span className="text-slate-500 block text-xs">{sub}</span>}</span>
                    <span className="font-medium text-slate-900 shrink-0">{price}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-indigo-600">Total Due Today</span>
                <span className="text-xl font-bold text-indigo-600">A$250.00</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">Payment Method</h3>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Payment Method *</label>
                <select value={formData.paymentMethod ?? 'Credit Card'} onChange={(e) => update('paymentMethod', e.target.value)} className={`w-full border ${errors.paymentMethod ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm bg-white`}>
                  <option value="">Select method</option>
                  <option>Credit Card</option>
                  <option>Bank Transfer</option>
                </select>
                {errors.paymentMethod && <p className="mt-1 text-xs text-red-500">{errors.paymentMethod}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {formData.paymentMethod === 'Credit Card' && (<>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cardholder Name *</label>
                    <input type="text" value={formData.cardholderName} onChange={(e) => update('cardholderName', e.target.value)} className={`w-full border ${errors.cardholderName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                    {errors.cardholderName && <p className="mt-1 text-xs text-red-500">{errors.cardholderName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Card Number *</label>
                    <input type="text" value={formData.cardNumber} onChange={(e) => update('cardNumber', e.target.value)} className={`w-full border ${errors.cardNumber ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                    {errors.cardNumber && <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date (MM/YY) *</label>
                    <input type="text" value={formData.expiryDate} onChange={(e) => update('expiryDate', e.target.value)} className={`w-full border ${errors.expiryDate ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                    {errors.expiryDate && <p className="mt-1 text-xs text-red-500">{errors.expiryDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CVV *</label>
                    <input type="text" value={formData.cvv} onChange={(e) => update('cvv', e.target.value)} className={`w-full border ${errors.cvv ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                    {errors.cvv && <p className="mt-1 text-xs text-red-500">{errors.cvv}</p>}
                  </div>
                </>)}
                {formData.paymentMethod === 'Bank Transfer' && (<>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Name *</label>
                    <input type="text" value={formData.bankAccountName || ''} onChange={(e) => update('bankAccountName', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="John Smith" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">BSB *</label>
                    <input type="text" value={formData.bankBsb || ''} onChange={(e) => update('bankBsb', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="000-000" maxLength={7} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Number *</label>
                    <input type="text" value={formData.bankAccountNumber || ''} onChange={(e) => update('bankAccountNumber', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="123456789" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name *</label>
                    <input type="text" value={formData.bankName || ''} onChange={(e) => update('bankName', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. Commonwealth Bank" />
                  </div>
                </>)}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Address</label>
                  <input type="text" value={formData.billingAddress} onChange={(e) => update('billingAddress', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Postcode *</label>
                  <input type="text" value={formData.billingPostcode} onChange={(e) => update('billingPostcode', e.target.value)} className={`w-full border ${errors.billingPostcode ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                  {errors.billingPostcode && <p className="mt-1 text-xs text-red-500">{errors.billingPostcode}</p>}
                </div>
              </div>
               <div className="mt-4">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.paymentAuthorized || false} onChange={(e) => update('paymentAuthorized', e.target.checked)} className={`rounded ${errors.paymentAuthorized ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} text-indigo-600 mt-1 shrink-0`} />
                  <span className={`text-sm ${errors.paymentAuthorized ? 'text-red-700 font-medium' : 'text-slate-700'}`}>I authorize the charges outlined above * — I understand that these fees cover InfoTrack Verification services and platform onboarding. The charges are non-refundable once the checks have been initiated.</span>
                </label>
                {errors.paymentAuthorized && <p className="mt-1 text-xs text-red-500 font-bold">{errors.paymentAuthorized}</p>}
              </div>
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                <span className="text-green-600 shrink-0">🔒</span>
                <p className="text-sm text-green-800 font-medium">Secure Payment. All payment information is encrypted and processed securely. We never store your full card details.</p>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Lender Details & Documents</h2>
            <p className="text-sm text-slate-500">Current lender and loan account information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lender Name</label>
                <input type="text" value={formData.lenderName} onChange={(e) => update('lenderName', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Contact Person *</label>
                <input type="text" value={formData.lenderContact} onChange={(e) => update('lenderContact', e.target.value)} className={`w-full border ${errors.lenderContact ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                {errors.lenderContact && <p className="mt-1 text-xs text-red-500">{errors.lenderContact}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lender Email *</label>
                <input type="email" value={formData.lenderEmail} onChange={(e) => update('lenderEmail', e.target.value)} className={`w-full border ${errors.lenderEmail ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                {errors.lenderEmail && <p className="mt-1 text-xs text-red-500">{errors.lenderEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lender Phone *</label>
                <input type="text" value={formData.lenderPhone} onChange={(e) => update('lenderPhone', e.target.value)} className={`w-full border ${errors.lenderPhone ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                {errors.lenderPhone && <p className="mt-1 text-xs text-red-500">{errors.lenderPhone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loan Account Number *</label>
                <input type="text" value={formData.loanAccountNumber} onChange={(e) => update('loanAccountNumber', e.target.value)} className={`w-full border ${errors.loanAccountNumber ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                {errors.loanAccountNumber && <p className="mt-1 text-xs text-red-500">{errors.loanAccountNumber}</p>}
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex gap-2">
              <span className="text-blue-600 shrink-0" aria-hidden>ℹ</span>
              <span>We'll contact the lender to verify the outstanding loan amount and coordinate the settlement process once a buyer is found.</span>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Lender Documents for Mortgage Reassignment</h3>
              <p className={`text-sm ${errors.lenderDocs ? 'text-red-600 font-medium' : 'text-slate-500'} mt-0.5`}>Upload all documents the lender should be holding to facilitate mortgage reassignment and settlement. {lenderDocsCompleted} of 12 categories completed. {errors.lenderDocs && <span className="block">{errors.lenderDocs}</span>}</p>
              {LENDER_DOCS.map(({ title, desc }) => {
                const fileName = uploadedLenderDocs[title]
                const isUploaded = !!fileName
                return (
                  <div key={title} className="mt-3 flex flex-wrap items-center justify-between gap-4 p-3 border border-slate-200 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700 block truncate">{title}</span>
                      <span className="text-xs text-slate-500 block truncate">{desc}</span>
                      {fileName && <p className="text-xs text-indigo-600 font-medium mt-1 truncate">📄 {fileName}</p>}
                    </div>
                    <button type="button" onClick={() => triggerUpload({ type: 'lender', title, field: 'lenderDocs' })} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 shrink-0 ${isUploaded ? 'bg-green-100 text-green-800' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                      {isUploaded ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Change
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          Upload
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <span className="text-red-600 shrink-0" aria-hidden>!</span>
              <div className="text-sm text-red-800">
                <p className="font-medium">Critical for Mortgage Reassignment</p>
                <p className="mt-1">These documents are essential for a successful mortgage reassignment. Missing documents may delay or prevent the transaction. The lender must provide:</p>
                <ul className="mt-2 list-disc list-inside space-y-0.5">
                  <li>Original executed loan documentation</li>
                  <li>Current payout figures with settlement instructions</li>
                  <li>Registered mortgage documents with dealing numbers</li>
                  <li>Documented privacy consent / client authority</li>
                  <li>Full loan account history and arrears breakdown</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">$ Loan Details</h2>
            <p className="text-sm text-slate-500">Complete loan and financial information</p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              This loan is subject to NCCP (National Consumer Credit Protection Act 2009). Ensure all checks and requirements for consumer credit are completed. For commercial loans, confirm NCCP does not apply.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Outstanding Debt (A$) *</label>
                <input type="text" value={formData.outstandingDebt} onChange={(e) => update('outstandingDebt', e.target.value)} className={`w-full border ${errors.outstandingDebt ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                {errors.outstandingDebt && <p className="mt-1 text-xs text-red-500">{errors.outstandingDebt}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Original Loan Amount (A$) *</label>
                <input type="text" value={formData.originalLoanAmount} onChange={(e) => update('originalLoanAmount', e.target.value)} className={`w-full border ${errors.originalLoanAmount ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                {errors.originalLoanAmount && <p className="mt-1 text-xs text-red-500">{errors.originalLoanAmount}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loan Start Date</label>
                <input type="date" value={formData.loanStartDate} onChange={(e) => update('loanStartDate', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#33A8A0] focus:border-[#33A8A0]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Repayment Type</label>
                <select value={formData.repaymentType} onChange={(e) => update('repaymentType', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
                  <option>Principal & Interest</option>
                  <option>Interest Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%) *</label>
                <input type="number" step="0.01" min="0" max="999.99" value={formData.interestRate} onChange={(e) => update('interestRate', e.target.value)} className={`w-full border ${errors.interestRate ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600`} />
                {errors.interestRate && <p className="mt-1 text-xs text-red-500">{errors.interestRate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Missed Payments *</label>
                <input type="text" value={formData.missedPayments} onChange={(e) => update('missedPayments', e.target.value)} className={`w-full border ${errors.missedPayments ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                {errors.missedPayments && <p className="mt-1 text-xs text-red-500">{errors.missedPayments}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Arrears (A$)</label>
                <input type="text" value={formData.totalArrears} onChange={(e) => update('totalArrears', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Notice Date</label>
                <input type="date" value={formData.defaultNoticeDate} onChange={(e) => update('defaultNoticeDate', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#33A8A0] focus:border-[#33A8A0]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenure (Months)</label>
                <select value={formData.tenure} onChange={(e) => update('tenure', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                  <option value="18">18 Months</option>
                  <option value="24">24 Months</option>
                </select>
              </div>
            </div>
            <section>
              <h3 className="font-medium text-slate-900">Property Valuation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Valuation (A$) *</label>
                  <input type="text" value={formData.currentValuation} onChange={(e) => update('currentValuation', e.target.value)} className={`w-full border ${errors.currentValuation ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                  {errors.currentValuation && <p className="mt-1 text-xs text-red-500">{errors.currentValuation}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valuation Provider</label>
                  <input type="text" value={formData.valuationProvider} readOnly className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valuation Date</label>
                  <input type="date" value={formData.valuationDate} onChange={(e) => update('valuationDate', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#33A8A0] focus:border-[#33A8A0]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Upload Valuation Report *</label>
                  <button type="button" onClick={() => triggerUpload({ type: 'valuation', field: 'valuationReport' })} className={`w-full mt-1 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${valuationUploaded ? 'bg-green-100 text-green-800 border border-green-200' : errors.valuationReport ? 'border-red-500 ring-1 ring-red-500 text-red-700 bg-red-50' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                    {valuationUploaded ? (
                      <> 
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> 
                        <span className="truncate">{valuationUploaded}</span>
                      </>
                    ) : (
                      <> <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> Upload Report </>
                    )}
                  </button>
                  {errors.valuationReport && <p className="mt-1 text-xs text-red-500 font-medium">{errors.valuationReport}</p>}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Note: A valuation report will be automatically generated upon payment in Step 3.</p>
            </section>
          </div>
        )}

        {step === 6 && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Property Features & Condition</h2>
            <p className="text-sm text-slate-500">Detailed property information for lender assessment</p>
            <h3 className="font-medium text-slate-900">Building Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year Built</label>
                <input type="text" value={formData.yearBuilt} onChange={(e) => update('yearBuilt', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Floor Area (sqm)</label>
                <input type="text" value={formData.floorArea} onChange={(e) => update('floorArea', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Number of Storeys</label>
                <input type="number" min="0" value={formData.numberOfStoreys} onChange={(e) => update('numberOfStoreys', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bedrooms</label>
                <input type="number" min="0" value={formData.numberOfBedrooms} onChange={(e) => update('numberOfBedrooms', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. 3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bathrooms</label>
                <input type="number" min="0" value={formData.numberOfBathrooms} onChange={(e) => update('numberOfBathrooms', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. 2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kitchens</label>
                <input type="number" min="0" value={formData.numberOfKitchens} onChange={(e) => update('numberOfKitchens', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Car Spaces / Parking</label>
                <input type="number" min="0" value={formData.numberOfParking} onChange={(e) => update('numberOfParking', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. 2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Construction Type</label>
                <select value={formData.constructionType} onChange={(e) => update('constructionType', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
                  <option value="">Select type</option>
                  <option>Brick</option>
                  <option>Timber</option>
                  <option>Double brick</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Roof Type</label>
                <select value={formData.roofType} onChange={(e) => update('roofType', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
                  <option value="">Select type</option>
                  <option>Tile</option>
                  <option>Metal</option>
                  <option>Flat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Property Condition</label>
                <select value={formData.propertyCondition} onChange={(e) => update('propertyCondition', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Poor</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Recent Renovations/Improvements</label>
                <textarea value={formData.recentRenovations} onChange={(e) => update('recentRenovations', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" rows={2} placeholder="Kitchen renovation 2022, new roof 2021, etc." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Special Features</label>
                <textarea value={formData.specialFeatures} onChange={(e) => update('specialFeatures', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" rows={2} placeholder="Swimming pool, tennis court, granny flat, solar panels, etc." />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mt-6">Rates & Ongoing Charges</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Council Rates (Annual A$)</label>
                  <input type="text" value={formData.councilRates} onChange={(e) => update('councilRates', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Water Rates (Annual A$)</label>
                  <input type="text" value={formData.waterRates} onChange={(e) => update('waterRates', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Strata Fees (Quarterly A$)</label>
                  <input type="text" value={formData.strataFees} onChange={(e) => update('strataFees', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
                  <p className="text-xs text-slate-500 mt-0.5">If applicable (apartments/townhouses)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Land Tax (Annual A$)</label>
                  <input type="text" value={formData.landTax} onChange={(e) => update('landTax', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
                  <p className="text-xs text-slate-500 mt-0.5">If applicable (investment property)</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Insurance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Provider</label>
                  <input type="text" value={formData.insuranceProvider} onChange={(e) => update('insuranceProvider', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="NRMA, RACV, etc." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sum Insured (A$)</label>
                  <input type="text" value={formData.sumInsured} onChange={(e) => update('sumInsured', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Expiry Date</label>
                  <input type="date" value={formData.insuranceExpiry} onChange={(e) => update('insuranceExpiry', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#33A8A0] focus:border-[#33A8A0]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Upload Insurance Policy</label>
                  <button type="button" onClick={() => triggerUpload({ type: 'insurance', field: 'insurancePolicy' })} className={`mt-1 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${insuranceUploaded ? 'bg-green-100 text-green-800 border border-green-200' : errors.insurancePolicy ? 'border-red-500 ring-1 ring-red-500 text-red-700 bg-red-50' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                    {insuranceUploaded ? (
                      <> 
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> 
                        <span className="truncate">{insuranceUploaded}</span>
                      </>
                    ) : (
                      <> <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> Upload Policy </>
                    )}
                  </button>
                  {errors.insurancePolicy && <p className="mt-1 text-xs text-red-500 font-medium">{errors.insurancePolicy}</p>}
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Sales History</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Sale Price (A$)</label>
                  <input type="text" value={formData.lastSalePrice} onChange={(e) => update('lastSalePrice', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Sale Date</label>
                  <input type="date" value={formData.lastSaleDate} onChange={(e) => update('lastSaleDate', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#33A8A0] focus:border-[#33A8A0]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prior Sale Price (A$)</label>
                  <input type="text" value={formData.priorSalePrice} onChange={(e) => update('priorSalePrice', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prior Sale Date</label>
                  <input type="date" value={formData.priorSaleDate} onChange={(e) => update('priorSaleDate', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#33A8A0] focus:border-[#33A8A0]" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Supporting Documents</h3>
              <div className="flex flex-wrap gap-3 mt-2">
                {Object.entries({ title: 'Upload Title', certificate: 'Upload Certificate', report: 'Upload Report' }).map(([key, label]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <button type="button" onClick={() => triggerUpload({ type: 'supporting', key, field: `supporting_${key}` })} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${supportingDocs[key] ? 'bg-green-100 text-green-800 border border-green-200' : errors[`supporting_${key}`] ? 'border-red-500 ring-1 ring-red-500 text-red-700 bg-red-50' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                      {supportingDocs[key] ? (
                        <> 
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> 
                          <span className="truncate">{supportingDocs[key]}</span> 
                        </>
                      ) : (
                        <> <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> {label} </>
                      )}
                    </button>
                    {errors[`supporting_${key}`] && <p className="text-xs text-red-500 font-medium">{errors[`supporting_${key}`]}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">All Parties Involved</h2>
            <p className="text-sm text-slate-500">Capture contact details for all professionals involved in the MIP transaction</p>
            <section>
              <h3 className="font-medium text-slate-900">Borrower's Lawyer / Solicitor (Required)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lawyer Name *</label>
                  <input type="text" value={formData.borrowerLawyerName} onChange={(e) => update('borrowerLawyerName', e.target.value)} className={`w-full border ${errors.borrowerLawyerName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                  {errors.borrowerLawyerName && <p className="mt-1 text-xs text-red-500">{errors.borrowerLawyerName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Law Firm *</label>
                  <input type="text" value={formData.borrowerLawFirm} onChange={(e) => update('borrowerLawFirm', e.target.value)} className={`w-full border ${errors.borrowerLawFirm ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                  {errors.borrowerLawFirm && <p className="mt-1 text-xs text-red-500">{errors.borrowerLawFirm}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input type="email" value={formData.borrowerLawyerEmail} onChange={(e) => update('borrowerLawyerEmail', e.target.value)} className={`w-full border ${errors.borrowerLawyerEmail ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                  {errors.borrowerLawyerEmail && <p className="mt-1 text-xs text-red-500">{errors.borrowerLawyerEmail}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                  <input type="text" value={formData.borrowerLawyerPhone} onChange={(e) => update('borrowerLawyerPhone', e.target.value)} className={`w-full border ${errors.borrowerLawyerPhone ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                  {errors.borrowerLawyerPhone && <p className="mt-1 text-xs text-red-500">{errors.borrowerLawyerPhone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License/Registration Number *</label>
                  <input type="text" value={formData.borrowerLawyerLicense} onChange={(e) => update('borrowerLawyerLicense', e.target.value)} className={`w-full border ${errors.borrowerLawyerLicense ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} />
                  {errors.borrowerLawyerLicense && <p className="mt-1 text-xs text-red-500">{errors.borrowerLawyerLicense}</p>}
                </div>
              </div>
            </section>
            <section>
              <h3 className="font-medium text-slate-900 mt-6">Lender's Lawyer / Solicitor (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Lawyer Name</label><input type="text" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="Jane Doe" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Firm</label><input type="text" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="Doe Legal Partners" /></div>
              </div>
            </section>
          </div>
        )}

        {step === 8 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Disclosure Requirements & Lender Licence</h2>
            <p className="text-sm text-slate-500 mt-1">NCCP disclosure obligations and Australian Credit Licence verification</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lender Licence Type *</label>
                <select value={formData.lenderLicenceType} onChange={(e) => update('lenderLicenceType', e.target.value)} className={`w-full border ${errors.lenderLicenceType ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm bg-white`}>
                  <option value="">Select...</option>
                  <option>Australian Credit Licence</option>
                </select>
                {errors.lenderLicenceType && <p className="mt-1 text-xs text-red-500">{errors.lenderLicenceType}</p>}
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                All required disclosures must be provided before the borrower signs the credit contract. Incomplete disclosures may void the contract.
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.creditGuide} onChange={(e) => update('creditGuide', e.target.checked)} className={`rounded ${errors.creditGuide ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} text-indigo-600`} />
                  <span className={`text-sm ${errors.creditGuide ? 'text-red-700 font-medium' : 'text-slate-700'}`}>Credit Guide (NCCP s120) *</span>
                </div>
                {errors.creditGuide && <p className="text-xs text-red-500">{errors.creditGuide}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.creditContract} onChange={(e) => update('creditContract', e.target.checked)} className={`rounded ${errors.creditContract ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} text-indigo-600`} />
                  <span className={`text-sm ${errors.creditContract ? 'text-red-700 font-medium' : 'text-slate-700'}`}>Credit Contract with Full Terms (NCCP s17) *</span>
                </div>
                {errors.creditContract && <p className="text-xs text-red-500">{errors.creditContract}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Disclosure</h2>
              <p className="text-sm text-slate-500 mt-1">Confirm all NCCP disclosure obligations have been fulfilled before proceeding</p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex gap-2">
              <span className="shrink-0 text-amber-600" aria-hidden>!</span>
              <span>All required disclosures must be completed before the borrower signs the credit contract. Incomplete disclosures may void the contract and attract regulatory penalties.</span>
            </div>

            <div className="space-y-4">
              {/* Key Facts Sheet */}
              <div className="p-4 border border-slate-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.disclosureKeyFacts}
                    onChange={(e) => update('disclosureKeyFacts', e.target.checked)}
                    className={`mt-0.5 rounded shrink-0 ${errors.disclosureKeyFacts ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} text-indigo-600 focus:ring-indigo-500`}
                  />
                  <div>
                    <span className={`text-sm font-medium ${errors.disclosureKeyFacts ? 'text-red-700' : 'text-slate-800'}`}>
                      Key Facts Sheet has been provided *
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      I confirm that a Key Facts Sheet (as required under NCCP s133BB) has been given to the borrower prior to signing, summarising the loan details, comparison rate, and total repayments.
                    </p>
                    {errors.disclosureKeyFacts && <p className="mt-1 text-xs text-red-500">{errors.disclosureKeyFacts}</p>}
                  </div>
                </label>
              </div>

              {/* Fees & Charges */}
              <div className="p-4 border border-slate-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.disclosureFeesCharges}
                    onChange={(e) => update('disclosureFeesCharges', e.target.checked)}
                    className={`mt-0.5 rounded shrink-0 ${errors.disclosureFeesCharges ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} text-indigo-600 focus:ring-indigo-500`}
                  />
                  <div>
                    <span className={`text-sm font-medium ${errors.disclosureFeesCharges ? 'text-red-700' : 'text-slate-800'}`}>
                      All fees and charges have been disclosed *
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      I confirm that all applicable fees, charges, interest rates, and comparison rates have been fully disclosed to the borrower in writing, including establishment fees, ongoing fees, discharge fees, and any early repayment penalties.
                    </p>
                    {errors.disclosureFeesCharges && <p className="mt-1 text-xs text-red-500">{errors.disclosureFeesCharges}</p>}
                  </div>
                </label>
              </div>

              {/* Contract Copy */}
              <div className="p-4 border border-slate-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.disclosureContractCopy}
                    onChange={(e) => update('disclosureContractCopy', e.target.checked)}
                    className={`mt-0.5 rounded shrink-0 ${errors.disclosureContractCopy ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} text-indigo-600 focus:ring-indigo-500`}
                  />
                  <div>
                    <span className={`text-sm font-medium ${errors.disclosureContractCopy ? 'text-red-700' : 'text-slate-800'}`}>
                      Borrower has received a copy of the credit contract *
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      I confirm that the borrower has been provided with a copy of the credit contract (NCCP s64) prior to, or at the time of, signing. The borrower was given adequate time to read and seek independent advice.
                    </p>
                    {errors.disclosureContractCopy && <p className="mt-1 text-xs text-red-500">{errors.disclosureContractCopy}</p>}
                  </div>
                </label>
              </div>

              {/* Borrower Consent */}
              <div className="p-4 border border-slate-200 rounded-lg bg-indigo-50 border-indigo-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.disclosureBorrowerConsent}
                    onChange={(e) => update('disclosureBorrowerConsent', e.target.checked)}
                    className={`mt-0.5 rounded shrink-0 ${errors.disclosureBorrowerConsent ? 'border-red-500 ring-1 ring-red-500' : 'border-indigo-300'} text-indigo-600 focus:ring-indigo-500`}
                  />
                  <div>
                    <span className={`text-sm font-medium ${errors.disclosureBorrowerConsent ? 'text-red-700' : 'text-indigo-800'}`}>
                      Borrower has given informed consent to proceed *
                    </span>
                    <p className="text-xs text-indigo-700 mt-0.5">
                      I declare that the borrower has been fully informed of the nature of the credit contract, all associated risks, and has voluntarily provided their written consent to proceed with this application. All disclosures comply with the National Consumer Credit Protection Act 2009.
                    </p>
                    {errors.disclosureBorrowerConsent && <p className="mt-1 text-xs text-red-500">{errors.disclosureBorrowerConsent}</p>}
                  </div>
                </label>
              </div>
            </div>

            {/* Final Confirmation */}
            <div className={`p-4 rounded-lg border-2 ${errors.disclosureFinalConfirmation ? 'border-red-400 bg-red-50' : formData.disclosureFinalConfirmation ? 'border-green-400 bg-green-50' : 'border-slate-900 bg-slate-900'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.disclosureFinalConfirmation}
                  onChange={(e) => update('disclosureFinalConfirmation', e.target.checked)}
                  className={`mt-0.5 w-5 h-5 rounded shrink-0 ${errors.disclosureFinalConfirmation ? 'border-red-500 ring-2 ring-red-400' : 'border-slate-300'} text-indigo-600 focus:ring-indigo-500`}
                />
                <div>
                  <span className={`text-sm font-semibold ${errors.disclosureFinalConfirmation ? 'text-red-700' : formData.disclosureFinalConfirmation ? 'text-green-800' : 'text-white'}`}>
                    I confirm all disclosure obligations have been fulfilled *
                  </span>
                  <p className={`text-xs mt-1 ${errors.disclosureFinalConfirmation ? 'text-red-600' : formData.disclosureFinalConfirmation ? 'text-green-700' : 'text-slate-300'}`}>
                    By checking this box, I declare that all four disclosure requirements above have been completed in full and in compliance with the National Consumer Credit Protection Act 2009. I understand that false declarations may result in penalties, licence suspension, or legal action.
                  </p>
                  {errors.disclosureFinalConfirmation && <p className="mt-1 text-xs font-medium text-red-600">{errors.disclosureFinalConfirmation}</p>}
                </div>
              </label>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
              All five confirmations above are mandatory. Proceeding without completing these disclosures may constitute a breach of your Australian Credit Licence obligations under the NCCP Act 2009.
            </div>
          </div>
        )}

        {step === 10 && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Review & Submit</h2>
            <p className="text-sm text-slate-500">Final details and case review</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Default *</label>
                <textarea value={formData.reasonForDefault} onChange={(e) => update('reasonForDefault', e.target.value)} className={`w-full border ${errors.reasonForDefault ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-md px-3 py-2 text-sm`} rows={3} placeholder="Provide details about why the borrower has defaulted..." />
                {errors.reasonForDefault && <p className="mt-1 text-xs text-red-500">{errors.reasonForDefault}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Hardship Circumstances</label>
                <textarea value={formData.hardshipCircumstances} onChange={(e) => update('hardshipCircumstances', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" rows={2} placeholder="Job loss, illness, divorce, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Borrower Cooperation</label>
                <select value={formData.borrowerCooperation} onChange={(e) => update('borrowerCooperation', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
                  <option>Yes - Fully Cooperative</option>
                  <option>Partial</option>
                  <option>No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Possession Status</label>
                <select value={formData.possessionStatus} onChange={(e) => update('possessionStatus', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
                  <option>Owner Occupied</option>
                  <option>Tenanted</option>
                  <option>Vacant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Case Urgency</label>
                <select value={formData.caseUrgency} onChange={(e) => update('caseUrgency', e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
                  <option>Medium - Priority processing (14-30 days)</option>
                  <option>High - Urgent</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-medium text-slate-900 flex items-center gap-2">AI Compliance Agent</h3>
              <p className="text-sm text-slate-600 mt-1">Automated compliance checking & data verification assistant</p>
              <button type="button" onClick={handleRunAnalysis} disabled={runAnalysisLoading} className="mt-3 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-70 flex items-center gap-2">
                {runAnalysisLoading ? (
                  <> <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Running analysis… </>
                ) : (
                  'Run Analysis'
                )}
              </button>
              {runAnalysisResult && (
                <div className="mt-3 p-3 bg-white border border-purple-200 rounded-md text-sm text-slate-700">
                  {runAnalysisResult}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
              Complete Credit Pack Assembly — All InfoTrack documents and third-party documents assembled with data reduction as per Privacy Act 1988 and OAIC guidelines.
            </div>
          </div>
        )}

        {step === 11 && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Ready to Finalize Case</h2>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800">All Pre-Checks Passed</p>
              <ul className="mt-2 text-sm text-green-700 space-y-1">
                <li>✓ Property valuation and title search completed</li>
                <li>✓ AML/CTF screening complete for all entities</li>
                <li>✓ All verification checks complete & compliant</li>
              </ul>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Final Confirmation Required — Please confirm all details are accurate before submitting. This action will create the case and make it available to the platform.
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />

      {/* Footer nav */}
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-4 flex flex-wrap items-center justify-between gap-4 mt-6">
        <button type="button" onClick={handlePrev} disabled={step === 1} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
          ← Previous
        </button>
        <span className="text-sm text-slate-600">Step {step} of 11</span>
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 11 ? (submitting ? 'Submitting...' : 'Submit & Create Case') : 'Next →'}
        </button>
      </div>
    </div>
  )
}
