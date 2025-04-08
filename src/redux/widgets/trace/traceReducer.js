import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  traceConfigurations: [],
  utilityNetworkServiceUrl: "",
  utilityNetworkSpatialReference: "",
  utilityNetworkIntial: null,
  assetsDataIntial: null,
  traceErrorMessage: null,
  selectedTraceTypes: [],
  traceGraphicsLayer: null,
  traceLocations: [],
  selectedPoints: {
    StartingPoints: [],
    Barriers: [],
  },
  traceConfigHighlights: null,
  categorizedElementsIntial: null,
  traceLayersData:null
};

export const traceReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case ActionTypes.SET_UTILITYNETWORK_SPATIALREFERENCE:
      return { ...state, utilityNetworkSpatialReference: payload };
    
    case ActionTypes.SET_UTILITYNETWORK_SERVICE_URL:
    return { ...state, utilityNetworkServiceUrl: payload };
  
    case ActionTypes.SET_TRACE_CONFIGURATIONS:
    return { ...state, traceConfigurations: payload };
  
    case ActionTypes.ADD_TRACE_SELECTED_POINT:
    return {
      ...state,
      selectedPoints: {
        ...state.selectedPoints,
        [payload.type === "startingPoint" ? "StartingPoints" : "Barriers"]: [
          ...state.selectedPoints[
            payload.type === "startingPoint" ? "StartingPoints" : "Barriers"
          ],
          payload.newPoint,
        ],
      },
    };

    case ActionTypes.ADD_TRACE_LOCATION:
      return {
        ...state,
        traceLocations: [...state.traceLocations, payload],
      };
  
    case ActionTypes.REMOVE_TRACE_POINT:
    return {
      ...state,
      selectedPoints: {
        ...state.selectedPoints,
        StartingPoints: state.selectedPoints.StartingPoints.filter(
          ([, id]) => id !== payload.globalId
        ),
        Barriers: state.selectedPoints.Barriers.filter(
          ([, id]) => id !== payload.globalId
        ),
      },
      traceLocations: state.traceLocations.filter(
        (location) => location.globalId !== payload.globalId
      ),
    };
  
    case ActionTypes.SET_CATEGORIZED_ELEMENTS:
    return { ...state, categorizedElementsIntial: payload };
  
    case ActionTypes.SET_TRACE_CONFIG_HIGHLIGHTS:
    return { ...state, traceConfigHighlights: payload };
  

    case ActionTypes.SET_UTILITYNETWORK:
    return { ...state, utilityNetworkIntial: payload };
  
    case ActionTypes.SET_ASSETS_DATA:
    return { ...state, assetsDataIntial: payload };
  
    case ActionTypes.SET_TRACE_GRAPHICS_LAYER:
      return { ...state, traceGraphicsLayer: payload };

    case ActionTypes.CLEAR_TRACE_GRAPHICS_LAYER:
      return {
        ...state,
        traceGraphicsLayer: null,
      };
    
    case ActionTypes.SET_TRACE_ERROR_MESSAGE:
      return { ...state, traceErrorMessage: payload };
    
    case ActionTypes.CLEAR_TRACE_ERROR_MESSAGE:
      return {
        ...state,
        traceErrorMessage: null,
      };
    
    case ActionTypes.SET_TRACE_LAYERS_DATA:
             return { ...state, traceLayersData: payload };
    
    case ActionTypes.SET_SELECTED_TRACE_TYPE:
      return { ...state, selectedTraceTypes: payload };

    case ActionTypes.CLEAR_TRACE_SELECTED_POINTS:
        return {
          ...state,
          selectedPoints: {
            ...state.selectedPoints,
            StartingPoints: [],
            Barriers: [],
          },
          traceLocations: [],
        };
    
    default:
      return state;
  }
};
