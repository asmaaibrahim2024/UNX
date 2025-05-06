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
  addSingleFeatureToSelection,
  isFeatureAlreadySelected,
} from "../../../../handlers/esriHandler";
import { removeTracePoint } from "../../../../redux/widgets/trace/traceAction";
import { SelectedTracePoint } from "../../../widgets/trace/models";

import {
  getSelectedPointTerminalId,
  addPointToTrace,
} from "../../trace/traceHandler";
import { useEffect, useState } from "react";
import { setSelectedFeatures } from "../../../../redux/widgets/selection/selectionAction";
import store from "../../../../redux/store";

import dot from "../../../../style/images/dots-vertical.svg";
import ShowProperties from "../../../commonComponents/showProperties/ShowProperties";
import { useTranslation } from "react-i18next";
import { useI18n } from "../../../../handlers/languageHandler";

export default function FeatureItem({ feature, layerTitle }) {
  const { t, direction } = useI18n("Find");
  const { t: tTrace, i18n: i18nTrace } = useTranslation("Trace");

  const objectId = getAttributeCaseInsensitive(feature.attributes, "objectid");

  // console.log(feature);
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
        !event.target.closest(".header-action")
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
    ).formattedAttributes;

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
        (nl) => nl.layerId == Number(feature.layer.layerId)
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

      const featureWithDomainValues = {};
      featureWithDomainValues.attributes = getDomainValues(
        utilityNetwork,
        filteredAttributes,
        matchingFeature.layer,
        Number(matchingFeature.layer.layerId)
      ).formattedAttributes;

      setPopupFeature(featureWithDomainValues);
    }
  };

  const getSelectedFeaturesForLayer = () => {
    return (
      currentSelectedFeatures.find((selectedfeature) => {
        return (
          Number(selectedfeature.layer.layerId) ===
          Number(feature.layer.layerId)
        );
      })?.features || []
    );
  };

  const addOrRemoveFeatureFromSelection = async (objectId, feature) => {
    // const featureAttributes = feature.attributes;
    const matchingFeatures = getSelectedFeaturesForLayer();

    if (isFeatureAlreadySelected(matchingFeatures, feature)) {
      // Feature exists - remove it
      return removeSingleFeatureFromSelection(
        currentSelectedFeatures,
        layerTitle,
        objectId,
        dispatch,
        setSelectedFeatures,
        view
      );
    } else {
      // Feature doesn't exist - add it
      return await addSingleFeatureToSelection(
        feature,
        feature.layer,
        view,
        () => store.getState().selectionReducer.selectedFeatures,
        dispatch,
        setSelectedFeatures
      );
    }
  };

  const handleselectFeature = async (objectId) => {
    const matchingFeature = feature;
    if (!matchingFeature) return;

    await addOrRemoveFeatureFromSelection(objectId, matchingFeature);
  };

  const isBarrierPoint = (globalId) => {
    if (!selectedPoints?.Barriers) return false;

    const selectedpoint = selectedPoints.Barriers.find(
      (point) => point[1] === globalId
    );
    return selectedpoint !== undefined;
  };

  const addOrRemoveBarrierPoint = (feature) => {
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
        Number(feature.layer.layerId),
        assetGroup,
        assetType
      );

      const selectedTracePoint = new SelectedTracePoint(
        type,
        globalId,
        Number(feature.layer.layerId),
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
        dispatch,
        tTrace
      );
    }
  };

  const handleBarrierPoint = () => {
    const matchingFeature = feature;
    addOrRemoveBarrierPoint(matchingFeature);
  };

  const handleTraceStartPoint = () => {
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
        Number(feature.layer.layerId),
        assetGroup,
        assetType
      );

      const selectedTracePoint = new SelectedTracePoint(
        type,
        globalId,
        Number(feature.layer.layerId),
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
        dispatch,
        tTrace
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
        <span># {objectId} </span>
        {renderListDetailsAttributesToJSX(feature, feature.layer)}
      </div>
      <div
        className="header-action"
        onClick={() => {
          setClickedOptions(objectId);
        }}
      >
        <img src={dot} alt="folder" className="cursor-pointer" />
      </div>

      {clickedOptions === objectId && (
        <div className="value-menu">
          <button onClick={() => handleZoomToFeature(objectId)}>
            {t("Zoom to")}
          </button>
          <button onClick={() => handleselectFeature(objectId)}>
            {isFeatureAlreadySelected(getSelectedFeaturesForLayer(), feature)
              ? t("Unselect")
              : t("Select")}
          </button>
          <button onClick={() => showProperties(objectId)}>
            {t("Properties")}
          </button>
          <button onClick={() => handleTraceStartPoint()}>
            {isStartingPoint(
              getAttributeCaseInsensitive(feature.attributes, "globalid")
            )
              ? t("Remove trace start point")
              : t("Add as a trace start point")}
          </button>
          <button onClick={() => handleBarrierPoint()}>
            {isBarrierPoint(
              getAttributeCaseInsensitive(feature.attributes, "globalid")
            )
              ? t("Remove barrier point")
              : t("Add as a barrier point")}
          </button>
        </div>
      )}

      {popupFeature && (
        <ShowProperties
          feature={popupFeature}
          direction={direction}
          t={t}
          isLoading={false}
          onClose={() => setPopupFeature(null)}
        />
      )}
    </>
  );
}
