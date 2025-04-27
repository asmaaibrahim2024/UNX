
 import React, { useState } from "react";
 import './Layout.scss'
 import { Layout } from "antd";
 import Sidebar from "../sidebar/Sidebar";
  import Header from "../home/header/Header";
 import MapContainer from "../mapContainer/MapContainer";
//  import { useTranslation } from "react-i18next";
import { useI18n } from "../../handlers/languageHandler";
const { Content } = Layout;
const AppLayout = () => {
  //  const { t, i18n,dir } = useTranslation("Layout");
  // const direction = i18n.dir(i18n.language);
    const { t, direction, dirClass } = useI18n("Layout");
  
  return (
    <div dir={direction} className="app-layout">
    <Header/>
  <div className="sidebar-container">
    <Sidebar />
    <div className="map-container">
    <MapContainer />
  </div>
  </div>
  
</div>

  );
};

export default AppLayout;
