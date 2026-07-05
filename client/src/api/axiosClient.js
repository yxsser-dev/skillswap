import axios from 'axios';

export const API_BASE = 'http://localhost:5000/api';
export const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, '');


export function resolveUploadUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_ORIGIN}${path}`;
}

const rawAxios = axios.create({ baseURL: API_BASE });

const axiosClient = axios.create({ baseURL: API_BASE });

export function getAccessToken() {
  return localStorage.getItem('accessToken');
}
export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}
export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}
export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, newAccessToken) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newAccessToken);
  });
  pendingQueue = [];
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthRoute = originalRequest?.url?.includes('/auth/');

    if (status !== 401 || isAuthRoute || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newAccessToken) => {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');

      const { data } = await rawAxios.post('/auth/refresh', { refreshToken });
      setTokens(data);
      isRefreshing = false;
      flushQueue(null, data.accessToken);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      flushQueue(refreshError, null);
      clearTokens();
       window.dispatchEvent(new Event('auth:sessionExpired'));
      return Promise.reject(refreshError);
    }
  }
);

export default axiosClient;
