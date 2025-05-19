import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  isContainmentVisible: true,
};

export const showContainmentReducer = (
  state = initialState,
  { type, payload }
) => {
  switch (type) {
    case ActionTypes.SET_CONTAINMENT_VISIBLITY:
      return { ...state, isContainmentVisible: payload };

    default:
      return state;
  }
};
