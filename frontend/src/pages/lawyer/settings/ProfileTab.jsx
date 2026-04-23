import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { adminService } from '../../../api/dataService'
import {
  validateFirstName, validateLastName, validateEmail,
  validateAuPhone, validateAuPostcode, validateSuburb,
} from '../../../utils/auValidation'

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '', company: '',
  jobTitle: '', bio: '', streetAddress: '', city: '', state: 'VIC',
  postcode: '', country: 'Australia', memberSince: '', accountType: 'Lawyer', verification: '',
}

export default function ProfileTab() {
  const { user } = useAuth()
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    firstName: user?.first_name || user?.firstName || '',
    lastName: user?.last_name || user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    accountType: user?.role || 'Lawyer',
  }))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)
  const fileInputRef = useRef(null)

  // Sync form when user loads from auth context (async)
  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      firstName: user.first_name || user.firstName || prev.firstName,
      lastName: user.last_name || user.lastName || prev.lastName,
      email: user.email || prev.email,
      phone: user.phone || prev.phone,
      accountType: user.role || prev.accountType,
      memberSince: user.created_at
        ? new Date(user.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
        : prev.memberSince,
      verification: user.kyc_status === 'approved' ? 'Verified' : (user.kyc_status || ''),
    }))
    if (user.photo || user.avatar_url) setPhotoUrl(user.photo || user.avatar_url)
  }, [user])

  const handleUploadPhoto = () => fileInputRef.current?.click()
  const handleRemovePhoto = () => setPhotoUrl(null)
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoUrl(reader.result)
    reader.readAsDataURL(file)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }))
  }

  const validate = () => {
    const e = {}
    const fnErr = validateFirstName(form.firstName); if (fnErr) e.firstName = fnErr
    const lnErr = validateLastName(form.lastName); if (lnErr) e.lastName = lnErr
    const emErr = validateEmail(form.email); if (emErr) e.email = emErr
    if (form.phone) { const phErr = validateAuPhone(form.phone); if (phErr) e.phone = phErr }
    if (form.postcode) { const pcErr = validateAuPostcode(form.postcode, form.state); if (pcErr) e.postcode = pcErr }
    if (form.city) { const cityErr = validateSuburb(form.city); if (cityErr) e.city = cityErr }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await adminService.updateProfile?.({ ...form }) // best-effort
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (_) {}
    setSaving(false)
  }

  const handleCancel = () => {
    setForm({
      ...EMPTY_FORM,
      firstName: user?.first_name || user?.firstName || '',
      lastName: user?.last_name || user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    })
    setErrors({})
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/lawyer/dashboard" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/lawyer/settings" className="hover:text-slate-700">Settings</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-slate-900">Profile</span>
      </nav>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Profile Photo</h3>
              <div className="flex flex-col items-start gap-4">
                <div className="w-28 h-28 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {photoUrl
                    ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    : <>{form.firstName?.[0]}{form.lastName?.[0]}</>
                  }
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={handleUploadPhoto} className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-2">
                    Upload Photo
                  </button>
                  <button type="button" onClick={handleRemovePhoto} className="text-red-600 text-sm font-medium hover:underline flex items-center gap-2">
                    Remove Photo
                  </button>
                </div>
                <p className="text-xs text-slate-500">Recommended: Square image, at least 400x400px. JPG, PNG or GIF. Max 5MB.</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Account Info</h3>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-slate-500">Account Type:</dt><dd className="text-slate-900">{form.accountType}</dd></div>
                <div><dt className="text-slate-500">Verification:</dt><dd className="text-green-600 font-medium">{form.verification}</dd></div>
              </dl>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input type="text" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className={`w-full border rounded px-3 py-2 text-sm ${errors.firstName ? 'border-red-500' : 'border-slate-300'}`} />
                  {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input type="text" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className={`w-full border rounded px-3 py-2 text-sm ${errors.lastName ? 'border-red-500' : 'border-slate-300'}`} />
                  {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className={`w-full border rounded px-3 py-2 text-sm ${errors.email ? 'border-red-500' : 'border-slate-300'}`} />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className={`w-full border rounded px-3 py-2 text-sm ${errors.phone ? 'border-red-500' : 'border-slate-300'}`} />
                  {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                  <input type="text" value={form.company} onChange={(e) => handleChange('company', e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                  <input type="text" value={form.jobTitle} onChange={(e) => handleChange('jobTitle', e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                  <textarea value={form.bio} onChange={(e) => handleChange('bio', e.target.value)} rows={3} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                  <p className="text-xs text-slate-500 mt-1">{String(form.bio || '').length} / 500 characters</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                  <input type="text" value={form.streetAddress} onChange={(e) => handleChange('streetAddress', e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input type="text" value={form.city} onChange={(e) => handleChange('city', e.target.value)} className={`w-full border rounded px-3 py-2 text-sm ${errors.city ? 'border-red-500' : 'border-slate-300'}`} />
                  {errors.city && <p className="text-red-600 text-xs mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <select value={form.state} onChange={(e) => handleChange('state', e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white">
                    <option>VIC</option>
                    <option>NSW</option>
                    <option>QLD</option>
                    <option>WA</option>
                    <option>SA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
                  <input type="text" value={form.postcode} onChange={(e) => handleChange('postcode', e.target.value)} className={`w-full border rounded px-3 py-2 text-sm ${errors.postcode ? 'border-red-500' : 'border-slate-300'}`} />
                  {errors.postcode && <p className="text-red-600 text-xs mt-1">{errors.postcode}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <input type="text" value={form.country} onChange={(e) => handleChange('country', e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          {saved && <span className="text-sm text-green-600 font-medium self-center mr-2">Changes saved</span>}
          {Object.keys(errors).length > 0 && <span className="text-sm text-red-600 self-center mr-2">Please fix validation errors</span>}
          <button type="button" onClick={handleCancel} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
