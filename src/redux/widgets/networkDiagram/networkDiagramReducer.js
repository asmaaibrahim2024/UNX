import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  isNetworkDiagramSplitterVisible: false,
  networkDiagramViewIntial:null,
  diagramExportUrlIntial:null,
  diagramModelData:null,
    renderKey: 0,
    isDiagramLoadingIntial:false

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
          case ActionTypes.SET_EXPORT_DIAGRAM_URL:
      return { ...state, diagramExportUrlIntial: payload };
           case ActionTypes.SET_DIAGRAM_LOADER:
      return { ...state, isDiagramLoadingIntial: payload };
                case ActionTypes.SET_DIAGRAM_MODEL_DATA:
      return { ...state, diagramModelData: payload };
                     case ActionTypes.TRIGGER_SPLIT_RERENDER:
      return {
        ...state,
        isNetworkDiagramSplitterVisible: true,
        renderKey: state.renderKey + 1
      };
    default:
      return state;
  }
};
