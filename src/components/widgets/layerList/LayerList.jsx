import "./LayerList.scss";
import React, { useEffect, useState, useRef } from "react";
import { useI18n } from "../../../handlers/languageHandler";

import { useDispatch, useSelector } from "react-redux";

import { createLayerList } from "../../../handlers/esriHandler";

import close from "../../../style/images/x-close.svg";
import layer from "../../../style/images/layers-three.svg";
import layerActive from "../../../style/images/layers-three-active.svg";
import edit from "../../../style/images/edit-pen.svg";
import { useTranslation } from "react-i18next";

export default function LayerList({ containerRef, onclose }) {
  const dispatch = useDispatch();
  const { t, direction } = useI18n("LayerList");
  const { i18n } = useTranslation("LayerList");

  const [uniqueId] = useState("LayerList-map-tool-container");

  const zIndexPanel = useSelector((state) => state.uiReducer.zIndexPanel);

  // Set z-index: 100 if this component is active, else 1
  const zIndex = zIndexPanel === "LayerList" ? 100 : 1;
  const mapView = useSelector((state) => state.mapViewReducer.intialView);
  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );
  const laylistWGRef = useRef(null);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (!mapView?.map || !layersAndTablesData || isInitialized.current) return;

    const setupLayerList = async () => {
      const layerlistWidget = await createLayerList(mapView, uniqueId);
      laylistWGRef.current = layerlistWidget;

      isInitialized.current = true;
    };

    setupLayerList();
  }, [layersAndTablesData, mapView]);
  return (
    <div
      ref={containerRef}
      className="layer-list-container sidebar_widget"
      style={{ display: "none", zIndex }}
    >
      <div className="sidebar_widget_header">
        <div className="header_title_container">
          <img src={layerActive} alt="layer" className="sidebar_widget_icon" />

          <span class="title">{t("layerlist")}</span>
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
      <div className="sidebar_widget_body overflow-auto">
        <div id={uniqueId}></div>
      </div>
    </div>
    // )
  );
}
