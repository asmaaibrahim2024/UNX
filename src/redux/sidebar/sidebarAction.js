import { ActionTypes } from "../constants/actionTypes";

export const setActiveButton = (activeButton) => {
  return {
    type: ActionTypes.SET_ACTIVE_BUTTON,
    payload: activeButton,
  };
};
