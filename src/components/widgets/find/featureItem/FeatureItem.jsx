import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Menu } from "primereact/menu";
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
//menu
import file from "../../../../style/images/document-text.svg";
import attachment from "../../../../style/images/menu_attachment.svg";
import barrier from "../../../../style/images/barrier.svg";
import connection from "../../../../style/images/connection.svg";
import deselect from "../../../../style/images/deselect.svg";
import edit from "../../../../style/images/edit.svg";
import flag from "../../../../style/images/flag.svg";
import zoom from "../../../../style/images/menu_zoom.svg";
//
import ShowProperties from "../../../commonComponents/showProperties/ShowProperties";
import { useTranslation } from "react-i18next";
import { useI18n } from "../../../../handlers/languageHandler";

export default function FeatureItem({
  feature,
  layerTitle,
  popupFeature,
  setPopupFeature,
}) {
  const { t, direction } = useI18n("Find");
  const { t: tTrace, i18n: i18nTrace } = useTranslation("Trace");

  const objectId = getAttributeCaseInsensitive(feature.attributes, "objectid");

  // console.log(feature);
  const [clickedOptions, setClickedOptions] = useState(null);

  const currentSelectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );
  const selectedPoints = useSelector(
    (state) => state.traceReducer.selectedPoints
  );
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );

  const networkService = useSelector(
    (state) => state.mapSettingReducer.networkServiceConfig
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
    setPopupFeature(null);

    if (!objectId || !view) return;

    const matchingFeature = feature;
    ZoomToFeature(matchingFeature, view);
  };

  const showProperties = () => {
    const matchingFeature = feature;

    if (matchingFeature) {
      if (
        popupFeature &&
        getAttributeCaseInsensitive(matchingFeature.attributes, "objectid") ==
          getAttributeCaseInsensitive(popupFeature.attributes, "objectid")
      ) {
        setPopupFeature(null);
        return;
      }

      setPopupFeature(matchingFeature);
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
    setPopupFeature(null);

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
      // Remove point graphic from map
      const graphicToRemove = traceGraphicsLayer.graphics.find(
        (g) => g.attributes?.id === globalId
      );
      if (graphicToRemove) {
        traceGraphicsLayer.graphics.remove(graphicToRemove);
      }
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
    setPopupFeature(null);

    const matchingFeature = feature;
    addOrRemoveBarrierPoint(matchingFeature);
  };

  const handleTraceStartPoint = () => {
    setPopupFeature(null);

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
      // Remove point graphic from map
      const graphicToRemove = traceGraphicsLayer.graphics.find(
        (g) => g.attributes?.id === globalId
      );
      if (graphicToRemove) {
        traceGraphicsLayer.graphics.remove(graphicToRemove);
      }
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
  ///////
  const menuZoom = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => handleZoomToFeature(objectId)}
        >
          <img src={zoom} alt="zoom" height="18" />
          <span className="m_l_8">{t("Zoom to")}</span>
        </div>
      </>
    );
  };
  const menuProperties = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => showProperties(objectId)}
        >
          <img src={file} alt="Properties" height="18" />
          <span className="m_l_8">{t("Properties")}</span>
        </div>
      </>
    );
  };
  const menuEdit = () => {
    return (
      <>
        <div className="d-flex align-items-center cursor-pointer">
          <img src={edit} alt="edit" height="18" />
          <span className="m_l_8">{t("Edit")}</span>
        </div>
      </>
    );
  };
  const menuConnection = () => {
    return (
      <>
        <div className="d-flex align-items-center cursor-pointer">
          <img src={connection} alt="connection" height="18" />
          <span className="m_l_8">{t("Connection")}</span>
        </div>
      </>
    );
  };
  const menuAttachment = () => {
    return (
      <>
        <div className="d-flex align-items-center cursor-pointer">
          <img src={attachment} alt="attachment" height="18" />
          <span className="m_l_8">{t("attachment")}</span>
        </div>
      </>
    );
  };
  const menuUnselect = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => handleselectFeature(objectId)}
        >
          <img src={deselect} alt="Unselect" height="18" />
          <span className="m_l_8">
            {isFeatureAlreadySelected(getSelectedFeaturesForLayer(), feature)
              ? t("Unselect")
              : t("Select")}
          </span>
        </div>
      </>
    );
  };
  const menuTraceStartPoint = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => handleTraceStartPoint(objectId)}
        >
          <img src={flag} alt="zoom" height="18" />
          <span className="m_l_8">
            {isStartingPoint(
              getAttributeCaseInsensitive(feature.attributes, "globalid")
            )
              ? t("Remove trace start point")
              : t("Add as a trace start point")}
          </span>
        </div>
      </>
    );
  };
  const menuBarrierPoint = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => handleBarrierPoint(objectId)}
        >
          <img src={barrier} alt="zoom" height="18" />
          <span className="m_l_8">
            {isBarrierPoint(
              getAttributeCaseInsensitive(feature.attributes, "globalid")
            )
              ? t("Remove barrier point")
              : t("Add as a barrier point")}
          </span>
        </div>
      </>
    );
  };
  //////

  const menuFeature = useRef(null);
  const items = [
    {
      template: menuZoom,
    },
    {
      template: menuProperties,
    },
    // {
    //   template: menuEdit,
    // },
    // {
    //   template: menuConnection,
    // },
    // {
    //   template: menuAttachment,
    // },
    {
      template: menuUnselect,
      className: "item_unselect",
    },
    {
      label: t("Add"),
      items: [
        {
          template: menuTraceStartPoint,
        },
        {
          template: menuBarrierPoint,
        },
      ],
    },
  ];

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
        onClick={(event) => {
          setClickedOptions(objectId);
          menuFeature.current.toggle(event);
        }}
      >
        <img src={dot} alt="folder" className="cursor-pointer" />
        <Menu
          model={items}
          popup
          ref={menuFeature}
          popupAlignment="left"
          className="feature_menu"
        />
      </div>

      {/* {clickedOptions === objectId && (
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
      )} */}
    </>
  );
}
