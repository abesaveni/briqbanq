import { useState, useEffect } from 'react'
import { Breadcrumb, FormInput, FormSelect } from './SettingsComponents'
import { useAuth } from '../../../context/AuthContext'
import { useBorrowerProfile } from '../BorrowerProfileContext'
import { profileService } from '../services'
import {
  validateFirstName, validateLastName, validateEmail,
  validateAuPhone, validateAuPostcode, validateSuburb,
} from '../../../utils/auValidation'

const BIO_MAX = 500
const STATES = [{ value: 'VIC', label: 'VIC' }, { value: 'NSW', label: 'NSW' }, { value: 'QLD', label: 'QLD' }, { value: 'WA', label: 'WA' }, { value: 'SA', label: 'SA' }, { value: 'TAS', label: 'TAS' }, { value: 'ACT', label: 'ACT' }, { value: 'NT', label: 'NT' }]
const COUNTRIES = [{ value: 'Australia', label: 'Australia' }]

function toFormProfile(p) {
  const fallback = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    bio: '',
    streetAddress: '',
    city: '',
    state: 'VIC',
    postcode: '',
    country: 'Australia',
    memberSince: 'Mar 2024',
    accountType: 'Borrower',
    verified: false,
  }
  if (!p || typeof p !== 'object') return fallback
  return {
    firstName: p.firstName ?? p.first_name ?? fallback.firstName,
    lastName: p.lastName ?? p.last_name ?? fallback.lastName,
    email: p.email ?? fallback.email,
    phone: p.phone ?? fallback.phone,
    company: p.company ?? fallback.company,
    jobTitle: p.jobTitle ?? p.job_title ?? fallback.jobTitle,
    bio: p.bio ?? fallback.bio,
    streetAddress: p.streetAddress ?? p.street_address ?? fallback.streetAddress,
    city: p.city ?? fallback.city,
    state: p.state ?? fallback.state,
    postcode: p.postcode ?? fallback.postcode,
    country: p.country ?? fallback.country,
    memberSince: p.memberSince ?? fallback.memberSince,
    accountType: p.accountType ?? p.role ?? fallback.accountType,
    verified: p.verified ?? fallback.verified,
  }
}

export default function ProfileSettings() {
  const { user: authUser, updateUser } = useAuth()
  const { profile: ctxProfile, setProfile: setCtxProfile } = useBorrowerProfile()
  const [formData, setFormData] = useState(() => toFormProfile(authUser || ctxProfile))
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [photoPreview, setPhotoPreview] = useState(() => (authUser?.photoUrl ?? ctxProfile?.photoUrl ?? null))

  useEffect(() => {
    if (authUser && !isDirty) {
      setFormData(toFormProfile(authUser))
      if (authUser.photoUrl) setPhotoPreview(authUser.photoUrl)
    }
  }, [authUser, isDirty])

  useEffect(() => {
    let cancelled = false
    profileService.getProfile()
      .then((profile) => {
        if (cancelled) return
        setFormData(toFormProfile(profile))
        setCtxProfile(profile)
        updateUser(profile)
        if (profile.photoUrl) setPhotoPreview(profile.photoUrl)
      })
      .catch(() => {
        if (!cancelled && authUser) {
          setFormData(toFormProfile(authUser))
        }
      })
    return () => { cancelled = true }
  }, [setCtxProfile, authUser, updateUser])

  const handleChange = (field, value) => {
    let filtered = value
    if (field === 'firstName' || field === 'lastName' || field === 'city') {
      filtered = value.replace(/[^a-zA-Z\s''-]/g, '')
    } else if (field === 'phone') {
      filtered = value.replace(/[^0-9+\-()\s]/g, '')
    } else if (field === 'postcode') {
      filtered = value.replace(/[^0-9]/g, '').slice(0, 4)
    }
    setFormData((prev) => ({ ...prev, [field]: filtered }))
    setIsDirty(true)
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  const validate = () => {
    const e = {}
    const fnErr = validateFirstName(formData.firstName); if (fnErr) e.firstName = fnErr
    const lnErr = validateLastName(formData.lastName); if (lnErr) e.lastName = lnErr
    const emErr = validateEmail(formData.email); if (emErr) e.email = emErr
    if (formData.phone) { const phErr = validateAuPhone(formData.phone); if (phErr) e.phone = phErr }
    if (formData.postcode) { const pcErr = validateAuPostcode(formData.postcode, formData.state); if (pcErr) e.postcode = pcErr }
    if (formData.city) { const cityErr = validateSuburb(formData.city); if (cityErr) e.city = cityErr }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setIsSaving(true)
    setErrors({})
    const updated = {
      ...formData,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      photoUrl: photoPreview || undefined,
    }
    try {
      const saved = await profileService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        photoUrl: photoPreview || undefined,
      })
      setCtxProfile(saved)
      setIsDirty(false)
    } catch (err) {
      // Service layer handles network errors and updates localStorage
      // Still update context for UI consistency
      setCtxProfile(updated)
      setIsDirty(false)
      const isNetworkError = err?.code === 'ERR_NETWORK' || err?.message === 'Network Error'
      if (!isNetworkError) setErrors({ submit: err?.message || 'Failed to save' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(toFormProfile(ctxProfile ?? authUser ?? {}))
    setPhotoPreview(ctxProfile?.photoUrl ?? null)
    setIsDirty(false)
    setErrors({})
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Optimistically show preview
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
    setIsDirty(true)
    
    // Try to upload via service (handles offline gracefully)
    try {
      const updated = await profileService.uploadPhoto(file)
      setCtxProfile(updated)
      if (updated.photoUrl) setPhotoPreview(updated.photoUrl)
    } catch (err) {
      // Service handles offline case, just log error
      console.warn('Photo upload failed:', err)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    setIsDirty(true)
    setCtxProfile((prev) => (prev ? { ...prev, photoUrl: undefined } : prev))
  }

  const initials = [formData.firstName, formData.lastName].filter(Boolean).map((s) => s[0]).join('').toUpperCase() || '?'

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: '🏠', link: '/borrower/dashboard' },
        { label: 'Dashboard', link: '/borrower/dashboard' },
        { label: 'Settings', link: '/borrower/settings' },
        { label: 'Profile' },
      ]} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your mortgage resolution case</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Photo</h3>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-medium overflow-hidden">
                {photoPreview ? <img src={photoPreview} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <div className="flex gap-2 mt-4">
                <label className="border border-slate-300 bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50 cursor-pointer">
                  Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                <button type="button" onClick={handleRemovePhoto} className="text-sm text-red-500 hover:text-red-700">
                  Remove Photo
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">Recommended: Square image, at least 400x400px JPG, PNG or GIF. Max 5MB.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Info</h3>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-slate-500">Member Since:</dt><dd className="text-slate-900 font-medium">{formData.memberSince}</dd></div>
              <div><dt className="text-slate-500">Account Type:</dt><dd className="text-slate-900 font-medium">{formData.accountType}</dd></div>
              <div><dt className="text-slate-500">Verification:</dt><dd><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${formData.verified ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>{formData.verified ? 'Verified' : 'Pending'}</span></dd></div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h3>
            <div className="space-y-4">
              <FormInput label="First Name" required value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Enter first name" error={errors.firstName} />
              <FormInput label="Last Name" required value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Enter last name" error={errors.lastName} />
              <FormInput label="Email Address" required type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="your.email@example.com" error={errors.email} />
              <FormInput label="Phone Number" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+61 4XX XXX XXX" />
              <FormInput label="Company" value={formData.company} onChange={(e) => handleChange('company', e.target.value)} placeholder="Company name" />
              <FormInput label="Job Title" value={formData.jobTitle} onChange={(e) => handleChange('jobTitle', e.target.value)} placeholder="Your role" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea value={formData.bio} onChange={(e) => handleChange('bio', e.target.value.slice(0, BIO_MAX))} placeholder="Tell us about yourself..." rows={3} className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <p className="text-xs text-slate-500 mt-1">{formData.bio.length}/{BIO_MAX} characters</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Address</h3>
            <div className="space-y-4">
              <FormInput label="Street Address" value={formData.streetAddress} onChange={(e) => handleChange('streetAddress', e.target.value)} placeholder="123 Example Street" />
              <div className="grid grid-cols-3 gap-4">
                <FormInput label="City" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="City" />
                <FormSelect label="State" value={formData.state} onChange={(v) => handleChange('state', v)} options={STATES} />
                <FormInput label="Postcode" value={formData.postcode} onChange={(e) => handleChange('postcode', e.target.value)} placeholder="3000" />
              </div>
              <FormSelect label="Country" value={formData.country} onChange={(v) => handleChange('country', v)} options={COUNTRIES} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div>
          {isDirty && (
            <div className="flex items-center space-x-2 text-amber-600 text-sm">
              <span>⚠️</span>
              <span>You have unsaved changes</span>
            </div>
          )}
          {errors.submit && <p className="text-sm text-red-500 mt-1">{errors.submit}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleCancel} className="border border-slate-300 bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded inline-flex items-center gap-2 disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" /></svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
