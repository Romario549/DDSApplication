import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const cashflowAPI = {
  getNotes: (params) => api.get('/notes/', { params }),
  getNote: (id) => api.get(`/notes/${id}/`),
  createNote: (data) => api.post('/notes/', data),
  updateNote: (id, data) => api.put(`/notes/${id}/`, data),
  deleteNote: (id) => api.delete(`/notes/${id}/`),
  getSummary: () => api.get('/notes/summary/'),
  
  getStatuses: () => api.get('/statuses/'),
  getTypes: () => api.get('/types/'),
  getCategories: (params) => api.get('/categories/', { params }), 
  getSubcategories: () => api.get('/subcategories/'),

  createStatus: (data) => api.post('/statuses/', data),
  createType: (data) => api.post('/types/', data),
  createCategory: (data) => api.post('/categories/', data),
  createSubcategory: (data) => api.post('/subcategories/', data),
  
  updateStatus: (id, data) => api.put(`/statuses/${id}/`, data),
  updateType: (id, data) => api.put(`/types/${id}/`, data),
  updateCategory: (id, data) => api.put(`/categories/${id}/`, data),
  updateSubcategory: (id, data) => api.put(`/subcategories/${id}/`, data),
  
  deleteStatus: (id) => api.delete(`/statuses/${id}/`),
  deleteType: (id) => api.delete(`/types/${id}/`),
  deleteCategory: (id) => api.delete(`/categories/${id}/`),
  deleteSubcategory: (id) => api.delete(`/subcategories/${id}/`),
  
  getCategoriesByType: (typeId) => 
    api.get(`/notes/categories_by_type/?type_id=${typeId}`),
  getSubcategoriesByCategory: (categoryId) => 
    api.get(`/notes/subcategories_by_category/?category_id=${categoryId}`),
};