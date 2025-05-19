import { ActionTypes } from "../../constants/actionTypes";

const initialState = {
  traceGraphicsLayer: null,
  traceConfigurations: [],
  selectedTraceTypes: [],
  traceLocations: [],
  selectedPoints: {StartingPoints: [], Barriers: []},
  traceErrorMessage: null,
  traceConfigHighlights: null,
  traceResultsElements: null,
  groupedTraceResultGlobalIds:{},
  queriedTraceResultFeaturesMap: {},
};

export const traceReducer = (state = initialState, { type, payload }) => {
  switch (type) {
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
      traceLocations: [...state.traceLocations, payload.traceLocation],
    };

    case ActionTypes.REMOVE_TRACE_POINT:
    return {
      ...state,
      selectedPoints: {
        ...state.selectedPoints,
        StartingPoints: state.selectedPoints.StartingPoints.filter(
          ([, id, percentAlong]) => `${id}-${percentAlong}` !== payload.globalIdWithPercentAlong
        ),
        Barriers: state.selectedPoints.Barriers.filter(
          ([, id, percentAlong]) => `${id}-${percentAlong}` !== payload.globalIdWithPercentAlong
        ),
        // StartingPoints: state.selectedPoints.StartingPoints.filter(
        //   ([, id]) => id !== payload.globalId
        // ),
        // Barriers: state.selectedPoints.Barriers.filter(
        //   ([, id]) => id !== payload.globalId
        // ),
      },
      traceLocations: state.traceLocations.filter(
        (location) => `${location.globalId}-${location.percentAlong}` !== payload.globalIdWithPercentAlong
        // (location) => location.globalId !== payload.globalId
      ),
    };
  
    case ActionTypes.SET_TRACE_RESULTS_ELEMENTS:
    return { ...state, traceResultsElements: payload };
  
    case ActionTypes.SET_TRACE_CONFIG_HIGHLIGHTS:
    return { ...state, traceConfigHighlights: payload };
  

  
    case ActionTypes.SET_TRACE_GRAPHICS_LAYER:
      return { ...state, traceGraphicsLayer: payload };
    
    case ActionTypes.SET_TRACE_ERROR_MESSAGE:
      return { ...state, traceErrorMessage: payload };
    
    case ActionTypes.SET_SELECTED_TRACE_TYPE:
      return { ...state, selectedTraceTypes: payload };

    case ActionTypes.CLEAR_TRACE_SELECTED_POINTS:
        return {
          ...state,
          selectedPoints: {...state.selectedPoints, StartingPoints: [], Barriers: []},
          traceLocations: [],
        };
    
        
    case ActionTypes.SET_TRACE_RESULT_GLOBAL_IDS:
        return {...state, groupedTraceResultGlobalIds:payload}

    case ActionTypes.SET_QUERIED_TRACE_RESULT_FEATURES_MAP:
      return {...state, queriedTraceResultFeaturesMap:payload}

    default:
      return state;
  }
};
