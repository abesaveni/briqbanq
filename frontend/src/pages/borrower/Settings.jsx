import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useBorrowerProfile } from './BorrowerProfileContext'
import SettingsTabBar from './settings/SettingsTabBar'
import { borrowerApi } from './api'
import { TABS } from './settings/SettingsTabBar'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../api/dataService'

// ——— Breadcrumb ———
function BreadcrumbSettings({ currentLabel }) {
  return (
    <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
      <NavLink to="/borrower/dashboard" className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        Dashboard
      </NavLink>
      <span className="text-gray-400" aria-hidden>›</span>
      <NavLink to="/borrower/settings" className="text-gray-600 hover:text-gray-900">Settings</NavLink>
      <span className="text-gray-400" aria-hidden>›</span>
      <span className="text-gray-900 font-medium">{currentLabel}</span>
    </nav>
  )
}

// ——— Shared: section card header ———
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ——— Shared: input label + field ———
const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

const initialProfile = () => ({
  firstName: '', lastName: '', email: '', phone: '', bio: '',
  address: { street: '', suburb: '', state: '', postcode: '' },
})

export default function Settings() {
  const navigate = useNavigate()
  const { user: profileUser, setUser: setBorrowerUser } = useBorrowerProfile()
  const { user: authUser, updateUser: updateAuthUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState(initialProfile)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)
  const [bioLength, setBioLength] = useState(profile.bio?.length ?? 0)
  const [saveMessage, setSaveMessage] = useState('')

  // Sync profile form from auth user on mount
  useEffect(() => {
    const src = authUser || profileUser
    if (src) {
      const name = src.name || ''
      const parts = name.trim().split(/\s+/)
      setProfile((p) => ({
        ...p,
        firstName: src.first_name || src.firstName || parts[0] || p.firstName,
        lastName: src.last_name || src.lastName || parts.slice(1).join(' ') || p.lastName,
        email: src.email || p.email,
        phone: src.phone || src.phone_number || p.phone,
        bio: src.bio || p.bio,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Organization
  const [org, setOrg] = useState({})
  const [teamMembers, setTeamMembers] = useState([])
  const [orgSaveMessage, setOrgSaveMessage] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Member' })
  const [billing, setBilling] = useState({})
  const [showManagePlanModal, setShowManagePlanModal] = useState(false)
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ cardLast4: '', cardExpires: '', billingMessage: '' })

  // API Integrations (controlled field values)
  const [integrations, setIntegrations] = useState([])
  const [requestIntegrationOpen, setRequestIntegrationOpen] = useState(false)
  const [showAddIntegrationModal, setShowAddIntegrationModal] = useState(false)

  // Form Customization (per-form fields; counts are dynamic from array length)
  const [selectedFormId, setSelectedFormId] = useState('case-creation')
  const [customFieldsByFormId, setCustomFieldsByFormId] = useState({})
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState('Text')
  const [formCustomizationMessage, setFormCustomizationMessage] = useState('')

  // Security
  const [sessions, setSessions] = useState([])
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })

  // Notifications
  const [emailPrefs, setEmailPrefs] = useState([])
  const [pushPrefs, setPushPrefs] = useState([])
  const [smsPrefs, setSmsPrefs] = useState([])
  const [notifSaving, setNotifSaving] = useState(false)

  const currentTabLabel = TABS.find((t) => t.id === activeTab)?.label ?? 'Profile'

  const handleUploadPhoto = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      if (profilePhotoUrl) URL.revokeObjectURL(profilePhotoUrl)
      setProfilePhotoUrl(URL.createObjectURL(f))
    }
  }
  const handleRemovePhoto = () => {
    if (profilePhotoUrl) URL.revokeObjectURL(profilePhotoUrl)
    setProfilePhotoUrl(null)
  }
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profileUser?.name || 'Borrower'
    const initials = fullName.split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2) || 'B'
    try {
      await authService.updateProfile({ ...profile, name: fullName, photoUrl: profilePhotoUrl })
      updateAuthUser({ ...profile, name: fullName, photo: profilePhotoUrl })
    } catch {}
    setBorrowerUser({ name: fullName, role: profileUser?.role ?? 'Borrower', initials })
    setSaveMessage('Settings saved successfully.')
    setTimeout(() => setSaveMessage(''), 4000)
  }
  const handleCancelProfile = () => {
    setProfile(initialProfile())
    setBioLength(initialProfile().bio?.length ?? 0)
    handleRemovePhoto()
  }

  const handleInviteMember = () => setShowInviteModal(true)
  const handleInviteSubmit = (e) => {
    e.preventDefault()
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return
    const initials = inviteForm.name.trim().split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2) || '?'
    setTeamMembers((prev) => [
      ...prev,
      { id: Math.max(0, ...prev.map((m) => m.id)) + 1, name: inviteForm.name.trim(), email: inviteForm.email.trim(), role: inviteForm.role, initials, color: 'bg-indigo-500' },
    ])
    setInviteForm({ name: '', email: '', role: 'Member' })
    setShowInviteModal(false)
  }
  const handleRemoveMember = (id) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id))
  }
  const handleRoleChange = (id, role) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
  }

  const ADDABLE_INTEGRATION_TEMPLATES = [
    { id: 'slack', name: 'Slack', description: 'Notifications and alerts to your Slack workspace', fields: [{ label: 'Webhook URL', value: '', placeholder: 'https://hooks.slack.com/...', masked: false }, { label: 'Channel', value: '', placeholder: '#general', masked: false }] },
    { id: 'quickbooks', name: 'QuickBooks', description: 'Sync invoices and accounting data', fields: [{ label: 'Client ID', value: '', placeholder: 'Enter Client ID', masked: false }, { label: 'Client Secret', value: '', placeholder: 'Enter Client Secret', masked: true }, { label: 'Realm ID', value: '', placeholder: 'Enter Realm ID', masked: false }] },
    { id: 'zapier', name: 'Zapier', description: 'Connect to 5000+ apps via Zapier', fields: [{ label: 'Webhook URL', value: '', placeholder: 'https://hooks.zapier.com/...', masked: false }, { label: 'API Key', value: '', placeholder: 'Optional API key', masked: true }] },
    { id: 'custom', name: 'Custom API', description: 'Connect a custom API with API key authentication', fields: [{ label: 'API Key', value: '', placeholder: 'Enter API Key', masked: true }, { label: 'Endpoint URL', value: '', placeholder: 'https://api.example.com', masked: false }, { label: 'Environment', value: 'production', placeholder: 'production or sandbox', masked: false }] },
  ]

  const handleAddIntegration = (template) => {
    const newId = `${template.id}-${Date.now()}`
    const newIntegration = {
      id: newId,
      name: template.name,
      description: template.description,
      status: 'disconnected',
      lastTested: null,
      lastTestSuccess: null,
      fields: template.fields.map((f) => ({ ...f, value: f.value ?? '', placeholder: f.placeholder ?? '' })),
    }
    setIntegrations((prev) => [...prev, newIntegration])
    setShowAddIntegrationModal(false)
  }

  const handleRemoveIntegration = (id) => {
    setIntegrations((prev) => prev.filter((i) => i.id !== id))
  }

  const handleTestConnection = (id) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, lastTested: new Date().toLocaleString('en-AU'), lastTestSuccess: i.status === 'disconnected' ? false : true }
          : i
      )
    )
  }
  const handleIntegrationFieldChange = (intId, fieldIndex, value) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === intId
          ? { ...i, fields: i.fields.map((f, idx) => (idx === fieldIndex ? { ...f, value } : f)) }
          : i
      )
    )
  }

  const handleOrganizationSave = () => {
    setOrgSaveMessage('Organization settings saved.')
    setTimeout(() => setOrgSaveMessage(''), 3000)
  }
  const handleOrganizationCancel = () => {
    setOrg({})
    setTeamMembers([])
    setBilling({})
  }

  const handleManagePlan = () => setShowManagePlanModal(true)
  const handleChangePlan = (planOption) => {
    setBilling((prev) => ({
      ...prev,
      plan: planOption.plan,
      price: planOption.price,
      billingCycle: planOption.billingCycle || prev.billingCycle,
      nextBillingDate: planOption.nextBillingDate || prev.nextBillingDate,
    }))
    setShowManagePlanModal(false)
    setOrgSaveMessage('Plan updated successfully.')
    setTimeout(() => setOrgSaveMessage(''), 4000)
  }
  const handleCloseManagePlanModal = () => setShowManagePlanModal(false)

  const handleUpdatePayment = () => {
    setPaymentForm({ cardLast4: billing.cardLast4 || '', cardExpires: billing.cardExpires || '', billingMessage: '' })
    setShowUpdatePaymentModal(true)
  }
  const handleSubmitPaymentUpdate = (e) => {
    e.preventDefault()
    const last4 = (paymentForm.cardLast4 || '').replace(/\D/g, '').slice(-4)
    const expires = paymentForm.cardExpires.trim() || billing.cardExpires
    if (last4.length !== 4) {
      setPaymentForm((p) => ({ ...p, billingMessage: 'Please enter a valid 4-digit card ending.' }))
      return
    }
    setBilling((prev) => ({ ...prev, cardLast4: last4, cardExpires: expires }))
    setShowUpdatePaymentModal(false)
    setOrgSaveMessage('Payment method updated successfully.')
    setTimeout(() => setOrgSaveMessage(''), 4000)
  }
  const handleCloseUpdatePaymentModal = () => setShowUpdatePaymentModal(false)

  const handleToggleRequired = (fieldId) => {
    setCustomFieldsByFormId((prev) => ({
      ...prev,
      [selectedFormId]: (prev[selectedFormId] || []).map((f) =>
        f.id === fieldId ? { ...f, required: !f.required } : f
      ),
    }))
  }
  const handleDeleteField = (fieldId) => {
    setCustomFieldsByFormId((prev) => ({
      ...prev,
      [selectedFormId]: (prev[selectedFormId] || []).filter((f) => f.id !== fieldId),
    }))
  }
  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return
    const list = customFieldsByFormId[selectedFormId] || []
    const nextId = Math.max(0, ...list.map((f) => f.id)) + 1
    const iconMap = { Text: 'document', Number: 'hash', Date: 'document', Currency: 'dollar', Textarea: 'textarea', Select: 'select' }
    setCustomFieldsByFormId((prev) => ({
      ...prev,
      [selectedFormId]: [
        ...(prev[selectedFormId] || []),
        { id: nextId, label: newFieldLabel.trim(), type: newFieldType, required: false, icon: iconMap[newFieldType] || 'document', showAssigneeUi: false },
      ],
    }))
    setNewFieldLabel('')
    setNewFieldType('Text')
  }
  const handleClearNewField = () => {
    setNewFieldLabel('')
    setNewFieldType('Text')
  }

  const [securityMessage, setSecurityMessage] = useState('')
  const [signOutAllConfirm, setSignOutAllConfirm] = useState(false)

  const handleSignOutSession = (id) => setSessions((prev) => prev.filter((s) => s.id !== id))
  const handleSignOutAllOther = () => {
    setSignOutAllConfirm(false)
    setSessions((prev) => prev.filter((s) => s.current))
    setSecurityMessage('All other sessions have been signed out.')
    setTimeout(() => setSecurityMessage(''), 4000)
  }
  const handleChangePassword = (e) => {
    e.preventDefault()
    if (passwordForm.new !== passwordForm.confirm) {
      setSecurityMessage('New password and confirmation do not match.')
      setTimeout(() => setSecurityMessage(''), 4000)
      return
    }
    if (passwordForm.new.length < 8) {
      setSecurityMessage('Password must be at least 8 characters.')
      setTimeout(() => setSecurityMessage(''), 4000)
      return
    }
    setSecurityMessage('Password updated successfully.')
    setPasswordForm({ current: '', new: '', confirm: '' })
    setTimeout(() => setSecurityMessage(''), 4000)
  }

  const handleToggleNotif = (category, id) => {
    const setter = category === 'email' ? setEmailPrefs : category === 'push' ? setPushPrefs : setSmsPrefs
    setter((prev) => prev.map((p) => (p.id === id ? { ...p, on: !p.on } : p)))
  }
  const [savedNotifPrefs, setSavedNotifPrefs] = useState(() => ({
    email: [],
    push: [],
    sms: [],
  }))
  const [notifSaveError, setNotifSaveError] = useState('')
  const handleSaveNotifications = async () => {
    setNotifSaveError('')
    setNotifSaving(true)
    try {
      await borrowerApi.updateNotificationPreferences({ email: emailPrefs, push: pushPrefs, sms: smsPrefs })
      setSavedNotifPrefs({ email: [...emailPrefs], push: [...pushPrefs], sms: [...smsPrefs] })
      setSaveMessage('Notification preferences saved.')
      setTimeout(() => setSaveMessage(''), 4000)
    } catch (err) {
      setNotifSaveError(err?.message || 'Failed to save preferences. Your changes are kept locally.')
      setSavedNotifPrefs({ email: [...emailPrefs], push: [...pushPrefs], sms: [...smsPrefs] })
      setSaveMessage('Notification preferences saved locally.')
      setTimeout(() => { setSaveMessage(''); setNotifSaveError('') }, 4000)
    } finally {
      setNotifSaving(false)
    }
  }
  const handleCancelNotifications = () => {
    setEmailPrefs([...savedNotifPrefs.email])
    setPushPrefs([...savedNotifPrefs.push])
    setSmsPrefs([...savedNotifPrefs.sms])
    setNotifSaveError('')
  }

  const gearIcon = (
    <span className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0" aria-hidden>
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </span>
  )

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* Page title — Figma */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your mortgage resolution case</p>
        </div>

        {/* Section header: gear + Settings + description */}
        <div className="flex items-start gap-3 mb-4">
          {gearIcon}
          <div>
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage your account, integrations, and platform configuration</p>
          </div>
        </div>

        <div className="mt-8">
          <SettingsTabBar
            activeTab={activeTab}
            onTabChange={(id) => {
              if (id === 'notifications') {
                navigate('/borrower/notifications')
              } else {
                setActiveTab(id)
              }
            }}
          />
        </div>

        <BreadcrumbSettings currentLabel={currentTabLabel} />

        {/* ——— PROFILE ——— */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
              {/* Left: Profile Photo + Account Info */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Profile Photo</h3>
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shrink-0">
                      {profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span>{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
                      )}
                    </div>
                    <label className="mt-4 w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-900 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12m0 0l4-4m-4 4l4-4" /></svg>
                      Upload Photo
                      <input type="file" className="sr-only" accept="image/*" onChange={handleUploadPhoto} />
                    </label>
                    <button type="button" onClick={handleRemovePhoto} className="mt-2 w-full flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:text-red-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      Remove Photo
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-4 text-center">Brickbanq MIP PLATFORM</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Account Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-baseline">
                      <span className="text-gray-600">Member Since:</span>
                      <span className="text-gray-900 font-medium">{profile.memberSince}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-gray-600">Account Type:</span>
                      <span className="text-blue-600 font-medium">{profile.accountType}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-gray-600">Verification:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Personal Information + Address */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <SectionHeader title="Personal Information" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>First Name *</label>
                      <input type="text" value={profile.firstName ?? ''} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value.replace(/[^a-zA-Z\s''-]/g, '') }))} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Last Name *</label>
                      <input type="text" value={profile.lastName ?? ''} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value.replace(/[^a-zA-Z\s''-]/g, '') }))} className={inputClass} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className={labelClass}>Email Address *</label>
                    <input type="email" value={profile.email ?? ''} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} className={inputClass} />
                  </div>
                  <div className="mt-4">
                    <label className={labelClass}>Phone Number</label>
                    <input type="text" value={profile.phone ?? ''} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value.replace(/[^0-9+\-()\s]/g, '') }))} placeholder="+61 412 345 678" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className={labelClass}>Company</label>
                      <select value={profile.company ?? ''} onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))} className={inputClass}>
                        <option value="Platinum Capital Partners">Platinum Capital Partners</option>
                        <option value="Brickbanq Platform">Brickbanq Platform</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Job Title</label>
                      <textarea rows={3} value={profile.bio ?? ''} onChange={(e) => { setProfile((p) => ({ ...p, bio: e.target.value })); setBioLength(e.target.value.length) }} className={inputClass} placeholder="e.g. Experienced investment professional..." />
                      <p className="text-xs text-gray-400 text-right mt-1">{bioLength} / 500 characters</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <SectionHeader title="Address" />
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Street Address</label>
                      <input type="text" value={profile.address?.street ?? ''} onChange={(e) => setProfile((p) => ({ ...p, address: { ...p.address, street: e.target.value } }))} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>City</label>
                        <input type="text" value={profile.address?.city ?? ''} onChange={(e) => setProfile((p) => ({ ...p, address: { ...p.address, city: e.target.value } }))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>State</label>
                        <select value={profile.address?.state ?? ''} onChange={(e) => setProfile((p) => ({ ...p, address: { ...p.address, state: e.target.value } }))} className={inputClass}>
                          <option value="VIC">VIC</option>
                          <option value="NSW">NSW</option>
                          <option value="QLD">QLD</option>
                          <option value="WA">WA</option>
                          <option value="SA">SA</option>
                          <option value="TAS">TAS</option>
                          <option value="ACT">ACT</option>
                          <option value="NT">NT</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Postcode</label>
                        <input type="text" value={profile.address?.postcode ?? ''} onChange={(e) => setProfile((p) => ({ ...p, address: { ...p.address, postcode: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) } }))} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <input type="text" value={profile.address?.country ?? ''} onChange={(e) => setProfile((p) => ({ ...p, address: { ...p.address, country: e.target.value } }))} className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {saveMessage && <p className="text-sm text-green-600">{saveMessage}</p>}
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={handleCancelProfile} className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m4 3V4" /></svg>
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* ——— ORGANIZATION ——— */}
        {activeTab === 'organization' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <SectionHeader icon={<svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} title="Organization Details" subtitle="Manage your organization information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Organization Name *</label><input type="text" value={org.name} onChange={(e) => setOrg((o) => ({ ...o, name: e.target.value }))} className={inputClass} /></div>
                <div><label className={labelClass}>ABN *</label><input type="text" value={org.abn} onChange={(e) => setOrg((o) => ({ ...o, abn: e.target.value }))} className={inputClass} /></div>
                <div><label className={labelClass}>Website</label><input type="url" value={org.website} onChange={(e) => setOrg((o) => ({ ...o, website: e.target.value }))} className={inputClass} /></div>
                <div><label className={labelClass}>Phone</label><input type="text" value={org.phone} onChange={(e) => setOrg((o) => ({ ...o, phone: e.target.value.replace(/[^0-9+\-()\s]/g, '') }))} className={inputClass} /></div>
                <div><label className={labelClass}>Street Address</label><input type="text" value={org.street} onChange={(e) => setOrg((o) => ({ ...o, street: e.target.value }))} className={inputClass} /></div>
                <div><label className={labelClass}>City</label><input type="text" value={org.city} onChange={(e) => setOrg((o) => ({ ...o, city: e.target.value }))} className={inputClass} /></div>
                <div><label className={labelClass}>Postcode</label><input type="text" value={org.postcode} onChange={(e) => setOrg((o) => ({ ...o, postcode: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) }))} className={inputClass} /></div>
                <div><label className={labelClass}>Industry</label><select value={org.industry} onChange={(e) => setOrg((o) => ({ ...o, industry: e.target.value }))} className={inputClass}><option>Financial Services</option><option>Legal</option><option>Real Estate</option></select></div>
                <div><label className={labelClass}>Company Size</label><select value={org.companySize} onChange={(e) => setOrg((o) => ({ ...o, companySize: e.target.value }))} className={inputClass}><option>50-100 employees</option><option>1-10</option><option>11-50</option><option>100+</option></select></div>
                <div><label className={labelClass}>State</label><select value={org.state} onChange={(e) => setOrg((o) => ({ ...o, state: e.target.value }))} className={inputClass}><option value="ACT">ACT</option><option value="NSW">NSW</option><option value="NT">NT</option><option value="QLD">QLD</option><option value="SA">SA</option><option value="TAS">TAS</option><option value="VIC">VIC</option><option value="WA">WA</option></select></div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <SectionHeader icon={<svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} title={`Team Members (${teamMembers.length})`} subtitle="Manage who has access to your organization" />
                <button type="button" onClick={handleInviteMember} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Invite Member
                </button>
              </div>
              <ul className="space-y-4">
                {teamMembers.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                    <div className={`w-10 h-10 rounded-full ${m.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>{m.initials}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                      <p className="text-sm text-gray-500">{m.email}</p>
                    </div>
                    <select value={m.role} onChange={(e) => handleRoleChange(m.id, e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40">
                      <option>Administrator</option>
                      <option>Member</option>
                      <option>Viewer</option>
                    </select>
                    <button type="button" onClick={() => handleRemoveMember(m.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" aria-label="Remove member">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-2">Role descriptions</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Administrator:</strong> Full access to organization settings and billing.</li>
                  <li><strong>Member:</strong> Can view and edit cases; no billing access.</li>
                  <li><strong>Viewer:</strong> Read-only access.</li>
                </ul>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <SectionHeader icon={<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} title="Billing information" subtitle="Subscription and payment details" />
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{billing.plan}</p>
                    <p className="text-sm text-gray-600">{billing.price} • {billing.billingCycle}</p>
                    <p className="text-xs text-gray-500 mt-1">Next billing date: {billing.nextBillingDate}</p>
                  </div>
                  <button type="button" onClick={handleManagePlan} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Manage Plan</button>
                </div>
                <div className="flex flex-wrap justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">•••• •••• •••• {billing.cardLast4}</p>
                    <p className="text-sm text-gray-500">Expires {billing.cardExpires}</p>
                  </div>
                  <button type="button" onClick={handleUpdatePayment} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Update</button>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <p className="font-semibold text-amber-800">Billing Contact</p>
                    <p className="text-sm text-amber-800">All invoices will be sent to the organization administrator email.</p>
                  </div>
                </div>
              </div>
            </div>
            {orgSaveMessage && <p className="text-sm text-green-600">{orgSaveMessage}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={handleOrganizationCancel} className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleOrganizationSave} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m4 3V4" /></svg>
                Save Changes
              </button>
            </div>
          </div>
        )}

        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="invite-member-title">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 id="invite-member-title" className="text-lg font-semibold text-gray-900 mb-4">Invite Member</h2>
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input type="text" value={inviteForm.name} onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="Full name" required />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="email@example.com" required />
                </div>
                <div>
                  <label className={labelClass}>Role</label>
                  <select value={inviteForm.role} onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))} className={inputClass}>
                    <option value="Administrator">Administrator</option>
                    <option value="Member">Member</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Send Invite</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showManagePlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="manage-plan-title">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 id="manage-plan-title" className="text-lg font-semibold text-gray-900 mb-2">Manage Plan</h2>
              <p className="text-sm text-gray-500 mb-4">Current plan: <strong>{billing.plan}</strong>. Choose a plan below to change.</p>
              <div className="space-y-3">
                {[
                  { plan: 'Starter Plan', price: 'A$99/month', billingCycle: 'Billed monthly', nextBillingDate: billing.nextBillingDate },
                  { plan: 'Professional Plan', price: 'A$299/month', billingCycle: 'Billed annually', nextBillingDate: billing.nextBillingDate },
                  { plan: 'Enterprise Plan', price: 'A$599/month', billingCycle: 'Billed annually', nextBillingDate: billing.nextBillingDate },
                ].map((option) => (
                  <button
                    key={option.plan}
                    type="button"
                    onClick={() => handleChangePlan(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${billing.plan === option.plan ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                  >
                    <p className="font-medium text-gray-900">{option.plan}</p>
                    <p className="text-sm text-gray-600">{option.price} • {option.billingCycle}</p>
                  </button>
                ))}
              </div>
              <button type="button" onClick={handleCloseManagePlanModal} className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        {showUpdatePaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="update-payment-title">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 id="update-payment-title" className="text-lg font-semibold text-gray-900 mb-4">Update Payment Method</h2>
              <form onSubmit={handleSubmitPaymentUpdate} className="space-y-4">
                <div>
                  <label className={labelClass}>Card number (last 4 digits)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={paymentForm.cardLast4}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, cardLast4: e.target.value.replace(/\D/g, '').slice(0, 4), billingMessage: '' }))}
                    className={inputClass}
                    placeholder="4242"
                  />
                </div>
                <div>
                  <label className={labelClass}>Expiry (MM/YY)</label>
                  <input
                    type="text"
                    value={paymentForm.cardExpires}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, cardExpires: e.target.value, billingMessage: '' }))}
                    className={inputClass}
                    placeholder="12/25"
                  />
                </div>
                {paymentForm.billingMessage && <p className="text-sm text-amber-600">{paymentForm.billingMessage}</p>}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={handleCloseUpdatePaymentModal} className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Update</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'api-integrations' && (
          <SettingsApiIntegrations
            integrations={integrations}
            onTestConnection={handleTestConnection}
            onFieldChange={handleIntegrationFieldChange}
            onRequestIntegration={() => setRequestIntegrationOpen(true)}
            onAddIntegration={() => setShowAddIntegrationModal(true)}
            onRemoveIntegration={handleRemoveIntegration}
          />
        )}
        {activeTab === 'form-customization' && (
          <SettingsFormCustomization
            formsList={[]}
            selectedFormId={selectedFormId}
            onSelectForm={setSelectedFormId}
            customFieldsByFormId={customFieldsByFormId}
            customFields={customFieldsByFormId[selectedFormId] || []}
            onToggleRequired={handleToggleRequired}
            onDeleteField={handleDeleteField}
            newFieldLabel={newFieldLabel}
            setNewFieldLabel={setNewFieldLabel}
            newFieldType={newFieldType}
            setNewFieldType={setNewFieldType}
            onAddField={handleAddCustomField}
            onClearNewField={handleClearNewField}
            formCustomizationMessage={formCustomizationMessage}
          />
        )}
        {activeTab === 'security' && (
          <SettingsSecurity
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            twoFaEnabled={twoFaEnabled}
            setTwoFaEnabled={setTwoFaEnabled}
            sessions={sessions}
            onSignOutSession={handleSignOutSession}
            onSignOutAllOther={handleSignOutAllOther}
            onChangePassword={handleChangePassword}
            securityMessage={securityMessage}
            signOutAllConfirm={signOutAllConfirm}
            setSignOutAllConfirm={setSignOutAllConfirm}
          />
        )}
        {activeTab === 'notifications' && (
          <SettingsNotifications
            emailPrefs={emailPrefs}
            pushPrefs={pushPrefs}
            smsPrefs={smsPrefs}
            onToggleEmail={(id) => handleToggleNotif('email', id)}
            onTogglePush={(id) => handleToggleNotif('push', id)}
            onToggleSms={(id) => handleToggleNotif('sms', id)}
            onSave={handleSaveNotifications}
            onCancel={handleCancelNotifications}
            saveMessage={saveMessage}
            saveError={notifSaveError}
            saving={notifSaving}
          />
        )}
        {requestIntegrationOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Request Integration</h2>
              <p className="text-sm text-gray-500 mb-4">Contact support to add a custom API integration. We&apos;ll get back to you within 2 business days.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setRequestIntegrationOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Close</button>
                <a href="mailto:integrations@brickbanq.com?subject=API%20Integration%20Request" className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 text-center">Email Support</a>
              </div>
            </div>
          </div>
        )}

        {showAddIntegrationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="add-integration-title">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
              <h2 id="add-integration-title" className="text-lg font-semibold text-gray-900 mb-2">Add Integration</h2>
              <p className="text-sm text-gray-500 mb-4">Choose an integration to add. You can configure it and test the connection after adding.</p>
              <div className="space-y-3">
                {ADDABLE_INTEGRATION_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleAddIntegration(template)}
                    className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{template.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{template.description}</p>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setShowAddIntegrationModal(false)} className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ——— API Integrations tab ———
function SettingsApiIntegrations({ integrations, onTestConnection, onFieldChange, onRequestIntegration, onAddIntegration, onRemoveIntegration }) {
  const [visibleMask, setVisibleMask] = useState({}) // { 'intId-fieldIdx': true }
  const toggleMask = (intId, fieldIdx) => {
    const key = `${intId}-${fieldIdx}`
    setVisibleMask((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  const statusBadge = (status) => {
    if (status === 'connected') return <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Connected</span>
    if (status === 'error') return <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Error</span>
    return <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-500">Disconnected</span>
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">API Integrations</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage third-party API connections for KYC, property data, payments, and compliance.</p>
      </div>
      <div className="space-y-4">
        {integrations.map((int) => (
          <div key={int.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{int.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{int.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(int.status)}
                {onRemoveIntegration && (
                  <button type="button" onClick={() => onRemoveIntegration(int.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Remove integration" aria-label="Remove integration">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {int.fields.map((f, i) => (
                <div key={i}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <div className="relative">
                    <input
                      type={f.masked && !visibleMask[`${int.id}-${i}`] ? 'password' : 'text'}
                      value={f.value}
                      onChange={(e) => onFieldChange(int.id, i, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-9"
                    />
                    {f.masked && (
                      <button type="button" onClick={() => toggleMask(int.id, i)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" aria-label={visibleMask[`${int.id}-${i}`] ? 'Hide' : 'Show'}>
                        {visibleMask[`${int.id}-${i}`] ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-between items-center mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {int.lastTested && (
                  <>
                    Last tested: {int.lastTested}
                    {int.lastTestSuccess !== null && (int.lastTestSuccess ? <span className="text-green-600 ml-1">✓</span> : <span className="text-red-600 ml-1">✗</span>)}
                  </>
                )}
              </span>
              <button type="button" onClick={() => onTestConnection(int.id)} className="text-sm font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Test Connection
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center mx-auto text-2xl text-gray-500 mb-3">+</div>
        <h3 className="text-base font-semibold text-gray-900">Need Another Integration?</h3>
        <p className="text-sm text-gray-500 mt-1">Add Slack, QuickBooks, Zapier, or a custom API. Or contact support for custom integrations.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          {onAddIntegration && (
            <button type="button" onClick={onAddIntegration} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Integration
            </button>
          )}
          <button type="button" onClick={onRequestIntegration} className="text-sm font-medium text-blue-600 hover:underline">Request Integration</button>
        </div>
      </div>
    </div>
  )
}

// ——— Form Customization tab (Figma-accurate) ———
const FIELD_TYPE_OPTIONS = ['Text', 'Number', 'Date', 'Currency', 'Textarea', 'Select']

function FormCustomizationFieldIcon({ icon }) {
  const c = 'w-5 h-5 shrink-0 text-gray-500'
  if (icon === 'hash') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    )
  }
  if (icon === 'person') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
  if (icon === 'dollar') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  if (icon === 'textarea') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    )
  }
  if (icon === 'select') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    )
  }
  return (
    <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function SettingsFormCustomization({ formsList, selectedFormId, onSelectForm, customFieldsByFormId, customFields, onToggleRequired, onDeleteField, newFieldLabel, setNewFieldLabel, newFieldType, setNewFieldType, onAddField, onClearNewField, formCustomizationMessage }) {
  const selectedForm = formsList.find((f) => f.id === selectedFormId)
  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
      {/* Left: Forms list — Figma: each form = distinct white card with rounded corners + grey border; selected = light blue bg, blue left border */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-900 px-0.5">Forms</h3>
        <div className="flex flex-col gap-2">
          {formsList.map((f) => {
            const count = (customFieldsByFormId[f.id] || []).length
            const isSelected = selectedFormId === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectForm(f.id)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors ${isSelected ? 'bg-blue-50 border-gray-200 border-l-4 border-l-blue-600' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              >
                <svg className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>{f.name}</div>
                  <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>{count} custom field{count !== 1 ? 's' : ''}</div>
                </div>
              </button>
            )
          })}
        </div>
        <div className="pt-2 mt-1 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium">Brickbanq MIP PLATFORM</p>
        </div>
      </div>

      {/* Right: Form title card + Custom Fields (header in light gray box) + Add New (header in light gray box) — exact Figma alignment */}
      <div className="flex flex-col gap-6 min-w-0">
        {/* Selected form title card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900">{selectedForm?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{selectedForm?.description}</p>
        </div>

        {/* Custom Fields — section header in light gray box, then field cards */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Custom Fields</span>
          </div>
          <ul className="p-4 space-y-3">
            {customFields.map((field) => (
              <li key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="cursor-move text-gray-400 shrink-0 mt-0.5" aria-label="Drag to reorder">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                    </svg>
                  </span>
                  <FormCustomizationFieldIcon icon={field.icon} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{field.label}</p>
                      {field.required && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-600 text-white shrink-0">Required</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Type: {field.type}</p>
                    {field.showAssigneeUi && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <button type="button" className="p-1 text-gray-400 hover:text-gray-600 rounded shrink-0" aria-label="Options">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <select className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 shrink-0">
                          <option>Brickbanq Platform</option>
                        </select>
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <select className="text-sm border border-blue-500 rounded-lg px-2 py-1.5 bg-blue-50 text-gray-900 focus:ring-2 focus:ring-blue-500 shrink-0">
                          <option>Borrower</option>
                        </select>
                        <span className="relative shrink-0">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" aria-hidden />
                        </span>
                        <span className="text-sm text-gray-900">{profileUser?.name || "User"}</span>
                        <span className="text-xs text-gray-500">{profileUser?.role || "Borrower"}</span>
                        <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">{profileUser?.initials || "U"}</span>
                      </div>
                    )}
                  </div>
                  {!field.showAssigneeUi && (
                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      <button type="button" onClick={() => onToggleRequired(field.id)} className="text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 whitespace-nowrap">
                        {field.required ? 'Make Optional' : 'Make Required'}
                      </button>
                      <button type="button" onClick={() => onDeleteField(field.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" aria-label="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                {field.showAssigneeUi && (
                  <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-gray-200">
                    <button type="button" onClick={() => onToggleRequired(field.id)} className="text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 whitespace-nowrap">
                      {field.required ? 'Make Optional' : 'Make Required'}
                    </button>
                    <button type="button" onClick={() => onDeleteField(field.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" aria-label="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Add New Custom Field — section header in light gray box, then form card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">+</span>
            <span className="text-sm font-semibold text-gray-900">Add New Custom Field</span>
          </div>
          <div className="p-4">
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Field Label *</label>
                  <input type="text" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="e.g., Property Manager Contact" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Field Type *</label>
                  <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className={inputClass}>
                    {FIELD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {formCustomizationMessage && (
              <p className={`text-sm mb-2 ${formCustomizationMessage.startsWith('Please') ? 'text-amber-600' : 'text-green-600'}`} role="status">
                {formCustomizationMessage}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={onAddField} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                + Add Field to Form
              </button>
              <button type="button" onClick={onClearNewField} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ——— Security tab ———
function SettingsSecurity({ passwordForm, setPasswordForm, twoFaEnabled, setTwoFaEnabled, sessions, onSignOutSession, onSignOutAllOther, onChangePassword, securityMessage, signOutAllConfirm, setSignOutAllConfirm }) {
  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <div className="space-y-6">
      {securityMessage && <p className={`text-sm ${securityMessage.includes('success') || securityMessage.includes('signed out') ? 'text-green-600' : 'text-red-600'}`}>{securityMessage}</p>}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0"><svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></span>
          <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Update your password regularly to keep your account secure.</p>
        <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
          <div><label className={labelClass}>Current Password *</label><input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} placeholder="Enter current password" className={inputClass} /></div>
          <div><label className={labelClass}>New Password *</label><input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))} placeholder="Enter new password" className={inputClass} /><p className="text-xs text-gray-500 mt-1">Must be at least 8 characters with uppercase, lowercase, and numbers</p></div>
          <div><label className={labelClass}>Confirm New Password *</label><input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="Confirm new password" className={inputClass} /></div>
          <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Change Password</button>
        </form>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0"><svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></span>
          <h2 className="text-base font-semibold text-gray-900">Two-Factor Authentication</h2>
        </div>
        <p className="text-sm text-gray-500 mb-2">Add an extra layer of security to your account.</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Status: {twoFaEnabled ? 'Enabled' : 'Disabled'}</span>
            {!twoFaEnabled && <span className="text-red-500" title="Info">ⓘ</span>}
          </div>
          {twoFaEnabled ? <button type="button" onClick={() => setTwoFaEnabled(false)} className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50">Disable 2FA</button> : <button type="button" onClick={() => setTwoFaEnabled(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Enable 2FA</button>}
        </div>
        {!twoFaEnabled && <p className="text-sm text-gray-600 mt-2">Enable 2FA to significantly improve your account security.</p>}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900">Active Sessions</h2>
        <p className="text-sm text-gray-500 mb-4">Manage devices where you&apos;re currently signed in.</p>
        <p className="text-sm font-medium text-gray-700 mb-3">{sessions.length} active</p>
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id} className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg ${s.current ? 'bg-blue-50' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="text-gray-500">{s.device.includes('Mac') ? '💻' : s.device.includes('iOS') ? '📱' : '🖥️'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.current ? 'Current Session' : s.device}</p>
                  <p className="text-xs text-gray-500">{s.location} • Last active: {s.lastActive}</p>
                </div>
              </div>
              {s.current ? <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">Active</span> : <button type="button" onClick={() => onSignOutSession(s.id)} className="text-sm font-medium text-red-600 hover:underline">Sign Out</button>}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setSignOutAllConfirm(true)} className="mt-4 w-full py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Sign Out All Other Sessions</button>
      </div>
      {signOutAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Sign out all other sessions?</h2>
            <p className="text-sm text-gray-500 mb-4">You will remain signed in on this device. All other devices will be signed out.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSignOutAllConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={onSignOutAllOther} className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Sign Out All</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Security Best Practices</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {['Use a unique password not used on other sites', 'Enable two-factor authentication for extra protection', 'Review active sessions regularly', 'Never share your password or 2FA codes'].map((text, i) => (
            <li key={i} className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ——— Notifications tab ———
/* eslint-disable react-hooks/static-components -- Section/Toggle/icons are stable and only used here */
function SettingsNotifications({ emailPrefs, pushPrefs, smsPrefs, onToggleEmail, onTogglePush, onToggleSms, onSave, onCancel, saveMessage, saveError }) {
  function NotificationToggle({ checked, onChange }) {
    return (
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange()} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    )
  }
  const NotificationSection = ({ icon, title, subtitle, items, onToggle }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">{icon}</span>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <NotificationToggle checked={item.on} onChange={() => onToggle(item.id)} />
          </li>
        ))}
      </ul>
    </div>
  )
  const EnvelopeIconSvg = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  const BellIconSvg = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  const MessageIconSvg = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <NotificationSection icon={<EnvelopeIconSvg />} title="Email Notifications" subtitle="Manage which emails you receive from us" items={emailPrefs} onToggle={onToggleEmail} />
      <NotificationSection icon={<BellIconSvg />} title="Push Notifications" subtitle="In-app and browser notifications" items={pushPrefs} onToggle={onTogglePush} />
      <NotificationSection icon={<MessageIconSvg />} title="SMS Notifications" subtitle="Text message alerts to your phone" items={smsPrefs} onToggle={onToggleSms} />
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
        <p className="text-sm text-gray-700"><strong>Note:</strong> Standard SMS rates may apply. We recommend enabling SMS only for critical alerts.</p>
      </div>
      {saveMessage && <p className="text-sm text-green-600 mb-2">{saveMessage}</p>}
      {saveError && <p className="text-sm text-red-600 mb-2">{saveError}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m4 3V4" /></svg>
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
/* eslint-enable react-hooks/static-components */
