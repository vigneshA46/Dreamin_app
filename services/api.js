import axios from 'axios';

const domainurl = 'https://algoapi.dreamintraders.in';

const api = axios.create({
  baseURL: domainurl,
  withCredentials: true, // 🍪 cookies auto sent
  headers: { 'Content-Type': 'application/json' },
});

/* ===========================
   AUTH FAILURE HOOK
   UserProvider calls setAuthFailureHandler() once on mount,
   passing its own setUser/setIsAuthenticated setters.
=========================== */

let onAuthFailure = null;

export const setAuthFailureHandler = (fn) => {
  onAuthFailure = fn;
};

/* ===========================
   REFRESH ACCESS TOKEN
=========================== */

const refreshAccessToken = async () => {
  try {
    await api.post('/api/auth/refresh');
    return true;
  } catch (err) {
    return false;
  }
};

/* ===========================
   GENERIC API REQUEST
=========================== */

export const apiRequest = async (
  method,
  endpoint,
  data,
  retry = true
) => {
  try {
    const response = await api({
      method,
      url: endpoint,
      ...(data !== undefined && { data }),
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401 && retry) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        return apiRequest(method, endpoint, data, false);
      }

      // ❌ refresh failed → flip isAuthenticated to false
      if (onAuthFailure) onAuthFailure();
      throw new Error('Session expired');
    }

    throw new Error(
      error.response?.data?.message || error.message || 'Something went wrong'
    );
  }
};

export default api;