import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { organizationService } from '../../../api/dataService'

const DEFAULT_ORG = { name: '', abn: '', industry: '', companySize: '', website: '', phone: '', streetAddress: '', city: '', state: 'VIC', postcode: '' }

export default function OrganizationTab() {
  const [org, setOrg] = useState(DEFAULT_ORG)
  const [team, setTeam] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    organizationService.getOrgSettings()
      .then((res) => { const d = res.data || res; if (d?.name) setOrg(d) })
      .catch(() => {})
    organizationService.getTeamMembers()
      .then((res) => { const d = res.data || res; if (Array.isArray(d)) setTeam(d) })
      .catch(() => {})
  }, [])

  const handleOrgChange = (field, value) => {
    setOrg((prev) => ({ ...prev, [field]: value }))
  }

  const handleRoleChange = (memberId, role) => {
    setTeam((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)))
  }

  const handleRemoveMember = (memberId) => {
    setTeam((prev) => prev.filter((m) => m.id !== memberId))
  }

  const handleSave = async () => {
    setSaving(true)
    try { await organizationService.updateOrgSettings?.(org) } catch (_) {}
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/lawyer/dashboard" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/lawyer/settings" className="hover:text-slate-700">Settings</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-slate-900">Organization</span>
      </nav>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Organization Details</h3>
        <p className="text-sm text-slate-500 mb-4">Manage your organization information</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Organization Name *', value: org.name },
            { key: 'abn', label: 'ABN *', value: org.abn },
            { key: 'industry', label: 'Industry', value: org.industry },
            { key: 'companySize', label: 'Company Size', value: org.companySize },
            { key: 'website', label: 'Website', value: org.website },
            { key: 'phone', label: 'Phone Number', value: org.phone },
            { key: 'streetAddress', label: 'Street Address', value: org.streetAddress },
            { key: 'city', label: 'City', value: org.city },
            { key: 'state', label: 'State', value: org.state },
            { key: 'postcode', label: 'Postcode', value: org.postcode },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
              <input
                type="text"
                value={f.value}
                onChange={(e) => handleOrgChange(f.key, e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Team Members ({team.length})</h3>
            <p className="text-sm text-slate-500">Manage who has access to your organization</p>
          </div>
          <a href="mailto:admin@brickbanq.com?subject=Team%20Member%20Invitation" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 flex items-center gap-2">
            <span>+</span> Invite Member
          </a>
        </div>
        <div className="space-y-4">
          {team.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm">
                  {m.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{m.name}</p>
                  <p className="text-sm text-slate-500">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  className="border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                >
                  <option>Administrator</option>
                  <option>Member</option>
                  <option>Viewer</option>
                </select>
                {m.role !== 'Administrator' && (
                  <button type="button" onClick={() => handleRemoveMember(m.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" aria-label="Remove">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
          <ul className="list-disc list-inside space-y-1">
            <li>Administrator: Full access to all settings and data</li>
            <li>Member: Can view and manage deals, but cannot change organization settings</li>
            <li>Viewer: Read-only access to organization data</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Billing Information</h3>
        <p className="text-sm text-slate-500 mb-4">Subscription and payment details</p>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Professional Plan</p>
              <p className="text-sm text-slate-500">Contact admin for billing details</p>
            </div>
            <a href="mailto:admin@brickbanq.com?subject=Plan%20Management%20Request" className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
              Manage Plan
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-3">
            <div>
              <p className="font-medium text-slate-900">Payment Method</p>
              <p className="text-sm text-slate-500">Contact admin to update payment method</p>
            </div>
            <a href="mailto:admin@brickbanq.com?subject=Payment%20Method%20Update" className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
              Update
            </a>
          </div>
        </div>
        <div className="mt-4 p-4 bg-amber-50 rounded-lg flex items-start gap-2">
          <span className="text-amber-500">⚠</span>
          <p className="text-sm text-amber-800">All invoices will be sent to the organization administrator email.</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOrg(DEFAULT_ORG)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
