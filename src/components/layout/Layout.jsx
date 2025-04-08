
 import React, { useState } from "react";
 import { Layout } from "antd";
 import Sidebar from "../sidebar/Sidebar";
 import MapContainer from "../mapContainer/MapContainer";

const { Content } = Layout;

const AppLayout = () => {
  return (
    <div className="app-layout">
    <div className="sidebar-container">
      <Sidebar />
    </div>
    <div className="map-container">
      <MapContainer />
    </div>
  </div>
  );
};

export default AppLayout;
