import { ActionTypes } from "../../constants/actionTypes";

export const setConnectionVisiblity = (isConnectionVisible) => {
  return {
    type: ActionTypes.SET_CONNECTION_VISIBLITY,
    payload: isConnectionVisible,
  };
};

export const setConnectionFullScreen = (isConnectionFullScreen) => {
  return {
    type: ActionTypes.SET_CONNECTION_FullSCREEN,
    payload: isConnectionFullScreen,
  };
};

export const setConnectionParentFeature = (feature) => {
  return {
    type: ActionTypes.SET_CONNECTION_PARENT_FEATURE,
    payload: feature,
  };
};
