import { React, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./MapSettingConfig.scss";
import { useI18n } from "../../../handlers/languageHandler";
import { setActiveButton } from "../../../redux/sidebar/sidebarAction";
import {
  setMapSettingVisiblity,
  setMapSettingConfigActiveButton,
  setNetworkServicesVisiblity,
  setLayerAliasesVisiblity,
  setSearchableLayersVisiblity,
  setPropertiesLayerFieldsVisiblity,
  setResultDetailsLayerFieldsVisiblity,
  setIdentifyDetailsLayerFieldsVisiblity,
} from "../../../redux/mapSetting/mapSettingAction";

import close from "../../../style/images/x-close.svg";

export default function MapSettingConfig({ isVisible }) {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");
  const dispatch = useDispatch();

  const activeButton = useSelector(
    (state) => state.mapSettingReducer.activeButton
  );

  const closeMapSettingPanel = () => {
    dispatch(setActiveButton(null));
    dispatch(setMapSettingVisiblity(false));
  };

  const resetMapSettingContent = () => {
    dispatch(setNetworkServicesVisiblity(false));
    dispatch(setLayerAliasesVisiblity(false));
    dispatch(setSearchableLayersVisiblity(false));
    dispatch(setPropertiesLayerFieldsVisiblity(false));
    dispatch(setResultDetailsLayerFieldsVisiblity(false));
    dispatch(setIdentifyDetailsLayerFieldsVisiblity(false));
  };


  const handleConfigButtonClick = (buttonName) => {

    const newActiveButton = activeButton === buttonName ? null : buttonName;
    dispatch(setMapSettingConfigActiveButton(newActiveButton));

    resetMapSettingContent();
    
    // debugger;
    if (buttonName === "Layer-Fields-Aliases") {
      dispatch(setLayerAliasesVisiblity(true));
    } else if (buttonName === "Searchable-Layers") {
      dispatch(setSearchableLayersVisiblity(true));
    } else if (buttonName === "Properties-Layer-Fields") {
      dispatch(setPropertiesLayerFieldsVisiblity(true));
    } else if (buttonName === "Result-Details-Layer-Fields") {
      dispatch(setResultDetailsLayerFieldsVisiblity(true));
    } else if (buttonName === "Identify-Details-Layer-Fields") {
      dispatch(setIdentifyDetailsLayerFieldsVisiblity(true));
    } else {
      dispatch(setNetworkServicesVisiblity(true));
    }
  };

  if (!isVisible) return null;

  return (
    <div className="mapSettingConfig-container">
      <div className="mapSettingConfig-header">
        <div className="container-title">{t("Configuration")}</div>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={closeMapSettingPanel}
        />
      </div>

      <main className="mapSettingConfig-body">
        <div className="h-100 d-flex flex-column">
          <button
            className={`config-button ${
              activeButton === "network-Services" ? "active" : ""
            }`}
            onClick={() => handleConfigButtonClick("network-Services")}
          >
            <span className="config-text">{t("Network Services")}</span>
          </button>
          <button
            className={`config-button ${
              activeButton === "Layer-Fields-Aliases" ? "active" : ""
            }`}
            onClick={() => handleConfigButtonClick("Layer-Fields-Aliases")}
          >
            <span className="config-text">{t("Layer Fields Aliases")}</span>
          </button>
          <button
            className={`config-button ${
              activeButton === "Searchable-Layers" ? "active" : ""
            }`}
            onClick={() => handleConfigButtonClick("Searchable-Layers")}
          >
            <span className="config-text">{t("Searchable Layers")}</span>
          </button>
          {/* */}
          <button
            className={`config-button ${
              activeButton === "Properties-Layer-Fields" ? "active" : ""
            }`}
            onClick={() => handleConfigButtonClick("Properties-Layer-Fields")}
          >
            <span className="config-text">{t("Properties Layer Fields")}</span>
          </button>
          <button
            className={`config-button ${
              activeButton === "Result-Details-Layer-Fields" ? "active" : ""
            }`}
            onClick={() => handleConfigButtonClick("Result-Details-Layer-Fields")}
          >
            <span className="config-text">{t("Result Details Layer Fields")}</span>
          </button>
          <button
            className={`config-button ${
              activeButton === "Identify-Details-Layer-Fields" ? "active" : ""
            }`}
            onClick={() => handleConfigButtonClick("Identify-Details-Layer-Fields")}
          >
            <span className="config-text">{t("Identify Details Layer Fields")}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
