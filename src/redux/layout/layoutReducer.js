import { ActionTypes } from "../constants/actionTypes";

const initialState = {
    intialLanguage:"en"
};

export const layoutReducer = (state = initialState, { type, payload }) => {
     switch (type) {
        case ActionTypes.CHANGE_LANGUAGE:
            return { ...state, intialLanguage: payload }
         default:
            return state; 
    }
} 