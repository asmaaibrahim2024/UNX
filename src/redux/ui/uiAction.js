import { ActionTypes } from "../constants/actionTypes";

export const setZIndexPanel = (zIndexPanel) => {
  return {
    type: ActionTypes.SET_ZINDEX_PANEL,
    payload: zIndexPanel,
  };
};
