import { authCommonService } from './authCommonHandler'; // adjust the path
import { fetchPost, fetchGet } from './httpRequestHandler'; // you may need to implement fetchPost/fetchGet

const PimApi = `${window.appConfig.apiServer.pimApiUrl}/api`;

export const authHttpService = {
  logout: (revokeToken) => {
    return fetchPost(`${PimApi}/Auth/logout`, revokeToken, authCommonService.httpOptions);
  },

  getUserByUniqueId: (id) => {
    // debugger
    console.log(`${PimApi}/Auth/getUserByUniqueId`, { id }, authCommonService.httpOptions,"MMMMMMMMMMMMMMMMMMM");
    
    return fetchPost(`${PimApi}/Auth/getUserByUniqueId`, { id }, authCommonService.httpOptions);
  },

  refreshTokenHttp: (refreshToken) => {
    return fetchGet(`${PimApi}/Auth/RefreshToken/${refreshToken}`, authCommonService.httpOptions);
  }
};