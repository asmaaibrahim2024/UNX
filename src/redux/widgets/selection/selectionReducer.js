import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
    isGettingSelectionData:false,
    selectedFeatures:[],
    expandedGroups:[],
    expandedTypes:[],
    expandedObjects:[]
 };

export const selectionReducer = (state = initialState, { type, payload }) => {
     switch (type) {
        case ActionTypes.SET_IS_GETTING_SELECTION_DATA:
            return {...state, isGettingSelectionData:payload}
        case ActionTypes.SET_SELECTED_FEATURES:
            return {...state, selectedFeatures:payload}
        case ActionTypes.SET_EXPANDED_GROUPS:
            return {...state, expandedGroups:payload}
        case ActionTypes.SET_EXPANDED_TYPES:
            return {...state, expandedTypes:payload}
        case ActionTypes.SET_EXPANDED_OBJECTS:
            return {...state, expandedObjects:payload}
  
         default:
            return state; 
    }
}