import { borrowerApi } from '../api'
import { settingsStorage } from '../data/settingsStorage'

/**
 * Security Service - Backend-friendly API wrapper with localStorage fallback
 */

export const securityService = {
  async getSecuritySettings() {
    try {
      const res = await borrowerApi.getSecuritySettings()
      const data = res?.data?.data !== undefined ? res.data.data : res?.data
      if (data && typeof data === 'object') {
        settingsStorage.setSecurity(data)
        return data
      }
      throw new Error('Invalid security settings')
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const cached = settingsStorage.getSecurity()
        return cached || { twoFaEnabled: false, sessions: [] }
      }
      const cached = settingsStorage.getSecurity()
      if (cached) return cached
      throw err
    }
  },

  async changePassword(data) {
    await borrowerApi.changePassword(data)
    return { success: true }
  },

  async toggleTwoFactor(enabled) {
    try {
      await borrowerApi.toggleTwoFactor(enabled)
      const existing = settingsStorage.getSecurity() || {}
      const merged = { ...existing, twoFaEnabled: enabled }
      settingsStorage.setSecurity(merged)
      return merged
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const existing = settingsStorage.getSecurity() || {}
        const merged = { ...existing, twoFaEnabled: enabled }
        settingsStorage.setSecurity(merged)
        return merged
      }
      throw err
    }
  },

  async getActiveSessions() {
    try {
      const res = await borrowerApi.getActiveSessions()
      const sessions = res?.data?.data?.sessions || res?.data?.sessions || res?.data
      
      if (Array.isArray(sessions)) {
        const existing = settingsStorage.getSecurity() || {}
        settingsStorage.setSecurity({ ...existing, sessions })
        return sessions
      }
      throw new Error('Invalid sessions data')
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const cached = settingsStorage.getSecurity()
        return cached?.sessions || []
      }
      const cached = settingsStorage.getSecurity()
      return cached?.sessions || []
    }
  },

  async revokeSession(sessionId) {
    try {
      await borrowerApi.revokeSession(sessionId)
      
      const existing = settingsStorage.getSecurity() || {}
      const updatedSessions = (existing.sessions || []).filter(s => s.id !== sessionId)
      settingsStorage.setSecurity({ ...existing, sessions: updatedSessions })
      return true
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const existing = settingsStorage.getSecurity() || {}
        const updatedSessions = (existing.sessions || []).filter(s => s.id !== sessionId)
        settingsStorage.setSecurity({ ...existing, sessions: updatedSessions })
        return true
      }
      throw err
    }
  },

  async revokeAllOtherSessions() {
    try {
      await borrowerApi.revokeAllOtherSessions()
      
      const existing = settingsStorage.getSecurity() || {}
      const updatedSessions = (existing.sessions || []).filter(s => s.isCurrent)
      settingsStorage.setSecurity({ ...existing, sessions: updatedSessions })
      return true
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const existing = settingsStorage.getSecurity() || {}
        const updatedSessions = (existing.sessions || []).filter(s => s.isCurrent)
        settingsStorage.setSecurity({ ...existing, sessions: updatedSessions })
        return true
      }
      throw err
    }
  },
}
