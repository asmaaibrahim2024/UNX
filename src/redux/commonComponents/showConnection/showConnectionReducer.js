import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  isConnectionVisible: false,
  isConnectionFullScreen: false,
};

export const showConnectionReducer = (
  state = initialState,
  { type, payload }
) => {
  switch (type) {
    case ActionTypes.SET_CONNECTION_VISIBLITY:
      return { ...state, isConnectionVisible: payload };
    case ActionTypes.SET_CONNECTION_FullSCREEN:
      return { ...state, isConnectionFullScreen: payload };

    default:
      return state;
  }
};
