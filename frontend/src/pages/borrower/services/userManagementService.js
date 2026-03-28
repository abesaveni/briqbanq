import { borrowerApi } from '../api'
import { settingsStorage } from '../data/settingsStorage'

/**
 * User Management Service - Backend-friendly API wrapper with localStorage fallback
 */

export const userManagementService = {
  async getUsers() {
    try {
      const res = await borrowerApi.getUsers()
      const users = res?.data?.data?.users || res?.data?.users || res?.data
      
      if (Array.isArray(users)) {
        settingsStorage.setUsers(users)
        return users
      }
      throw new Error('Invalid users data')
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const cached = settingsStorage.getUsers()
        return cached || []
      }
      const cached = settingsStorage.getUsers()
      if (cached) return cached
      throw err
    }
  },

  async createUser(userData) {
    try {
      const res = await borrowerApi.createUser(userData)
      const user = res?.data?.data !== undefined ? res.data.data : res?.data
      
      const existing = settingsStorage.getUsers() || []
      settingsStorage.setUsers([...existing, user])
      return user
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        // Add locally for offline-first
        const existing = settingsStorage.getUsers() || []
        const user = { ...userData, id: Date.now(), status: 'Active' }
        settingsStorage.setUsers([...existing, user])
        return user
      }
      throw err
    }
  },

  async updateUser(userId, userData) {
    try {
      const res = await borrowerApi.updateUser(userId, userData)
      const updated = res?.data?.data !== undefined ? res.data.data : res?.data
      
      const existing = settingsStorage.getUsers() || []
      const updatedUsers = existing.map(u => u.id === userId ? { ...u, ...updated } : u)
      settingsStorage.setUsers(updatedUsers)
      return updated
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const existing = settingsStorage.getUsers() || []
        const updatedUsers = existing.map(u => u.id === userId ? { ...u, ...userData } : u)
        settingsStorage.setUsers(updatedUsers)
        return { id: userId, ...userData }
      }
      throw err
    }
  },

  async deleteUser(userId) {
    try {
      await borrowerApi.deleteUser(userId)
      
      const existing = settingsStorage.getUsers() || []
      const updatedUsers = existing.filter(u => u.id !== userId)
      settingsStorage.setUsers(updatedUsers)
      return true
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const existing = settingsStorage.getUsers() || []
        const updatedUsers = existing.filter(u => u.id !== userId)
        settingsStorage.setUsers(updatedUsers)
        return true
      }
      throw err
    }
  },

  async getUserDetails(userId) {
    try {
      const res = await borrowerApi.getUserDetails(userId)
      return res?.data?.data !== undefined ? res.data.data : res?.data
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const existing = settingsStorage.getUsers() || []
        return existing.find(u => u.id === userId) || null
      }
      throw err
    }
  },
}
