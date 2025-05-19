import { ActionTypes } from "../../constants/actionTypes";

export const setContainmentVisiblity = (isContainmentVisible) => {
  return {
    type: ActionTypes.SET_CONTAINMENT_VISIBLITY,
    payload: isContainmentVisible,
  };
};
