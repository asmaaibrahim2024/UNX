import { ActionTypes } from "../constants/actionTypes";

export const setMapSettingVisiblity = (mapSettingVisiblity) => {
  return {
    type: ActionTypes.SET_MAP_SETTING_VISIBLITY,
    payload: mapSettingVisiblity,
  };
};

export const setMapSettingConfigActiveButton = (activeButton) => {
  return {
    type: ActionTypes.SET_MAP_SETTING_ACTIVE_BUTTON,
    payload: activeButton,
  };
};

export const setNetworkServicesVisiblity = (networkServices) => {
  return {
    type: ActionTypes.SET_NETWORK_SERVICES_VISIBLITY,
    payload: networkServices,
  };
};

export const setLayerAliasesVisiblity = (layerAliases) => {
  return {
    type: ActionTypes.SET_LAYER_ALIASES_VISIBLITY,
    payload: layerAliases,
  };
};

export const setSearchableLayersVisiblity = (searchableLayers) => {
  return {
    type: ActionTypes.SET_SEARCHABLE_LAYERS_VISIBLITY,
    payload: searchableLayers,
  };
};

export const setPropertiesLayerFieldsVisiblity = (propertiesLayerFields) => {
  return {
    type: ActionTypes.SET_PROPERTIES_LAYER_FIELDS_VISIBLITY,
    payload: propertiesLayerFields,
  };
};

export const setResultDetailsLayerFieldsVisiblity = (resultDetailsLayerFields) => {
  return {
    type: ActionTypes.SET_RESULT_DETAILS_LAYER_FIELDS_VISIBLITY,
    payload: resultDetailsLayerFields,
  };
};

export const setIdentifyDetailsLayerFieldsVisiblity = (identifyDetailsLayerFields) => {
  return {
    type: ActionTypes.SET_IDENTIFY_DETAILS_LAYER_FIELDS_VISIBLITY,
    payload: identifyDetailsLayerFields,
  };
};


export const setUtilityNetwork = (utilityNetwork) => {
  return {
      type: ActionTypes.SET_UTILITYNETWORK,
      payload: utilityNetwork
  };
};

export const setFeatureServiceLayers = (featureServiceLayers) => {
  return {
      type: ActionTypes.SET_FEATURE_SERVICE_LAYERS,
      payload: featureServiceLayers
  };
};



