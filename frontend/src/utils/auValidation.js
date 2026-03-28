/**
 * Australian validation utilities for BrickBanq
 * All validations follow Australian standards and guidelines.
 */

// ─── Name Validation ────────────────────────────────────────────────────────

/** Australian name: letters, hyphens, apostrophes, spaces. Min 2 chars. */
export const validateName = (value, fieldLabel = 'Name') => {
  if (!value || !value.trim()) return `${fieldLabel} is required`
  if (value.trim().length < 2) return `${fieldLabel} must be at least 2 characters`
  if (value.trim().length > 100) return `${fieldLabel} must be under 100 characters`
  if (!/^[a-zA-ZÀ-ÖØ-öø-ÿ'\- ]+$/.test(value.trim()))
    return `${fieldLabel} may only contain letters, hyphens, and apostrophes`
  return null
}

export const validateFirstName = (v) => validateName(v, 'First name')
export const validateLastName = (v) => validateName(v, 'Last name')

// ─── Email Validation ────────────────────────────────────────────────────────

export const validateEmail = (value) => {
  if (!value || !value.trim()) return 'Email is required'
  const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  if (!re.test(value.trim())) return 'Enter a valid email address'
  return null
}

// ─── Australian Phone Number ─────────────────────────────────────────────────
// Accepts:
//   Mobile:   04XX XXX XXX  or  +61 4XX XXX XXX
//   Landline: 02/03/07/08 XXXX XXXX  or  +61 2/3/7/8 XXXX XXXX
//   1800/1300 free-call numbers

export const validateAuPhone = (value) => {
  if (!value || !value.trim()) return 'Phone number is required'
  const raw = value.replace(/[\s\-().]/g, '')
  const patterns = [
    /^04\d{8}$/,              // 04XX XXX XXX
    /^\+614\d{8}$/,           // +61 4XX XXX XXX
    /^0[2378]\d{8}$/,         // landline 02 03 07 08
    /^\+61[2378]\d{8}$/,      // +61 2/3/7/8
    /^1[38]00\d{6}$/,         // 1800 / 1300
    /^13\d{4}$/,              // 13XXXX
  ]
  if (!patterns.some((p) => p.test(raw)))
    return 'Enter a valid Australian phone number (e.g. 0412 345 678 or 02 9000 0000)'
  return null
}

// ─── Australian Postcode ─────────────────────────────────────────────────────
// 4 digits; optional state validation

const AU_POSTCODE_STATE_RANGES = {
  NSW: [[1000, 2999], [3000, 3000]],         // NSW incl. ACT overlap
  ACT: [[200, 299], [2600, 2639], [2900, 2920]],
  VIC: [[3000, 3999], [8000, 8999]],
  QLD: [[4000, 4999], [9000, 9999]],
  SA:  [[5000, 5999]],
  WA:  [[6000, 6999]],
  TAS: [[7000, 7999]],
  NT:  [[800, 999]],
}

export const validateAuPostcode = (value, state = null) => {
  if (!value || !String(value).trim()) return 'Postcode is required'
  const code = String(value).replace(/\s/g, '')
  if (!/^\d{4}$/.test(code)) return 'Postcode must be exactly 4 digits'
  const num = parseInt(code, 10)
  if (num < 200 || num > 9999) return 'Enter a valid Australian postcode'
  if (state) {
    const ranges = AU_POSTCODE_STATE_RANGES[state.toUpperCase()]
    if (ranges && !ranges.some(([lo, hi]) => num >= lo && num <= hi))
      return `Postcode ${code} does not appear to be valid for ${state}`
  }
  return null
}

// ─── Australian State ────────────────────────────────────────────────────────

export const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']

export const validateAuState = (value) => {
  if (!value || !value.trim()) return 'State is required'
  if (!AU_STATES.includes(value.toUpperCase()))
    return `State must be one of: ${AU_STATES.join(', ')}`
  return null
}

// ─── ABN (Australian Business Number) ───────────────────────────────────────
// 11 digits, weighted checksum per ATO specification

export const validateABN = (value) => {
  if (!value || !String(value).trim()) return 'ABN is required'
  const digits = String(value).replace(/[\s\-]/g, '')
  if (!/^\d{11}$/.test(digits)) return 'ABN must be 11 digits'
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
  const d = digits.split('').map(Number)
  d[0] -= 1
  const sum = d.reduce((acc, digit, i) => acc + digit * weights[i], 0)
  if (sum % 89 !== 0) return 'Enter a valid ABN'
  return null
}

// ─── ACN (Australian Company Number) ────────────────────────────────────────
// 9 digits, weighted mod-10 checksum

export const validateACN = (value) => {
  if (!value || !String(value).trim()) return null // ACN is often optional
  const digits = String(value).replace(/[\s\-]/g, '')
  if (!/^\d{9}$/.test(digits)) return 'ACN must be 9 digits'
  const weights = [8, 7, 6, 5, 4, 3, 2, 1]
  const d = digits.split('').map(Number)
  const sum = d.slice(0, 8).reduce((acc, digit, i) => acc + digit * weights[i], 0)
  const check = (10 - (sum % 10)) % 10
  if (check !== d[8]) return 'Enter a valid ACN'
  return null
}

// ─── BSB (Bank State Branch) ─────────────────────────────────────────────────
// Format: XXX-XXX (6 digits with optional hyphen)

export const validateBSB = (value) => {
  if (!value || !String(value).trim()) return null // often optional
  const raw = String(value).replace(/[\s]/g, '')
  if (!/^\d{3}-?\d{3}$/.test(raw)) return 'BSB must be in format XXX-XXX (e.g. 062-000)'
  return null
}

// ─── Bank Account Number ─────────────────────────────────────────────────────

export const validateBankAccount = (value) => {
  if (!value || !String(value).trim()) return null
  const raw = String(value).replace(/[\s\-]/g, '')
  if (!/^\d{6,10}$/.test(raw)) return 'Bank account number must be 6–10 digits'
  return null
}

// ─── Street Address ──────────────────────────────────────────────────────────

export const validateStreetAddress = (value) => {
  if (!value || !value.trim()) return 'Street address is required'
  if (value.trim().length < 5) return 'Enter a complete street address'
  if (value.trim().length > 200) return 'Street address is too long'
  return null
}

// ─── Suburb ──────────────────────────────────────────────────────────────────

export const validateSuburb = (value) => {
  if (!value || !value.trim()) return 'Suburb is required'
  if (!/^[a-zA-Z\s'\-]+$/.test(value.trim())) return 'Enter a valid suburb name'
  if (value.trim().length < 2) return 'Suburb name is too short'
  if (value.trim().length > 100) return 'Suburb name is too long'
  return null
}

// ─── Password ────────────────────────────────────────────────────────────────

export const validatePassword = (value) => {
  if (!value) return 'Password is required'
  if (value.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter'
  if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter'
  if (!/\d/.test(value)) return 'Password must contain at least one number'
  return null
}

export const validateConfirmPassword = (value, password) => {
  if (!value) return 'Please confirm your password'
  if (value !== password) return 'Passwords do not match'
  return null
}

// ─── Property Value / Loan Amount ───────────────────────────────────────────

export const validateCurrency = (value, fieldLabel = 'Amount', min = 0) => {
  if (value === null || value === undefined || value === '') return `${fieldLabel} is required`
  const num = parseFloat(String(value).replace(/[,$\s]/g, ''))
  if (isNaN(num)) return `${fieldLabel} must be a valid number`
  if (num < min) return `${fieldLabel} must be at least ${min.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`
  return null
}

export const validateLoanAmount = (value) => validateCurrency(value, 'Loan amount', 10000)
export const validatePropertyValue = (value) => validateCurrency(value, 'Property value', 50000)

// ─── LVR (Loan to Value Ratio) ───────────────────────────────────────────────

export const validateLVR = (value) => {
  if (value === null || value === undefined || value === '') return 'LVR is required'
  const num = parseFloat(value)
  if (isNaN(num)) return 'LVR must be a valid number'
  if (num <= 0 || num > 100) return 'LVR must be between 1% and 100%'
  return null
}

// ─── Date ────────────────────────────────────────────────────────────────────

export const validateDate = (value, fieldLabel = 'Date') => {
  if (!value) return `${fieldLabel} is required`
  const d = new Date(value)
  if (isNaN(d.getTime())) return `${fieldLabel} must be a valid date`
  return null
}

export const validateFutureDate = (value, fieldLabel = 'Date') => {
  const base = validateDate(value, fieldLabel)
  if (base) return base
  if (new Date(value) <= new Date()) return `${fieldLabel} must be in the future`
  return null
}

// ─── Generic Required ────────────────────────────────────────────────────────

export const validateRequired = (value, fieldLabel = 'This field') => {
  if (value === null || value === undefined || String(value).trim() === '')
    return `${fieldLabel} is required`
  return null
}

// ─── Batch Validator ─────────────────────────────────────────────────────────

/**
 * Run multiple validators over a form values object.
 * validators = { fieldName: (value) => errorString | null }
 * Returns { fieldName: errorString } for any failed fields, or {} if all pass.
 */
export const validateForm = (values, validators) => {
  const errors = {}
  for (const [field, fn] of Object.entries(validators)) {
    const err = fn(values[field])
    if (err) errors[field] = err
  }
  return errors
}

// ─── Format helpers ──────────────────────────────────────────────────────────

/** Format a raw phone string to 04XX XXX XXX or (0X) XXXX XXXX */
export const formatAuPhone = (value) => {
  const raw = value.replace(/\D/g, '')
  if (raw.startsWith('04') && raw.length === 10)
    return `${raw.slice(0, 4)} ${raw.slice(4, 7)} ${raw.slice(7)}`
  if (raw.startsWith('0') && raw.length === 10)
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)} ${raw.slice(6)}`
  return value
}

/** Format ABN as XX XXX XXX XXX */
export const formatABN = (value) => {
  const d = String(value).replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
}

/** Format ACN as XXX XXX XXX */
export const formatACN = (value) => {
  const d = String(value).replace(/\D/g, '').slice(0, 9)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

/** Format BSB as XXX-XXX */
export const formatBSB = (value) => {
  const d = String(value).replace(/\D/g, '').slice(0, 6)
  if (d.length <= 3) return d
  return `${d.slice(0, 3)}-${d.slice(3)}`
}
