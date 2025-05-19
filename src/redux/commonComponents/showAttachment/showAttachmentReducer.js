import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  isAttachmentVisible: false,
  parentFeature: null,
};

export const showAttachmentReducer = (
  state = initialState,
  { type, payload }
) => {
  switch (type) {
    case ActionTypes.SET_ATTACHMENT_VISIBLITY:
      return { ...state, isAttachmentVisible: payload };
    case ActionTypes.SET_ATTACHMENT_PARENT_FEATURE:
      return { ...state, parentFeature: payload };

    default:
      return state;
  }
};
