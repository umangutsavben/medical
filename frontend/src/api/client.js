import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Profile API
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
};

// Documents API
export const documentsAPI = {
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
  list: (params) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`),
  process: (id) => api.post(`/documents/${id}/process`),
  getText: (id) => api.get(`/documents/${id}/text`),
  updateCategory: (id, categoryId) => api.patch(`/documents/${id}/category`, { categoryId }),
};

// Search API
export const searchAPI = {
  search: (q, params) => api.get('/search', { params: { q, ...params } }),
};

// Categories API
export const categoriesAPI = {
  list: () => api.get('/categories'),
};

// Health Parameters API
export const healthAPI = {
  getParameters: () => api.get('/health-parameters'),
  getMeasurements: (type) => api.get(`/health-parameters/${type}`),
  correctMeasurement: (id, data) => api.post(`/health-parameters/${id}/correct`, data),
  getTrends: (parameter) => api.get(`/health-trends/${parameter}`),
};

export default api;
