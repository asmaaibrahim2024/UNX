import { ActionTypes } from "../constants/actionTypes";

const initialState = {
};

export const sidebarReducer = (state = initialState, { type, payload }) => {
     switch (type) {
    //     case ActionTypes.SET_CURRENT_VIEW_EXTENT:
    //         return { ...state, currentViewExtent: payload }
         default:
            return state; 
    }
} 