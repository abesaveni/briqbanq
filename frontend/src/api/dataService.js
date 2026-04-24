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

// ─── In-memory GET cache (45 s default TTL) ──────────────────────────────────
// Eliminates redundant round-trips when the user navigates between pages.
// Mutations must call invalidateCache() with the relevant key prefix.

const _cache = new Map();
const _TTL = 45_000;

const wrapCached = (key, promiseFn, ttl = _TTL) => {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < ttl) return Promise.resolve(hit.value);
  return promiseFn()
    .then((res) => {
      const result = { success: true, data: res.data, message: "OK" };
      _cache.set(key, { value: result, ts: Date.now() });
      return result;
    })
    .catch((err) => {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Request failed";
      return { success: false, error: typeof msg === "string" ? msg : JSON.stringify(msg), data: null };
    });
};

export const invalidateCache = (...prefixes) => {
  for (const key of _cache.keys()) {
    if (prefixes.some((p) => key.startsWith(p))) _cache.delete(key);
  }
};

// ─── Auction Service ─────────────────────────────────────────────────────────

export const auctionService = {
  getAuctions: (params) => wrapCached(`auctions:list:${JSON.stringify(params||{})}`, () => api.get("/api/v1/auctions", { params })),
  startAuction: (id) => { invalidateCache("auctions:"); return wrap(api.post(`/api/v1/auctions/${id}/start`)); },
  endAuction: (id) => { invalidateCache("auctions:"); return wrap(api.post(`/api/v1/auctions/${id}/end`)); },
  closeAuction: (id) => { invalidateCache("auctions:"); return wrap(api.post(`/api/v1/auctions/${id}/close`)); },
  cancelAuction: (id) => { invalidateCache("auctions:"); return wrap(api.post(`/api/v1/auctions/${id}/cancel`)); },
  pauseAuction: (id) => { invalidateCache("auctions:"); return wrap(api.post(`/api/v1/auctions/${id}/pause`)); },
  resumeAuction: (id) => { invalidateCache("auctions:"); return wrap(api.post(`/api/v1/auctions/${id}/resume`)); },
  getAuctionById: (id) => wrapCached(`auctions:${id}`, () => api.get(`/api/v1/auctions/${id}`)),
  getActiveAuctions: () => wrapCached("auctions:active", () => api.get("/api/v1/auctions")),
  placeBid: (auctionId, amount) =>
    wrap(api.post("/api/v1/bids/place", { auction_id: auctionId, amount })),
  getBidHistory: (auctionId) => wrapCached(`bids:auction:${auctionId}`, () => api.get(`/api/v1/bids/auction/${auctionId}`)),
  getBidsByCase: (caseId) => wrapCached(`bids:case:${caseId}`, () => api.get(`/api/v1/bids/by-case/${caseId}`)),
  getAuctionsByCase: (caseId) => wrapCached(`auctions:case:${caseId}`, () => api.get(`/api/v1/auctions/by-case/${caseId}`)),
  approveBid: (bidId) => wrap(api.post(`/api/v1/bids/approve/${bidId}`)),
  getMyBids: (page = 1, pageSize = 50) =>
    wrapCached(`bids:my:${page}:${pageSize}`, () => api.get("/api/v1/bids/my-bids", { params: { page, page_size: pageSize } })),
  getDocuments: (auctionId) => wrapCached(`auctions:docs:${auctionId}`, () => api.get(`/api/v1/documents/auction/${auctionId}`)),
};

// ─── Deals Service ────────────────────────────────────────────────────────────

export const dealsService = {
  getDeals: () => wrapCached("deals:list", () => api.get("/api/v1/deals")),
  getDealById: (id) => wrapCached(`deals:${id}`, () => api.get(`/api/v1/deals/${id}`)),
  purchaseDeal: (id) => { invalidateCache("deals:"); return wrap(api.post(`/api/v1/deals/${id}/purchase`)); },
  listDeal: (id) => { invalidateCache("deals:"); return wrap(api.post(`/api/v1/deals/${id}/list`)); },
  updateDeal: (id, payload) => { invalidateCache("deals:"); return wrap(api.put(`/api/v1/deals/${id}`, payload)); },
  addDealNote: (id, noteData) => wrap(api.post(`/api/v1/deals/${id}/notes`, noteData)),
  deleteDealNote: (id, noteId) => wrap(api.delete(`/api/v1/deals/${id}/notes/${noteId}`)),
};

// ─── Contract Service ─────────────────────────────────────────────────────────

export const contractService = {
  getContracts: () => wrapCached("contracts:list", () => api.get("/api/v1/contracts")),
  getContractById: (id) => wrapCached(`contracts:${id}`, () => api.get(`/api/v1/contracts/${id}`)),
  signContract: (id, signatureData) => { invalidateCache("contracts:"); return wrap(api.post(`/api/v1/contracts/${id}/sign`, signatureData)); },
  uploadContractDocument: (id, formData) => { invalidateCache(`contracts:${id}`); return wrap(api.post(`/api/v1/contracts/${id}/documents`, formData, { headers: { "Content-Type": "multipart/form-data" } })); },
  createContract: (payload) => { invalidateCache("contracts:"); return wrap(api.post("/api/v1/contracts", payload)); },
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
  getUserProfile: () => wrapCached("user:profile", () => api.get("/api/v1/identity/me"), 30_000),
  updateUserProfile: (payload) => { invalidateCache("user:profile"); return wrap(api.put("/api/v1/identity/me", payload)); },
  getUserSettings: () => wrapCached("user:settings", () => api.get("/api/v1/admin/extra/settings")),
  updateUserSettings: (settingsType, payload) => { invalidateCache("user:settings"); return wrap(api.put(`/api/v1/admin/extra/settings/${settingsType}`, payload)); },
  getInvestorDocuments: () => wrapCached("user:investor-docs", () => api.get("/api/v1/documents/my-documents")),
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
  getCases: () => wrapCached("cases:list", () => api.get("/api/v1/cases/", { params: { page: 1, page_size: 500 } })),
  getMyCases: () => wrapCached("cases:mine", () => api.get("/api/v1/cases/my-cases")),
  getCaseById: (caseId) => wrapCached(`cases:${caseId}`, () => api.get(`/api/v1/cases/${caseId}`)),
  createCase: (payload) => { invalidateCache("cases:"); return wrap(api.post("/api/v1/cases/", payload)); },
  submitCase: (payload) => { invalidateCache("cases:"); return wrap(api.post("/api/v1/cases/", payload)); },
  submitCaseActual: (caseId) => { invalidateCache("cases:"); return wrap(api.post(`/api/v1/cases/${caseId}/submit`)); },
  updateCase: (caseId, payload) => { invalidateCache("cases:"); return wrap(api.put(`/api/v1/cases/${caseId}`, payload)); },
  adminUpdateCase: (caseId, payload) => { invalidateCache("cases:"); return wrap(api.put(`/api/v1/cases/${caseId}/admin-update`, payload)); },
  updateCaseStatus: (caseId, newStatus) => { invalidateCache("cases:"); return wrap(api.put(`/api/v1/cases/${caseId}/status`, { status: newStatus })); },
  updateCaseMetadata: (caseId, metadata) => { invalidateCache(`cases:${caseId}`); return wrap(api.patch(`/api/v1/cases/${caseId}/metadata`, { metadata })); },
  startCaseReview: (caseId) => { invalidateCache("cases:"); return wrap(api.post(`/api/v1/cases/${caseId}/review`)); },
  saveLawyerChecklist: (caseId, checklist, notes) => {
    invalidateCache(`cases:${caseId}`);
    return wrap(api.patch(`/api/v1/cases/${caseId}/metadata`, {
      metadata: { lawyer_review: { checklist, notes: notes || "", updated_at: new Date().toISOString() } },
    }));
  },
  completeLawyerReview: (caseId) => {
    invalidateCache(`cases:${caseId}`);
    return wrap(api.patch(`/api/v1/cases/${caseId}/metadata`, {
      metadata: { lawyer_review: { submitted_to_admin: true, submitted_at: new Date().toISOString() } },
    }));
  },
  approveCase: (caseId) => { invalidateCache("cases:"); return wrap(api.post(`/api/v1/cases/${caseId}/approve`)); },
  rejectCase: (caseId, reason) => { invalidateCache("cases:"); return wrap(api.post(`/api/v1/cases/${caseId}/reject`, { rejection_reason: reason })); },
  listCaseForAuction: (caseId) => { invalidateCache("cases:", "auctions:"); return wrap(api.post(`/api/v1/cases/${caseId}/list`)); },
  assignParticipants: (caseId, payload) => { invalidateCache(`cases:${caseId}`); return wrap(api.post(`/api/v1/cases/${caseId}/assign`, payload)); },
  getReviewQueue: () => wrapCached("cases:review-queue", () => api.get("/api/v1/cases/review-queue")),
  getLiveListings: () => wrapCached("cases:live", () => api.get("/api/v1/cases/live")),
  exportCaseReport: async (caseId) => {
    const res = await api.get(`/api/v1/cases/${caseId}/export`, { responseType: "blob" });
    return res.data;
  },
  deleteCase: (caseId) => { invalidateCache("cases:"); return wrap(api.delete(`/api/v1/cases/${caseId}`)); },
  moveToAuction: (caseId, payload) => { invalidateCache("cases:", "auctions:"); return wrap(api.post(`/api/v1/cases/${caseId}/move-to-auction`, payload)); },
  uploadCaseImage: (caseId, file) => {
    const form = new FormData();
    form.append("file", file);
    invalidateCache(`cases:${caseId}`);
    return wrap(api.post(`/api/v1/cases/${caseId}/images`, form));
  },
  getCaseImages: (caseId) => wrapCached(`cases:${caseId}:images`, () => api.get(`/api/v1/cases/${caseId}/images`)),

  // Extended case endpoints (securities, parties, metrics, notes, history)
  getSecurities: (caseId) => wrapCached(`cases:${caseId}:securities`, () => api.get(`/api/v1/cases/${caseId}/securities`)),
  addSecurity: (caseId, payload) => { invalidateCache(`cases:${caseId}`); return wrap(api.post(`/api/v1/cases/${caseId}/securities`, payload)); },
  updateSecurity: (caseId, secId, payload) => { invalidateCache(`cases:${caseId}`); return wrap(api.put(`/api/v1/cases/${caseId}/securities/${secId}`, payload)); },
  deleteSecurity: (caseId, secId) => { invalidateCache(`cases:${caseId}`); return wrap(api.delete(`/api/v1/cases/${caseId}/securities/${secId}`)); },

  getParties: (caseId) => wrapCached(`cases:${caseId}:parties`, () => api.get(`/api/v1/cases/${caseId}/parties`)),
  addParty: (caseId, payload) => { invalidateCache(`cases:${caseId}`); return wrap(api.post(`/api/v1/cases/${caseId}/parties`, payload)); },
  updateParty: (caseId, partyId, payload) => { invalidateCache(`cases:${caseId}`); return wrap(api.put(`/api/v1/cases/${caseId}/parties/${partyId}`, payload)); },
  deleteParty: (caseId, partyId) => { invalidateCache(`cases:${caseId}`); return wrap(api.delete(`/api/v1/cases/${caseId}/parties/${partyId}`)); },

  getLoanMetrics: (caseId) => wrapCached(`cases:${caseId}:loan-metrics`, () => api.get(`/api/v1/cases/${caseId}/loan-metrics`)),
  saveLoanMetrics: (caseId, payload) => { invalidateCache(`cases:${caseId}`); return wrap(api.put(`/api/v1/cases/${caseId}/loan-metrics`, payload)); },

  getAuctionMetrics: (caseId) => wrapCached(`cases:${caseId}:auction-metrics`, () => api.get(`/api/v1/cases/${caseId}/auction-metrics`)),
  saveAuctionMetrics: (caseId, payload) => { invalidateCache(`cases:${caseId}`); return wrap(api.put(`/api/v1/cases/${caseId}/auction-metrics`, payload)); },

  getInternalNotes: (caseId) => wrapCached(`cases:${caseId}:notes`, () => api.get(`/api/v1/cases/${caseId}/internal-notes`)),
  addInternalNote: (caseId, payload) => { invalidateCache(`cases:${caseId}:notes`); return wrap(api.post(`/api/v1/cases/${caseId}/internal-notes`, payload)); },
  deleteInternalNote: (caseId, noteId) => { invalidateCache(`cases:${caseId}:notes`); return wrap(api.delete(`/api/v1/cases/${caseId}/internal-notes/${noteId}`)); },

  getStatusHistory: (caseId) => wrapCached(`cases:${caseId}:history`, () => api.get(`/api/v1/cases/${caseId}/status-history`)),

  saveDraft: (caseId, payload) => { invalidateCache(`cases:${caseId}`, "cases:list"); return wrap(api.patch(`/api/v1/cases/${caseId}/draft`, payload)); },
  archiveCase: (caseId) => { invalidateCache("cases:"); return wrap(api.post(`/api/v1/cases/${caseId}/archive`)); },
  unarchiveCase: (caseId) => { invalidateCache("cases:"); return wrap(api.post(`/api/v1/cases/${caseId}/unarchive`)); },
};

export const caseService = casesService;

// ─── Lawyer Service ───────────────────────────────────────────────────────────

export const lawyerService = {
  getMyAssignedCases: () => wrapCached("lawyer:assigned", () => api.get("/api/v1/cases/assigned-to-me")),
  getMyCases: () => wrapCached("lawyer:my-cases", () => api.get("/api/v1/cases/my-cases")),
  getDashboard: () => wrapCached("lawyer:dashboard", () => api.get("/api/v1/lawyer/dashboard")),
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
  getTasks: () => wrapCached("tasks:list", () => api.get("/api/v1/tasks")),
  getSummaryStats: () => wrapCached("tasks:summary", () => api.get("/api/v1/tasks/summary")),
  createTask: (payload) => { invalidateCache("tasks:"); return wrap(api.post("/api/v1/tasks", payload)); },
  updateTask: (id, payload) => { invalidateCache("tasks:"); return wrap(api.patch(`/api/v1/tasks/${id}`, payload)); },
  deleteTask: (id) => { invalidateCache("tasks:"); return wrap(api.delete(`/api/v1/tasks/${id}`)); },
};

// ─── Analytics Service ────────────────────────────────────────────────────────

export const analyticsService = {
  getDashboardStats: (params) => wrapCached(`analytics:dashboard:${JSON.stringify(params||{})}`, () => api.get("/api/v1/admin/dashboard", { params })),
  getPlatformStats: (params) => wrapCached(`analytics:platform:${JSON.stringify(params||{})}`, () => api.get("/api/v1/admin/platform-stats", { params })),
  getCaseStats: (params) => wrapCached(`analytics:cases:${JSON.stringify(params||{})}`, () => api.get("/api/v1/admin/extra/analytics/cases", { params })),
  getAuctionStats: (params) => wrapCached(`analytics:auctions:${JSON.stringify(params||{})}`, () => api.get("/api/v1/admin/extra/analytics/auctions", { params })),
  getRevenueStats: (params) => wrapCached(`analytics:revenue:${JSON.stringify(params||{})}`, () => api.get("/api/v1/admin/extra/analytics/revenue", { params })),
};

// ─── KYC Service ─────────────────────────────────────────────────────────────

export const kycService = {
  getKYCQueue: () => wrapCached("kyc:queue", () => api.get("/api/v1/kyc/queue")),
  getMyKYC: () => wrapCached("kyc:mine", () => api.get("/api/v1/kyc/my-kyc")),
  getKYCById: (id) => wrapCached(`kyc:${id}`, () => api.get(`/api/v1/kyc/${id}`)),
  approveKYC: (id) => { invalidateCache("kyc:"); return wrap(api.post(`/api/v1/kyc/${id}/approve`)); },
  rejectKYC: (id, reason) => { invalidateCache("kyc:"); return wrap(api.post(`/api/v1/kyc/${id}/reject`, { rejection_reason: reason || "" })); },
  submitKYC: (payload) => { invalidateCache("kyc:"); return wrap(api.post("/api/v1/kyc/submit", payload)); },
  submitKYCForm: (formData) => { invalidateCache("kyc:"); return wrap(api.post("/api/v1/kyc/submit-form", formData)); },
  updateKYCRisk: (id, riskLevel) => { invalidateCache(`kyc:${id}`); return wrap(api.patch(`/api/v1/kyc/${id}/risk`, { risk_level: riskLevel })); },
};

// ─── Document Service ─────────────────────────────────────────────────────────

export const documentService = {
  getAllDocuments: (params = {}) => wrapCached(`docs:all:${JSON.stringify(params)}`, () => api.get("/api/v1/documents", { params })),
  getDocuments: (caseId) => wrapCached(`docs:case:${caseId}`, () => api.get(`/api/v1/documents/case/${caseId}`)),
  uploadDocument: (_caseId, formData) => { invalidateCache("docs:"); return wrap(api.post(`/api/v1/documents/upload`, formData)); },
  deleteDocument: (docId) => { invalidateCache("docs:"); return wrap(api.delete(`/api/v1/documents/${docId}`)); },
  getDocumentUrl: (docId) => wrap(api.get(`/api/v1/documents/${docId}/download`)),
  approveDocument: (docId) => { invalidateCache("docs:"); return wrap(api.post(`/api/v1/documents/${docId}/approve`)); },
  rejectDocument: (docId, reason) => { invalidateCache("docs:"); return wrap(api.post(`/api/v1/documents/${docId}/reject`, { rejection_reason: reason || "" })); },
};

// ─── Admin Users Service ──────────────────────────────────────────────────────

export const adminUsersService = {
  getUsers: (params) => wrapCached(`users:list:${JSON.stringify(params||{})}`, () => api.get("/api/v1/identity/users", { params })),
  getUserById: (id) => wrapCached(`users:${id}`, () => api.get(`/api/v1/identity/users/${id}`)),
  getUsersByRole: (role) => wrapCached(`users:role:${role}`, () => api.get("/api/v1/identity/users", { params: { role } })),
  createUser: (data) => {
    invalidateCache("users:");
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
  suspendUser: (id) => { invalidateCache("users:"); return wrap(api.post(`/api/v1/identity/users/${id}/suspend`)); },
  reactivateUser: (id) => { invalidateCache("users:"); return wrap(api.post(`/api/v1/identity/users/${id}/reactivate`)); },
  getPendingRoles: () => wrapCached("roles:pending", () => api.get("/api/v1/roles/pending")),
  approveRole: (id) => { invalidateCache("roles:", "users:"); return wrap(api.post(`/api/v1/roles/${id}/approve`)); },
  rejectRole: (id) => { invalidateCache("roles:", "users:"); return wrap(api.post(`/api/v1/roles/${id}/reject`)); },
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
  getDashboard: () => wrapCached("investor:dashboard", () => api.get("/api/v1/investor/analytics/summary")),
  getPortfolio: () => wrapCached("investor:portfolio", () => api.get("/api/v1/investor/portfolio")),
  getActiveInvestments: () => wrapCached("investor:activity", () => api.get("/api/v1/investor/analytics/activity")),
  getCharts: () => wrapCached("investor:charts", () => api.get("/api/v1/investor/analytics/charts")),
  getMyInvestmentCases: () => wrapCached("investor:my-cases", () => api.get("/api/v1/investor/my-cases")),
};

// ─── Admin Service ────────────────────────────────────────────────────────────

export const adminService = {
  getDashboardStats: () => wrapCached("admin:dashboard", () => api.get("/api/v1/admin/dashboard")),
  getPlatformStats: () => wrapCached("admin:platform-stats", () => api.get("/api/v1/admin/platform-stats")),
  getUsers: (params = {}) => wrapCached(`users:list:${JSON.stringify(params)}`, () => api.get("/api/v1/identity/users", { params })),
  getSettings: () => wrapCached("admin:settings", () => api.get("/api/v1/admin/settings")),
  updateSettings: ({ key, value }) => { invalidateCache("admin:settings"); return wrap(api.put(`/api/v1/admin/settings/${key}`, { value })); },
  getAuditLog: (params = {}) => wrap(api.get("/api/v1/audit", { params })),
};

// ─── Borrower Service ─────────────────────────────────────────────────────────

export const borrowerService = {
  getDashboard: () => wrapCached("borrower:dashboard", () => api.get("/api/v1/borrower/dashboard")),
  getMyCase: () => wrapCached("borrower:my-case", () => api.get("/api/v1/borrower/my-case")),
  getTimeline: () => wrapCached("borrower:timeline", () => api.get("/api/v1/borrower/case/timeline")),
  getCaseDocuments: (caseId) => wrapCached(`borrower:docs:${caseId}`, () => api.get(`/api/v1/borrower/case/${caseId}/documents`)),
};

// ─── Lender / Loans Service ───────────────────────────────────────────────────

export const lenderService = {
  getDashboard: () => wrapCached("lender:dashboard", () => api.get("/api/v1/loans/dashboard")),
  getPortfolio: () => wrapCached("lender:portfolio", () => api.get("/api/v1/loans/portfolio")),
  getMyCases: () => wrapCached("lender:my-cases", () => api.get("/api/v1/loans/my-cases")),
  getMyAssignedCases: () => wrapCached("lender:my-cases", () => api.get("/api/v1/loans/my-cases")),
};
