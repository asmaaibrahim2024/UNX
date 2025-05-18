import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  isNetworkDiagramSplitterVisible: false,
};

export const networkDiagramReducer = (
  state = initialState,
  { type, payload }
) => {
  switch (type) {
    case ActionTypes.SET_NETWORK_DIAGRAM_SPLITTER_VISIBLE:
      return { ...state, isNetworkDiagramSplitterVisible: payload };
    default:
      return state;
  }
};
