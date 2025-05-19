import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  isAttachmentVisible: false,
};

export const showAttachmentReducer = (
  state = initialState,
  { type, payload }
) => {
  switch (type) {
    case ActionTypes.SET_ATTACHMENT_VISIBLITY:
      return { ...state, isAttachmentVisible: payload };

    default:
      return state;
  }
};
