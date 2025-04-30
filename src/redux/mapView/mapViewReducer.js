import { ActionTypes } from "../constants/actionTypes";

const initialState = {
  intialView: null,
  intialWebMap: null,
  layersAndTablesData: null,
  networkService: null,
};

export const mapViewReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case ActionTypes.SET_VIEW:
      return { ...state, intialView: payload };
    case ActionTypes.SET_WEBMAP:
      return { ...state, intialWebMap: payload };
    case ActionTypes.SET_LAYERS_AND_TABLES_DATA:
      return { ...state, layersAndTablesData: payload };
    case ActionTypes.SET_NETWORK_SERVICE:
      return { ...state, networkService: payload };

    default:
      return state;
  }
};
