import { useDispatch, useSelector } from "react-redux";
import "./FeatureItem.scss";
import {
  getAttributeCaseInsensitive,
  getDomainValues,
  highlightOrUnhighlightFeature,
  getFilteredAttributesByFields,
  ZoomToFeature,
  showErrorToast,
} from "../../../../handlers/esriHandler";
import { removeTracePoint } from "../../../../redux/widgets/trace/traceAction";
import { SelectedTracePoint } from "../../../widgets/trace/models";

import {
  getSelectedPointTerminalId,
  addPointToTrace,
} from "../../trace/traceHandler";
import { useEffect, useState } from "react";
import { setSelectedFeatures } from "../../../../redux/widgets/selection/selectionAction";

export default function FeatureItem({
  feature,
  layerTitle,
  selectedLayerId,
  getLayerTitle,
}) {
  const objectId = getAttributeCaseInsensitive(feature.attributes, "objectid");

  const [clickedOptions, setClickedOptions] = useState(null);
  const [popupFeature, setPopupFeature] = useState(null);

  const currentSelectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );
  const selectedPoints = useSelector(
    (state) => state.traceReducer.selectedPoints
  );
  const utilityNetwork = useSelector(
    (state) => state.traceReducer.utilityNetworkIntial
  );

  const networkService = useSelector(
    (state) => state.mapViewReducer.networkService
  );

  const traceGraphicsLayer = useSelector(
    (state) => state.traceReducer.traceGraphicsLayer
  );
  const view = useSelector((state) => state.mapViewReducer.intialView);

  const dispatch = useDispatch();

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

  const renderListDetailsAttributesToJSX = (feature, layer) => {
    const attributes = feature.attributes;
    const SelectedNetworklayer = networkService.networkLayers.find(
      (nl) => nl.layerId == Number(layer.layerId)
    );

    if (!SelectedNetworklayer) return "";

    const listDetailsFields = SelectedNetworklayer.layerFields
      .filter((lf) => lf.isListDetails === true)
      .map((lf) => lf.dbFieldName.toLowerCase()); // Normalize field names

    // Filter attributes to only include listDetailsFields
    const filteredAttributes = getFilteredAttributesByFields(
      attributes,
      listDetailsFields
    );

    const filteredAttributessWithoutObjectId = Object.fromEntries(
      Object.entries(filteredAttributes).filter(
        ([key]) => key.toLowerCase() !== "objectid"
      )
    );
    const featureWithDomainValues = getDomainValues(
      utilityNetwork,
      filteredAttributessWithoutObjectId,
      feature.layer,
      Number(layer.layerId)
    );

    return Object.entries(featureWithDomainValues).map(([key, value]) => (
      <span className="name">{String(value)}</span>
    ));
  };

  const handleZoomToFeature = async (objectId) => {
    if (!objectId || !view) return;

    const matchingFeature = feature;
    ZoomToFeature(matchingFeature, view);
  };

  const showProperties = () => {
    const matchingFeature = feature;

    if (matchingFeature) {
      const SelectedNetworklayer = networkService.networkLayers.find(
        (nl) => nl.layerId == Number(selectedLayerId)
      );

      if (!SelectedNetworklayer) return "";

      const identifiableFields = SelectedNetworklayer.layerFields
        .filter((lf) => lf.isIdentifiable === true)
        .map((lf) => lf.dbFieldName.toLowerCase()); // Normalize field names

      // Filter matchingFeature.attributes to only include identifiableFields
      const filteredAttributes = getFilteredAttributesByFields(
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
    const matchingFeature = feature;
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
    const matchingFeature = feature;
    addOrRemoveBarrierPoint(selectedLayerId, objectId, matchingFeature);
  };

  const handleTraceStartPoint = (selectedLayerId, objectId) => {
    const matchingFeature = feature;

    addOrRemoveTraceStartPoint(selectedLayerId, matchingFeature);
  };

  const addOrRemoveTraceStartPoint = async (selectedLayerId, feature) => {
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

  const isStartingPoint = (globalId) => {
    if (!selectedPoints?.StartingPoints) return false;

    const selectedpoint = selectedPoints.StartingPoints.find(
      (point) => point[1] === globalId
    );
    return selectedpoint !== undefined;
  };

  return (
    <>
      <div className="object-header">
        <span># {objectId} </span>
        {renderListDetailsAttributesToJSX(feature, feature.layer)}
      </div>
      <div
        className="options-button"
        onClick={() => setClickedOptions(objectId)}
      >
        <div className="options-button-dot">.</div>
        <div className="options-button-dot">.</div>
        <div className="options-button-dot">.</div>
      </div>

      {clickedOptions === objectId && (
        <div className="value-menu">
          <button onClick={() => handleZoomToFeature(objectId)}>Zoom to</button>
          <button onClick={() => handleselectFeature(objectId)}>
            {isFeatureSelected(currentSelectedFeatures, layerTitle, objectId)
              ? "Unselect"
              : "Select"}
          </button>
          <button onClick={() => showProperties(objectId)}>Properties</button>
          <button
            onClick={() => handleTraceStartPoint(selectedLayerId, objectId)}
          >
            {isStartingPoint(
              getAttributeCaseInsensitive(feature.attributes, "globalid")
            )
              ? "Remove trace start point"
              : "Add as a trace start point"}
          </button>
          <button onClick={() => handleBarrierPoint(selectedLayerId, objectId)}>
            {isBarrierPoint(
              getAttributeCaseInsensitive(feature.attributes, "globalid")
            )
              ? "Remove barrier point"
              : "Add as a barrier point"}
          </button>
        </div>
      )}

      {popupFeature && (
        <div className="properties-sidebar">
          <button
            className="close-button"
            onClick={() => setPopupFeature(null)}
          >
            ❌
          </button>
          <h3>Feature Details</h3>
          <ul>
            {Object.entries(popupFeature).map(([key, val]) => (
              <li key={key}>
                <strong>{key}:</strong> {val}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
