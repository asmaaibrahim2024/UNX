
 import React, { useState } from "react";
 import { Layout } from "antd";
 import Sidebar from "../sidebar/Sidebar";
 import MapContainer from "../mapContainer/MapContainer";
 import { useTranslation } from "react-i18next";

const { Content } = Layout;

const AppLayout = () => {
   const { t, i18n,dir } = useTranslation("Layout");
  const direction = i18n.dir(i18n.language);
  
  return (
    <div dir={direction}>
    <div className="app-layout">
    <div className="sidebar-container">
      <Sidebar />
    </div>
    <div className="map-container">
      <MapContainer />
    </div>
  </div>
      </div>

  );
};

export default AppLayout;
