const KEY_PROFILE = 'brickbanq_borrower_profile'
const KEY_ORGANIZATION = 'brickbanq_borrower_organization'
const KEY_NOTIFICATIONS = 'brickbanq_borrower_notifications'
const KEY_SECURITY = 'brickbanq_borrower_security'
const KEY_MODULE = 'brickbanq_borrower_module_settings'
const KEY_USER_MANAGEMENT = 'brickbanq_borrower_user_management'

function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('settingsStorage set failed', e)
  }
}

export const settingsStorage = {
  getProfile: () => get(KEY_PROFILE),
  setProfile: (data) => set(KEY_PROFILE, data),

  getOrganization: () => get(KEY_ORGANIZATION),
  setOrganization: (data) => set(KEY_ORGANIZATION, data),

  getNotifications: () => get(KEY_NOTIFICATIONS),
  setNotifications: (data) => set(KEY_NOTIFICATIONS, data),

  getSecurity: () => get(KEY_SECURITY),
  setSecurity: (data) => set(KEY_SECURITY, data),

  getModuleSettings: () => get(KEY_MODULE),
  setModuleSettings: (data) => set(KEY_MODULE, data),

  getUsers: () => get(KEY_USER_MANAGEMENT),
  setUsers: (data) => set(KEY_USER_MANAGEMENT, data),
}
