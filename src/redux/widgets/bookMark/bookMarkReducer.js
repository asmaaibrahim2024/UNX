import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
     bookmarkList: [],
     bookmarkFilterText:''
 };

export const bookMarkReducer = (state = initialState, { type, payload }) => {
     switch (type) {
         case ActionTypes.FILL_BOOKMARKS:
             return { ...state, bookmarkList: payload }
             case ActionTypes.BOOKMARK_FILTER_TEXT:
               return { ...state, bookmarkFilterText: payload }
         default:
            return state; 
    }
} 