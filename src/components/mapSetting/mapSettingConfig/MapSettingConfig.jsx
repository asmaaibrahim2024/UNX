import { React, useEffect, useState } from "react";
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
  setHasUnsavedChanges,
} from "../../../redux/mapSetting/mapSettingAction";

import close from "../../../style/images/x-close.svg";
import SweetAlert from "../../../shared/uiControls/swalHelper/SwalHelper";
import { connectNetwork, saveAliases, saveFlags } from "../mapSettingHandler";
import { HasUnsavedChanges } from "../models/HasUnsavedChanges";

export default function MapSettingConfig({ isVisible }) {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");
  const dispatch = useDispatch();

  const activeButton = useSelector(
    (state) => state.mapSettingReducer.activeButton
  );

  const utilityNetworkMapSetting = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );

  const featureServiceLayers = useSelector(
      (state) => state.mapSettingReducer.featureServiceLayers
    );

  const hasUnsavedChanges = useSelector(
      (state) => state.mapSettingReducer.hasUnsavedChanges
    );

  const htmlContentEdit = `<div class="htmlContent">
                                <div class="icon_container icon_container_image nx_scale">
                                    <span class="bookmark_icon_edit img"></span>
                                </div>
                                <h2 class="title_main">${t("Edited!")}</h2>
                                <h2 class="title">${t(
                                  "Are you sure you want to save your edits?"
                                )}</h2>
                            </div>`;

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

    // If the button is already active, do nothing
    if (activeButton === buttonName) return;

    let goToAnotherTab = hasUnsavedChanges?.isSaved;

    // Check for unsaved changes in the current tab before going to another one
      if(!hasUnsavedChanges?.isSaved) {
        
          SweetAlert(
            "30rem", // Width
            "", // Title
            "", // Title class
            htmlContentEdit, // HTML text
            true, // Show confirm button
            `${t("Save")}`, // Confirm button text
            "btn btn-primary", // Confirm button class
            true, // Show cancel button
            `${t("Cancel")}`, // Cancel button text
            "btn btn-outline-secondary", // Cancel button class
            false, // Show close button
            "", // Close button class
            "", // Additional text
            "", // Icon
            "", // Container class
            "", // Popup class
            "", // Header class
            "", // Icon class
            "", // Image class
            "", // HTML container class
            "", // Input class
            "", // Input label class
            "", // Validation message class
            "", // Actions class
            "", // Deny button class
            "", // Loader class
            "", // Footer class
            "", // Timer progress bar class
            "",
            false,
            async () => {
              // Confirm callback
              const tabStates = hasUnsavedChanges?.tabStates;

              if(hasUnsavedChanges?.tabName === "network-Services") {
                await connectNetwork(...tabStates);
              } else if(hasUnsavedChanges?.tabName === "Layer-Fields-Aliases") {
                await saveAliases(...tabStates);
              } else {
                await saveFlags(...tabStates);
              }

              goToAnotherTab = true;
              dispatch(setHasUnsavedChanges({}));
              changeTab(buttonName)
             
            },
            () => {
              // Cancel callback
              goToAnotherTab = true;
              changeTab(buttonName)
              dispatch(setHasUnsavedChanges({}));
            }
          );


      } else {
        changeTab(buttonName);
      }

    if(!goToAnotherTab) return;
  };


  function changeTab(buttonName) {
    dispatch(setMapSettingConfigActiveButton(buttonName));
    
    resetMapSettingContent();
    
    // debugger;
    if (buttonName === "Layer-Fields-Aliases" &&  utilityNetworkMapSetting) {
      dispatch(setLayerAliasesVisiblity(true));
    } else if (buttonName === "Searchable-Layers" &&  utilityNetworkMapSetting) {
      dispatch(setSearchableLayersVisiblity(true));
    } else if (buttonName === "Properties-Layer-Fields" &&  utilityNetworkMapSetting) {
      dispatch(setPropertiesLayerFieldsVisiblity(true));
    } else if (buttonName === "Result-Details-Layer-Fields" &&  utilityNetworkMapSetting) {
      dispatch(setResultDetailsLayerFieldsVisiblity(true));
    } else if (buttonName === "Identify-Details-Layer-Fields" &&  utilityNetworkMapSetting) {
      dispatch(setIdentifyDetailsLayerFieldsVisiblity(true));
    } else {
      dispatch(setNetworkServicesVisiblity(true));
    }
  }

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
              activeButton === "network-Services" || !utilityNetworkMapSetting ? "active" : ""
            }`}
            onClick={() => {
              if (utilityNetworkMapSetting) {
                handleConfigButtonClick("network-Services");
              }
            }}
            disabled={!utilityNetworkMapSetting || !featureServiceLayers}
          >
            <span className="config-text">{t("Network Map Service")}</span>
          </button>
          <button
            className={`config-button ${
              activeButton === "Layer-Fields-Aliases" ? "active" : ""
            }`}
            onClick={() => handleConfigButtonClick("Layer-Fields-Aliases")}
            disabled={!utilityNetworkMapSetting || !featureServiceLayers}
          >
            <span className="config-text">{t("Field Alias")}</span>
          </button>
          <button
            className={`config-button ${
              activeButton === "Searchable-Layers" ? "active" : ""
            }`}
            onClick={() => handleConfigButtonClick("Searchable-Layers")}
            disabled={!utilityNetworkMapSetting || !featureServiceLayers}
          >
            <span className="config-text">{t("Searchable Layers")}</span>
          </button>
          {/* */}
          <button
            className={`config-button ${
              activeButton === "Properties-Layer-Fields" ? "active" : ""
            }`}
            onClick={() => handleConfigButtonClick("Properties-Layer-Fields")}
            disabled={!utilityNetworkMapSetting || !featureServiceLayers}
          >
            <span className="config-text">{t("Feature Properties")}</span>
          </button>
          <button
            className={`config-button ${
              activeButton === "Result-Details-Layer-Fields" ? "active" : ""
            }`}
            onClick={() => handleConfigButtonClick("Result-Details-Layer-Fields")}
            disabled={!utilityNetworkMapSetting || !featureServiceLayers}
          >
            <span className="config-text">{t("Features Listing")}</span>
          </button>
          <button
            className={`config-button ${
              activeButton === "Identify-Details-Layer-Fields" ? "active" : ""
            }`}
            onClick={() => handleConfigButtonClick("Identify-Details-Layer-Fields")}
            disabled={!utilityNetworkMapSetting || !featureServiceLayers}
          >
            <span className="config-text">{t("Identify Settings")}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
