import { useEffect, useRef, useState } from "react";
import "./Find.scss";
import { useSelector, useDispatch } from "react-redux";
import {
  getAttributeCaseInsensitive,
  makeEsriRequest,
  createFeatureLayer,
  highlightOrUnhighlightFeature,
  ZoomToFeature,
  getDomainValues,
  getFilteredAttributes,
  showErrorToast,
} from "../../../handlers/esriHandler";
import { setSelectedFeatures } from "../../../redux/widgets/selection/selectionAction";
import {
  addTraceSelectedPoint,
  removeTracePoint,
} from "../../../redux/widgets/trace/traceAction";
import React from "react";
import { useTranslation } from "react-i18next";
import { SelectedTracePoint } from "../../widgets/trace/models";
import {
  getSelectedPointTerminalId,
  getPercentAlong,
  addPointToTrace,
} from "../trace/traceHandler";
import * as ReactDOM from "react-dom";
import { Select, Input } from "antd";

import layer from "../../../style/images/layers.svg";
import search from "../../../style/images/search.svg";
import close from "../../../style/images/x-close.svg";
import file from "../../../style/images/document-text.svg";

const { Option } = Select;

export default function Find({ isVisible, container }) {
  const { t, i18n } = useTranslation("Find");

  const [layers, setLayers] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [features, setFeatures] = useState([]);
  const [searchClicked, setSearchClicked] = useState(false);
  const [clickedOptions, setClickedOptions] = useState(null);
  const [popupFeature, setPopupFeature] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const view = useSelector((state) => state.mapViewReducer.intialView);
  const selectedPoints = useSelector(
    (state) => state.traceReducer.selectedPoints
  );
  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );

  const networkService = useSelector(
    (state) => state.mapViewReducer.networkService
  );

  const currentSelectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );

  const utilityNetwork = useSelector(
    (state) => state.traceReducer.utilityNetworkIntial
  );
  const traceGraphicsLayer = useSelector(
    (state) => state.traceReducer.traceGraphicsLayer
  );

  const dispatch = useDispatch();
  const [showSidebar, setShowSidebar] = useState(false);

  const handleEnterSearch = () => {
    if (!searchValue) return;

    setShowSidebar(true); // Always show sidebar when pressing Enter
  };

  // efect to load layers and to check if the view is loaded or not
  useEffect(() => {
    if (!view) return;
    if (view && layers == null) {
      view.when(() => loadLayers());
    }
  }, [view, layers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the options menu
      if (
        !event.target.closest(".value-menu") &&
        !event.target.closest(".options-button")
      ) {
        setClickedOptions(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const loadLayers = async () => {
    try {
      const featureLayers = layersAndTablesData[0].layers
        .filter((layer) => layer.type.toLowerCase() === "feature layer")
        .map((layer) => ({
          id: layer.id,
          title: layer.name,
          type: layer.type,
        }));

      setLayers(featureLayers);
    } catch (error) {
      console.error("Error loading layers:", error);
    }
  };

  const getLayerTitle = () => {
    return (
      layers.find((layer) => layer.id.toString() === selectedLayerId)?.title ||
      "Unknown Layer"
    );
  };

  const isFeatureSelected = (selectedFeatures, layerTitle, objectId) => {
    const layer = selectedFeatures.find(
      (item) => item.layerName === layerTitle
    );
    return (
      layer?.features.some((f) => {
        return getAttributeCaseInsensitive(f, "objectid") == objectId;
      }) || false
    );
  };

  const addFeatureToSelection = (
    selectedFeatures,
    layerTitle,
    featureAttributes
  ) => {
    const existingLayerIndex = selectedFeatures.findIndex(
      (item) => item.layerName === layerTitle
    );

    if (existingLayerIndex >= 0) {
      // Add to existing layer
      return selectedFeatures.map((item, index) =>
        index === existingLayerIndex
          ? { ...item, features: [...item.features, featureAttributes] }
          : item
      );
    } else {
      // Create new layer entry
      return [
        ...selectedFeatures,
        {
          layerName: layerTitle,
          features: [featureAttributes],
        },
      ];
    }
  };

  const removeFeatureFromSelection = (
    selectedFeatures,
    layerTitle,
    objectId
  ) => {
    return selectedFeatures
      .map((layer) => {
        if (layer.layerName === layerTitle) {
          // Filter out the feature
          const filteredFeatures = layer.features.filter(
            (f) =>
              getAttributeCaseInsensitive(f.attributes, "objectid") != objectId
          );
          return filteredFeatures.length > 0
            ? { ...layer, features: filteredFeatures }
            : null;
        }
        return layer;
      })
      .filter(Boolean); // Remove empty layers
  };

  const addOrRemoveFeatureFromSelection = (layerTitle, objectId, feature) => {
    const featureAttributes = feature.attributes;

    if (isFeatureSelected(currentSelectedFeatures, layerTitle, objectId)) {
      // Feature exists - remove it
      return removeFeatureFromSelection(
        currentSelectedFeatures,
        layerTitle,
        objectId
      );
    } else {
      // Feature doesn't exist - add it
      return addFeatureToSelection(
        currentSelectedFeatures,
        layerTitle,
        featureAttributes
      );
    }
  };

  const handleselectFeature = async (objectId) => {
    const matchingFeature = features.find(
      (f) => getAttributeCaseInsensitive(f.attributes, "objectid") == objectId
    );
    if (!matchingFeature) return;

    const layerTitle = getLayerTitle();

    const updatedFeatures = addOrRemoveFeatureFromSelection(
      layerTitle,
      objectId,
      matchingFeature
    );

    dispatch(setSelectedFeatures(updatedFeatures));
    highlightOrUnhighlightFeature(matchingFeature, false, view);

    handleZoomToFeature(objectId);
  };

  const handleZoomToFeature = async (objectId) => {
    if (!objectId || !view) return;

    const matchingFeature = features.find(
      (feature) =>
        getAttributeCaseInsensitive(feature.attributes, "objectid") == objectId
    );
    ZoomToFeature(matchingFeature, view);
  };

  const resetSelection = () => {
    setSelectedLayerId("");
    setSelectedField("");
    setFeatures([]);
    setSearchClicked(false);
    setSearchValue("");
  };

  const showProperties = (value) => {
    const matchingFeature = features.find(
      (feature) =>
        getAttributeCaseInsensitive(feature.attributes, "objectid") == value
    );

    if (matchingFeature) {
      const SelectedNetworklayer = networkService.networkLayers.find(
        (nl) => nl.layerId == Number(selectedLayerId)
      );

      if (!SelectedNetworklayer) return "";

      const identifiableFields = SelectedNetworklayer.layerFields
        .filter((lf) => lf.isIdentifiable === true)
        .map((lf) => lf.dbFieldName.toLowerCase()); // Normalize field names

      // Filter matchingFeature.attributes to only include identifiableFields
      const filteredAttributes = getFilteredAttributes(
        matchingFeature.attributes,
        identifiableFields
      );

      const featureWithDomainValues = getDomainValues(
        utilityNetwork,
        filteredAttributes,
        matchingFeature.layer,
        Number(selectedLayerId)
      );

      setPopupFeature(featureWithDomainValues);
    }
  };

  const OnSearchClicked = async () => {
    setSearchClicked(true);
    if (!searchValue) {
      getAllFeatures();
    } else {
      getFilteredFeatures();
    }
  };

  const getAllFeatures = async () => {
    if (!selectedLayerId) return;

    const featureLayer = await getFeatureLayer();

    try {
      await featureLayer.load();

      const queryFeaturesresult = await featureLayer.queryFeatures({
        where: "1=1",
        outFields: ["*"],
        returnGeometry: true,
      });

      setFeatures(queryFeaturesresult.features);
    } catch (error) {
      console.error("Error loading features:", error);
    }
  };

  const getFilteredFeatures = async () => {
    if (!selectedLayerId) return;

    const featureLayer = await getFeatureLayer();

    try {
      await featureLayer.load();

      const whereClause = getFilteredFeaturesWhereClause();

      const queryFeaturesresult = await featureLayer.queryFeatures({
        where: whereClause,
        outFields: ["*"],
        returnGeometry: true,
      });

      setFeatures(queryFeaturesresult.features);
    } catch (error) {
      console.error("Error loading features:", error);
    }
  };

  const getFilteredFeaturesWhereClause = () => {
    const searchString = searchValue.replace(/'/g, "''");
    const whereClauses = [];

    const SelectedNetworklayer = networkService.networkLayers.find(
      (nl) => nl.layerId == Number(selectedLayerId)
    );

    if (!SelectedNetworklayer) return "";

    const searchableFields = SelectedNetworklayer.layerFields.filter(
      (lf) => lf.isSearchable === true
    );

    searchableFields.forEach((field) => {
      const fieldName = field.dbFieldName;
      const dataType = field.dataType?.toLowerCase();

      if (dataType?.includes("string")) {
        whereClauses.push(`${fieldName} LIKE '%${searchString}%'`);
      } else {
        whereClauses.push(`${fieldName} = ${searchString}`);
      }
    });

    return whereClauses.join(" OR ");
  };

  const getFeatureLayer = async () => {
    const layerData = layers.find(
      (layer) => layer.id.toString() === selectedLayerId
    );
    if (!layerData) return;
    console.log(layerData);

    const utilityNetworkLayerUrl =
      window.mapConfig.portalUrls.utilityNetworkLayerUrl;
    const featureServerUrl = utilityNetworkLayerUrl
      .split("/")
      .slice(0, -1)
      .join("/");
    const featureLayerUrl = `${featureServerUrl}/${layerData.id}`;

    const featureLayer = await createFeatureLayer(
      // `Layer ${layerData.id}`,
      // layerData.id,
      featureLayerUrl,
      {
        outFields: ["*"],
      }
    );

    return featureLayer;
  };

  const isStartingPoint = (globalId) => {
    if (!selectedPoints?.StartingPoints) return false;

    const selectedpoint = selectedPoints.StartingPoints.find(
      (point) => point[1] === globalId
    );
    return selectedpoint !== undefined;
  };

  const addOrRemoveTraceStartPoint = async (
    selectedLayerId,
    objectId,
    feature
  ) => {
    const type = "startingPoint";
    const globalId = getAttributeCaseInsensitive(
      feature.attributes,
      "globalid"
    );
    const assetGroup = getAttributeCaseInsensitive(
      feature.attributes,
      "assetgroup"
    );
    const assetType = getAttributeCaseInsensitive(
      feature.attributes,
      "assettype"
    );

    if (!assetGroup) {
      showErrorToast(
        "Cannot add point: The selected point does not belong to any asset group."
      );
      return;
    }
    if (isStartingPoint(globalId)) {
      dispatch(removeTracePoint(globalId));
    } else {
      // Get terminal id for device/junction features
      const terminalId = getSelectedPointTerminalId(
        utilityNetwork,
        Number(selectedLayerId),
        assetGroup,
        assetType
      );

      const selectedTracePoint = new SelectedTracePoint(
        type,
        globalId,
        Number(selectedLayerId),
        assetGroup,
        assetType,
        terminalId,
        0 // percentAlong
      );

      let featureGeometry = feature.geometry;
      // If it's a line (polyline), take its first point
      if (featureGeometry.type === "polyline") {
        const firstPath = featureGeometry.paths[0]; // first path (array of points)
        const firstPoint = firstPath[0]; // first point in that path

        featureGeometry = {
          type: "point",
          x: firstPoint[0],
          y: firstPoint[1],
          spatialReference: featureGeometry.spatialReference,
        };
      }
      addPointToTrace(
        utilityNetwork,
        selectedPoints,
        selectedTracePoint,
        featureGeometry,
        traceGraphicsLayer,
        dispatch
      );
    }
  };

  const handleTraceStartPoint = (selectedLayerId, objectId) => {
    const matchingFeature = features.find(
      (feature) =>
        getAttributeCaseInsensitive(feature.attributes, "objectid") === objectId
    );

    addOrRemoveTraceStartPoint(selectedLayerId, objectId, matchingFeature);
  };

  const isBarrierPoint = (globalId) => {
    if (!selectedPoints?.Barriers) return false;

    const selectedpoint = selectedPoints.Barriers.find(
      (point) => point[1] === globalId
    );
    return selectedpoint !== undefined;
  };

  const addOrRemoveBarrierPoint = (selectedLayerId, objectId, feature) => {
    const type = "barrier";
    const globalId = getAttributeCaseInsensitive(
      feature.attributes,
      "globalid"
    );
    const assetGroup = getAttributeCaseInsensitive(
      feature.attributes,
      "assetgroup"
    );
    const assetType = getAttributeCaseInsensitive(
      feature.attributes,
      "assettype"
    );

    if (!assetGroup) return;
    if (isBarrierPoint(globalId)) {
      dispatch(removeTracePoint(globalId));
    } else {
      // Get terminal id for device/junction features
      const terminalId = getSelectedPointTerminalId(
        utilityNetwork,
        Number(selectedLayerId),
        assetGroup,
        assetType
      );

      const selectedTracePoint = new SelectedTracePoint(
        type,
        globalId,
        Number(selectedLayerId),
        assetGroup,
        assetType,
        terminalId,
        0 // percentAlong
      );

      let featureGeometry = feature.geometry;
      // If it's a line (polyline), take its first point
      if (featureGeometry.type === "polyline") {
        const firstPath = featureGeometry.paths[0]; // first path (array of points)
        const firstPoint = firstPath[0]; // first point in that path

        featureGeometry = {
          type: "point",
          x: firstPoint[0],
          y: firstPoint[1],
          spatialReference: featureGeometry.spatialReference,
        };
      }
      addPointToTrace(
        utilityNetwork,
        selectedPoints,
        selectedTracePoint,
        featureGeometry,
        traceGraphicsLayer,
        dispatch
      );
    }
  };

  const handleBarrierPoint = (selectedLayerId, objectId) => {
    const matchingFeature = features.find(
      (feature) =>
        getAttributeCaseInsensitive(feature.attributes, "objectid") === objectId
    );
    addOrRemoveBarrierPoint(selectedLayerId, objectId, matchingFeature);
  };

  const renderListDetailsAttributesToJSX = (attributes, layer) => {
    const SelectedNetworklayer = networkService.networkLayers.find(
      (nl) => nl.layerId == Number(selectedLayerId)
    );

    if (!SelectedNetworklayer) return "";

    const listDetailsFields = SelectedNetworklayer.layerFields
      .filter((lf) => lf.isListDetails === true)
      .map((lf) => lf.dbFieldName.toLowerCase()); // Normalize field names

    // Filter attributes to only include listDetailsFields
    const filteredAttributes = getFilteredAttributes(
      attributes,
      listDetailsFields
    );
    const featureWithDomainValues = getDomainValues(
      utilityNetwork,
      filteredAttributes,
      layer,
      Number(selectedLayerId)
    );

    return Object.entries(featureWithDomainValues).map(([key, value]) => (
      <div key={key} style={{ marginBottom: "8px" }}>
        <strong>{key}:</strong> {String(value)}
      </div>
    ));
  };

  if (!isVisible) return null;
  const content = (
    <div>
      <div className="layer-search-bar">
        <div className="layer-select">
          <img src={layer} alt="Layers" className="layer-fixed-icon" />
          <Select
            value={selectedLayerId || undefined}
            onChange={(value) => {
              setSelectedLayerId(value);
              setSelectedField(""); // reset field when layer changes
            }}
            placeholder="All Layers"
            style={{ width: 160 }}
          >
            {layers?.map((layer) => (
              <Option key={layer.id} value={layer.id}>
                {layer.title} ({layer.type})
              </Option>
            ))}
          </Select>
        </div>
        <div className="search-input-wrapper">
          <img src={search} alt="Search" className="search-icon" />

          <Input
            type="text"
            placeholder="Quick Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ flex: 1, border: "none", background: "transparent" }}
            bordered={false}
            onPressEnter={() => handleEnterSearch()}
          />
          {searchValue && (
            <img
              src={close}
              alt="Close"
              className="close-icon"
              onClick={() => {
                setSearchValue(""); // clear the input
                setShowSidebar(false); // hide the sidebar
              }}
            />
          )}
        </div>
      </div>

      {showSidebar && (
        <div className="properties-sidebar">
          <ul className="elements-list">
            <li className="element-item">
              <div className="object-header">
                <span># 123</span>
                <span className="name">RCBO</span>
              </div>
              <img src={file} alt="folder" className="cursor-pointer" />
            </li>
            <li className="element-item">
              <div className="object-header">
                <span># 123</span>
                <span className="name">RCBO</span>
              </div>
              <img src={file} alt="folder" className="cursor-pointer" />
            </li>
            <li className="element-item">
              <div className="object-header">
                <span># 123</span>
                <span className="name">RCBO</span>
              </div>
              <img src={file} alt="folder" className="cursor-pointer" />
            </li>
            <li className="element-item">
              <div className="object-header">
                <span># 123</span>
                <span className="name">RCBO</span>
              </div>
              <img src={file} alt="folder" className="cursor-pointer" />
            </li>
            <li className="element-item">
              <div className="object-header">
                <span># 123</span>
                <span className="name">RCBO</span>
              </div>
              <img src={file} alt="folder" className="cursor-pointer" />
            </li>
            <li className="element-item">
              <div className="object-header">
                <span># 123</span>
                <span className="name">RCBO</span>
              </div>
              <img src={file} alt="folder" className="cursor-pointer" />
            </li>
          </ul>
          <button className="all-result">Show All Result</button>
        </div>
      )}
    </div>
  );
  return container ? ReactDOM.createPortal(content, container) : content;
}
