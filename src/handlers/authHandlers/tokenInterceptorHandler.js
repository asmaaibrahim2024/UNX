
import { AuthService } from "./authServiceHandler"; // assuming you have a normal HTTP service

const BASE_URL = `${window.appConfig.apiServer.apiUrl}`; // Set your base API URL

const getAuthModel = () => {
  const authString = localStorage.getItem('AuthModleLocalStorage');
  return authString ? JSON.parse(authString) : null;
};

const logout = () => {
  localStorage.removeItem('AuthModleLocalStorage');
  window.location.href = '/login'; // or navigate to login page
};

const handleRequest = async (method, url, body = null, customHeaders = {}) => {
  let authModel = getAuthModel();
  let token = authModel?.jwtToken;

  let headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && token) {
    // Try to refresh token
    const newToken = await AuthService.refreshToken();

    if (newToken) {
      authModel = getAuthModel() || {};
      authModel.jwtToken = newToken;
      localStorage.setItem('AuthModleLocalStorage', JSON.stringify(authModel));

      headers['Authorization'] = `Bearer ${newToken}`;

      // Retry original request
      response = await fetch(`${BASE_URL}${url}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        return Promise.reject(await response.json());
      }
      return response.json();
    } else {
      logout();
      return Promise.reject({ message: 'Unauthorized' });
    }
  }

  if (response.status === 403 && token) {
    window.location.href = '/error/500';
    return;
  }

  if (!response.ok) {
    return Promise.reject(await response.json());
  }

  return response.json();
};

// Exported interceptor functions
export const interceptor = {
  getRequest: (url, headers = {}) => handleRequest('GET', url, null, headers),
  postRequest: (url, body, headers = {}) => handleRequest('POST', url, body, headers),
    putRequest: (url, body, headers = {}) => handleRequest('PUT', url, body, headers),
    deleteRequest: (url, body, headers = {}) => handleRequest('DELETE', url, body, headers),

};
