/**
 * Lawyer panel API layer — real backend integration.
 * All functions call the backend via the shared axios instance.
 */

import api from '../../services/api'

const wrap = async (call) => {
  try {
    const res = await call
    return { data: res?.data?.data ?? res?.data ?? res, error: null }
  } catch (err) {
    return { data: null, error: err?.response?.data?.message || err?.message || 'Request failed' }
  }
}

export async function getCurrentUser() {
  return wrap(api.get('/api/v1/identity/me'))
}

export async function getDashboardData() {
  // Fetch assigned cases to build real dashboard stats
  const res = await wrap(api.get('/api/v1/cases/assigned-to-me'))
  const cases = Array.isArray(res.data) ? res.data : (res.data?.items || [])
  const total = cases.length
  const active = cases.filter(c => ['UNDER_REVIEW', 'APPROVED', 'LISTED', 'AUCTION'].includes(c.status)).length
  const pending = cases.filter(c => ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status)).length
  const completed = cases.filter(c => c.status === 'CLOSED').length
  return {
    data: {
      stats: { total, active, pending, completed },
      recentCases: cases.slice(0, 5),
    },
    error: res.error,
  }
}

export async function getCases(params = {}) {
  return wrap(api.get('/api/v1/cases/assigned-to-me'))
}

export async function getContracts() {
  return wrap(api.get('/api/v1/contracts'))
}

export async function createContract(payload) {
  return wrap(api.post('/api/v1/contracts', payload))
}

export async function getTasks(params = {}) {
  return wrap(api.get('/api/v1/tasks', { params }))
}

export async function createTask(payload) {
  return wrap(api.post('/api/v1/tasks', payload))
}

export async function getNotifications() {
  return wrap(api.get('/api/v1/notifications'))
}

