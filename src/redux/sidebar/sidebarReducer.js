import { ActionTypes } from "../constants/actionTypes";

const initialState = {
  activeButton: null,
};

export const sidebarReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    //     case ActionTypes.SET_CURRENT_VIEW_EXTENT:
    //         return { ...state, currentViewExtent: payload }
    case ActionTypes.SET_ACTIVE_BUTTON:
      return { ...state, activeButton: payload };
    default:
      return state;
  }
};
