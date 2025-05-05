import { ActionTypes } from "../constants/actionTypes";

export const setMapSettingVisiblity = (mapSettingVisiblity) => {
  return {
    type: ActionTypes.SET_MAP_SETTING_VISIBLITY,
    payload: mapSettingVisiblity,
  };
};
