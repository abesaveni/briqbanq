import { borrowerApi } from '../api'
import { settingsStorage } from '../data/settingsStorage'

/**
 * Module Settings Service - Backend-friendly API wrapper with localStorage fallback
 */

const defaultConfig = {
  status: 'active',
  environment: 'production',
  apiEndpoint: 'https://api.brickbanq.com',
  database: 'PostgreSQL',
  maxUsers: 10,
}

const defaultFeatures = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  twoFactorAuth: false,
  auditLogging: true,
}

export const moduleSettingsService = {
  async getModuleSettings() {
    try {
      const res = await borrowerApi.getModuleSettings()
      const data = res?.data?.data !== undefined ? res.data.data : res?.data
      if (data && typeof data === 'object') {
        settingsStorage.setModuleSettings(data)
        return data
      }
      throw new Error('Invalid module settings')
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const cached = settingsStorage.getModuleSettings()
        return cached || { config: defaultConfig, features: defaultFeatures }
      }
      const cached = settingsStorage.getModuleSettings()
      if (cached) return cached
      throw err
    }
  },

  async updateModuleSettings(data) {
    try {
      const res = await borrowerApi.updateModuleSettings(data)
      const updated = res?.data?.data !== undefined ? res.data.data : res?.data
      settingsStorage.setModuleSettings(updated)
      return updated
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        settingsStorage.setModuleSettings(data)
        return data
      }
      throw err
    }
  },
}
