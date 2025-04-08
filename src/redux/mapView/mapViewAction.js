
import { ActionTypes } from "../constants/actionTypes";

export const setView = (intialView) => {
    return {
        type: ActionTypes.SET_VIEW,
        payload: intialView
    }
}
export const setWebMap = (intialWebMap) => {
    return {
        type: ActionTypes.SET_WEBMAP,
        payload: intialWebMap
    }
}