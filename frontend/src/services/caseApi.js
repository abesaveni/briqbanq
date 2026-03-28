// src/services/caseApi.js — re-exports from the main api client
// All requests go through the central axios instance that auto-attaches the JWT.
import api from "./api";

// Cases
export const getCaseDetails = (caseId) => api.get(`/api/v1/cases/${caseId}`);
export const updateCaseDetails = (caseId, data) => api.put(`/api/v1/cases/${caseId}`, data);

// Documents
export const uploadDocument = (caseId, formData) =>
  api.post(`/api/v1/documents/case/${caseId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteDocument = (caseId, docId) => api.delete(`/api/v1/documents/${docId}`);

// Images
export const uploadImages = (caseId, formData) =>
  api.post(`/api/v1/cases/${caseId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteImage = (caseId, imageId) =>
  api.delete(`/api/v1/cases/${caseId}/images/${imageId}`);

// AI Content generation stub
export const generateAIContent = (caseId, contentType) =>
  api.post(`/api/v1/cases/${caseId}/ai-generate`, { contentType });

// PDF generation
export const generateIM = (caseId) =>
  api.post(`/api/v1/cases/${caseId}/generate-im`, {}, { responseType: "blob" });
export const generateFlyer = (caseId) =>
  api.post(`/api/v1/cases/${caseId}/generate-flyer`, {}, { responseType: "blob" });

// Messages
export const getCaseMessages = (caseId) => api.get(`/api/v1/cases/${caseId}/messages`);
export const sendMessage = (caseId, message) =>
  api.post(`/api/v1/cases/${caseId}/messages`, { message });

// Bids
export const getCaseBids = (caseId) => api.get(`/api/v1/bids/auction/${caseId}`);

// Activity
export const getCaseActivity = (caseId) => api.get(`/api/v1/cases/${caseId}/activity`);

// Settlement
export const updateSettlementItem = (caseId, itemId, data) =>
  api.patch(`/api/v1/settlement/case/${caseId}/items/${itemId}`, data);
export const markReadyForSettlement = (caseId) =>
  api.post(`/api/v1/settlement/case/${caseId}/ready`);

export default api;
