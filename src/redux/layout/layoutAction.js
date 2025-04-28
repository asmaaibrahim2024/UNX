import { ActionTypes } from "../constants/actionTypes";
export const changeLanguage = (intialLanguage) => {
    return {
        type: ActionTypes.CHANGE_LANGUAGE,
        payload: intialLanguage
    }
}
export const setUserData = (userDataIntial) => {
    return {
        type: ActionTypes.SET_USER_DATA,
        payload: userDataIntial
    }
}