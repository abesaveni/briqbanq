import { borrowerApi } from '../api'
import { settingsStorage } from '../data/settingsStorage'

/**
 * Organization Service - Backend-friendly API wrapper with localStorage fallback
 */

export const organizationService = {
  async getOrganization() {
    try {
      const res = await borrowerApi.getOrganization()
      const data = res?.data?.data !== undefined ? res.data.data : res?.data
      if (data && typeof data === 'object') {
        settingsStorage.setOrganization(data)
        return data
      }
      throw new Error('Invalid organization data')
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const cached = settingsStorage.getOrganization()
        return cached || { formData: {}, teamMembers: [] }
      }
      const cached = settingsStorage.getOrganization()
      if (cached) return cached
      throw err
    }
  },

  async updateOrganization(data) {
    try {
      const res = await borrowerApi.updateOrganization(data)
      const updated = res?.data?.data !== undefined ? res.data.data : res?.data
      settingsStorage.setOrganization(updated)
      return updated
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        settingsStorage.setOrganization(data)
        return data
      }
      throw err
    }
  },

  async inviteTeamMember(memberData) {
    try {
      const res = await borrowerApi.inviteTeamMember(memberData)
      const member = res?.data?.data !== undefined ? res.data.data : res?.data
      
      // Update local organization data
      const org = settingsStorage.getOrganization() || { teamMembers: [] }
      const updated = {
        ...org,
        teamMembers: [...(org.teamMembers || []), member]
      }
      settingsStorage.setOrganization(updated)
      return member
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        // Add locally for offline-first
        const org = settingsStorage.getOrganization() || { teamMembers: [] }
        const member = { ...memberData, id: Date.now(), status: 'Pending' }
        const updated = {
          ...org,
          teamMembers: [...(org.teamMembers || []), member]
        }
        settingsStorage.setOrganization(updated)
        return member
      }
      throw err
    }
  },

  async updateTeamMember(memberId, data) {
    try {
      const res = await borrowerApi.updateTeamMember(memberId, data)
      const updated = res?.data?.data !== undefined ? res.data.data : res?.data
      
      const org = settingsStorage.getOrganization() || { teamMembers: [] }
      const updatedMembers = org.teamMembers.map(m => 
        m.id === memberId ? { ...m, ...updated } : m
      )
      settingsStorage.setOrganization({ ...org, teamMembers: updatedMembers })
      return updated
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const org = settingsStorage.getOrganization() || { teamMembers: [] }
        const updatedMembers = org.teamMembers.map(m => 
          m.id === memberId ? { ...m, ...data } : m
        )
        settingsStorage.setOrganization({ ...org, teamMembers: updatedMembers })
        return { id: memberId, ...data }
      }
      throw err
    }
  },

  async removeTeamMember(memberId) {
    try {
      await borrowerApi.removeTeamMember(memberId)
      
      const org = settingsStorage.getOrganization() || { teamMembers: [] }
      const updatedMembers = org.teamMembers.filter(m => m.id !== memberId)
      settingsStorage.setOrganization({ ...org, teamMembers: updatedMembers })
      return true
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
        const org = settingsStorage.getOrganization() || { teamMembers: [] }
        const updatedMembers = org.teamMembers.filter(m => m.id !== memberId)
        settingsStorage.setOrganization({ ...org, teamMembers: updatedMembers })
        return true
      }
      throw err
    }
  },
}
