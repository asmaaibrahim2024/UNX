import { ActionTypes } from "../../constants/actionTypes";

export const setNetworkDiagramSplitterVisiblity = (isNetworkDiagramSplitterVisible) => {
  return {
    type: ActionTypes.SET_NETWORK_DIAGRAM_SPLITTER_VISIBLE,
    payload: isNetworkDiagramSplitterVisible,
  };
};
export const setNetworkDiagramView = (networkDiagramViewIntial) => {
  return {
    type: ActionTypes.SET_NETWORK_DIAGRAM_VIEW,
    payload: networkDiagramViewIntial,
  };
};
export const setExportDiagramUrl = (diagramExportUrlIntial) => {
  return {
    type: ActionTypes.SET_EXPORT_DIAGRAM_URL,
    payload: diagramExportUrlIntial,
  };
};