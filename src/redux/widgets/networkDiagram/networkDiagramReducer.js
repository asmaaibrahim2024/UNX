import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  isNetworkDiagramSplitterVisible: false,
  networkDiagramViewIntial:null
};

export const networkDiagramReducer = (
  state = initialState,
  { type, payload }
) => {
  switch (type) {
    case ActionTypes.SET_NETWORK_DIAGRAM_SPLITTER_VISIBLE:
      return { ...state, isNetworkDiagramSplitterVisible: payload };
       case ActionTypes.SET_NETWORK_DIAGRAM_VIEW:
      return { ...state, networkDiagramViewIntial: payload };
    default:
      return state;
  }
};
