import api from "../services/api";

const wrap = (promise) =>
  promise
    .then((res) => ({ success: true, data: res.data, message: "OK" }))
    .catch((err) => {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message;
      return { success: false, error: msg, data: null };
    });

export const analyticsService = {
  getSummaryStats: (range = "Last 30 Days") =>
    wrap(api.get(`/api/v1/investor/analytics/summary?range=${encodeURIComponent(range)}`)),

  getAnalyticsCharts: (range = "Last 30 Days") =>
    wrap(api.get(`/api/v1/investor/analytics/charts?range=${encodeURIComponent(range)}`)),

  getRecentActivity: () =>
    wrap(api.get("/api/v1/investor/analytics/activity")),

  exportReport: (section, format) =>
    wrap(api.get(`/api/v1/admin/extra/analytics/export?section=${section}&format=${format}`)),
};
