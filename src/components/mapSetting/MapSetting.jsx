import { React, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./MapSetting.scss";
import NetworkService from "./networkService/NetworkService";
import LayerAliases from "./layerAliases/LayerAliases";

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

  return <div className="map_setting_container">
    {networkServices && <NetworkService/>}
    {layerAliases && <LayerAliases/>}
  </div>;
}
