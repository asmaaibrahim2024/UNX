import { ActionTypes } from "../constants/actionTypes";

const initialState = {
    intialLanguage:"en",
    userDataIntial: null
};

export const layoutReducer = (state = initialState, { type, payload }) => {
     switch (type) {
        case ActionTypes.CHANGE_LANGUAGE:
            return { ...state, intialLanguage: payload }
            case ActionTypes.SET_USER_DATA:
                return { ...state, userDataIntial: payload }
         default:
            return state; 
    }
} 