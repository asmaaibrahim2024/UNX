import { combineReducers } from "redux";
import { mapViewReducer } from "./mapView/mapViewReducer";
import { bookMarkReducer } from "./widgets/bookMark/bookMarkReducer";
import { connectionExplorerReducer } from "./widgets/connectionExplorer/connectionExplorerReducer";
import { containmentExplorerReducer } from "./widgets/containmentExplorer/containmentExplorerReducer";
import { findReducer } from "./widgets/find/findReducer";
import { selectionReducer } from "./widgets/selection/selectionReducer";
import { traceReducer } from "./widgets/trace/traceReducer";
import { validateReducer } from "./widgets/validate/validateReducer";
import { layerListReducer } from "./widgets/layerList/layerListReducer";
import { networkDiagramReducer } from "./widgets/networkDiagram/networkDiagramReducer";
import { layoutReducer } from "./layout/layoutReducer";
import { sidebarReducer } from "./sidebar/sidebarReducer";
import { mapContainerReducer } from "./mapContainer/mapContainerReducer";
import { homeReducer } from "./home/homeReducer";
import { uiReducer } from "./ui/uiReducer";
import { loginReducer } from "./login/loginReducer";
import { ActionTypes } from "./constants/actionTypes";
import { mapSettingReducer } from "./mapSetting/mapSettingReducer";
import { showPropertiesReducer } from "./commonComponents/showProperties/showPropertiesReducer";

const reducers = combineReducers({
  mapViewReducer: mapViewReducer,
  bookMarkReducer: bookMarkReducer,
  sidebarReducer: sidebarReducer,
  layoutReducer: layoutReducer,
  mapContainerReducer: mapContainerReducer,
  uiReducer: uiReducer,
  homeReducer: homeReducer,
  connectionExplorerReducer: connectionExplorerReducer,
  containmentExplorerReducer: containmentExplorerReducer,
  findReducer: findReducer,
  layerListReducer: layerListReducer,
  networkDiagramReducer: networkDiagramReducer,
  selectionReducer: selectionReducer,
  traceReducer: traceReducer,
  validateReducer: validateReducer,
  loginReducer: loginReducer,
  mapSettingReducer: mapSettingReducer,
  showPropertiesReducer: showPropertiesReducer,
});

const rootReducer = (state, action) => {
  // Clear all data in redux store to initial.
  if (action.type === ActionTypes.LOGOUT_FULFILLED) state = undefined;

  return reducers(state, action);
};
export default rootReducer;
