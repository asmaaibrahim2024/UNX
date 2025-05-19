import { ActionTypes } from "../../constants/actionTypes";

export const setNetworkDiagramSplitterVisiblity = (isNetworkDiagramSplitterVisible) => {
  return {
    type: ActionTypes.SET_NETWORK_DIAGRAM_SPLITTER_VISIBLE,
    payload: isNetworkDiagramSplitterVisible,
  };
};
