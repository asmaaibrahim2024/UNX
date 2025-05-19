import { ActionTypes } from "../../constants/actionTypes";

export const setAttachmentVisiblity = (isAttachmentVisible) => {
  return {
    type: ActionTypes.SET_ATTACHMENT_VISIBLITY,
    payload: isAttachmentVisible,
  };
};
