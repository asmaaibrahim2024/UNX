import "./BaseMapGallery.scss";
import React, { useEffect, useState, useRef } from "react";
import { useI18n } from "../../../handlers/languageHandler";

import { useDispatch, useSelector } from "react-redux";

import { createBasemapGallery } from "../../../handlers/esriHandler";

import close from "../../../style/images/x-close.svg";
import grid from "../../../style/images/grid.svg";
import edit from "../../../style/images/edit-pen.svg";

import { useTranslation } from "react-i18next";

export default function BaseMapGallery({ containerRef, onclose }) {
  const dispatch = useDispatch();
  const { t, direction } = useI18n("BaseMapGallery");
  const { i18n } = useTranslation("BaseMapGallery");

  const [uniqueId] = useState("BaseMapGallery-map-tool-container");

  const zIndexPanel = useSelector((state) => state.uiReducer.zIndexPanel);

  // Set z-index: 100 if this component is active, else 1
  const zIndex = zIndexPanel === "BaseMapGallery" ? 100 : 1;
  const mapView = useSelector((state) => state.mapViewReducer.intialView);

  const baseMapWGRef = useRef(null);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (!mapView?.map || isInitialized.current) return;

    const setupbaseMapGallery = async () => {
      const baseMapWidget = await createBasemapGallery(mapView, uniqueId);
      baseMapWGRef.current = baseMapWidget;

      isInitialized.current = true;
    };

    setupbaseMapGallery();
  }, [mapView]);
  return (
    <div
      ref={containerRef}
      className="basemap-gallery-container sidebar_widget"
      style={{ display: "none", zIndex }}
    >
      <div className="sidebar_widget_header">
        <div className="header_title_container">
          <img src={grid} alt="layer" className="sidebar_widget_icon" />

          <span class="title">{t("BaseMapGallery")}</span>
        </div>
        <img
          src={close}
          alt="close"
          width="25"
          height="24"
          className="sidebar_widget_close"
          onClick={() => onclose()}
        />
      </div>
      <div className="sidebar_widget_body esri-basemap-gallery">
        <div id={uniqueId}></div>
      </div>
    </div>
    // )
  );
}
