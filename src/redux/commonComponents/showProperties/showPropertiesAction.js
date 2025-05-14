import { ActionTypes } from "../../constants/actionTypes";

export const setShowPropertiesFeature = (feature) => {
  return {
    type: ActionTypes.SET_SHOW_PROPERTIES_FEATURE,
    payload: feature,
  };
};
