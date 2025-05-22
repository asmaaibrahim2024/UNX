import "./TraceResult.scss";
import React, { useState, useEffect } from "react";
import { useI18n } from "../../../../handlers/languageHandler";
import { useDispatch, useSelector } from "react-redux";
import {
  createFeatureLayer,
  createGraphic,
  getAttributeCaseInsensitive,
  getDomainValues,
  getFeatureLayers,
  getLayerOrTable,
  getLayerOrTableName,
  renderListDetailsAttributesToJSX,
  showErrorToast,
  showInfoToast,
  queryAllLayerFeatures
} from "../../../../handlers/esriHandler";

import { loadModules } from "esri-loader";
import { getAssetGroupName, getAssetTypeName } from "../traceHandler";
import ShowProperties from "../../../commonComponents/showProperties/ShowProperties";
import chevronleft from "../../../../style/images/chevron-left.svg";
import close from "../../../../style/images/x-close.svg";
import folder from "../../../../style/images/folder.svg";
import arrowup from "../../../../style/images/cheveron-up.svg";
import arrowdown from "../../../../style/images/cheveron-down.svg";
import file from "../../../../style/images/document-text.svg";
// import cong from "../../../../style/images/cog.svg";
import reset from "../../../../style/images/refresh.svg";
import "react-color-palette/css";
import { HexColorPicker } from "react-colorful";
import { setShowPropertiesFeature } from "../../../../redux/commonComponents/showProperties/showPropertiesAction";
// import FeatureListDetails from "./featureListDetails/FeatureListDetails";

export default function TraceResult({ setActiveTab, setActiveButton }) {
  const { t, direction } = useI18n("Trace");

  const view = useSelector((state) => state.mapViewReducer.intialView);
  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const selectedStartingPoints = useSelector(
    (state) => state.traceReducer.selectedPoints.StartingPoints
  );
  const categorizedElements = useSelector(
    (state) => state.traceReducer.traceResultsElements
  );
  const traceConfigHighlights = useSelector(
    (state) => state.traceReducer.traceConfigHighlights
  );
  const traceResultGraphicsLayer = useSelector(
    (state) => state.traceReducer.traceGraphicsLayer
  );

  const networkService = useSelector(
    (state) => state.mapSettingReducer.networkServiceConfig
  );

  const networkLayersCache = useSelector(
    (state) => state.mapSettingReducer.networkLayersCache
  );

  const showPropertiesFeature = useSelector(
    (state) => state.showPropertiesReducer.showPropertiesFeature
  );

  const queriedTraceResultFeaturesMap = useSelector(
        (state) => state.traceReducer.queriedTraceResultFeaturesMap
      );

  const dispatch = useDispatch();

  const [expandedSources, setExpandedSources] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedTypes, setExpandedTypes] = useState({});
  const [sourceToLayerMap, setSourceToLayerMap] = useState({});
  const [queriedTraceFeatures, setQueriedTraceFeatures] = useState({});
  const [expandedTraceTypes, setExpandedTraceTypes] = useState({});
  const [colorPickerVisible, setColorPickerVisible] = useState({});
  const [strokeSizes, setStrokeSizes] = useState();
  const [colorPreview, setColorPreview] = useState();
  const [hexValuePreview, setHexValuePreview] = useState();
  const [transparencies, setTransparencies] = useState({});
  const [allObjectIds, setAllObjectIds] = useState([]);
  const [layerFieldsByLayerId, setLayerFieldsByLayerId] = useState({});

  useEffect(() => {
    if (!utilityNetwork) return;

    // Extract sourceId -> layerId mapping
    const mapping = {};
    const domainNetworks = utilityNetwork?.dataElement?.domainNetworks;

    domainNetworks?.forEach((network) => {
      [...network.edgeSources, ...network.junctionSources].forEach((source) => {
        mapping[source.sourceId] = source.layerId;
      });
    });

    setSourceToLayerMap(mapping);
  }, [utilityNetwork]);


  useEffect(() => {
    const serviceConfigLayers = networkService?.networkLayers || [];
    const cachedLayersArray = Object.values(networkLayersCache || {});
    const traceResultsLayersConfig = new Map();

    cachedLayersArray.forEach(layer => {
      const fieldNames = (layer.layerFields || [])
        .filter(field => field.isListDetails)
        .map(field => field.dbFieldName);
      traceResultsLayersConfig.set(layer.layerId, fieldNames);
    });


    serviceConfigLayers.forEach(layer => {
      if (!traceResultsLayersConfig.has(layer.layerId)) {
        const fieldNames = (layer.layerFields || [])
          .filter(field => field.isListDetails)
          .map(field => field.dbFieldName);
        traceResultsLayersConfig.set(layer.layerId, fieldNames);
      }
    });

    const finalFieldMap = {};
    traceResultsLayersConfig.forEach((value, key) => {
      finalFieldMap[key] = value;
    });

    // console.log("layers config:", finalFieldMap);

    setLayerFieldsByLayerId(finalFieldMap);
  }, [networkLayersCache, networkService]);


  // To be removed
  useEffect(() => {
    setQueriedTraceFeatures(queriedTraceResultFeaturesMap);

  }, [queriedTraceResultFeaturesMap]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close all color pickers if click is outside any picker or color box
      const isColorPicker = e.target.closest(".color-picker-popup");
      const isColorBox = e.target.closest(".color-box");

      if (!isColorPicker && !isColorBox) {
        setColorPickerVisible({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Handles the click event on the color box associated with a specific trace type.
   * It prevents the propagation of the click event to avoid triggering other UI interactions
   * and toggles the visibility of the color picker for the specified trace type.
   *
   * @param {string} traceId - The unique identifier of the trace type for which the color picker is toggled.
   * @param {Object} e - The event object associated with the click event.
   */
  const handleColorBoxClick = (traceId, e) => {
    e.stopPropagation(); // Prevent the trace type from toggling
    // Close all color pickers except the one for the clicked traceId
    setColorPickerVisible((prev) => {
      const updatedVisibility = Object.keys(prev).reduce((acc, key) => {
        // Set all color pickers to false except the one for the clicked traceId
        acc[key] = key === traceId ? !prev[key] : false;
        return acc;
      }, {});

      // Ensure the clicked color picker toggles its visibility
      return {
        ...updatedVisibility,
        [traceId]: !prev[traceId], // toggle clicked picker
      };
    });

    setHexValuePreview(traceConfigHighlights[traceId]?.graphicColor);
  };

  /**
   * Updates the color and stroke width of all graphics associated with a given trace ID.
   * Handles polyline, multipoint, and polygon symbols according to their types and configurations.
   *
   * @param {string} traceId - The unique identifier of the trace whose graphics need to be updated.
   * @param {string} color - The new color to apply (hex or RGBA format).
   * @param {number} strokeWidth - The new stroke width for line symbols.
   */
  const updateTraceGraphicColor = (traceId, color, strokeWidth) => {
    traceResultGraphicsLayer.graphics.forEach((graphic) => {
      if (graphic.symbol && graphic.attributes?.id === traceId) {
        // Line
        if (
          graphic.symbol.type === window.traceConfig.Symbols.polylineSymbol.type
        ) {
          graphic.symbol = {
            type: window.traceConfig.Symbols.polylineSymbol.type,
            color: color,
            width: strokeWidth,
          };
        }

        // Point
        if (
          graphic.symbol.type ===
          window.traceConfig.Symbols.multipointSymbol.type
        ) {
          graphic.symbol = {
            type: window.traceConfig.Symbols.multipointSymbol.type,
            color: color,
            size: window.traceConfig.Symbols.multipointSymbol.size,
            outline: {
              color: color,
              width: window.traceConfig.Symbols.multipointSymbol.outline.width,
            },
          };
        }

        // Polygon
        if (
          graphic.symbol.type === window.traceConfig.Symbols.polygonSymbol.type
        ) {
          graphic.symbol = {
            type: window.traceConfig.Symbols.polygonSymbol.type,
            color: color,
            style: window.traceConfig.Symbols.polygonSymbol.style,
            outline: {
              color: color,
              width: window.traceConfig.Symbols.polygonSymbol.outline.width,
            },
          };
        }
      }
    });
  };

  /**
   * Handles the change in stroke size for a specific trace by updating the corresponding graphic's stroke width
   * and updating the trace configuration with the new stroke size.
   *
   * @param {string} traceId - The ID of the trace whose stroke size is being changed.
   * @param {number} value - The new stroke width value to apply to the trace.
   * @returns {void} Updates the trace's stroke size on the map and stores the new stroke size in the trace configuration.
   */
  const handleStrokeChange = (traceId, value) => {
    updateTraceGraphicColor(
      traceId,
      traceConfigHighlights[traceId]?.graphicColor,
      value
    );

    if (traceConfigHighlights[traceId]) {
      traceConfigHighlights[traceId] = {
        ...traceConfigHighlights[traceId],
        strokeSize: value,
      };

      setStrokeSizes(value);
    }
  };

  /**
   * Handles the color change for a specific trace by updating the corresponding graphic's symbol
   * and updating the trace configuration with the new color.
   *
   * @param {string} traceId - The ID of the trace whose color is being changed.
   * @param {object} newColor - The new color object containing the hex value.
   * @param {string} newColor.hex - The hex color value to apply to the trace.
   * @returns {void} Updates the trace's color on the map and stores the new color in the trace configuration.
   */
  const handleColorChange = (traceId, newColor) => {
    updateTraceGraphicColor(
      traceId,
      newColor.hex,
      traceConfigHighlights[traceId]?.strokeSize
    );

    if (traceConfigHighlights[traceId]) {
      traceConfigHighlights[traceId] = {
        ...traceConfigHighlights[traceId],
        graphicColor: newColor.hex,
        baseColor: newColor.hex,
      };

      setColorPreview(newColor.hex);
      setHexValuePreview(newColor.hex);
      setTransparencies((prev) => ({ ...prev, [traceId]: 0 }));
    }
  };

  const showProperties = (feature) => {
  if (feature === showPropertiesFeature) {
    // Hide if same feature
    dispatch(setShowPropertiesFeature(null));
  } else {
    // Show new feature
    dispatch(setShowPropertiesFeature(feature)); 
  }
};


  /**
   * Updates the hex color value preview based on user input.
   *
   * @param {string} value - The new hex color value entered by the user.
   * @returns {void} Updates the local state for the hex color preview.
   */
  const handleHexInputChange = (value) => {
    setHexValuePreview(value);
  };

  /**
   * Updates the line color of a trace graphic based on a provided hex value after validating it.
   * If the hex value is valid, the graphic's color and trace configuration are updated.
   * If the hex value is invalid, an error is logged.
   *
   * @param {string} traceId - The ID of the trace graphic to update.
   * @param {string} value - The new hex color value to apply.
   * @returns {void} Updates the graphic color or logs an error if the hex is invalid.
   */
  const handleSetHexValue = (traceId, value) => {
    // Regular expression to check if the color is a valid hex code
    const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})([0-9A-Fa-f]{2})?$/;

    // Check if the input value is a valid hex color
    if (hexRegex.test(value)) {
      // Update the symbol color visually if the value is valid
      // value is the new hex color string
      updateTraceGraphicColor(
        traceId,
        value,
        traceConfigHighlights[traceId]?.strokeSize
      );

      if (traceConfigHighlights[traceId]) {
        traceConfigHighlights[traceId] = {
          ...traceConfigHighlights[traceId],
          graphicColor: value,
          baseColor: value,
        };

        setHexValuePreview(value);
        setColorPreview(value);
        setTransparencies((prev) => ({ ...prev, [traceId]: 0 }));
      }
    } else {
      console.error("This is not a valid hex color.");
      showErrorToast(" Please enter a valid hex color.");
    }
  };

  /**
   * Converts a hex color code to an RGBA color string.
   *
   * @param {string} hex - The hex color code (e.g., "#FF5733" or "FF5733").
   * @param {number} [alpha=1] - The alpha (opacity) value (between 0 and 1).
   * @returns {string} The corresponding RGBA color string.
   */
  const hexToRgba = (hex, alpha = 1) => {
    if (hex.startsWith("#")) {
      hex = hex.slice(1);
    }

    // Ensure the hex is in the correct format
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((h) => h + h)
        .join("");
    }

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  /**
   * Adds an alpha (transparency) component to a hex color code.
   *
   * @param {string} hex - The base hex color (e.g., "#RRGGBB" or "#RGB").
   * @param {number} transparency - The transparency percentage (0 = fully opaque, 100 = fully transparent).
   * @returns {string} The hex color with the alpha component appended (e.g., "#RRGGBBAA").
   */
  const hexWithAlpha = (hex, transparency) => {
    if (hex.startsWith("#")) hex = hex.slice(1);

    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((h) => h + h)
        .join("");
    }

    const r = hex.slice(0, 2);
    const g = hex.slice(2, 4);
    const b = hex.slice(4, 6);

    const alphaDecimal = Math.round(((100 - transparency) / 100) * 255);
    const alphaHex = alphaDecimal.toString(16).padStart(2, "0").toUpperCase();

    return `#${r}${g}${b}${alphaHex}`;
  };

  /**
   * Updates the transparency (alpha) of a trace graphic based on user input.
   * Also updates the graphic's color with the new alpha value and updates the relevant UI states.
   *
   * @param {string} traceId - The ID of the trace to update.
   * @param {number|string} value - The new transparency value (0 to 1) or a string that can be converted to a number.
   * @returns {void}
   */
  const handleTransparencyChange = (traceId, value) => {
    const numericValue = Number(value);
    setTransparencies((prev) => ({ ...prev, [traceId]: numericValue }));

    // Also update the color with new alpha
    const baseColor = traceConfigHighlights[traceId]?.baseColor || "#4F46E5";

    const newHexColorWithAlpha = hexWithAlpha(baseColor, numericValue);

    updateTraceGraphicColor(
      traceId,
      newHexColorWithAlpha,
      traceConfigHighlights[traceId]?.strokeSize
    );

    if (traceConfigHighlights[traceId]) {
      traceConfigHighlights[traceId] = {
        ...traceConfigHighlights[traceId],
        graphicColor: newHexColorWithAlpha,
      };

      setColorPreview(newHexColorWithAlpha);
      setHexValuePreview(newHexColorWithAlpha);
    }
  };

  /**
   * Resets the color, stroke size, and transparency of a specific trace graphic to its original values.
   *
   * @param {string} traceId - The unique ID of the trace to reset.
   */
  const handleReset = (traceId) => {
    setTransparencies((prev) => ({ ...prev, [traceId]: 0 }));
    updateTraceGraphicColor(
      traceId,
      traceConfigHighlights[traceId]?.reset.graphicColor,
      traceConfigHighlights[traceId]?.reset.strokeSize
    );

    if (traceConfigHighlights[traceId]) {
      traceConfigHighlights[traceId] = {
        ...traceConfigHighlights[traceId],
        graphicColor: traceConfigHighlights[traceId]?.reset.graphicColor,
        strokeSize: traceConfigHighlights[traceId]?.reset.strokeSize,
        baseColor: traceConfigHighlights[traceId]?.reset.graphicColor,
      };

      setColorPreview(traceConfigHighlights[traceId]?.reset.graphicColor);
      setHexValuePreview(traceConfigHighlights[traceId]?.reset.graphicColor);
      setStrokeSizes(traceConfigHighlights[traceId]?.reset.strokeSize);
    }
  };

  /**
   * Toggles the expanded/collapsed state of a trace type section based on starting point and trace ID.
   *
   * @param {string} startingPointId - The ID of the starting point associated with the trace.
   * @param {string} traceId - The ID of the trace whose section should be toggled.
   * @returns {void} Updates the state to reflect the new expanded/collapsed status.
   */
  const toggleTraceType = (startingPointId, traceId) => {
    const key = `${startingPointId}-${traceId}`;

    const traceGroup = categorizedElements[startingPointId]?.[traceId];

    // Check if there are any elements in the group
    const hasData =
      traceGroup &&
      Object.values(traceGroup).some((layerResults) => {
        return Array.isArray(layerResults)
          ? layerResults.length > 0
          : typeof layerResults === "object" &&
              Object.values(layerResults).flat().length > 0;
      });

    if (!hasData) {
      showInfoToast("No elements to show");
      return;
    }

    setExpandedTraceTypes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * Toggles the expanded/collapsed state of a network source section based on starting point ID, trace ID, and network source.
   *
   * @param {string} startingPointId - The ID of the starting point associated with the trace.
   * @param {string} traceId - The ID of the trace.
   * @param {string} networkSource - The name or ID of the network source to toggle.
   * @returns {void} Updates the state to reflect the new expanded/collapsed status.
   */
  const toggleSource = (startingPointId, traceId, networkSource) => {
    const key = `${startingPointId}-${traceId}-${networkSource}`;
    setExpandedSources((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * Toggles the expanded/collapsed state of an asset group section based on starting point ID, trace ID, network source, and asset group.
   *
   * @param {string} startingPointId - The ID of the starting point associated with the trace.
   * @param {string} traceId - The ID of the trace.
   * @param {string} networkSource - The name or ID of the network source.
   * @param {string} assetGroup - The name or ID of the asset group to toggle.
   * @returns {void} Updates the state to reflect the new expanded/collapsed status.
   */
  const toggleGroup = (startingPointId, traceId, networkSource, assetGroup) => {
    const key = `${startingPointId}-${traceId}-${networkSource}-${assetGroup}`;
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * Toggles the expanded/collapsed state of an asset type section based on starting point ID, trace ID, network source, asset group, and asset type.
   *
   * @param {string} startingPointId - The ID of the starting point associated with the trace.
   * @param {string} traceId - The ID of the trace.
   * @param {string} networkSource - The name or ID of the network source.
   * @param {string} assetGroup - The name or ID of the asset group containing the asset type.
   * @param {string} assetType - The name or ID of the asset type to toggle.
   * @returns {void} Updates the state to reflect the new expanded/collapsed status for the asset type.
   */
  const toggleType = (
    startingPointId,
    traceId,
    networkSource,
    assetGroup,
    assetType
  ) => {
    const key = `${startingPointId}-${traceId}-${networkSource}-${assetGroup}-${assetType}`;
    setExpandedTypes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

 
  /**
 * Zooms the map view to a given geometry and highlights it temporarily. If the geometry is nonspatial or invalid,
 * it shows an informational toast.
 *
 * @param {__esri.MapView} view - The ArcGIS MapView instance.
 * @param {__esri.Geometry} geometry - The geometry to zoom to. Supports point, polyline, and polygon.
 */
  const zoomToTraceFeature = (view, geometry) => {

    if(!geometry) {
      showInfoToast("Nonspatial Object.");
      return;
    }

    // Choose symbol based on geometry type
    let symbol;

    switch (geometry.type) {
      case "point":
        symbol = window.mapConfig.ZoomHighlights.pointSymbol;
        break;
      case "polyline":
        symbol = window.mapConfig.ZoomHighlights.polylineSymbol;
        break;
      case "polygon":
        symbol = window.mapConfig.ZoomHighlights.polygonSymbol;
        break;
      default:
        console.warn("Unknown geometry type:", geometry.type);
        symbol = window.mapConfig.ZoomHighlights.pointSymbol;
        return;
    }

    view
      .goTo({
        target: geometry,
        zoom: 20,
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Zoom error:", error);
          showErrorToast(`Zoom error: ${error}`);
        }
      });

    createGraphic(geometry, symbol, { id: "featureZoom" }).then(
      (tempGraphic) => {
        view.graphics.add(tempGraphic);

        setTimeout(() => {
          view.graphics.remove(tempGraphic);
        }, 1000);
      }
    );
  };

/**
 * Resolves a user-friendly display name for a given field value, using domain information,
 * asset group/type mappings, or formatting logic.
 *
 * @param {__esri.FeatureLayer} layer - The feature layer containing domain and field metadata.
 * @param {Object} attributes - The full set of feature attributes (used for related lookups like asset group).
 * @param {string} fieldName - The name of the field to resolve.
 * @param {*} value - The raw value from the feature attribute to be converted.
 * @returns {string|number} A formatted or domain-resolved string representing the value for display.
 */
 function getDomainDisplayName(
  layer,
  attributes,
  fieldName,
  value
) {
  if (!value) return '';

  const layerId = layer?.layerId
  const field = layer?.fields.find(
    (f) => f.name.toLowerCase() === fieldName.toLowerCase()
  );

  if (!field) return value;

  const key = fieldName.toLowerCase();

  // Handle assetgroup
  if (key === "assetgroup") {
    return getAssetGroupName(utilityNetwork, layerId, value);
  }

  // Handle assettype
  if (key === "assettype") {
    const assetGroupCode = getAttributeCaseInsensitive(attributes, "assetgroup");
    return getAssetTypeName(utilityNetwork, layerId, assetGroupCode, value);
  }

  // Handle coded-value domain
  if (field.domain && field.domain.type === "coded-value") {
    const codedValueEntry = field.domain.codedValues.find((cv) => cv.code === value);
    return codedValueEntry ? codedValueEntry.name : value;
  }

  // Handle date field
  if (field.type === "date") {
    try {
      const date = new Date(value);
      return (
        date.toLocaleDateString() +
        ", " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return value;
    }
  }

  // Fallback to raw value
  return value;
}




  return (
    <div className="trace-result">
      <div className="trace-header">
        <div className="result-header">
          <img
            src={chevronleft}
            alt="close"
            className="cursor-pointer"
            onClick={() => setActiveTab("input")}
          />
          <h4>{t("Trace Results")}</h4>
        </div>
        <div className="result-header-action">
          {/* <img src={cong} alt="close" className="cursor-pointer" /> */}
          <img
            src={close}
            alt="close"
            className="cursor-pointer"
            onClick={() => dispatch(setActiveButton(""))}
          />
        </div>
      </div>

      {categorizedElements && Object.keys(categorizedElements).length > 0 ? (
        <div className="result-container">
          {/* Loop through each starting point */}
          {Object.entries(categorizedElements).map(
            ([startingPointId, traceResults]) => {
              // Find asset group name for this startingPointId
              const match = selectedStartingPoints.find(
                ([, id]) => id === startingPointId
              );
              const displayName = match ? match[0] : startingPointId;
              return (
                <div key={startingPointId} className="starting-point-box">
                  {/* <h4 className="starting-point-id">
                <span style={{color: "grey", paddingLeft: '5px'}}>#{displayName}</span>
              </h4> */}

                  {/* Loop through each trace type under this starting point */}
                  {Object.entries(traceResults).map(([traceId, result]) => (
                    <div key={traceId} className="trace-type-box">
                      <div
                        className={`trace-type-header ${
                          expandedTraceTypes[`${startingPointId}-${traceId}`]
                            ? "expanded"
                            : ""
                        }`}
                        onClick={() =>
                          toggleTraceType(startingPointId, traceId)
                        }
                      >
                        {traceConfigHighlights.hasOwnProperty(
                          `${startingPointId}${traceId}`
                        ) && (
                          <div className="color-box-container">
                            <span
                              className="color-box"
                              style={{
                                backgroundColor:
                                  traceConfigHighlights[
                                    `${startingPointId}${traceId}`
                                  ]?.graphicColor || colorPreview,
                              }}
                              onClick={(e) =>
                                handleColorBoxClick(
                                  `${startingPointId}${traceId}`,
                                  e
                                )
                              }
                            />
                          </div>
                        )}

                        {colorPickerVisible[`${startingPointId}${traceId}`] && (
                          <div
                            className={`color-picker-popup ${direction}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="symbol-properties">
                              <div className="header">
                                <span>{t("Symbol Properties")}</span>
                                <button
                                  className="close-button"
                                  onClick={() => setColorPickerVisible({})}
                                >
                                  &times;
                                </button>
                              </div>

                              <div className="section-size">
                                <label className="stroke-label">
                                  {t("Stroke Size")}
                                </label>
                                <div className="input-row">
                                  <input
                                    type="number"
                                    min="1"
                                    value={
                                      traceConfigHighlights[
                                        `${startingPointId}${traceId}`
                                      ]?.strokeSize || strokeSizes
                                    }
                                    onChange={(e) =>
                                      handleStrokeChange(
                                        `${startingPointId}${traceId}`,
                                        e.target.value
                                      )
                                    }
                                  />
                                  <span>{t("px")}</span>
                                </div>
                              </div>

                              <div className="section">
                                <HexColorPicker
                                  color={
                                    traceConfigHighlights[
                                      `${startingPointId}${traceId}`
                                    ]?.graphicColor || colorPreview
                                  }
                                  onChange={(newColor) =>
                                    handleColorChange(
                                      `${startingPointId}${traceId}`,
                                      { hex: newColor }
                                    )
                                  }
                                />
                              </div>

                              <div className="section color-preview">
                                <div
                                  className="color-circle"
                                  style={{
                                    backgroundColor:
                                      traceConfigHighlights[
                                        `${startingPointId}${traceId}`
                                      ]?.graphicColor || colorPreview,
                                  }}
                                />
                                <select className="format-select" disabled>
                                  <option>Hex</option>
                                </select>
                                <input
                                  type="text"
                                  value={hexValuePreview}
                                  onChange={(e) =>
                                    handleHexInputChange(e.target.value)
                                  }
                                />
                                <button
                                  className="tick-button"
                                  style={{
                                    backgroundColor: "transparent",
                                    border: "none",
                                    color: "black",
                                    fontSize: "16px",
                                    cursor: "pointer",
                                    padding: "0px",
                                  }}
                                  onClick={() =>
                                    handleSetHexValue(
                                      `${startingPointId}${traceId}`,
                                      hexValuePreview
                                    )
                                  }
                                >
                                  ✓
                                </button>
                              </div>

                              <div className="section">
                                <div className="transparency">
                                  <label>{t("Set Transparency")}</label>
                                  <input
                                    className="input-number"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={
                                      transparencies[
                                        `${startingPointId}${traceId}`
                                      ] || 0
                                    }
                                    onChange={(e) =>
                                      handleTransparencyChange(
                                        `${startingPointId}${traceId}`,
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>

                                <div className="input-row">
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={
                                      transparencies[
                                        `${startingPointId}${traceId}`
                                      ] || 0
                                    }
                                    onChange={(e) =>
                                      handleTransparencyChange(
                                        `${startingPointId}${traceId}`,
                                        e.target.value
                                      )
                                    }
                                    style={{
                                      background: `linear-gradient(to right, 
                                    ${hexToRgba(
                                      traceConfigHighlights[
                                        `${startingPointId}${traceId}`
                                      ]?.baseColor || "#4F46E5",
                                      1
                                    )} 0%, 
                                    ${hexToRgba(
                                      traceConfigHighlights[
                                        `${startingPointId}${traceId}`
                                      ]?.baseColor || "#4F46E5",
                                      0
                                    )} 100%)`,
                                      "--thumb-color":
                                        traceConfigHighlights[
                                          `${startingPointId}${traceId}`
                                        ]?.baseColor || "#4F46E5",
                                    }}
                                    className="dynamic-range"
                                  />
                                </div>
                              </div>

                              <button
                                className="reset-button"
                                onClick={() =>
                                  handleReset(`${startingPointId}${traceId}`)
                                }
                              >
                                <img src={reset} alt="reset" />
                                {t("Reset")}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="trace-title">
                          <div className="title-img">
                            <img src={folder} alt="folter-img" />
                            <h5
                              className="trace-id"
                              title={traceId} // Show full traceId on hover
                            >
                              {traceId.length > 17
                                ? `${traceId.slice(0, 17)}..`
                                : traceId}
                              <span
                                style={{ color: "grey", paddingLeft: "10px" }}
                                title={displayName} // Tooltip with full name
                              >
                                {displayName.length > 8
                                  ? `${displayName.slice(0, 8)}..`
                                  : displayName}
                              </span>
                            </h5>
                          </div>
                          {Object.keys(result).length > 0 &&
                            (expandedTraceTypes[
                              `${startingPointId}-${traceId}`
                            ] ? (
                              <img src={arrowup} alt="arrow-up" height="18" />
                            ) : (
                              <img src={arrowdown} alt="arrow-down" height="18" />
                            ))}
                        </div>
                      </div>

                      {expandedTraceTypes[`${startingPointId}-${traceId}`] && (
                        <div className="trace-group">
                          {Object.entries(result).map(
                            ([networkSource, assetGroups]) => (
                              <div
                                key={networkSource}
                                className="feature-layers"
                              >
                                <div
                                  className="layer-header"
                                  onClick={() =>
                                    toggleSource(
                                      startingPointId,
                                      traceId,
                                      networkSource
                                    )
                                  }
                                >
                                  <span>
                                    {getLayerOrTableName(
                                      layersAndTablesData,
                                      sourceToLayerMap[networkSource]
                                    )}
                                    &nbsp;
                                    (
                                    {
                                      Object.values(assetGroups)
                                        .flatMap(assetTypes =>
                                          Object.values(assetTypes).flat()
                                        ).length
                                    }
                                    )
                                  </span>
                                  <span>
                                    {expandedSources[
                                      `${startingPointId}-${traceId}-${networkSource}`
                                    ] ? (
                                      <img src={arrowup} alt="folter-img" height="18" />
                                    ) : (
                                      <img src={arrowdown} alt="folter-img" height="18" />
                                    )}
                                  </span>
                                </div>
                                {expandedSources[
                                  `${startingPointId}-${traceId}-${networkSource}`
                                ] && (
                                  <div className="asset-groups">
                                    {Object.entries(assetGroups).map(
                                      ([assetGroup, assetTypes]) => (
                                        <div
                                          key={assetGroup}
                                          className="asset-group"
                                        >
                                          <div
                                            className="group-header"
                                            onClick={() =>
                                              toggleGroup(
                                                startingPointId,
                                                traceId,
                                                networkSource,
                                                assetGroup
                                              )
                                            }
                                          >
                                            <span>
                                              {getAssetGroupName(
                                                utilityNetwork,
                                                sourceToLayerMap[networkSource],
                                                Number(assetGroup)
                                              )}
                                              &nbsp;
                                              (
                                              {
                                                Object.values(assetTypes).flat()
                                                  .length
                                              }
                                              )
                                            </span>

                                            <span>
                                              {expandedGroups[
                                                `${startingPointId}-${traceId}-${networkSource}-${assetGroup}`
                                              ] ? (
                                                <img
                                                  src={arrowup}
                                                  alt="folter-img"
                                                  height="18"
                                                />
                                              ) : (
                                                <img
                                                  src={arrowdown}
                                                  alt="folter-img"
                                                  height="18"
                                                />
                                              )}
                                            </span>
                                          </div>
                                          {expandedGroups[
                                            `${startingPointId}-${traceId}-${networkSource}-${assetGroup}`
                                          ] && (
                                            <div className="asset-types">
                                              {Object.entries(assetTypes).map(
                                                ([assetType, elements]) => (
                                                  <div
                                                    key={assetType}
                                                    className="asset-type"
                                                  >
                                                    <div
                                                      className="type-header"
                                                      onClick={() =>
                                                        toggleType(
                                                          startingPointId,
                                                          traceId,
                                                          networkSource,
                                                          assetGroup,
                                                          assetType
                                                        )
                                                      }
                                                    >
                                                      <span>
                                                        {getAssetTypeName(
                                                          utilityNetwork,
                                                          sourceToLayerMap[
                                                            networkSource
                                                          ],
                                                          Number(assetGroup),
                                                          Number(assetType)
                                                        )}
                                                        &nbsp;
                                                        ({elements.length})
                                                      </span>
                                                      <span>
                                                        {expandedTypes[
                                                          `${startingPointId}-${traceId}-${networkSource}-${assetGroup}-${assetType}`
                                                        ] ? (
                                                          <img
                                                            src={arrowup}
                                                            alt="folter-img"
                                                            height="18"
                                                          />
                                                        ) : (
                                                          <img
                                                            src={arrowdown}
                                                            alt="folter-img"
                                                            height="18"
                                                          />
                                                        )}
                                                      </span>
                                                    </div>
                                                    {expandedTypes[
                                                      `${startingPointId}-${traceId}-${networkSource}-${assetGroup}-${assetType}`
                                                    ] && (
                                                      <ul className="elements-list">
                                                        {elements.map(
                                                          (element, index) => {
                                                            return (
                                                              <li
                                                                key={index}
                                                                className="element-item"
                                                                onClick={() =>
                                                                  // queriedTraceFeatures[element.objectId] &&
                                                                  // zoomToTraceFeature(view, queriedTraceFeatures[element.objectId]?.geometry)
                                                                  queriedTraceFeatures[element.globalId] &&
                                                                  zoomToTraceFeature(view, queriedTraceFeatures[element.globalId]?.geometry)
                                                                }
                                                              >
                                                                <div
                                                                  className="object-header"
                                                                >
                                                                  <span>
                                                                    #
                                                                    {
                                                                      element.objectId
                                                                    }
                                                                    {
                                                                      (() => {
                                                                        const fields = layerFieldsByLayerId[sourceToLayerMap[networkSource]] || [];
                                                                        const fieldToShow = fields.find(f => f !== 'OBJECTID');
                                                                        const attributes = queriedTraceFeatures[element.objectId]?.attributes;
                                                                        const layer = queriedTraceFeatures[element.objectId]?.layer;
                                                                        const rawValue = attributes?.[fieldToShow];
                                                                        const displayValue =
                                                                          fieldToShow && layer && rawValue !== undefined
                                                                            ? getDomainDisplayName(layer, attributes, fieldToShow, rawValue)
                                                                            : '';
                                                                                                                                              
                                                                        return displayValue ? `   ${displayValue}` : '';
                                                                      })()}
                                                                  </span>
                                                                </div>
                                                                <img
                                                                  src={file}
                                                                  alt="folder"
                                                                  className="cursor-pointer"
                                                                  onClick={(
                                                                    e
                                                                  ) => {
                                                                    e.stopPropagation();
                                                                    // queriedTraceFeatures[element.objectId] &&
                                                                    // showProperties(
                                                                    //   queriedTraceFeatures[element.objectId]
                                                                    // );
                                                                    queriedTraceFeatures[element.globalId] &&
                                                                    showProperties(
                                                                      queriedTraceFeatures[element.globalId]
                                                                    );
                                                                  }}
                                                                />
                                                                {/* {renderFeatureDetails(openFeatureKey)} */}
                                                              </li>
                                                            );
                                                          }
                                                        )}
                                                      </ul>
                                                    )}
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            }
          )}
        </div>
      ) : (
        <p className="no-results">{t("No trace results available.")}</p>
      )}
    </div>
  );
}
