import { ActionTypes } from "../../constants/actionTypes";
export const setUtilityNetworkSpatialReference = (utilityNetworkSpatialReference) => {
    return {
        type: ActionTypes.SET_UTILITYNETWORK_SPATIALREFERENCE,
        payload: utilityNetworkSpatialReference
    }
}
export const setUtilityNetworkServiceUrl = (utilityNetworkServiceUrl) => {
    return {
        type: ActionTypes.SET_UTILITYNETWORK_SERVICE_URL,
        payload: utilityNetworkServiceUrl
    }
}
export const setTraceConfigurations = (traceConfigurations) => {
    return {
        type: ActionTypes.SET_TRACE_CONFIGURATIONS,
        payload: traceConfigurations
    }
}

export const addTraceSelectedPoint = (type, newPoint) => {
    return {
        type: ActionTypes.ADD_TRACE_SELECTED_POINT,
        payload: { type, newPoint }
    };
};

export const addTraceLocation = (traceLocation) => {
    return {
        type: ActionTypes.ADD_TRACE_LOCATION,
        payload: traceLocation
    };
};

export const removeTracePoint = (globalId) => {
    return {
        type: ActionTypes.REMOVE_TRACE_POINT,
        payload: { globalId }
    };
};
export const setCategorizedElements = (categorizedElementsIntial) => {
    return {
        type: ActionTypes.SET_CATEGORIZED_ELEMENTS,
        payload: categorizedElementsIntial
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
export const setAssetsData = (assetsDataIntial) => {
    return {
        type: ActionTypes.SET_ASSETS_DATA,
        payload: assetsDataIntial
    };
};
export const setTraceErrorMessage = (traceErrorMessage) => {
    return {
        type: ActionTypes.SET_TRACE_ERROR_MESSAGE,
        payload: traceErrorMessage
    };
};

export const clearTraceErrorMessage = () => {
    return {
        type: ActionTypes.CLEAR_TRACE_ERROR_MESSAGE,
    };
};
export const setTraceGraphicsLayer = (traceGraphicsLayer) => {
    return {
        type: ActionTypes.SET_TRACE_GRAPHICS_LAYER,
        payload: traceGraphicsLayer
    };
};

export const settestTraceGraphicsLayer = (testtraceGraphicsLayer) => {
    return {
        type: ActionTypes.SET_TRACE_GRAPHICS_LAYER,
        payload: testtraceGraphicsLayer
    };
};

export const clearTraceGraphicsLayer = () => {
    return {
        type: ActionTypes.CLEAR_TRACE_GRAPHICS_LAYER,
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
export const setLayersData = (traceLayersData) => {
    return {
        type: ActionTypes.SET_TRACE_LAYERS_DATA,
        payload: traceLayersData
    };
};