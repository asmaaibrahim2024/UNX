import { React, useState } from "react";
import "./MapSetting.scss";
import NetworkService from "./networkService/NetworkService";
import LayerAliases from "./layerAliases/LayerAliases";

export default function MapSetting() {
  return <div className="map_setting_container">
    <NetworkService/>
    {/* <LayerAliases/> */}
  </div>;
}
