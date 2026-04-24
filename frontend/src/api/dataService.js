/**
 * dataService.js — centralised API client for all BrickBanq services.
 * All calls go to the real FastAPI backend at /api/v1/*.
 * The axios instance in services/api.js attaches the JWT token automatically.
 */

import api from "../services/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

const wrap = (promise) =>
  promise
    .then((res) => ({ success: true, data: res.data, message: "OK" }))
    .catch((err) => {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Request failed";
      return { success: false, error: typeof msg === "string" ? msg : JSON.stringify(msg), data: null };
    });

// ─── Auction Service ─────────────────────────────────────────────────────────

export const auctionService = {
  getAuctions: (params) => wrap(api.get("/api/v1/auctions", { params })),
  startAuction: (id) => wrap(api.post(`/api/v1/auctions/${id}/start`)),
  endAuction: (id) => wrap(api.post(`/api/v1/auctions/${id}/end`)),
  closeAuction: (id) => wrap(api.post(`/api/v1/auctions/${id}/close`)),
  cancelAuction: (id) => wrap(api.post(`/api/v1/auctions/${id}/cancel`)),
  pauseAuction: (id) => wrap(api.post(`/api/v1/auctions/${id}/pause`)),
  resumeAuction: (id) => wrap(api.post(`/api/v1/auctions/${id}/resume`)),
  getAuctionById: (id) => wrap(api.get(`/api/v1/auctions/${id}`)),
  getActiveAuctions: () => wrap(api.get("/api/v1/auctions")),
  placeBid: (auctionId, amount) =>
    wrap(api.post("/api/v1/bids/place", { auction_id: auctionId, amount })),
  getBidHistory: (auctionId) => wrap(api.get(`/api/v1/bids/auction/${auctionId}`)),
  getBidsByCase: (caseId) => wrap(api.get(`/api/v1/bids/by-case/${caseId}`)),
  getAuctionsByCase: (caseId) => wrap(api.get(`/api/v1/auctions/by-case/${caseId}`)),
  approveBid: (bidId) => wrap(api.post(`/api/v1/bids/approve/${bidId}`)),
  getMyBids: (page = 1, pageSize = 50) =>
    wrap(api.get("/api/v1/bids/my-bids", { params: { page, page_size: pageSize } })),
  getDocuments: (auctionId) => wrap(api.get(`/api/v1/documents/auction/${auctionId}`)),
};

// ─── Deals Service ────────────────────────────────────────────────────────────

export const dealsService = {
  getDeals: () => wrap(api.get("/api/v1/deals")),
  getDealById: (id) => wrap(api.get(`/api/v1/deals/${id}`)),
  purchaseDeal: (id) => wrap(api.post(`/api/v1/deals/${id}/purchase`)),
  listDeal: (id) => wrap(api.post(`/api/v1/deals/${id}/list`)),
  updateDeal: (id, payload) => wrap(api.put(`/api/v1/deals/${id}`, payload)),
  addDealNote: (id, noteData) => wrap(api.post(`/api/v1/deals/${id}/notes`, noteData)),
  deleteDealNote: (id, noteId) => wrap(api.delete(`/api/v1/deals/${id}/notes/${noteId}`)),
};

// ─── Contract Service ─────────────────────────────────────────────────────────

export const contractService = {
  getContracts: () => wrap(api.get("/api/v1/contracts")),
  getContractById: (id) => wrap(api.get(`/api/v1/contracts/${id}`)),
  signContract: (id, signatureData) =>
    wrap(api.post(`/api/v1/contracts/${id}/sign`, signatureData)),
  uploadContractDocument: (id, formData) =>
    wrap(
      api.post(`/api/v1/contracts/${id}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),
  createContract: (payload) => wrap(api.post("/api/v1/contracts", payload)),
};

// ─── Escrow Service ───────────────────────────────────────────────────────────

export const escrowService = {
  getEscrowInfo: () => wrap(api.get("/api/v1/escrows")),
  getEscrowTransactions: () => wrap(api.get("/api/v1/escrows/transactions")),
  releaseFunds: (escrowId) =>
    wrap(api.post(`/api/v1/escrows/${escrowId}/release`)),
  refundEscrow: (escrowId) =>
    wrap(api.post(`/api/v1/escrows/${escrowId}/refund`)),
};

// ─── User / Profile Service ───────────────────────────────────────────────────

export const userService = {
  getUserProfile: () => wrap(api.get("/api/v1/identity/me")),
  updateUserProfile: (payload) => wrap(api.put("/api/v1/identity/me", payload)),
  getUserSettings: () => wrap(api.get("/api/v1/admin/extra/settings")),
  updateUserSettings: (settingsType, payload) =>
    wrap(api.put(`/api/v1/admin/extra/settings/${settingsType}`, payload)),
  getInvestorDocuments: () => wrap(api.get("/api/v1/documents/my-documents")),
};

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  updateProfile: (payload) => wrap(api.put("/api/v1/identity/me", payload)),
  changePassword: (payload) =>
    wrap(api.put("/api/v1/identity/me/password", payload)),
  enable2FA: () => wrap(api.post("/api/v1/admin/extra/2fa/enable")),
  disable2FA: () => wrap(api.post("/api/v1/admin/extra/2fa/disable")),
  getActiveSessions: () => wrap(api.get("/api/v1/admin/extra/sessions")),
  logoutSession: (sessionId) =>
    wrap(api.delete(`/api/v1/admin/extra/sessions/${sessionId}`)),
  logoutAllOtherSessions: () =>
    wrap(api.delete("/api/v1/admin/extra/sessions/logout-others")),
};

// ─── Notification Service ─────────────────────────────────────────────────────

export const notificationService = {
  getNotifications: () => wrap(api.get("/api/v1/notifications")),
  getUnreadCount: () => wrap(api.get("/api/v1/notifications/unread-count")),
  getPreferences: () => wrap(api.get("/api/v1/admin/extra/notification-preferences")),
  updatePreferences: (payload) =>
    wrap(api.put("/api/v1/admin/extra/notification-preferences", payload)),
  markAsRead: (id) => wrap(api.post(`/api/v1/notifications/${id}/read`)),
  markAllAsRead: () => wrap(api.post("/api/v1/notifications/read-all")),
  deleteNotification: (id) => wrap(api.delete(`/api/v1/notifications/${id}`)),
  deleteAllNotifications: () => wrap(api.delete("/api/v1/notifications")),
};

// ─── Form Builder Service ─────────────────────────────────────────────────────

export const formService = {
  getForms: () => wrap(api.get("/api/v1/admin/extra/forms")),
  getFormFields: (formId) => wrap(api.get(`/api/v1/admin/extra/forms/${formId}/fields`)),
  addField: (formId, fieldData) =>
    wrap(api.post(`/api/v1/admin/extra/forms/${formId}/fields`, fieldData)),
  updateField: (formId, fieldId, payload) =>
    wrap(api.patch(`/api/v1/admin/extra/forms/${formId}/fields/${fieldId}`, payload)),
  deleteField: (formId, fieldId) =>
    wrap(api.delete(`/api/v1/admin/extra/forms/${formId}/fields/${fieldId}`)),
};

// ─── Integration Service ──────────────────────────────────────────────────────

export const integrationService = {
  getIntegrations: () => wrap(api.get("/api/v1/admin/extra/integrations")),
  createIntegration: (payload) => wrap(api.post("/api/v1/admin/extra/integrations", payload)),
  testIntegration: (id) =>
    wrap(api.post(`/api/v1/admin/extra/integrations/${id}/test`)),
  updateIntegration: (id, payload) =>
    wrap(api.put(`/api/v1/admin/extra/integrations/${id}`, payload)),
};

// ─── Cases Service ────────────────────────────────────────────────────────────

export const casesService = {
  getCases: () => wrap(api.get("/api/v1/cases/", { params: { page: 1, page_size: 500 } })),
  getMyCases: () => wrap(api.get("/api/v1/cases/my-cases")),
  getCaseById: (caseId) => wrap(api.get(`/api/v1/cases/${caseId}`)),
  createCase: (payload) => wrap(api.post("/api/v1/cases/", payload)),
  submitCase: (payload) => wrap(api.post("/api/v1/cases/", payload)),
  submitCaseActual: (caseId) => wrap(api.post(`/api/v1/cases/${caseId}/submit`)),
  updateCase: (caseId, payload) => wrap(api.put(`/api/v1/cases/${caseId}`, payload)),
  adminUpdateCase: (caseId, payload) => wrap(api.put(`/api/v1/cases/${caseId}/admin-update`, payload)),
  updateCaseStatus: (caseId, newStatus) =>
    wrap(api.put(`/api/v1/cases/${caseId}/status`, { status: newStatus })),
  updateCaseMetadata: (caseId, metadata) =>
    wrap(api.patch(`/api/v1/cases/${caseId}/metadata`, { metadata })),
  startCaseReview: (caseId) => wrap(api.post(`/api/v1/cases/${caseId}/review`)),
  saveLawyerChecklist: (caseId, checklist, notes) =>
    wrap(api.patch(`/api/v1/cases/${caseId}/metadata`, {
      metadata: { lawyer_review: { checklist, notes: notes || "", updated_at: new Date().toISOString() } },
    })),
  completeLawyerReview: (caseId) =>
    wrap(api.patch(`/api/v1/cases/${caseId}/metadata`, {
      metadata: { lawyer_review: { submitted_to_admin: true, submitted_at: new Date().toISOString() } },
    })),
  approveCase: (caseId) => wrap(api.post(`/api/v1/cases/${caseId}/approve`)),
  rejectCase: (caseId, reason) =>
    wrap(api.post(`/api/v1/cases/${caseId}/reject`, { rejection_reason: reason })),
  listCaseForAuction: (caseId) => wrap(api.post(`/api/v1/cases/${caseId}/list`)),
  assignParticipants: (caseId, payload) =>
    wrap(api.post(`/api/v1/cases/${caseId}/assign`, payload)),
  getReviewQueue: () => wrap(api.get("/api/v1/cases/review-queue")),
  getLiveListings: () => wrap(api.get("/api/v1/cases/live")),
  exportCaseReport: async (caseId) => {
    const res = await api.get(`/api/v1/cases/${caseId}/export`, {
      responseType: "blob",
    });
    return res.data;
  },
  deleteCase: (caseId) => wrap(api.delete(`/api/v1/cases/${caseId}`)),
  moveToAuction: (caseId, payload) =>
    wrap(api.post(`/api/v1/cases/${caseId}/move-to-auction`, payload)),
  uploadCaseImage: (caseId, file) => {
    const form = new FormData()
    form.append("file", file)
    return wrap(api.post(`/api/v1/cases/${caseId}/images`, form))
  },
  getCaseImages: (caseId) => wrap(api.get(`/api/v1/cases/${caseId}/images`)),

  // Extended case endpoints (securities, parties, metrics, notes, history)
  getSecurities: (caseId) => wrap(api.get(`/api/v1/cases/${caseId}/securities`)),
  addSecurity: (caseId, payload) => wrap(api.post(`/api/v1/cases/${caseId}/securities`, payload)),
  updateSecurity: (caseId, secId, payload) => wrap(api.put(`/api/v1/cases/${caseId}/securities/${secId}`, payload)),
  deleteSecurity: (caseId, secId) => wrap(api.delete(`/api/v1/cases/${caseId}/securities/${secId}`)),

  getParties: (caseId) => wrap(api.get(`/api/v1/cases/${caseId}/parties`)),
  addParty: (caseId, payload) => wrap(api.post(`/api/v1/cases/${caseId}/parties`, payload)),
  updateParty: (caseId, partyId, payload) => wrap(api.put(`/api/v1/cases/${caseId}/parties/${partyId}`, payload)),
  deleteParty: (caseId, partyId) => wrap(api.delete(`/api/v1/cases/${caseId}/parties/${partyId}`)),

  getLoanMetrics: (caseId) => wrap(api.get(`/api/v1/cases/${caseId}/loan-metrics`)),
  saveLoanMetrics: (caseId, payload) => wrap(api.put(`/api/v1/cases/${caseId}/loan-metrics`, payload)),

  getAuctionMetrics: (caseId) => wrap(api.get(`/api/v1/cases/${caseId}/auction-metrics`)),
  saveAuctionMetrics: (caseId, payload) => wrap(api.put(`/api/v1/cases/${caseId}/auction-metrics`, payload)),

  getInternalNotes: (caseId) => wrap(api.get(`/api/v1/cases/${caseId}/internal-notes`)),
  addInternalNote: (caseId, payload) => wrap(api.post(`/api/v1/cases/${caseId}/internal-notes`, payload)),
  deleteInternalNote: (caseId, noteId) => wrap(api.delete(`/api/v1/cases/${caseId}/internal-notes/${noteId}`)),

  getStatusHistory: (caseId) => wrap(api.get(`/api/v1/cases/${caseId}/status-history`)),

  saveDraft: (caseId, payload) => wrap(api.patch(`/api/v1/cases/${caseId}/draft`, payload)),
  archiveCase: (caseId) => wrap(api.post(`/api/v1/cases/${caseId}/archive`)),
  unarchiveCase: (caseId) => wrap(api.post(`/api/v1/cases/${caseId}/unarchive`)),
};

export const caseService = casesService;

// ─── Lawyer Service ───────────────────────────────────────────────────────────

export const lawyerService = {
  getMyAssignedCases: () => wrap(api.get("/api/v1/cases/assigned-to-me")),
  getMyCases: () => wrap(api.get("/api/v1/cases/my-cases")),
  getDashboard: () => wrap(api.get("/api/v1/lawyer/dashboard")),
};

// ─── Communication Service ────────────────────────────────────────────────────

export const communicationService = {
  getTemplates: () => wrap(api.get("/api/v1/communications/templates")),
  createTemplate: (data) => wrap(api.post("/api/v1/communications/templates", data)),
  deleteTemplate: (id) => wrap(api.delete(`/api/v1/communications/templates/${id}`)),

  getCampaigns: () => wrap(api.get("/api/v1/communications/campaigns")),
  createCampaign: (data) => wrap(api.post("/api/v1/communications/campaigns", data)),
  deleteCampaign: (id) => wrap(api.delete(`/api/v1/communications/campaigns/${id}`)),

  getSegments: () => wrap(api.get("/api/v1/communications/segments")),
  createSegment: (data) => wrap(api.post("/api/v1/communications/segments", data)),
  deleteSegment: (id) => wrap(api.delete(`/api/v1/communications/segments/${id}`)),

  getAnalytics: () => wrap(api.get("/api/v1/communications/analytics")),
};

// ─── Activity Service ─────────────────────────────────────────────────────────

export const activityService = {
  getRecentActivity: () => wrap(api.get("/api/v1/admin/extra/activity")),
  logActivity: (activity) => wrap(api.post("/api/v1/admin/extra/activity", activity)),
};

// ─── Organization Service ─────────────────────────────────────────────────────

export const organizationService = {
  getOrganization: () => wrap(api.get("/api/v1/admin/extra/organization")),
  updateOrganization: (payload) =>
    wrap(api.put("/api/v1/admin/extra/organization", payload)),
  getTeamMembers: () => wrap(api.get("/api/v1/admin/extra/organization/team")),
  inviteTeamMember: (payload) =>
    wrap(api.post("/api/v1/admin/extra/organization/team/invite", payload)),
  removeTeamMember: (memberId) =>
    wrap(api.delete(`/api/v1/admin/extra/organization/team/${memberId}`)),
  getBillingInfo: () => wrap(api.get("/api/v1/admin/extra/organization/billing")),
};

// ─── Task Service ─────────────────────────────────────────────────────────────

export const taskService = {
  getTasks: () => wrap(api.get("/api/v1/tasks")),
  getSummaryStats: () => wrap(api.get("/api/v1/tasks/summary")),
  createTask: (payload) => wrap(api.post("/api/v1/tasks", payload)),
  updateTask: (id, payload) => wrap(api.patch(`/api/v1/tasks/${id}`, payload)),
  deleteTask: (id) => wrap(api.delete(`/api/v1/tasks/${id}`)),
};

// ─── Analytics Service ────────────────────────────────────────────────────────

export const analyticsService = {
  getDashboardStats: (params) => wrap(api.get("/api/v1/admin/dashboard", { params })),
  getPlatformStats: (params) => wrap(api.get("/api/v1/admin/platform-stats", { params })),
  getCaseStats: (params) => wrap(api.get("/api/v1/admin/extra/analytics/cases", { params })),
  getAuctionStats: (params) => wrap(api.get("/api/v1/admin/extra/analytics/auctions", { params })),
  getRevenueStats: (params) => wrap(api.get("/api/v1/admin/extra/analytics/revenue", { params })),
};

// ─── KYC Service ─────────────────────────────────────────────────────────────

export const kycService = {
  getKYCQueue: () => wrap(api.get("/api/v1/kyc/queue")),
  getMyKYC: () => wrap(api.get("/api/v1/kyc/my-kyc")),
  getKYCById: (id) => wrap(api.get(`/api/v1/kyc/${id}`)),
  approveKYC: (id) => wrap(api.post(`/api/v1/kyc/${id}/approve`)),
  rejectKYC: (id, reason) =>
    wrap(api.post(`/api/v1/kyc/${id}/reject`, { rejection_reason: reason || "" })),
  submitKYC: (payload) => wrap(api.post("/api/v1/kyc/submit", payload)),
  submitKYCForm: (formData) =>
    wrap(api.post("/api/v1/kyc/submit-form", formData)),
  updateKYCRisk: (id, riskLevel) =>
    wrap(api.patch(`/api/v1/kyc/${id}/risk`, { risk_level: riskLevel })),
};

// ─── Document Service ─────────────────────────────────────────────────────────

export const documentService = {
  getAllDocuments: (params = {}) => wrap(api.get("/api/v1/documents", { params })),
  getDocuments: (caseId) => wrap(api.get(`/api/v1/documents/case/${caseId}`)),
  uploadDocument: (_caseId, formData) =>
    wrap(api.post(`/api/v1/documents/upload`, formData)),
  deleteDocument: (docId) => wrap(api.delete(`/api/v1/documents/${docId}`)),
  getDocumentUrl: (docId) => wrap(api.get(`/api/v1/documents/${docId}/download`)),
  approveDocument: (docId) => wrap(api.post(`/api/v1/documents/${docId}/approve`)),
  rejectDocument: (docId, reason) =>
    wrap(api.post(`/api/v1/documents/${docId}/reject`, { rejection_reason: reason || "" })),
};

// ─── Admin Users Service ──────────────────────────────────────────────────────

export const adminUsersService = {
  getUsers: (params) => wrap(api.get("/api/v1/identity/users", { params })),
  getUserById: (id) => wrap(api.get(`/api/v1/identity/users/${id}`)),
  getUsersByRole: (role) => wrap(api.get("/api/v1/identity/users", { params: { role } })),
  createUser: (data) => {
    const parts = (data.full_name || '').trim().split(/\s+/)
    const first_name = parts[0] || ''
    const last_name = parts.slice(1).join(' ') || ''
    return wrap(api.post("/api/v1/identity/register", {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      first_name,
      last_name,
      requested_roles: [(data.role || 'BORROWER').toUpperCase()],
    }))
  },
  suspendUser: (id) => wrap(api.post(`/api/v1/identity/users/${id}/suspend`)),
  reactivateUser: (id) => wrap(api.post(`/api/v1/identity/users/${id}/reactivate`)),
  getPendingRoles: () => wrap(api.get("/api/v1/roles/pending")),
  approveRole: (id) => wrap(api.post(`/api/v1/roles/${id}/approve`)),
  rejectRole: (id) => wrap(api.post(`/api/v1/roles/${id}/reject`)),
};

// ─── Wallet Service ───────────────────────────────────────────────────────────

export const walletService = {
  getWallet: () => wrap(api.get("/api/v1/wallet")),
  getTransactions: () => wrap(api.get("/api/v1/wallet/transactions")),
  deposit: (amount) => wrap(api.post("/api/v1/wallet/deposit", { amount })),
  withdraw: (amount) => wrap(api.post("/api/v1/wallet/withdraw", { amount })),
};

// ─── Settlement Service ───────────────────────────────────────────────────────

export const settlementService = {
  getSettlement: (caseId) => wrap(api.get(`/api/v1/settlement/case/${caseId}`)),
  saveChecklist: (caseId, checklist) =>
    wrap(api.patch(`/api/v1/settlement/case/${caseId}/checklist`, { checklist })),
  updateTask: (caseId, taskId, data) =>
    wrap(api.patch(`/api/v1/settlement/case/${caseId}/tasks/${taskId}`, data)),
  archiveTask: (caseId, taskId) =>
    wrap(api.delete(`/api/v1/settlement/case/${caseId}/tasks/${taskId}`)),
  escalateTask: (caseId, taskId, reason) =>
    wrap(api.post(`/api/v1/settlement/case/${caseId}/tasks/${taskId}/escalate`, { reason })),
  updateSettlementBreakdown: (settlementId, breakdown) =>
    wrap(api.patch(`/api/v1/settlements/${settlementId}/breakdown`, { breakdown })),
  markReadyForSettlement: (caseId) =>
    wrap(api.post(`/api/v1/settlement/case/${caseId}/ready`)),
};

// ─── Investor Service ─────────────────────────────────────────────────────────

export const investorService = {
  getDashboard: () => wrap(api.get("/api/v1/investor/analytics/summary")),
  getPortfolio: () => wrap(api.get("/api/v1/investor/portfolio")),
  getActiveInvestments: () => wrap(api.get("/api/v1/investor/analytics/activity")),
  getCharts: () => wrap(api.get("/api/v1/investor/analytics/charts")),
  getMyInvestmentCases: () => wrap(api.get("/api/v1/investor/my-cases")),
};

// ─── Admin Service ────────────────────────────────────────────────────────────

export const adminService = {
  getDashboardStats: () => wrap(api.get("/api/v1/admin/dashboard")),
  getPlatformStats: () => wrap(api.get("/api/v1/admin/platform-stats")),
  getUsers: (params = {}) => wrap(api.get("/api/v1/identity/users", { params })),
  getSettings: () => wrap(api.get("/api/v1/admin/settings")),
  updateSettings: ({ key, value }) => wrap(api.put(`/api/v1/admin/settings/${key}`, { value })),
  getAuditLog: (params = {}) => wrap(api.get("/api/v1/audit", { params })),
};

// ─── Borrower Service ─────────────────────────────────────────────────────────

export const borrowerService = {
  getDashboard: () => wrap(api.get("/api/v1/borrower/dashboard")),
  getMyCase: () => wrap(api.get("/api/v1/borrower/my-case")),
  getTimeline: () => wrap(api.get("/api/v1/borrower/case/timeline")),
  getCaseDocuments: (caseId) => wrap(api.get(`/api/v1/borrower/case/${caseId}/documents`)),
};

// ─── Lender / Loans Service ───────────────────────────────────────────────────

export const lenderService = {
  getDashboard: () => wrap(api.get("/api/v1/loans/dashboard")),
  getPortfolio: () => wrap(api.get("/api/v1/loans/portfolio")),
  getMyCases: () => wrap(api.get("/api/v1/loans/my-cases")),
  getMyAssignedCases: () => wrap(api.get("/api/v1/loans/my-cases")),
};
