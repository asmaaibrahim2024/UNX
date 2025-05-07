import { React, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./MapSetting.scss";
import NetworkService from "./networkService/NetworkService";
import LayerAliases from "./layerAliases/LayerAliases";
import SearchableLayers from "./searchableLayers/SearchableLayers";
import PropertiesFields from "./propertiesFields/PropertiesFields";
import SearchResultFields from "./searchResultFields/SearchResultFields";
import IdentifyFields from "./identifyFields/IdentifyFields";

export default function MapSetting() {

  const networkServices = useSelector(
    (state) => state.mapSettingReducer.networkServices
  );

  const layerAliases = useSelector(
    (state) => state.mapSettingReducer.layerAliases
  );

  const searchableLayers = useSelector(
    (state) => state.mapSettingReducer.searchableLayers
  );

  const propertiesLayerFields = useSelector(
    (state) => state.mapSettingReducer.propertiesLayerFields
  );

  const resultDetailsLayerFields = useSelector(
    (state) => state.mapSettingReducer.resultDetailsLayerFields
  );

  const identifyDetailsLayerFields = useSelector(
    (state) => state.mapSettingReducer.identifyDetailsLayerFields
  );

  return <div className="map_setting_container">
    {networkServices && <NetworkService/>}
    {layerAliases && <LayerAliases/>}
    {searchableLayers && <SearchableLayers/>}
    {propertiesLayerFields && <PropertiesFields/>}
    {resultDetailsLayerFields && <SearchResultFields/>}
    {identifyDetailsLayerFields && <IdentifyFields/>}
  </div>;
}
