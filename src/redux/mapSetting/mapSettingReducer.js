import { ActionTypes } from "../constants/actionTypes";

const initialState = {
  mapSettingVisiblity: false,
};

export const mapSettingReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case ActionTypes.SET_MAP_SETTING_VISIBLITY:
      return { ...state, mapSettingVisiblity: payload };

    default:
      return state;
  }
};
