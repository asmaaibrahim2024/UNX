import { ActionTypes } from "../../constants/actionTypes";




export const setSelectedFeatures=(selectedFeatures)=>{
    return {
        type: ActionTypes.SET_SELECTED_FEATURES,
        payload: selectedFeatures
    }
}
export const setExpandedGroups = (expandedGroups)=>{
    return {
        type: ActionTypes.SET_EXPANDED_GROUPS,
        payload: expandedGroups
    }
}
export const setExpandedTypes = (expandedTypes)=>{
    return {
        type: ActionTypes.SET_EXPANDED_TYPES,
        payload: expandedTypes
    }

}
export const setExpandedObjects = (expandedObjects)=>{
    return {
        type: ActionTypes.SET_EXPANDED_OBJECTS,
        payload: expandedObjects
    }
}