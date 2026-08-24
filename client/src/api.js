import axios from 'axios';

// Dedicated Render Production API Endpoint
const RENDER_BACKEND_URL = 'https://lastmile-delivery-tracker-7yrj.onrender.com/api';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // If running on Vercel frontend, connect directly to live Render backend API
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return RENDER_BACKEND_URL;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL()
});

// Add Token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('delivery_jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const AuthAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getDemoUsers: () => api.get('/auth/demo-users')
};

export const OrderAPI = {
  estimate: (data) => api.post('/orders/estimate', data),
  create: (data) => api.post('/orders', data),
  list: (params) => api.get('/orders', { params }),
  getDetails: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.post(`/orders/${id}/status`, data),
  reschedule: (id, data) => api.post(`/orders/${id}/reschedule`, data),
  adminAssign: (id, agentId) => api.post(`/orders/${id}/assign`, { agentId }),
  adminOverride: (id, status, notes) => api.post(`/orders/${id}/override`, { status, notes })
};

export const AdminAPI = {
  getMetrics: () => api.get('/admin/metrics'),
  getZones: () => api.get('/admin/zones'),
  createZone: (data) => api.post('/admin/zones', data),
  getPincodes: () => api.get('/admin/pincodes'),
  savePincode: (data) => api.post('/admin/pincodes', data),
  getRateCards: () => api.get('/admin/rate-cards'),
  updateRateCard: (id, data) => api.put(`/admin/rate-cards/${id}`, data),
  getConfig: () => api.get('/admin/config'),
  saveConfig: (key, value) => api.post('/admin/config', { key, value }),
  getAgents: () => api.get('/admin/agents'),
  updateAgent: (id, data) => api.put(`/admin/agents/${id}`, data),
  getNotifications: () => api.get('/admin/notifications')
};

export default api;
