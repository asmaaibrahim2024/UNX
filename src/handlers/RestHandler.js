import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
// import { userLoginFulfilled, userLoginFailed } from "../redux/actions/authAction.js";
// import { useLogout } from '../handlers/authHandler.js'

import { from, of } from "rxjs";
import { AES, enc, mode, pad } from "crypto-js";
const REFRESH_URL_BLACKLIST = [
    'login',
    'logout',
    'refresh',
];

class RestServices {
    axiosInstance = null;
    currToken = sessionStorage.getItem("token") ? sessionStorage.getItem("token") : null;
    currRefrshToken = sessionStorage.getItem("refreshToken") ? sessionStorage.getItem("refreshToken") : null;
    currentUserDetails = sessionStorage.getItem("token") ? jwtDecode(sessionStorage.getItem("token")) : null;
    appId = sessionStorage.getItem("appId") ? sessionStorage.getItem("appId") : null;
    userInfo=null
    /**
     * @param {string} baseURL
     */
    constructor(baseURL) {
        if (!this.axiosInstance) {
            this.axiosInstance = axios.create({});
        }

        this.axiosInstance.interceptors.request.use(
            (req) => {
                // Do something before request is sent
                if (this.currToken) {
                    req.headers["Authorization"] = `Bearer ${this.currToken}`;
                } else {
                    // "Invalid Token , please login to get a valid token";
                    //return Promise.reject(
                    //  new Error('Authorization error: The request did not go through')
                    //);
                }
                req.headers["Content-Type"] = "application/json";
                return req;
            },
            (error) => {
                // Do something with request error
                return Promise.reject(error);
            }
        );

        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                let originalRequest = error.config;
                
                if (
                    error.response &&
                    error.response.status == 401
                ) {
                  
                    originalRequest._retry = true;
                    let timeStamp = await this.getRequest(window.mapConfig.services.TimeStampUrl);
                    const refreshToken =
                    {
                        RefreshToken: this.currRefrshToken,
                        AppId: window.mapAppConfig.general.app.encryptedAppId
                    }
                    this.setAppId(refreshToken.AppId)
                    sessionStorage.setItem("appId", refreshToken.AppId);
                    if (this.currRefrshToken) {
                        try {
                            // get the new token and refresh token
                            const response = await this.axiosInstance.post(window.mapConfig.services.RefreshTokenUrl, refreshToken);
                            const token = response.data;
                            sessionStorage.setItem("token", token.AccessToken)
                            sessionStorage.setItem("refreshToken", token.RefreshToken);
                            this.setToken(token.AccessToken);
                            this.setRefreshToken(token.RefreshToken);
                            originalRequest.headers.Authorization = `Bearer ${token.AccessToken}`;
                       //     if (originalRequest.url.match('CheckLoginUser')) {
                                originalRequest.body={
                                  
                                        appId: refreshToken.AppId,
                                        refreshToken: token.RefreshToken
                                    
                                };
                            //  }
                           // window.location.reload();
                            return this.axiosInstance(originalRequest);
                        } catch (refreshError) {

                           
                            //sessionStorage.removeItem("token")
                           // useLogout();
                        }
                    }
                    else {
                        //call logout

                        sessionStorage.removeItem("token")
                        // useLogout();
                        // const response = this.LogoutRequest(mgAppConfig.services.LogoutRequest, this.currRefrshToken, this.appId);

                    }
                }
                return Promise.reject(error);
            }
        );
    }
     encryptData(value, timeStamp)  {
        const key = enc.Utf8.parse("7061737323313233");

        const iv = enc.Utf8.parse(timeStamp?.data.substring(0, 16));
        const cipherText = AES.encrypt(enc.Utf8.parse(value), key, {
            keySize: 128 / 8,
            iv: iv,
            mode: mode.CBC,
            padding: pad.Pkcs7,
        });
        return timeStamp.data + cipherText;
    };
    /**
     * @param {object} params contains http/https and ip and port
     */
    getURLPrefix({ protocol, host, port }) {
        if (port !== '')
            return `${protocol}://${host}:${port}/`;
        else return `${protocol}://${host}/`;
    }

    /**
     * return url string and inject the prams
     * @param {string} url: search prams part
     * @param {object} urlParams: key-value pair
     */
    fillURLSearchParams(url, urlParams = {}) {
        const urlParser = new URL(url);
        const newSearchPrams = new URLSearchParams("");
        for (const prams in urlParams) {
            if (urlParams[prams]) {
                newSearchPrams.set(prams, urlParams[prams]);
            }
        }
        urlParser.search = newSearchPrams.toString();
        return () => urlParser.href;
    }

    /**
     * @param {string} token
     */
    setToken(token) {
        this.currToken = token;
    }

    getToken() {
        return this.currToken;
    }

    setRefreshToken(refrshToken) {
        this.currRefrshToken = refrshToken;
    }
    setAppId(AppId) {
        this.appId = AppId;
    }


    /**
    * @DGDA2Security function to decode jwt token 
    * @return - decoded token -
    * @param token
    */
    getDecodedAccessToken(token) {
        try {

            this.currentUserDetails = jwtDecode(token);

        } catch (Error) {
            return null;
        }
    }
    /**
     * @param {string} url
     */
    getRequest(url) {
        return this.axiosInstance.get(url);
    }

    loginPostRequest(url, userInfo) {
        return this.axiosInstance.post(url, userInfo);
    }
    LogoutRequest(url, refreshToken, appId) {
        return this.axiosInstance.post(url, { RefreshToken: refreshToken, appId: appId });
    }

    getUserApplication(url) {
        var applicationId = "iHr+WwNzqHIIuw73dKyq3w==";
        return this.axiosInstance.post(url, { applicationId: applicationId });
    }


    /**
     * @param {string} url
     * @param {any} data
     */
    postRequest(url, data, header) {
        if (header)
            return this.axiosInstance.post(url, data, {
                headers: header,
            });
        return this.axiosInstance.post(url, data);
    }
    putRequest(url, data, header) {
        if (header)
            return this.axiosInstance.put(url, data, {
                headers: header,
            });
        return this.axiosInstance.put(url, data);
    }
    setUserInfo(value) {
        this.userInfo = value;
    }
    getUserInfo() {
        return this.userInfo
    }
    /**
     *
     * @param {string} url
     * @param {string} fileParamName data parameter name in form data object
     * @param {object} file
     * @param {string} additionalDataName optional
     * @param {object} additionalData optional
     */
    uploadData(url, fileParamName, file, additionalDataName, additionalData) {
        const formData = new FormData();
        formData.append(fileParamName, file);
        if (additionalDataName && additionalData) {
            formData.append(
                additionalDataName,
                new Blob([JSON.stringify(additionalData)], {
                    type: "application/json",
                })
            );
        }
        return this.axiosInstance.post(url, formData);
    }
    /**
     * @param {string} url
     * @param {any} data
     */
    putRequest(url, data) {
        return this.axiosInstance.put(url, data);
    }
    /**
     * @param {string} url
     */
    deleteRequest(url) {
        return this.axiosInstance.delete(url);
    }
    updateConstruction(url, data) {
        return this.axiosInstance.post(url, data);
    }
   
    LogUserActivity(DESCRIPTION_AR, DESCRIPTION_EN, ACTIVITY_ID, ACTIVITY_NAME) {
        
        if (!this.userInfo) 
            return;

        var UserApplications = this.userInfo ; 
        UserApplications.DESCRIPTION_AR = DESCRIPTION_AR;
        UserApplications.DESCRIPTION_EN = DESCRIPTION_EN;
        UserApplications.ACTIVITY_ID = ACTIVITY_ID;
        UserApplications.ACTIVITY_NAME = ACTIVITY_NAME;
        UserApplications.ROLE_NAME = this.userInfo.ROLE_EN_NAME;
        UserApplications.APPLICATION_NAME = this.userInfo.APPLICATION_EN_NAME;
        UserApplications.GROUP_NAME = this.userInfo.GROUP_EN_NAME;
        UserApplications.USER_NAME = this.userInfo.USERNAME;
        UserApplications.LOG_DATE = new Date().toISOString(); 
        UserApplications.ID = 0;

        try {
            const url = window.mapConfig.services.AddLog;
            const headers = {
                'Content-Type': 'application/json',
            };

            this.postRequest(url, JSON.stringify(UserApplications), headers)
                .then((response) => {
                  
                })
                .catch((error) => {
                   
                });
        } catch (error) {
         
        }
    }

}

let instance = null;

if (!instance) {
    instance = new RestServices();
}

export default instance;
