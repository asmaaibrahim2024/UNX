// authService.js

import { jwtDecode } from "jwt-decode"; // you'll need this library instead of @auth0/angular-jwt
import * as CryptoJS from "crypto-js";
import { DeviceUUID } from "device-uuid"; 
import { authHttpService } from "./authHttpHandler"; // assuming you have a normal HTTP service

export const AuthService = (() => {
  let pimUrl = `${window.appConfig.apiServer.utilityKitURL}/auth/login`;

  function getAuthFromLocalStorage() {
    try {
      const lsValue = localStorage.getItem('AuthModleLocalStorage');
      if (!lsValue) return undefined;
      return JSON.parse(lsValue);
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  function setAuthToLocalStorage(auth) {
    localStorage.setItem('AuthModleLocalStorage', JSON.stringify(auth));
  }

  function isTokenExpired() {
    const authModel = getAuthFromLocalStorage();
    if (!authModel?.jwtToken) return true;
    try {
      const decoded = jwtDecode(authModel.jwtToken);
      if (!decoded.exp) return true;
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      console.error(error);
      return true;
    }
  }

  function goToLogin() {
    localStorage.removeItem('AuthModleLocalStorage');
    window.location.href = pimUrl;
  }

  function goToHome() {
    window.location.href = window.appConfig.apiServer.utilityKitURL;
  }

  function logout() {
    const auth = getAuthFromLocalStorage();
    if (!auth || !auth.refreshToken) {
      goToLogin();
    } else {
      const revokeToken = { token: auth.refreshToken };
      authHttpService.logout(revokeToken)
        .catch(err => console.error('Logout error', err))
        .finally(() => goToLogin());
    }
  }

  function refreshToken() {
    const auth = getAuthFromLocalStorage();
    if (!auth || !auth.refreshToken) {
      localStorage.removeItem('AuthModleLocalStorage');
      goToLogin();
      return Promise.resolve('');
    }
    return authHttpService.refreshTokenHttp(auth.refreshToken)
      .then((newAuth) => {
        setAuthToLocalStorage(newAuth);
        return newAuth.jwtToken;
      })
      .catch(err => {
        console.error('Refresh token error', err);
        localStorage.removeItem('AuthModleLocalStorage');
        logout();
        return '';
      });
  }

  function encryptText(value) {
    const key = CryptoJS.enc.Utf8.parse('7061737323313233');
    const iv = CryptoJS.enc.Utf8.parse('7061737323313233');
    const encryptedValue = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(value),
      key,
      {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return encryptedValue.toString();
  }

  function getUserUniqueId() {
    const navigator_info = window.navigator;
    const screen_info = window.screen;
    let uid = navigator_info.mimeTypes.length.toString();
    uid += navigator_info.userAgent.replace(/\D+/g, '');
    uid += navigator_info.plugins.length;
    uid += screen_info.height || '';
    uid += screen_info.width || '';
    uid += screen_info.pixelDepth || '';
    return uid;
  }

  function getUserByUniqueId() {
    debugger;
    if (localStorage.getItem('AuthModleLocalStorage') != null) {
      const auth = getAuthFromLocalStorage();
      console.log(auth,"MMMMMMMMMMMMMMMMMMM");
      
      return Promise.resolve(auth);
    }
    const uuid = new DeviceUUID().get();
    const uniqueId = getUserUniqueId();
    console.log(uniqueId,"MMMMMMMMMMMMMMMMMMM");

    return authHttpService.getUserByUniqueId(uniqueId)
      .then((auth) => {
        debugger
        console.log(auth,"MMMMMMMMMMMMMMMMMMM");

        if (auth?.isAuthenticated) {
          setAuthToLocalStorage(auth);
          return auth;
        } else {
          localStorage.removeItem('AuthModleLocalStorage');
          logout();
          return undefined;
        }
      })
      .catch(err => {
        console.error('Get User by UniqueId error', err);
        localStorage.removeItem('AuthModleLocalStorage');
        logout();
        return undefined;
      });
  }

  return {
    getAuthFromLocalStorage,
    setAuthToLocalStorage,
    isTokenExpired,
    goToLogin,
    goToHome,
    logout,
    refreshToken,
    encryptText,
    getUserUniqueId,
    getUserByUniqueId
  };
})();
