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
export const setDiagramModelData  = (diagramModelData) => {
  return {
    type: ActionTypes.SET_DIAGRAM_MODEL_DATA,
    payload: diagramModelData,
  };
};
export const triggerSplitRerender   = () => {
  return {
    type: ActionTypes.TRIGGER_SPLIT_RERENDER,
  };
};
export const setDiagramLoader  = (isDiagramLoadingIntial) => {
  return {
    type: ActionTypes.SET_DIAGRAM_LOADER,
    payload: isDiagramLoadingIntial,
  };
};