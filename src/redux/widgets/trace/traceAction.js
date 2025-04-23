import { ActionTypes } from "../../constants/actionTypes";


export const setTraceConfigurations = (traceConfigurations) => {
    return {
        type: ActionTypes.SET_TRACE_CONFIGURATIONS,
        payload: traceConfigurations
    }
}

export const addTraceSelectedPoint = (type, newPoint, traceLocation) => {
    return {
        type: ActionTypes.ADD_TRACE_SELECTED_POINT,
        payload: { type, newPoint, traceLocation}
    };
};

export const removeTracePoint = (globalId) => {
    return {
        type: ActionTypes.REMOVE_TRACE_POINT,
        payload: { globalId }
    };
};
export const setTraceResultsElements = (traceResultsElements) => {
    return {
        type: ActionTypes.SET_TRACE_RESULTS_ELEMENTS,
        payload: traceResultsElements
    };
};
export const setTraceConfigHighlights = (traceConfigHighlights) => {
    return {
        type: ActionTypes.SET_TRACE_CONFIG_HIGHLIGHTS,
        payload: traceConfigHighlights
    };
};
export const setUtilityNetwork = (utilityNetworkIntial) => {
    return {
        type: ActionTypes.SET_UTILITYNETWORK,
        payload: utilityNetworkIntial
    };
};
export const setTraceErrorMessage = (traceErrorMessage) => {
    return {
        type: ActionTypes.SET_TRACE_ERROR_MESSAGE,
        payload: traceErrorMessage
    };
};


export const setTraceGraphicsLayer = (traceGraphicsLayer) => {
    return {
        type: ActionTypes.SET_TRACE_GRAPHICS_LAYER,
        payload: traceGraphicsLayer
    };
};


export const setSelectedTraceTypes = (selectedTraceTypes) => {
    return {
        type: ActionTypes.SET_SELECTED_TRACE_TYPE,
        payload: selectedTraceTypes
    };
};
export const clearTraceSelectedPoints = () => {
    return {
        type: ActionTypes.CLEAR_TRACE_SELECTED_POINTS,
    };
};
