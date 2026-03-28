import { useState, useEffect } from 'react'
import { BackToSettings, Toggle } from './SettingsComponents'
import { notificationService } from '../services'

const defaultPrefs = {
  email: {},
  push: {},
  sms: {},
}

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState(defaultPrefs)
  const [, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    notificationService.getPreferences()
      .then((saved) => {
        if (!cancelled && saved) setPrefs({ ...defaultPrefs, ...saved })
      })
      .catch(() => {
        // Service handles fallback
      })
    return () => { cancelled = true }
  }, [])

  const setEmail = (key, value) => {
    setPrefs((p) => ({ ...p, email: { ...p.email, [key]: value } }))
    setIsDirty(true)
  }
  const setPush = (key, value) => {
    setPrefs((p) => ({ ...p, push: { ...p.push, [key]: value } }))
    setIsDirty(true)
  }
  const setSms = (key, value) => {
    setPrefs((p) => ({ ...p, sms: { ...p.sms, [key]: value } }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await notificationService.updatePreferences(prefs)
      setIsDirty(false)
    } catch {
      // Service handles offline case
      setIsDirty(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async () => {
    try {
      const saved = await notificationService.getPreferences()
      if (saved) setPrefs({ ...defaultPrefs, ...saved })
      else setPrefs(defaultPrefs)
    } catch {
      // Service handles fallback
    }
    setIsDirty(false)
  }

  return (
    <div className="space-y-6">
      <BackToSettings />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notification Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your mortgage resolution case</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-indigo-600">📧</span>
          <h3 className="text-lg font-semibold text-slate-900">Email Notifications</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">Manage which emails you receive from us.</p>
        <div className="space-y-0">
          <Toggle label="Deal Updates" description="Get notified about new deals and opportunities" enabled={prefs.email.dealUpdates} onChange={(v) => setEmail('dealUpdates', v)} />
          <Toggle label="Auction Activity" description="Notifications about auction start times and bid activity" enabled={prefs.email.auctionActivity} onChange={(v) => setEmail('auctionActivity', v)} />
          <Toggle label="Contract Reminders" description="Reminders to sign contracts and complete documentation" enabled={prefs.email.contractReminders} onChange={(v) => setEmail('contractReminders', v)} />
          <Toggle label="Payment Notifications" description="Alerts about payments, invoices, and transactions" enabled={prefs.email.paymentNotifications} onChange={(v) => setEmail('paymentNotifications', v)} />
          <Toggle label="System Updates" description="Information about new features, and new features" enabled={prefs.email.systemUpdates} onChange={(v) => setEmail('systemUpdates', v)} />
          <Toggle label="Marketing Emails" description="Tips, articles, and product announcements" enabled={prefs.email.marketingEmails} onChange={(v) => setEmail('marketingEmails', v)} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-indigo-600">📱</span>
          <h3 className="text-lg font-semibold text-slate-900">Push Notifications</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">In-app and browser notifications.</p>
        <div className="space-y-0">
          <Toggle label="Deal Updates" description="Instant alerts for new investment opportunities" enabled={prefs.push.dealUpdates} onChange={(v) => setPush('dealUpdates', v)} />
          <Toggle label="Auction Alerts" description="Real-time auction activity and bid notifications" enabled={prefs.push.auctionAlerts} onChange={(v) => setPush('auctionAlerts', v)} />
          <Toggle label="Bid Activity" description="When someone outbids you or bids on your cases" enabled={prefs.push.bidActivity} onChange={(v) => setPush('bidActivity', v)} />
          <Toggle label="Messages" description="New messages from other users" enabled={prefs.push.messages} onChange={(v) => setPush('messages', v)} />
          <Toggle label="System Alerts" description="Important system notifications and warnings" enabled={prefs.push.systemAlerts} onChange={(v) => setPush('systemAlerts', v)} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-emerald-600">📲</span>
          <h3 className="text-lg font-semibold text-slate-900">SMS Notifications</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">Text message alerts to your phone.</p>
        <div className="space-y-0">
          <Toggle label="Critical Alerts" description="Urgent notifications requiring immediate action" enabled={prefs.sms.criticalAlerts} onChange={(v) => setSms('criticalAlerts', v)} />
          <Toggle label="Auction Reminders" description="SMS reminders before auctions start" enabled={prefs.sms.auctionReminders} onChange={(v) => setSms('auctionReminders', v)} />
          <Toggle label="Payment Alerts" description="Alerts for payment confirmations via SMS" enabled={prefs.sms.paymentAlerts} onChange={(v) => setSms('paymentAlerts', v)} />
        </div>
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <span className="text-amber-600">💡</span>
          <p className="text-sm text-amber-800">Note: Standard SMS rates may apply. We recommend enabling SMS only for critical alerts.</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={handleCancel} className="border border-slate-300 bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50">Cancel</button>
        <button type="button" onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded inline-flex items-center gap-2 disabled:opacity-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" /></svg>
          Save Preferences
        </button>
      </div>
    </div>
  )
}
