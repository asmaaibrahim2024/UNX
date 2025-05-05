import { ActionTypes } from "../../constants/actionTypes";


export const setDisplaySearchResults = (displaySearchResults) => {
    return {
        type: ActionTypes.SET_DISPLAY_SEARCH_RESULTS,
        payload: displaySearchResults
    };
};



export const setSearchResults = (searchResults) => {
    return {
        type: ActionTypes.SET_SEARCH_RESULTS,
        payload: searchResults
    };
};