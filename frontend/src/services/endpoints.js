import api from "./api";

// Auth
export const authApi = {
  login: (email, password) => api.post("/auth/login/json", { email, password }),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  refresh: (refresh_token) => api.post("/auth/refresh", { refresh_token }),
  forgot: (email) => api.post("/auth/forgot-password", { email }),
  reset: (token, new_password) => api.post("/auth/reset-password", { token, new_password }),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }),
  changePassword: (current_password, new_password) =>
    api.post("/auth/change-password", { current_password, new_password }),
  updateProfile: (data) => api.put("/auth/me", data),
  uploadAvatar: (form) => api.post("/auth/me/avatar", form),
  removeAvatar: () => api.delete("/auth/me/avatar"),
  logout: () => api.post("/auth/logout"),
};

// Dashboard
export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
  charts: () => api.get("/dashboard/charts"),
  recentCampaigns: () => api.get("/dashboard/recent-campaigns"),
  recentActivity: () => api.get("/dashboard/recent-activity"),
};

// Contacts
export const contactsApi = {
  list: (params) => api.get("/contacts", { params }),
  get: (id) => api.get(`/contacts/${id}`),
  create: (data) => api.post("/contacts", data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  remove: (id) => api.delete(`/contacts/${id}`),
  bulkDelete: (ids) => api.post("/contacts/bulk/delete", { ids }),
  bulkUpdate: (data) => api.post("/contacts/bulk/update", data),
  importPreview: (form) => api.post("/contacts/import/preview", form),
  import: (form) => api.post("/contacts/import", form),
  exportUrl: (format) => `/contacts/export?format=${format}`,
  audienceCount: (payload) => api.post("/contacts/audience-count", payload),
};

// Groups
export const groupsApi = {
  list: () => api.get("/groups"),
  create: (data) => api.post("/groups", data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  remove: (id) => api.delete(`/groups/${id}`),
};

// Segments
export const segmentsApi = {
  list: () => api.get("/segments"),
  create: (data) => api.post("/segments", data),
  update: (id, data) => api.put(`/segments/${id}`, data),
  remove: (id) => api.delete(`/segments/${id}`),
  preview: (id) => api.get(`/segments/${id}/preview`),
};

// Campaigns
export const campaignsApi = {
  list: (params) => api.get("/campaigns", { params }),
  get: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post("/campaigns", data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  remove: (id) => api.delete(`/campaigns/${id}`),
  preview: (id) => api.get(`/campaigns/${id}/preview`),
  recipients: (id, params) => api.get(`/campaigns/${id}/recipients`, { params }),
  logs: (id) => api.get(`/campaigns/${id}/logs`),
  send: (id) => api.post(`/campaigns/${id}/send`),
  pause: (id) => api.post(`/campaigns/${id}/pause`),
  resume: (id) => api.post(`/campaigns/${id}/resume`),
  cancel: (id) => api.post(`/campaigns/${id}/cancel`),
  archive: (id) => api.post(`/campaigns/${id}/archive`),
  retry: (id) => api.post(`/campaigns/${id}/retry`),
  clone: (id) => api.post(`/campaigns/${id}/clone`),
};

// Templates
export const templatesApi = {
  list: (params) => api.get("/templates", { params }),
  create: (data) => api.post("/templates", data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  remove: (id) => api.delete(`/templates/${id}`),
  sync: () => api.post("/templates/sync"),
};

// Media
export const mediaApi = {
  list: (params) => api.get("/media", { params }),
  folders: () => api.get("/media/folders"),
  upload: (form) => api.post("/media/upload", form),
  rename: (id, data) => api.put(`/media/${id}`, data),
  remove: (id) => api.delete(`/media/${id}`),
};

// Settings
export const settingsApi = {
  get: () => api.get("/settings"),
  update: (data) => api.put("/settings", data),
  test: () => api.post("/settings/test"),
  getEmail: () => api.get("/settings/email"),
  updateEmail: (data) => api.put("/settings/email", data),
  testEmail: () => api.post("/settings/email/test"),
};

// Reports
export const reportsApi = {
  summary: () => api.get("/reports/summary"),
  failureReasons: () => api.get("/reports/failure-reasons"),
  exportUrl: (format) => `/reports/export?format=${format}`,
};

// Users
export const usersApi = {
  list: () => api.get("/users"),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

// Notifications
export const notificationsApi = {
  list: () => api.get("/notifications"),
  unreadCount: () => api.get("/notifications/unread-count"),
  read: (id) => api.post(`/notifications/${id}/read`),
  readAll: () => api.post("/notifications/read-all"),
};

// Logs
export const logsApi = {
  activity: (limit = 100) => api.get("/logs/activity", { params: { limit } }),
  webhooks: (limit = 100) => api.get("/logs/webhooks", { params: { limit } }),
};

// Search
export const searchApi = {
  query: (q) => api.get("/search", { params: { q } }),
};
