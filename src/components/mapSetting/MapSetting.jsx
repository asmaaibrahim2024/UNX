import { React, useState } from "react";
import "./MapSetting.scss";
import NetworkService from "./networkService/NetworkService";

export default function MapSetting() {
  return <div className="map_setting_container">
    <NetworkService/>
  </div>;
}
