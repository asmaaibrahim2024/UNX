import { useDispatch, useSelector } from "react-redux";
import "./FeatureItem.scss";
import {
  getAttributeCaseInsensitive,
  getDomainValues,
  highlightOrUnhighlightFeature,
  getFilteredAttributesByFields,
  ZoomToFeature,
  showErrorToast,
  removeFeatureFromSelection,
  removeSingleFeatureFromSelection,
} from "../../../../handlers/esriHandler";
import { removeTracePoint } from "../../../../redux/widgets/trace/traceAction";
import { SelectedTracePoint } from "../../../widgets/trace/models";

import {
  getSelectedPointTerminalId,
  addPointToTrace,
} from "../../trace/traceHandler";
import { useEffect, useState } from "react";
import { setSelectedFeatures } from "../../../../redux/widgets/selection/selectionAction";
import file from "../../../../style/images/document-text.svg";
import dot from "../../../../style/images/dots-vertical.svg";

export default function FeatureItem({
  feature,
  layerTitle,
  layer,
  //   getLayerTitle,
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
        !event.target.closest(".cursor-pointer")
      ) {
        setClickedOptions(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleZoomToFeature = async (objectId) => {
    if (!objectId || !view) return;

    const matchingFeature = feature;
    ZoomToFeature(matchingFeature, view);
  };

  const showProperties = () => {
    const matchingFeature = feature;

    if (matchingFeature) {
      const SelectedNetworklayer = networkService.networkLayers.find((nl) => {
        console.log(nl.layerId);
        console.log(layer.layerId);
        return nl.layerId == Number(layer.layerId);
      });

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
        layer,
        Number(layer.layerId)
      );

      setPopupFeature(featureWithDomainValues);
    }
  };

  const handleUnselectFeature = async (objectId) => {
    const matchingFeature = feature;
    if (!matchingFeature) return;

    removeSingleFeatureFromSelection(
      currentSelectedFeatures,
      layerTitle,
      objectId,
      dispatch,
      setSelectedFeatures,
      view
    );
  };

  const isBarrierPoint = (globalId) => {
    if (!selectedPoints?.Barriers) return false;

    const selectedpoint = selectedPoints.Barriers.find(
      (point) => point[1] === globalId
    );
    return selectedpoint !== undefined;
  };

  const addOrRemoveBarrierPoint = (objectId, feature) => {
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
        Number(layer.layerId),
        assetGroup,
        assetType
      );

      const selectedTracePoint = new SelectedTracePoint(
        type,
        globalId,
        Number(layer.layerId),
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

  const handleBarrierPoint = (objectId) => {
    const matchingFeature = feature;
    addOrRemoveBarrierPoint(objectId, matchingFeature);
  };

  const handleTraceStartPoint = (objectId) => {
    const matchingFeature = feature;

    addOrRemoveTraceStartPoint(matchingFeature);
  };

  const addOrRemoveTraceStartPoint = async (feature) => {
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
        Number(layer.layerId),
        assetGroup,
        assetType
      );

      const selectedTracePoint = new SelectedTracePoint(
        type,
        globalId,
        Number(layer.layerId),
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
      <div
        className="object-header"
        onClick={() => handleZoomToFeature(objectId)}
      >
        <span>
          # {getAttributeCaseInsensitive(feature.attributes, "objectid")}
        </span>
      </div>
      <div className="header-action">
        {/* <img
          src={file}
          alt="folder"
          className="cursor-pointer"
          onClick={() => showProperties(objectId)}
        /> */}
        <img
          src={dot}
          alt="folder"
          className="cursor-pointer"
          onClick={() => setClickedOptions(objectId)}
        />
      </div>
      {clickedOptions === objectId && (
        <div className="value-menu">
          <button onClick={() => handleZoomToFeature(objectId)}>Zoom to</button>
          <button onClick={() => handleUnselectFeature(objectId)}>
            Unselect
          </button>
          <button onClick={() => showProperties(objectId)}>Properties</button>
          <button onClick={() => handleTraceStartPoint(objectId)}>
            {isStartingPoint(
              getAttributeCaseInsensitive(feature.attributes, "globalid")
            )
              ? "Remove trace start point"
              : "Add as a trace start point"}
          </button>
          <button onClick={() => handleBarrierPoint(objectId)}>
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
