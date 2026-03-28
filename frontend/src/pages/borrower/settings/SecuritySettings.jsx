import { useState, useEffect } from 'react'
import { Breadcrumb, FormInput } from './SettingsComponents'
import { securityService } from '../services'

function getPasswordStrength(pwd) {
  if (!pwd) return { label: '', level: 0 }
  let level = 0
  if (pwd.length >= 8) level++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) level++
  if (/\d/.test(pwd)) level++
  const labels = ['', 'Weak', 'Medium', 'Strong']
  return { label: labels[level], level }
}

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sessions, setSessions] = useState([])
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    securityService.getSecuritySettings()
      .then((settings) => {
        if (cancelled) return
        if (settings?.twoFaEnabled !== undefined) setTwoFaEnabled(settings.twoFaEnabled)
        if (Array.isArray(settings?.sessions)) setSessions(settings.sessions)
      })
      .catch(() => {
        // Service handles fallback
      })
    
    securityService.getActiveSessions()
      .then((sess) => {
        if (!cancelled && Array.isArray(sess)) setSessions(sess)
      })
      .catch(() => {
        // Service handles fallback
      })
    
    return () => { cancelled = true }
  }, [])

  const strength = getPasswordStrength(newPassword)
  const match = !newPassword || newPassword === confirmPassword

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('Please fill all password fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match.')
      return
    }
    if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setMessage('Password must be at least 8 characters with uppercase, lowercase, and numbers.')
      return
    }
    
    try {
      await securityService.changePassword({
        currentPassword,
        newPassword,
      })
      setMessage('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMessage(err?.message || 'Failed to update password.')
    }
  }

  const signOutSession = async (id) => {
    try {
      await securityService.revokeSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch {
      // Service handles offline case
      setSessions((prev) => prev.filter((s) => s.id !== id))
    }
  }

  const signOutAllOther = async () => {
    try {
      await securityService.revokeAllOtherSessions()
      setSessions((prev) => prev.filter((s) => s.isCurrent))
    } catch {
      // Service handles offline case
      setSessions((prev) => prev.filter((s) => s.isCurrent))
    }
  }

  const handleToggleTwoFactor = async () => {
    try {
      const updated = await securityService.toggleTwoFactor(!twoFaEnabled)
      setTwoFaEnabled(updated.twoFaEnabled)
    } catch {
      // Service handles offline case
      setTwoFaEnabled(!twoFaEnabled)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '🏠', link: '/borrower/dashboard' }, { label: 'Dashboard', link: '/borrower/dashboard' }, { label: 'Settings', link: '/borrower/settings' }, { label: 'Security' }]} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your mortgage resolution case</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-slate-500">🔑</span>
          <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">Update your password regularly to keep your account secure</p>
        <div className="space-y-4 max-w-md">
          <FormInput label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" required />
          <div>
            <FormInput label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" required />
            <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters with uppercase, lowercase, and numbers</p>
            {newPassword && <p className={`text-xs mt-1 ${strength.level >= 2 ? 'text-emerald-600' : 'text-amber-600'}`}>{strength.label}</p>}
          </div>
          <FormInput label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required />
          {confirmPassword && !match && <p className="text-xs text-red-500">Passwords do not match</p>}
          {message && <p className={`text-sm ${message.includes('success') ? 'text-emerald-600' : 'text-amber-600'}`}>{message}</p>}
          <button type="button" onClick={handleChangePassword} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded inline-flex items-center gap-2">
            <span>🔑</span> Change Password
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-slate-500">✅</span>
          <h3 className="text-lg font-semibold text-slate-900">Two-Factor Authentication</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Add an extra layer of security to your account</p>
        <p className="text-sm text-slate-700 mb-2">Status: {twoFaEnabled ? <span className="text-emerald-600">Enabled</span> : <span className="text-amber-600">Disabled</span>}</p>
        <p className="text-sm text-slate-500 mb-4">Enable 2FA to significantly improve your account security.</p>
        <button type="button" onClick={handleToggleTwoFactor} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded">
          {twoFaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-900">Active Sessions</h3>
          <span className="text-sm text-slate-500">{sessions.length} active</span>
        </div>
        <p className="text-sm text-slate-500 mb-6">Manage devices where you're currently signed in</p>
        <ul className="space-y-4">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{s.device.includes('iPhone') ? '📱' : '💻'}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{s.device}</p>
                  <p className="text-sm text-slate-500">{s.location}</p>
                  <p className="text-xs text-slate-400">Last Active: {s.lastActive}</p>
                </div>
              </div>
              {s.isCurrent ? (
                <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500 text-white">Active</span>
              ) : (
                <button type="button" onClick={() => signOutSession(s.id)} className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1">× Sign Out</button>
              )}
            </li>
          ))}
        </ul>
        {sessions.some((s) => !s.isCurrent) && (
          <div className="mt-6 text-center">
            <button type="button" onClick={signOutAllOther} className="text-sm text-red-600 hover:text-red-700 font-medium">Sign Out All Other Sessions</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Security Best Practices</h3>
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
