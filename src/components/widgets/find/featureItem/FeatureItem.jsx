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
  renderListDetailsAttributesToJSX,
  addOrRemoveFeatureFromSelection,
  isBarrierPoint,
  isStartingPoint,
  addOrRemoveTraceStartPoint,
  addOrRemoveBarrierPoint,
  mergeNetworkLayersWithNetworkLayersCache,
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
import select from "../../../../style/images/select.svg";
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
  setSelectedObjectIdsByFindGroupedByLayerTitle,
  selectedObjectIdsByFindGroupedByLayerTitle,
  startingPointsGlobalIds,
  setStartingPointsGlobalIds,
  barrierPointsGlobalIds,
  setBarrierPointsGlobalIds,
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
  const networkLayersCache = useSelector(
    (state) => state.mapSettingReducer.networkLayersCache
  );
  const traceGraphicsLayer = useSelector(
    (state) => state.traceReducer.traceGraphicsLayer
  );
  const view = useSelector((state) => state.mapViewReducer.intialView);

  const dispatch = useDispatch();

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     // Check if the click is outside the options menu
  //     if (
  //       !event.target.closest(".value-menu") &&
  //       !event.target.closest(".header-action")
  //     ) {
  //       setClickedOptions(null);
  //     }
  //   };

  //   document.addEventListener("click", handleClickOutside);
  //   return () => document.removeEventListener("click", handleClickOutside);
  // }, []);

  const handleZoomToFeature = async (objectId) => {
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

  const handleselectFeature = async (objectId) => {
    const matchingFeature = feature;
    if (!matchingFeature) return;

    let currentSelectedObjectIdsByFindGroupedByLayerTitle =
      selectedObjectIdsByFindGroupedByLayerTitle;
    if (!currentSelectedObjectIdsByFindGroupedByLayerTitle[feature.layer.title])
      currentSelectedObjectIdsByFindGroupedByLayerTitle[feature.layer.title] =
        [];

    if (
      currentSelectedObjectIdsByFindGroupedByLayerTitle[feature.layer.title]
    ) {
      if (
        currentSelectedObjectIdsByFindGroupedByLayerTitle[
          feature.layer.title
        ].find((oid) => oid === objectId)
      ) {
        currentSelectedObjectIdsByFindGroupedByLayerTitle =
          currentSelectedObjectIdsByFindGroupedByLayerTitle[
            feature.layer.title
          ].filter((oid) => oid !== objectId);
      } else {
        currentSelectedObjectIdsByFindGroupedByLayerTitle[
          feature.layer.title
        ].push(objectId);
      }
      setSelectedObjectIdsByFindGroupedByLayerTitle(
        currentSelectedObjectIdsByFindGroupedByLayerTitle
      );
    }

    await addOrRemoveFeatureFromSelection(
      objectId,
      matchingFeature,
      currentSelectedFeatures,
      feature.layer.title,
      dispatch,
      setSelectedFeatures,
      view,
      () => store.getState().selectionReducer.selectedFeatures
    );
  };

  const handleBarrierPoint = () => {
    const matchingFeature = feature;

    const featureGlobalId = getAttributeCaseInsensitive(
      feature.attributes,
      "globalid"
    );

    let currentBarrierPointsGlobalIds = barrierPointsGlobalIds;

    if (currentBarrierPointsGlobalIds.find((gid) => gid === featureGlobalId)) {
      currentBarrierPointsGlobalIds = currentBarrierPointsGlobalIds.filter(
        (gid) => gid !== featureGlobalId
      );
    } else {
      currentBarrierPointsGlobalIds.push(featureGlobalId);
    }

    setBarrierPointsGlobalIds(currentBarrierPointsGlobalIds);

    addOrRemoveBarrierPoint(
      matchingFeature,
      SelectedTracePoint,
      traceGraphicsLayer,
      dispatch,
      removeTracePoint,
      getSelectedPointTerminalId,
      addPointToTrace,
      utilityNetwork,
      selectedPoints,
      tTrace
    );
  };

  const handleTraceStartPoint = () => {
    const matchingFeature = feature;

    const featureGlobalId = getAttributeCaseInsensitive(
      feature.attributes,
      "globalid"
    );

    let currentStartingPointsGlobalIds = startingPointsGlobalIds;

    if (currentStartingPointsGlobalIds.find((gid) => gid === featureGlobalId)) {
      currentStartingPointsGlobalIds = currentStartingPointsGlobalIds.filter(
        (gid) => gid !== featureGlobalId
      );
    } else {
      currentStartingPointsGlobalIds.push(featureGlobalId);
    }

    setStartingPointsGlobalIds(currentStartingPointsGlobalIds);

    addOrRemoveTraceStartPoint(
      matchingFeature,
      SelectedTracePoint,
      traceGraphicsLayer,
      dispatch,
      removeTracePoint,
      getSelectedPointTerminalId,
      addPointToTrace,
      utilityNetwork,
      selectedPoints,
      tTrace
    );
  };

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
          <img src={file} alt="Show Properties" height="18" />
          <span className="m_l_8">{t("Show Properties")}</span>
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
          {isFeatureAlreadySelected(
            getSelectedFeaturesForLayer(currentSelectedFeatures, feature),
            feature
          ) ? (
            <>
              <img src={deselect} alt="Deselect" height="18" />
              <span className="m_l_8">{t("Deselect")}</span>
            </>
          ) : (
            <>
              <img src={select} alt="Select" height="18" />
              <span className="m_l_8">{t("Select")}</span>
            </>
          )}
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
              getAttributeCaseInsensitive(feature.attributes, "globalid"),
              selectedPoints
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
              getAttributeCaseInsensitive(feature.attributes, "globalid"),
              selectedPoints
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
        {renderListDetailsAttributesToJSX(
          feature,
          feature.layer,
          mergeNetworkLayersWithNetworkLayersCache(
            networkService.networkLayers,
            networkLayersCache
          ),
          utilityNetwork
        )}
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
