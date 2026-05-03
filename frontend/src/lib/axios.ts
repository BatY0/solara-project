import axios from 'axios';

let refreshPromise: Promise<void> | null = null;
let isRedirectingToLogin = false;
let authRecoveryDisabled = false;

const redirectToLogin = () => {
  if (isRedirectingToLogin) return;
  if (window.location.pathname === '/login') return;
  isRedirectingToLogin = true;
  window.location.href = '/login';
};

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => {
    const requestUrl = String(response.config?.url ?? '');
    if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh')) {
      authRecoveryDisabled = false;
      isRedirectingToLogin = false;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean; _authOptional?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthFailure = status === 401;
    const isAuthOptional = Boolean(originalRequest?._authOptional);
    const requestUrl = String(originalRequest?.url ?? '');
    const isAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout');
    if (isAuthFailure && isAuthOptional) {
      return Promise.reject(error);
    }

    if (isAuthFailure && authRecoveryDisabled && !isAuthRoute) {
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isAuthFailure && !originalRequest?._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh')
            .then(() => undefined)
            .finally(() => {
              refreshPromise = null;
            });
        }

        await refreshPromise;
        return api(originalRequest);
      } catch {
        authRecoveryDisabled = true;
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    if (isAuthFailure && isAuthRoute) {
      authRecoveryDisabled = true;
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;

