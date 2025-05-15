import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  isConnectionVisible: false,
};

export const showConnectionReducer = (
  state = initialState,
  { type, payload }
) => {
  switch (type) {
    case ActionTypes.SET_CONNECTION_VISIBLITY:
      return { ...state, isConnectionVisible: payload };
    default:
      return state;
  }
};
