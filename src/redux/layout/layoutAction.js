import { ActionTypes } from "../constants/actionTypes";
export const changeLanguage = (intialLanguage) => {
    return {
        type: ActionTypes.CHANGE_LANGUAGE,
        payload: intialLanguage
    }
}