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
  getAuctions: () => wrap(api.get("/api/v1/auctions")),
  startAuction: (id) => wrap(api.post(`/api/v1/auctions/${id}/start`)),
  getAuctionById: (id) => wrap(api.get(`/api/v1/auctions/${id}`)),
  getActiveAuctions: () => wrap(api.get("/api/v1/auctions/active")),
  placeBid: (auctionId, amount) =>
    wrap(api.post("/api/v1/bids/place", { auction_id: auctionId, amount })),
  getBidHistory: (auctionId) => wrap(api.get(`/api/v1/bids/auction/${auctionId}`)),
  getBidsByCase: (caseId) => wrap(api.get(`/api/v1/bids/by-case/${caseId}`)),
  getAuctionsByCase: (caseId) => wrap(api.get(`/api/v1/auctions/by-case/${caseId}`)),
  approveBid: (bidId) => wrap(api.post(`/api/v1/bids/approve/${bidId}`)),
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
  getInvestorDocuments: () => wrap(api.get("/api/v1/documents/my")),
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
  testIntegration: (id) =>
    wrap(api.post(`/api/v1/admin/extra/integrations/${id}/test`)),
  updateIntegration: (id, payload) =>
    wrap(api.put(`/api/v1/admin/extra/integrations/${id}`, payload)),
};

// ─── Cases Service ────────────────────────────────────────────────────────────

export const casesService = {
  getCases: () => wrap(api.get("/api/v1/cases/")),
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
  uploadCaseImage: (caseId, file) => {
    const form = new FormData()
    form.append("file", file)
    return wrap(api.post(`/api/v1/cases/${caseId}/images`, form))
  },
  getCaseImages: (caseId) => wrap(api.get(`/api/v1/cases/${caseId}/images`)),
};

export const caseService = casesService;

// ─── Lawyer Service ───────────────────────────────────────────────────────────

export const lawyerService = {
  getMyAssignedCases: () => wrap(api.get("/api/v1/cases/assigned-to-me")),
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
};

// ─── Document Service ─────────────────────────────────────────────────────────

export const documentService = {
  getAllDocuments: () => wrap(api.get("/api/v1/documents")),
  getDocuments: (caseId) => wrap(api.get(`/api/v1/documents/case/${caseId}`)),
  uploadDocument: (caseId, formData) =>
    wrap(api.post(`/api/v1/documents/upload`, formData)),
  deleteDocument: (docId) => wrap(api.delete(`/api/v1/documents/${docId}`)),
  getDocumentUrl: (docId) => wrap(api.get(`/api/v1/documents/${docId}/download`)),
};

// ─── Admin Users Service ──────────────────────────────────────────────────────

export const adminUsersService = {
  getUsers: (params) => wrap(api.get("/api/v1/identity/users", { params })),
  getUserById: (id) => wrap(api.get(`/api/v1/identity/users/${id}`)),
  getUsersByRole: (role) => wrap(api.get("/api/v1/identity/users", { params: { role } })),
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
