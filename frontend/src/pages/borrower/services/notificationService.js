import { borrowerApi } from '../api'
import { settingsStorage } from '../data/settingsStorage'

/**
 * Notification Service - Backend-friendly API wrapper with localStorage fallback
 */

export const notificationService = {
  async getPreferences() {
    try {
      const res = await borrowerApi.getNotificationPreferences()
      const data = res?.data?.data !== undefined ? res.data.data : res?.data
      if (data && typeof data === 'object') {
        settingsStorage.setNotifications(data)
        return data
      }
      throw new Error('Invalid notification preferences')
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const cached = settingsStorage.getNotifications()
        return cached || {}
      }
      const cached = settingsStorage.getNotifications()
      if (cached) return cached
      throw err
    }
  },

  async updatePreferences(data) {
    try {
      const res = await borrowerApi.updateNotificationPreferences(data)
      const updated = res?.data?.data !== undefined ? res.data.data : res?.data
      settingsStorage.setNotifications(updated)
      return updated
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        settingsStorage.setNotifications(data)
        return data
      }
      throw err
    }
  },
}
