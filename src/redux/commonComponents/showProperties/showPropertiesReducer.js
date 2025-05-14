import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  showPropertiesFeature: null,
};

export const showPropertiesReducer = (
  state = initialState,
  { type, payload }
) => {
  switch (type) {
    case ActionTypes.SET_SHOW_PROPERTIES_FEATURE:
      return { ...state, showPropertiesFeature: payload };
    default:
      return state;
  }
};
