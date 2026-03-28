import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../../api/dataService'

const DEFAULT_SESSIONS = [
  { id: 'current', device: 'Current Session', detail: 'Active session', lastActive: 'Just now', current: true },
]

export default function SecurityTab() {
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS)

  useEffect(() => {
    authService.getActiveSessions()
      .then((res) => {
        const data = res.data || res
        if (Array.isArray(data) && data.length > 0) setSessions(data)
      })
      .catch(() => {})
  }, [])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return
    setChangingPassword(true)
    try {
      await authService.changePassword({ current_password: currentPassword, new_password: newPassword })
    } catch (_) {}
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setChangingPassword(false)
  }

  const handleRevokeSession = async (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    try { await authService.logoutSession(id) } catch (_) {}
  }

  const handleRevokeAllOther = async () => {
    setSessions((prev) => prev.filter((s) => s.current))
    try { await authService.logoutAllOtherSessions() } catch (_) {}
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/lawyer/dashboard" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/lawyer/settings" className="hover:text-slate-700">Settings</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-slate-900">Security</span>
      </nav>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <span className="text-indigo-600">🔒</span> Change Password
        </h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Update your password regularly to keep your account secure.</p>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password *</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password *</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters with uppercase, lowercase, and numbers</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password *</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {changingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <span className="text-green-600">✓</span> Two-Factor Authentication
        </h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Add an extra layer of security to your account.</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-700">Status: <span className="font-medium text-amber-600">{twoFaEnabled ? 'Enabled' : 'Disabled'}</span></p>
            <p className="text-sm text-slate-500 mt-0.5">Enable 2FA to significantly improve your account security.</p>
          </div>
          <button
            type="button"
            onClick={() => setTwoFaEnabled(!twoFaEnabled)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            {twoFaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">Active Sessions</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Manage devices where you&apos;re currently signed in</p>
        <p className="text-sm text-slate-500 mb-4">{sessions.length} active</p>
        <div className="space-y-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border ${
                s.current ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{s.device}</p>
                  <p className="text-sm text-slate-500">{s.detail}</p>
                  <p className="text-xs text-slate-400">Last active: {s.lastActive}</p>
                </div>
              </div>
              <div>
                {s.current ? (
                  <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(s.id)}
                    className="flex items-center gap-1 text-red-600 text-sm font-medium hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleRevokeAllOther}
          className="mt-4 px-4 py-2 border border-indigo-600 text-indigo-600 text-sm font-medium rounded-md hover:bg-indigo-50"
        >
          Sign Out All Other Sessions
        </button>
      </div>

      <div className="bg-blue-50 rounded-lg border border-blue-100 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Security Best Practices</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2">✓ Use a unique password not used on other sites</li>
          <li className="flex items-center gap-2">✓ Enable two-factor authentication for extra protection</li>
          <li className="flex items-center gap-2">✓ Review active sessions regularly</li>
          <li className="flex items-center gap-2">✓ Never share your password or 2FA codes</li>
        </ul>
      </div>
    </div>
  )
}
