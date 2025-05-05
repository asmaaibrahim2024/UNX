import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
    displaySearchResults: false,
    searchResults: null,
 };

export const findReducer = (state = initialState, { type, payload }) => {
    switch (type) {
    
    case ActionTypes.SET_DISPLAY_SEARCH_RESULTS:
        return { ...state, displaySearchResults: payload };

    case ActionTypes.SET_SEARCH_RESULTS:
    return { ...state, searchResults: payload };

        default:
        return state; 
}
} 