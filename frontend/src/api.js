// api.js - axios instance for backend calls

import axios from 'axios';

var api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

api.interceptors.request.use(function(config) {
  var token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, function(error) {
  return Promise.reject(error);
});

api.interceptors.response.use(
  function(response) { return response; },
  function(error) {
    if (error.response && error.response.status == 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err, fallback) {
  if (err.response && err.response.data) {
    var data = err.response.data;
    if (typeof data.detail === 'string') return data.detail;
    if (data.message) return data.message;
    if (Array.isArray(data.detail)) {
      return data.detail.map(function(d) { return d.msg || d; }).join(', ');
    }
  }
  return fallback || 'Something went wrong';
}

export default api;
