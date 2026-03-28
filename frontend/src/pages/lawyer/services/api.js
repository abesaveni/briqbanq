/**
 * Lawyer panel API layer. Backend-ready; replace with real HTTP/WebSocket.
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const getCases = () => api.get('/api/lawyer/cases')
export const updateCaseStatus = (id, status) => api.patch(`/api/lawyer/cases/${id}`, { status })
export const getTasks = () => api.get('/api/lawyer/tasks')
export const getNotifications = () => api.get('/api/lawyer/notifications')
export const markNotificationRead = (id) => api.patch(`/api/lawyer/notifications/${id}/read`)
export const getProfile = () => api.get('/api/lawyer/profile')
export const updateProfile = (data) => api.put('/api/lawyer/profile', data)

export const createWebSocket = (path) => {
  const WS_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
  return new WebSocket(`${WS_URL}${path}`)
}

export default api
