
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
export const setLayersAndTablesData = (layersAndTablesData) => {
    return {
        type: ActionTypes.SET_LAYERS_AND_TABLES_DATA,
        payload: layersAndTablesData
    };
}