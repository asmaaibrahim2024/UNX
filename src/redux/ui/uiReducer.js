import { ActionTypes } from "../constants/actionTypes";

const initialState = {
  zIndexPanel: null,
};

export const uiReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case ActionTypes.SET_ZINDEX_PANEL:
      return { ...state, zIndexPanel: payload };
    default:
      return state;
  }
};
