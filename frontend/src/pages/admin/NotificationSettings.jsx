import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Bell, Mail, Smartphone, MessageSquare, ChevronRight,
    Home, Save, X, Info, AlertTriangle, ShieldAlert
} from 'lucide-react'

export default function NotificationSettings() {
    const navigate = useNavigate()
    const [isSaving, setIsSaving] = useState(false)
    const [savedBanner, setSavedBanner] = useState(false)

    const [emailPrefs, setEmailPrefs] = useState({
        dealUpdates: true,
        auctionAlerts: true,
        contractReminders: true,
        paymentNotifications: true,
        systemUpdates: false,
        marketingEmails: false
    })

    const [pushPrefs, setPushPrefs] = useState({
        dealUpdates: true,
        auctionAlerts: true,
        bidActivity: true,
        messages: true,
        systemAlerts: true
    })

    const [smsPrefs, setSmsPrefs] = useState({
        criticalAlerts: true,
        auctionReminders: false,
        paymentAlerts: true
    })

    const handleSave = () => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            setSavedBanner(true)
            setTimeout(() => setSavedBanner(false), 3000)
        }, 800)
    }

    const Toggle = ({ checked, onChange, label, sub }) => (
        <div className="flex items-center justify-between py-4 group">
            <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 tracking-tight">{label}</p>
                {sub && <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">{sub}</p>}
            </div>
            <button
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-indigo-50
                    ${checked ? 'bg-indigo-600' : 'bg-gray-200'}
                `}
            >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `} />
            </button>
        </div>
    )

    return (
        <div className="space-y-8 max-w-7xl pb-20">
            {savedBanner && (
                <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
                    Notification preferences saved!
                </div>
            )}
            {/* Page Header */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Notification Settings</h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium tracking-wide">Platform administration and compliance management</p>
                </div>
                <button
                    onClick={() => navigate('/admin/settings')}
                    className="flex items-center gap-2 px-4 py-2 w-fit bg-white border border-gray-100 rounded-xl text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm"
                >
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                    Back to Settings
                </button>
            </div>

            <div className="space-y-6">
                {/* Email Notifications */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">Email Notifications</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Manage which emails you receive from us</p>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        <Toggle
                            label="Deal Updates"
                            sub="Get notified about new deals and opportunities"
                            checked={emailPrefs.dealUpdates}
                            onChange={() => setEmailPrefs(p => ({ ...p, dealUpdates: !p.dealUpdates }))}
                        />
                        <Toggle
                            label="Auction Alerts"
                            sub="Notifications about auction start times and bid activity"
                            checked={emailPrefs.auctionAlerts}
                            onChange={() => setEmailPrefs(p => ({ ...p, auctionAlerts: !p.auctionAlerts }))}
                        />
                        <Toggle
                            label="Contract Reminders"
                            sub="Reminders to sign contracts and complete documentation"
                            checked={emailPrefs.contractReminders}
                            onChange={() => setEmailPrefs(p => ({ ...p, contractReminders: !p.contractReminders }))}
                        />
                        <Toggle
                            label="Payment Notifications"
                            sub="Alerts about payments, invoices, and transactions"
                            checked={emailPrefs.paymentNotifications}
                            onChange={() => setEmailPrefs(p => ({ ...p, paymentNotifications: !p.paymentNotifications }))}
                        />
                        <Toggle
                            label="System Updates"
                            sub="Platform updates, maintenance, and new features"
                            checked={emailPrefs.systemUpdates}
                            onChange={() => setEmailPrefs(p => ({ ...p, systemUpdates: !p.systemUpdates }))}
                        />
                        <Toggle
                            label="Marketing Emails"
                            sub="Tips, insights, and product announcements"
                            checked={emailPrefs.marketingEmails}
                            onChange={() => setEmailPrefs(p => ({ ...p, marketingEmails: !p.marketingEmails }))}
                        />
                    </div>
                </div>

                {/* Push Notifications */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">Push Notifications</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">In-app and browser notifications</p>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        <Toggle
                            label="Deal Updates"
                            sub="Instant alerts for new investment opportunities"
                            checked={pushPrefs.dealUpdates}
                            onChange={() => setPushPrefs(p => ({ ...p, dealUpdates: !p.dealUpdates }))}
                        />
                        <Toggle
                            label="Auction Alerts"
                            sub="Real-time auction activity and bid notifications"
                            checked={pushPrefs.auctionAlerts}
                            onChange={() => setPushPrefs(p => ({ ...p, auctionAlerts: !p.auctionAlerts }))}
                        />
                        <Toggle
                            label="Bid Activity"
                            sub="When someone outbids you or bids on your cases"
                            checked={pushPrefs.bidActivity}
                            onChange={() => setPushPrefs(p => ({ ...p, bidActivity: !p.bidActivity }))}
                        />
                        <Toggle
                            label="Messages"
                            sub="New messages from other users"
                            checked={pushPrefs.messages}
                            onChange={() => setPushPrefs(p => ({ ...p, messages: !p.messages }))}
                        />
                        <Toggle
                            label="System Alerts"
                            sub="Important system notifications and warnings"
                            checked={pushPrefs.systemAlerts}
                            onChange={() => setPushPrefs(p => ({ ...p, systemAlerts: !p.systemAlerts }))}
                        />
                    </div>
                </div>

                {/* SMS Notifications */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">SMS Notifications</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Text message alerts to your phone</p>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        <Toggle
                            label="Critical Alerts"
                            sub="Urgent notifications requiring immediate action"
                            checked={smsPrefs.criticalAlerts}
                            onChange={() => setSmsPrefs(p => ({ ...p, criticalAlerts: !p.criticalAlerts }))}
                        />
                        <Toggle
                            label="Auction Reminders"
                            sub="SMS reminders before auctions start"
                            checked={smsPrefs.auctionReminders}
                            onChange={() => setSmsPrefs(p => ({ ...p, auctionReminders: !p.auctionReminders }))}
                        />
                        <Toggle
                            label="Payment Alerts"
                            sub="Payment confirmations and receipts via SMS"
                            checked={smsPrefs.paymentAlerts}
                            onChange={() => setSmsPrefs(p => ({ ...p, paymentAlerts: !p.paymentAlerts }))}
                        />
                    </div>

                    <div className="mt-8 p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                            <Info className="w-4 h-4 shadow-sm" />
                        </div>
                        <p className="text-xs text-amber-900 font-semibold uppercase tracking-widest">
                            <span className="text-amber-700">Note:</span> Standard SMS rates may apply. We recommend enabling SMS only for critical alerts.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                <button
                    onClick={() => navigate('/admin/settings')}
                    className="px-8 py-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-3 px-10 py-3 bg-indigo-700 text-white rounded-xl text-xs font-semibold uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-800 hover:-translate-y-0.5 transition-all disabled:opacity-50 group"
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Preferences
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
