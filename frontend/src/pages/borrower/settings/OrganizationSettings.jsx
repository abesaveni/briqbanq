import { useState, useEffect } from 'react'
import { Breadcrumb, FormInput, FormSelect } from './SettingsComponents'
import { organizationService } from '../services'
import { validateABN, validateAuPhone, validateAuPostcode, validateEmail } from '../../../utils/auValidation'

const INDUSTRIES = [{ value: 'Financial Services', label: 'Financial Services' }, { value: 'Technology', label: 'Technology' }, { value: 'Healthcare', label: 'Healthcare' }, { value: 'Other', label: 'Other' }]
const COMPANY_SIZES = [{ value: '1-10 employees', label: '1-10 employees' }, { value: '11-50 employees', label: '11-50 employees' }, { value: '50-100 employees', label: '50-100 employees' }, { value: '100+ employees', label: '100+ employees' }]
const ROLES = [{ value: 'Administrator', label: 'Administrator' }, { value: 'Member', label: 'Member' }, { value: 'Viewer', label: 'Viewer' }]
const STATES = [{ value: 'VIC', label: 'VIC' }, { value: 'NSW', label: 'NSW' }, { value: 'QLD', label: 'QLD' }, { value: 'WA', label: 'WA' }, { value: 'SA', label: 'SA' }, { value: 'TAS', label: 'TAS' }, { value: 'ACT', label: 'ACT' }, { value: 'NT', label: 'NT' }]

const defaultForm = {
  name: '',
  abn: '',
  industry: '',
  companySize: '',
  website: '',
  phone: '',
  streetAddress: '',
  city: '',
  state: 'VIC',
  postcode: '',
}

function getAvatar(name) {
  return name.trim().split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function OrganizationSettings() {
  const [formData, setFormData] = useState(defaultForm)
  const [teamMembers, setTeamMembers] = useState([])
  const [activeTab, setActiveTab] = useState('organization')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    let cancelled = false
    organizationService.getOrganization()
      .then((org) => {
        if (cancelled) return
        if (org?.formData) setFormData({ ...defaultForm, ...org.formData })
        if (Array.isArray(org?.teamMembers) && org.teamMembers.length) {
          setTeamMembers(org.teamMembers)
        }
      })
      .catch(() => {
        // Service handles fallback
      })
    return () => { cancelled = true }
  }, [])

  const handleChange = (field, value) => {
    let filtered = value
    if (field === 'phone') {
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
    if (!formData.name?.trim()) e.name = 'Organisation name is required'
    if (formData.abn) { const err = validateABN(formData.abn); if (err) e.abn = err }
    if (formData.phone) { const err = validateAuPhone(formData.phone); if (err) e.phone = err }
    if (formData.postcode) { const err = validateAuPostcode(formData.postcode, formData.state); if (err) e.postcode = err }
    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) e.website = 'Enter a valid URL (e.g. https://example.com.au)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const updateMemberRole = async (id, role) => {
    try {
      await organizationService.updateTeamMember(id, { role })
      setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
      setIsDirty(true)
    } catch {
      // Service handles offline case
      setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
      setIsDirty(true)
    }
  }

  const removeMember = async (id) => {
    try {
      await organizationService.removeTeamMember(id)
      setTeamMembers((prev) => prev.filter((m) => m.id !== id))
      setIsDirty(true)
    } catch {
      // Service handles offline case
      setTeamMembers((prev) => prev.filter((m) => m.id !== id))
      setIsDirty(true)
    }
  }

  const addMember = async () => {
    const name = inviteName.trim()
    const email = inviteEmail.trim()
    if (!name || !email) return
    
    try {
      const member = await organizationService.inviteTeamMember({
        name,
        email,
        role: 'Member',
        avatar: getAvatar(name),
      })
      setTeamMembers((prev) => [...prev, member])
      setInviteName('')
      setInviteEmail('')
      setShowInvite(false)
      setIsDirty(true)
    } catch {
      // Service handles offline case, add locally
      const member = { id: Date.now(), name, email, role: 'Member', avatar: getAvatar(name) }
      setTeamMembers((prev) => [...prev, member])
      setInviteName('')
      setInviteEmail('')
      setShowInvite(false)
      setIsDirty(true)
    }
  }

  const handleSave = async () => {
    if (!validate()) return
    setIsSaving(true)
    try {
      await organizationService.updateOrganization({ formData, teamMembers })
      setIsDirty(false)
    } catch {
      // Service handles offline case
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async () => {
    try {
      const saved = await organizationService.getOrganization()
      if (saved?.formData) setFormData({ ...defaultForm, ...saved.formData })
      if (Array.isArray(saved?.teamMembers)) setTeamMembers(saved.teamMembers)
      else setTeamMembers([])
      if (!saved?.formData) setFormData(defaultForm)
    } catch {
      // Service handles fallback
    }
    setShowInvite(false)
    setInviteName('')
    setInviteEmail('')
    setIsDirty(false)
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '🏠', link: '/borrower/dashboard' }, { label: 'Dashboard', link: '/borrower/dashboard' }, { label: 'Settings', link: '/borrower/settings' }, { label: 'Organization' }]} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your mortgage resolution case</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button type="button" onClick={() => setActiveTab('organization')} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'organization' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>⚙️ Settings</button>
        <button type="button" onClick={() => setActiveTab('organization')} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'organization' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>🏢 Organization</button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-slate-500">🏢</span>
          <h3 className="text-lg font-semibold text-slate-900">Organization Details</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">Manage your organization information</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput label="Organization Name" required value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Your organization name" error={errors.name} />
          <FormInput label="ABN" required value={formData.abn} onChange={(e) => handleChange('abn', e.target.value)} placeholder="12 345 678 901" error={errors.abn} />
          <FormSelect label="Industry" value={formData.industry} onChange={(v) => handleChange('industry', v)} options={INDUSTRIES} />
          <FormSelect label="Company Size" value={formData.companySize} onChange={(v) => handleChange('companySize', v)} options={COMPANY_SIZES} />
          <FormInput label="Website" value={formData.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://example.com.au" error={errors.website} />
          <FormInput label="Phone Number" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="0412 345 678" error={errors.phone} />
          <div className="md:col-span-2"><FormInput label="Street Address" value={formData.streetAddress} onChange={(e) => handleChange('streetAddress', e.target.value)} placeholder="123 Example Street" /></div>
          <FormInput label="City / Suburb" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Melbourne" />
          <FormSelect label="State" value={formData.state} onChange={(v) => handleChange('state', v)} options={STATES} />
          <FormInput label="Postcode" value={formData.postcode} onChange={(e) => handleChange('postcode', e.target.value)} placeholder="3000" error={errors.postcode} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-500">👥</span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Team Members ({teamMembers.length})</h3>
              <p className="text-sm text-slate-500">Manage team accesses to your organization</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowInvite((s) => !s)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded inline-flex items-center gap-2">
            <span>+</span> Invite Member
          </button>
        </div>
        {showInvite && (
          <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 rounded-lg mb-4">
            <FormInput label="Name" value={inviteName} onChange={(e) => setInviteName(e.target.value.replace(/[^a-zA-Z\s''-]/g, ''))} placeholder="Full name" />
            <FormInput label="Email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" />
            <button type="button" onClick={addMember} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded">Add</button>
            <button type="button" onClick={() => { setShowInvite(false); setInviteName(''); setInviteEmail('') }} className="border border-slate-300 bg-white text-slate-700 text-sm px-4 py-2 rounded hover:bg-slate-50">Cancel</button>
          </div>
        )}
        <ul className="space-y-4">
          {teamMembers.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white text-sm font-medium flex items-center justify-center">{m.avatar}</div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.name}</p>
                  <p className="text-sm text-slate-500">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select value={m.role} onChange={(e) => updateMemberRole(m.id, e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button type="button" onClick={() => removeMember(m.id)} className="p-2 text-slate-400 hover:text-red-600" title="Delete">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-900 mb-2">Team Member Roles:</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Administrator: Full access to all settings and data</li>
            <li>• Member: Access to assigned cases and organization settings</li>
            <li>• Viewer: Read-only access to organization data</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-slate-500">💳</span>
          <h3 className="text-lg font-semibold text-slate-900">Billing Information</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">Subscription and payment details</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">Professional Plan</p>
              <p className="text-sm text-slate-500">A$29/month - Billed annually · Next billing date: 1 March 2026</p>
            </div>
            <button type="button" className="border border-indigo-600 text-indigo-600 bg-white text-sm font-medium px-4 py-2 rounded hover:bg-indigo-50">Manage Plan</button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">Payment Method</p>
              <p className="text-sm text-slate-500">•••• •••• •••• 4242 · Expires 12/2026</p>
            </div>
            <button type="button" className="border border-indigo-600 text-indigo-600 bg-white text-sm font-medium px-4 py-2 rounded inline-flex items-center gap-2 hover:bg-indigo-50">💳 Update</button>
          </div>
        </div>
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <span className="text-amber-600">ℹ️</span>
          <p className="text-sm text-amber-800">All invoices will be sent to the organization administrator email.</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div>{isDirty && <div className="flex items-center space-x-2 text-amber-600 text-sm"><span>⚠️</span><span>You have unsaved changes</span></div>}</div>
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
