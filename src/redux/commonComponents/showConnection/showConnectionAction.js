import { ActionTypes } from "../../constants/actionTypes";

export const setConnectionVisiblity = (isConnectionVisible) => {
  return {
    type: ActionTypes.SET_CONNECTION_VISIBLITY,
    payload: isConnectionVisible,
  };
};
