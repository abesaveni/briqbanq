import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const WS_URL = import.meta.env.VITE_WS_BASE_URL ?? ''

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

export const createWebSocket = (path) => new WebSocket(`${WS_URL}${path}`)

export const getBorrowerCase = (caseId) => api.get(`/api/v1/borrower/cases/${caseId}`)
export const getBorrowerCaseTimeline = (caseId) => api.get(`/api/v1/borrower/cases/${caseId}/timeline`)
export const getBorrowerDocuments = (caseId) => api.get(`/api/v1/borrower/cases/${caseId}/documents`)
export const uploadBorrowerDocument = (caseId, formData) =>
  api.post(`/api/v1/borrower/cases/${caseId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const submitKYC = (formData) =>
  api.post('/api/v1/borrower/kyc', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getKYCStatus = () => api.get('/api/v1/borrower/kyc/status')

export const getBorrowerContracts = () => api.get('/api/v1/borrower/contracts')
export const createBorrowerContract = (data) => api.post('/api/v1/borrower/contracts', data)

export const getBorrowerTasks = () => api.get('/api/v1/borrower/tasks')
export const createBorrowerTask = (data) => api.post('/api/v1/borrower/tasks', data)
export const updateBorrowerTask = (id, data) => api.patch(`/api/v1/borrower/tasks/${id}`, data)
export const deleteBorrowerTask = (id) => api.delete(`/api/v1/borrower/tasks/${id}`)

export const getAuctionDetails = (auctionId) => api.get(`/api/v1/borrower/auctions/${auctionId}`)

export const getBorrowerProfile = () => api.get('/api/v1/borrower/profile')
export const updateBorrowerProfile = (data) => api.put('/api/v1/borrower/profile', data)
export const uploadProfilePhoto = (formData) =>
  api.post('/api/v1/borrower/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const getEnvelopes = () => api.get('/api/v1/borrower/govsign/envelopes')
export const reviewEnvelope = (envelopeId) => api.get(`/api/v1/borrower/govsign/envelopes/${envelopeId}`)
export const signEnvelope = (envelopeId, data) =>
  api.post(`/api/v1/borrower/govsign/envelopes/${envelopeId}/sign`, data)

// GovSign / E-Signatures — integration-friendly; backend can implement these routes.
// GET /api/v1/borrower/govsign/data should return { stats, tasks, alerts, activity, envelopes, documents, templates, hsmCluster, certificates, evidenceChain, evidenceEvents, adminSovereignty, adminPolicies, adminSecurity } (see borrowerMockData.js MOCK_GOVSIGN_* for shapes).
export const getGovSignData = () => api.get('/api/v1/borrower/govsign/data')
export const getGovSignEnvelopes = (params) => api.get('/api/v1/borrower/govsign/envelopes', { params })
export const createGovSignEnvelope = (data) => api.post('/api/v1/borrower/govsign/envelopes', data)
export const getGovSignEnvelope = (id) => api.get(`/api/v1/borrower/govsign/envelopes/${id}`)
export const downloadGovSignEnvelope = (id) =>
  api.get(`/api/v1/borrower/govsign/envelopes/${id}/download`, { responseType: 'blob' })
export const getGovSignCertificates = () => api.get('/api/v1/borrower/govsign/certificates')
export const issueGovSignCertificate = (data) => api.post('/api/v1/borrower/govsign/certificates', data)
export const renewGovSignCertificate = (id) => api.post(`/api/v1/borrower/govsign/certificates/${id}/renew`)
export const exportGovSignCertificate = (id) =>
  api.get(`/api/v1/borrower/govsign/certificates/${id}/export`, { responseType: 'blob' })
export const getGovSignEvidenceLedger = () => api.get('/api/v1/borrower/govsign/evidence/summary')
export const getGovSignEvidenceEvents = (params) => api.get('/api/v1/borrower/govsign/evidence/events', { params })
export const exportGovSignLedgerProof = () =>
  api.get('/api/v1/borrower/govsign/evidence/export', { responseType: 'blob' })
export const getGovSignAdmin = () => api.get('/api/v1/borrower/govsign/admin')
export const updateGovSignAdminSetting = (id, payload) => api.patch(`/api/v1/borrower/govsign/admin/settings/${id}`, payload)
export const getGovSignDocuments = () => api.get('/api/v1/borrower/govsign/documents')
export const getGovSignTemplates = () => api.get('/api/v1/borrower/govsign/templates')
export const createGovSignTemplate = (data) => api.post('/api/v1/borrower/govsign/templates', data)
export const deleteGovSignTemplate = (id) => api.delete(`/api/v1/borrower/govsign/templates/${id}`)

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
      err.code = 'ERR_NETWORK'
      err.isOffline = true
    }
    return Promise.reject(err)
  }
)

export const borrowerApi = {
  getDashboardStats: () => api.get('/api/v1/borrower/dashboard/stats'),
  getNextActions: () => api.get('/api/v1/borrower/dashboard/actions'),
  getCaseTimeline: () => api.get('/api/v1/borrower/case/timeline'),

  getCases: () => api.get('/api/v1/borrower/cases'),
  getCaseDetails: (caseId) => api.get(`/api/v1/borrower/case/${caseId}`),
  getCaseSummary: (caseId) => api.get(`/api/v1/borrower/case/${caseId}/summary`),
  getFinancialOverview: (caseId) => api.get(`/api/v1/borrower/case/${caseId}/financial`),

  /** Export case report (PDF or JSON). Backend: GET /api/v1/borrower/case/:caseId/export returns blob. */
  exportCaseReport: (caseId, format = 'json') =>
    api.get(`/api/v1/borrower/case/${caseId}/export`, { params: { format }, responseType: 'blob' }),
  /** Update case details. Backend: PATCH /api/v1/borrower/case/:caseId */
  updateCase: (caseId, data) => api.patch(`/api/v1/borrower/case/${caseId}`, data),
  /** Get bids for a case. Backend: GET /api/v1/borrower/case/:caseId/bids */
  getCaseBids: (caseId) => api.get(`/api/v1/borrower/case/${caseId}/bids`),
  /** Send a case message. Backend: POST /api/v1/borrower/case/:caseId/messages */
  sendCaseMessage: (caseId, data) => api.post(`/api/v1/borrower/case/${caseId}/messages`, data),
  /** Get case messages. Backend: GET /api/v1/borrower/case/:caseId/messages */
  getCaseMessages: (caseId) => api.get(`/api/v1/borrower/case/${caseId}/messages`),
  /** Update settlement task. Backend: PATCH /api/v1/borrower/case/:caseId/settlement/tasks/:taskId */
  updateSettlementTask: (caseId, taskId, data) =>
    api.patch(`/api/v1/borrower/case/${caseId}/settlement/tasks/${taskId}`, data),
  /** Upload case document. Backend: POST /api/v1/borrower/case/:caseId/documents */
  uploadCaseDocument: (caseId, formData) =>
    api.post(`/api/v1/borrower/case/${caseId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  /** Get case documents list. Backend: GET /api/v1/borrower/case/:caseId/documents */
  getCaseDocuments: (caseId) => api.get(`/api/v1/borrower/case/${caseId}/documents`),
  /** Lawyer review: reject case. Backend: POST /api/v1/borrower/case/:caseId/reject */
  rejectCase: (caseId, data) => api.post(`/api/v1/borrower/case/${caseId}/reject`, data || {}),
  /** Lawyer review: approve case. Backend: POST /api/v1/borrower/case/:caseId/approve */
  approveCase: (caseId, data) => api.post(`/api/v1/borrower/case/${caseId}/approve`, data || {}),

  // Investment Memorandum
  getInvestmentMemo: (caseId) => api.get(`/api/v1/borrower/case/${caseId}/investment-memo`),
  updateInvestmentMemo: (caseId, data) => api.put(`/api/v1/borrower/case/${caseId}/investment-memo`, data),
  generateInvestmentMemoPdf: (caseId) =>
    api.post(`/api/v1/borrower/case/${caseId}/investment-memo/pdf`, {}, { responseType: 'blob' }),
  emailInvestmentMemo: (caseId, recipients) =>
    api.post(`/api/v1/borrower/case/${caseId}/investment-memo/email`, { recipients }),

  getContracts: () => api.get('/api/v1/borrower/contracts'),
  getContractDetails: (contractId) => api.get(`/api/v1/borrower/contracts/${contractId}`),
  downloadContract: (contractId) =>
    api.get(`/api/v1/borrower/contracts/${contractId}/download`, { responseType: 'blob' }),

  submitKYC: (formData) => api.post('/api/v1/borrower/kyc/submit', formData),
  uploadDocument: (file) => {
    const data = new FormData()
    data.append('file', file)
    return api.post('/api/v1/borrower/kyc/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  getNotifications: (filters) => api.get('/api/v1/notifications/', { params: filters }),
  markAsRead: (notificationId) => api.post(`/api/v1/notifications/${notificationId}/read`),
  deleteNotification: (notificationId) => api.delete(`/api/v1/notifications/${notificationId}`),
  markAllAsRead: () => api.post('/api/v1/notifications/read-all'),

  getProfile: () => api.get('/api/v1/borrower/profile'),
  updateProfile: (data) => api.patch('/api/v1/borrower/profile', data),
  uploadProfilePhoto: (file) => {
    const formData = new FormData()
    formData.append('photo', file)
    return api.post('/api/v1/borrower/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Organization Settings
  getOrganization: () => api.get('/api/v1/borrower/organization'),
  updateOrganization: (data) => api.patch('/api/v1/borrower/organization', data),
  inviteTeamMember: (data) => api.post('/api/v1/borrower/organization/team/invite', data),
  updateTeamMember: (memberId, data) => api.patch(`/api/v1/borrower/organization/team/${memberId}`, data),
  removeTeamMember: (memberId) => api.delete(`/api/v1/borrower/organization/team/${memberId}`),

  // Security Settings
  getSecuritySettings: () => api.get('/api/v1/borrower/security'),
  updateSecuritySettings: (data) => api.patch('/api/v1/borrower/security', data),
  changePassword: (data) => api.post('/api/v1/borrower/security/change-password', data),
  toggleTwoFactor: (enabled) => api.patch('/api/v1/borrower/security/two-factor', { enabled }),
  getActiveSessions: () => api.get('/api/v1/borrower/security/sessions'),
  revokeSession: (sessionId) => api.delete(`/api/v1/borrower/security/sessions/${sessionId}`),
  revokeAllOtherSessions: () => api.post('/api/v1/borrower/security/sessions/revoke-all'),

  // Notification Settings
  getNotificationPreferences: () => api.get('/api/v1/borrower/notifications/preferences'),
  updateNotificationPreferences: (data) => api.patch('/api/v1/borrower/notifications/preferences', data),

  // User Management
  getUsers: () => api.get('/api/v1/borrower/users'),
  createUser: (data) => api.post('/api/v1/borrower/users', data),
  updateUser: (userId, data) => api.patch(`/api/v1/borrower/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/api/v1/borrower/users/${userId}`),
  getUserDetails: (userId) => api.get(`/api/v1/borrower/users/${userId}`),

  // Module Settings
  getModuleSettings: () => api.get('/api/v1/borrower/module-settings'),
  updateModuleSettings: (data) => api.patch('/api/v1/borrower/module-settings', data),

  // Access Control
  getRoles: () => api.get('/api/v1/borrower/roles'),
  createRole: (data) => api.post('/api/v1/borrower/roles', data),
  updateRole: (roleId, data) => api.patch(`/api/v1/borrower/roles/${roleId}`, data),
  deleteRole: (roleId) => api.delete(`/api/v1/borrower/roles/${roleId}`),
  getRoleDetails: (roleId) => api.get(`/api/v1/borrower/roles/${roleId}`),

  // Integrations
  getIntegrations: () => api.get('/api/v1/borrower/integrations'),
  connectIntegration: (integrationId) => api.post(`/api/v1/borrower/integrations/${integrationId}/connect`),
  disconnectIntegration: (integrationId) => api.delete(`/api/v1/borrower/integrations/${integrationId}/disconnect`),

  // GovSign / E-Signatures
  getGovSignData: () => api.get('/api/v1/borrower/govsign/data'),
  getGovSignEnvelopes: (params) => api.get('/api/v1/borrower/govsign/envelopes', { params }),
  createGovSignEnvelope: (data) => api.post('/api/v1/borrower/govsign/envelopes', data),
  getGovSignEnvelope: (id) => api.get(`/api/v1/borrower/govsign/envelopes/${id}`),
  downloadGovSignEnvelope: (id) => api.get(`/api/v1/borrower/govsign/envelopes/${id}/download`, { responseType: 'blob' }),
  getGovSignCertificates: () => api.get('/api/v1/borrower/govsign/certificates'),
  issueGovSignCertificate: (data) => api.post('/api/v1/borrower/govsign/certificates', data),
  renewGovSignCertificate: (id) => api.post(`/api/v1/borrower/govsign/certificates/${id}/renew`),
  exportGovSignCertificate: (id) => api.get(`/api/v1/borrower/govsign/certificates/${id}/export`, { responseType: 'blob' }),
  getGovSignEvidenceLedger: () => api.get('/api/v1/borrower/govsign/evidence/summary'),
  getGovSignEvidenceEvents: (params) => api.get('/api/v1/borrower/govsign/evidence/events', { params }),
  exportGovSignLedgerProof: () => api.get('/api/v1/borrower/govsign/evidence/export', { responseType: 'blob' }),
  getGovSignAdmin: () => api.get('/api/v1/borrower/govsign/admin'),
  updateGovSignAdminSetting: (id, payload) => api.patch(`/api/v1/borrower/govsign/admin/settings/${id}`, payload),
  getGovSignDocuments: () => api.get('/api/v1/borrower/govsign/documents'),
  getGovSignTemplates: () => api.get('/api/v1/borrower/govsign/templates'),
  createGovSignTemplate: (data) => api.post('/api/v1/borrower/govsign/templates', data),
  deleteGovSignTemplate: (id) => api.delete(`/api/v1/borrower/govsign/templates/${id}`),
}

export default api
