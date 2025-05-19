import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  isConnectionVisible: false,
  parentFeature: null,
};

export const showConnectionReducer = (
  state = initialState,
  { type, payload }
) => {
  switch (type) {
    case ActionTypes.SET_CONNECTION_VISIBLITY:
      return { ...state, isConnectionVisible: payload };
    case ActionTypes.SET_CONNECTION_PARENT_FEATURE:
      return { ...state, parentFeature: payload };
    default:
      return state;
  }
};
