import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  isContainmentVisible: false,
  parentFeature: null,
};

export const showContainmentReducer = (
  state = initialState,
  { type, payload }
) => {
  switch (type) {
    case ActionTypes.SET_CONTAINMENT_VISIBLITY:
      return { ...state, isContainmentVisible: payload };
    case ActionTypes.SET_CONTAINMENT_PARENT_FEATURE:
      return { ...state, parentFeature: payload };

    default:
      return state;
  }
};
