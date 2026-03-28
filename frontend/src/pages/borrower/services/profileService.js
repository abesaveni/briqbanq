import { borrowerApi } from '../api'
import { settingsStorage } from '../data/settingsStorage'

const FALLBACK_PROFILE = null

/**
 * Profile Service - Backend-friendly API wrapper with localStorage fallback
 * 
 * Pattern:
 * 1. Try API call first
 * 2. On success: update localStorage as cache
 * 3. On network error: use localStorage as fallback
 * 4. On other errors: throw error (let component handle)
 */

export const profileService = {
  /**
   * Get profile from API, fallback to localStorage
   */
  async getProfile() {
    try {
      // Use the standardized identity endpoint
      const res = await borrowerApi.get('/api/v1/identity/me')
      const data = res?.data?.data !== undefined ? res.data.data : res?.data
      if (data && typeof data === 'object') {
        // Merge with localStorage to preserve photoUrl if API doesn't return it
        const cached = settingsStorage.getProfile()
        const merged = { ...data, ...(cached?.photoUrl ? { photoUrl: cached.photoUrl } : {}) }
        settingsStorage.setProfile(merged)
        return merged
      }
      throw new Error('Invalid profile data')
    } catch (err) {
      // Network error: use localStorage fallback
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const cached = settingsStorage.getProfile()
        return cached || FALLBACK_PROFILE
      }
      // Other errors: try localStorage, then fallback
      const cached = settingsStorage.getProfile()
      if (cached) return cached
      throw err
    }
  },

  /**
   * Update profile via API, update localStorage on success
   */
  async updateProfile(data) {
    try {
      const res = await borrowerApi.updateProfile(data)
      const updated = res?.data?.data !== undefined ? res.data.data : res?.data
      
      // Merge with existing localStorage data (preserve photoUrl, etc.)
      const existing = settingsStorage.getProfile() || {}
      const merged = { ...existing, ...updated, ...data }
      settingsStorage.setProfile(merged)
      
      return merged
    } catch (err) {
      // Network error: still update localStorage for offline-first behavior
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const existing = settingsStorage.getProfile() || {}
        const merged = { ...existing, ...data }
        settingsStorage.setProfile(merged)
        return merged
      }
      throw err
    }
  },

  /**
   * Upload profile photo via API
   */
  async uploadPhoto(file) {
    try {
      const res = await borrowerApi.uploadProfilePhoto(file)
      const photoUrl = res?.data?.data?.photoUrl || res?.data?.photoUrl
      
      if (photoUrl) {
        const existing = settingsStorage.getProfile() || {}
        const updated = { ...existing, photoUrl }
        settingsStorage.setProfile(updated)
        return updated
      }
      throw new Error('Photo upload failed')
    } catch (err) {
      // Network error: use FileReader to create data URL for local preview
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            const existing = settingsStorage.getProfile() || {}
            const updated = { ...existing, photoUrl: reader.result }
            settingsStorage.setProfile(updated)
            resolve(updated)
          }
          reader.readAsDataURL(file)
        })
      }
      throw err
    }
  },
}
