// userRoles.js

import { jwtDecode } from "jwt-decode";  // install with `npm install jwt-decode`

export const UserRolesService = (() => {
  let AppRoles = [];
  let UnxRole = null;

  function getAuthToken() {
    // debugger
    try {
      const authData = JSON.parse(localStorage.getItem('AuthModleLocalStorage') || '{}');
      return authData.jwtToken || null;
    } catch (error) {
      console.error('Error parsing localStorage:', error);
      return null;
    }
  }

  function decodedAccessToken(token) {
    // debugger
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('JWT decode error:', error);
      return null;
    }
  }

  async function getRoles(appCode) {
    // debugger
    AppRoles = [];
    UnxRole = null;

    const jwtToken = getAuthToken();
    const decoded = decodedAccessToken(jwtToken);

    if (decoded && Array.isArray(decoded.UserAppRoles)) {
      decoded.UserAppRoles.forEach((roleString) => {
        try {
          const roleObj = JSON.parse(roleString);
          AppRoles.push(roleObj);

          if (roleObj.ApplicationCode === appCode) {
            UnxRole = roleObj.RoleName;
          }
        } catch (err) {
          console.warn('Invalid role JSON:', roleString);
        }
      });
    }
  }

  function getAppRoles() {
    // debugger
    return AppRoles;
  }

  function getUnxRole() {
    // debugger
    return UnxRole;
  }

  return {
    getRoles,
    getAppRoles,
    getUnxRole,
  };
})();

