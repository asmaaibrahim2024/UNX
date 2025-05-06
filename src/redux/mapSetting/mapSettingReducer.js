import { ActionTypes } from "../constants/actionTypes";

const initialState = {
  mapSettingVisiblity: false,
  activeButton: "network-Services",
  networkServices: true,
  layerAliases: false,
  searchableLayers: false,
  propertiesLayerFields: false,
  resultDetailsLayerFields: false,
  identifyDetailsLayerFields: false,
};

export const mapSettingReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case ActionTypes.SET_MAP_SETTING_VISIBLITY:
      return { ...state, mapSettingVisiblity: payload };

    case ActionTypes.SET_MAP_SETTING_ACTIVE_BUTTON:
      return { ...state, activeButton: payload };

    case ActionTypes.SET_NETWORK_SERVICES_VISIBLITY:
      return { ...state, networkServices: payload };

    case ActionTypes.SET_LAYER_ALIASES_VISIBLITY:
      return { ...state, layerAliases: payload };

    case ActionTypes.SET_SEARCHABLE_LAYERS_VISIBLITY:
      return { ...state, searchableLayers: payload };

    case ActionTypes.SET_PROPERTIES_LAYER_FIELDS_VISIBLITY:
      return { ...state, propertiesLayerFields: payload };

    case ActionTypes.SET_RESULT_DETAILS_LAYER_FIELDS_VISIBLITY:
      return { ...state, resultDetailsLayerFields: payload };

    case ActionTypes.SET_IDENTIFY_DETAILS_LAYER_FIELDS_VISIBLITY:
      return { ...state, identifyDetailsLayerFields: payload };

    default:
      return state;
  }
};
