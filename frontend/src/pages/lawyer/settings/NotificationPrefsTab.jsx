import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { notificationService } from '../../../api/dataService'

const DEFAULT_PREFS = {
  email: [
    { key: 'dealUpdates', label: 'Deal Updates', description: 'Get notified about new deals and opportunities', enabled: true },
    { key: 'auctionAlerts', label: 'Auction Alerts', description: 'Notifications about auction start times and bid activity', enabled: true },
    { key: 'contractReminders', label: 'Contract Reminders', description: 'Reminders to sign contracts and complete documentation', enabled: true },
    { key: 'paymentNotifications', label: 'Payment Notifications', description: 'Alerts about payments, invoices, and transactions', enabled: true },
    { key: 'systemUpdates', label: 'System Updates', description: 'Platform updates, maintenance, and new features', enabled: false },
  ],
  push: [
    { key: 'dealUpdates', label: 'Deal Updates', description: 'Instant alerts for new investment opportunities', enabled: true },
    { key: 'auctionAlerts', label: 'Auction Alerts', description: 'Real-time auction activity and bid notifications', enabled: true },
    { key: 'messages', label: 'Messages', description: 'New messages from other users', enabled: true },
  ],
  sms: [
    { key: 'criticalAlerts', label: 'Critical Alerts', description: 'Urgent notifications requiring immediate action', enabled: true },
    { key: 'paymentAlerts', label: 'Payment Alerts', description: 'Payment confirmations and receipts via SMS', enabled: true },
  ],
}

export default function NotificationPrefsTab() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    notificationService.getPreferences()
      .then((res) => {
        const data = res.data || res
        if (data && (data.email || data.push || data.sms)) setPrefs(data)
      })
      .catch(() => {})
  }, [])

  const toggle = (category, key) => {
    setPrefs((prev) => ({
      ...prev,
      [category]: prev[category].map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p)),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try { await notificationService.updatePreferences?.(prefs) } catch (_) {}
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/lawyer/dashboard" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/lawyer/settings" className="hover:text-slate-700">Settings</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-slate-900">Notifications</span>
      </nav>

      <div className="space-y-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-1">📧 Email Notifications</h3>
          <p className="text-sm text-slate-500 mb-4">Manage which emails you receive from us.</p>
          <ul className="space-y-4">
            {prefs.email.map((p) => (
              <li key={p.key} className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium text-slate-900">{p.label}</p>
                  <p className="text-sm text-slate-500">{p.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.enabled}
                  onClick={() => toggle('email', p.key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    p.enabled ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      p.enabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-1">🔔 Push Notifications</h3>
          <p className="text-sm text-slate-500 mb-4">In-app and browser notifications.</p>
          <ul className="space-y-4">
            {prefs.push.map((p) => (
              <li key={p.key} className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium text-slate-900">{p.label}</p>
                  <p className="text-sm text-slate-500">{p.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.enabled}
                  onClick={() => toggle('push', p.key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    p.enabled ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      p.enabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-1">💬 SMS Notifications</h3>
          <p className="text-sm text-slate-500 mb-4">Text message alerts to your phone.</p>
          <ul className="space-y-4">
            {prefs.sms.map((p) => (
              <li key={p.key} className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium text-slate-900">{p.label}</p>
                  <p className="text-sm text-slate-500">{p.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.enabled}
                  onClick={() => toggle('sms', p.key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    p.enabled ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      p.enabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 p-4 bg-amber-50 rounded-lg flex items-start gap-2">
            <span className="text-amber-500">⚠</span>
            <p className="text-sm text-amber-800">Note: Standard SMS rates may apply. We recommend enabling SMS only for critical alerts.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setPrefs(DEFAULT_PREFS)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
