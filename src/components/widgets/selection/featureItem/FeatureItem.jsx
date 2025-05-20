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
  renderListDetailsAttributesToJSX,
  isBarrierPoint,
  addOrRemoveTraceStartPoint,
  isStartingPoint,
  addOrRemoveBarrierPoint,
  addOrRemoveFeatureFromSelection,
  mergeNetworkLayersWithNetworkLayersCache,
  getAssociationStatusValue,
  showContainment,
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
//menu
import attachment from "../../../../style/images/menu_attachment.svg";
import barrier from "../../../../style/images/barrier.svg";
import connection from "../../../../style/images/connection.svg";
import deselect from "../../../../style/images/deselect.svg";
import edit from "../../../../style/images/edit.svg";
import flag from "../../../../style/images/flag.svg";
import zoom from "../../../../style/images/menu_zoom.svg";
import containment from "../../../../style/images/containment.svg";
//
import ShowProperties from "../../../commonComponents/showProperties/ShowProperties";
import { useI18n } from "../../../../handlers/languageHandler";
import { useTranslation } from "react-i18next";
import store from "../../../../redux/store";
import { setShowPropertiesFeature } from "../../../../redux/commonComponents/showProperties/showPropertiesAction";
import {
  setConnectionParentFeature,
  setConnectionVisiblity,
} from "../../../../redux/commonComponents/showConnection/showConnectionAction";
import {
  setAttachmentParentFeature,
  setAttachmentVisiblity,
} from "../../../../redux/commonComponents/showAttachment/showAttachmentAction";
import {
  setContainmentParentFeature,
  setContainmentVisiblity,
} from "../../../../redux/commonComponents/showContainment/showContainmentAction";
import { setZIndexPanel } from "../../../../redux/ui/uiAction";

export default function FeatureItem({ feature, layer }) {
  const { t, direction } = useI18n("Selection");
  const { t: tTrace, i18n: i18nTrace } = useTranslation("Trace");

  const objectId = getAttributeCaseInsensitive(feature.attributes, "objectid");

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

  const showPropertiesFeature = useSelector(
    (state) => state.showPropertiesReducer.showPropertiesFeature
  );

  const isConnectionVisible = useSelector(
    (state) => state.showConnectionReducer.isConnectionVisible
  );

  const isContainmentVisible = useSelector(
    (state) => state.showContainmentReducer.isContainmentVisible
  );

  const showAttachmentFeature = useSelector(
    (state) => state.showAttachmentReducer.parentFeature
  );

  const showContainmentFeature = useSelector(
    (state) => state.showContainmentReducer.parentFeature
  );

  const dispatch = useDispatch();

  const associationStatusValue = getAssociationStatusValue(
    utilityNetwork,
    feature
  );

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

  const handleZoomToFeature = async () => {
    if (!objectId || !view) return;

    const matchingFeature = feature;
    ZoomToFeature(matchingFeature, view);
  };

  const showProperties = () => {
    const matchingFeature = feature;

    if (matchingFeature) {
      if (
        showPropertiesFeature &&
        getAttributeCaseInsensitive(matchingFeature.attributes, "objectid") ==
          getAttributeCaseInsensitive(
            showPropertiesFeature.attributes,
            "objectid"
          )
      ) {
        dispatch(setShowPropertiesFeature(null));
        return;
      }

      dispatch(setShowPropertiesFeature(matchingFeature));
      dispatch(setZIndexPanel("ShowProperties"));
    }
  };

  const handleUnselectFeature = async () => {
    const matchingFeature = feature;
    if (!matchingFeature) return;

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

  ///////
  const menuZoom = () => {
    if (feature.geometry)
      return (
        <>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={() => handleZoomToFeature()}
          >
            <img src={zoom} alt="zoom" height="18" />
            <span className="m_l_8">{t("Zoom to")}</span>
          </div>
        </>
      );
    else
      return (
        <>
          <div className="d-flex align-items-center text-muted">
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
          className={`d-flex align-items-center cursor-pointer ${
            showPropertiesFeature && "opened"
          }`}
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
    if (associationStatusValue.toLowerCase().includes("connectivity"))
      return (
        <>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={() => showConnection()}
          >
            <img src={connection} alt="connection" height="18" />
            <span className="m_l_8">{t("Connection")}</span>
          </div>
        </>
      );
    else
      return (
        <>
          <div className="d-flex align-items-center text-muted">
            <img src={connection} alt="connection" height="18" />
            <span className="m_l_8">{t("Connection")}</span>
          </div>
        </>
      );
  };

  const menuContainment = () => {
    if (
      associationStatusValue.toLowerCase().includes("containment") ||
      associationStatusValue.toLowerCase().includes("container") ||
      associationStatusValue.toLowerCase().includes("content")
    )
      return (
        <>
          <div
            className={`d-flex align-items-center cursor-pointer ${
              isContainmentVisible && "opened"
            }`}
            onClick={() => {
              showContainment(
                feature,
                showContainmentFeature,
                setContainmentParentFeature,
                dispatch
              );
              // dispatch(setContainmentVisiblity(!isContainmentVisible));
              dispatch(setZIndexPanel("ShowContainment"));
            }}
          >
            <img src={containment} alt="containment" height="18" />
            <span className="m_l_8">{t("containment")}</span>
          </div>
        </>
      );
    else
      return (
        <>
          <div className="d-flex align-items-center text-muted">
            <img src={containment} alt="containment" height="18" />
            <span className="m_l_8">{t("containment")}</span>
          </div>
        </>
      );
  };

  const menuAttachment = () => {
    if (
      associationStatusValue.toLowerCase().includes("attachment") ||
      associationStatusValue.toLowerCase().includes("structure")
    )
      return (
        <>
          <div
            className={`d-flex align-items-center cursor-pointer ${
              showAttachmentFeature && "opened"
            }`}
            onClick={() => {
              showAttachment();
              dispatch(setZIndexPanel("ShowAttachment"));
            }}
          >
            <img src={attachment} alt="attachment" height="18" />
            <span className="m_l_8">{t("attachment")}</span>
          </div>
        </>
      );
    else
      return (
        <>
          <div className="d-flex align-items-center text-muted ">
            <img src={attachment} alt="attachment" height="18" />
            <span className="m_l_8">{t("attachment")}</span>
          </div>
        </>
      );
  };

  const menuUnselect = () => {
    if (feature.geometry)
      return (
        <>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={() => handleUnselectFeature()}
          >
            <img src={deselect} alt="Deselect" height="18" />
            <span className="m_l_8">{t("Deselect")}</span>
          </div>
        </>
      );
    else
      return (
        <>
          <div className="d-flex align-items-center text-muted">
            <img src={flag} alt="zoom" height="18" />
            <span className="m_l_8">{t("Add as a trace start point")}</span>
          </div>
        </>
      );
  };
  const menuTraceStartPoint = () => {
    if (feature.geometry)
      return (
        <>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={() => handleTraceStartPoint()}
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
    else
      return (
        <>
          <div className="d-flex align-items-center text-muted">
            <img src={flag} alt="zoom" height="18" />
            <span className="m_l_8">{t("Add as a trace start point")}</span>
          </div>
        </>
      );
  };
  const menuBarrierPoint = () => {
    if (feature.geometry)
      return (
        <>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={() => handleBarrierPoint()}
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
    else
      return (
        <>
          <div className="d-flex align-items-center text-muted">
            <img src={barrier} alt="zoom" height="18" />
            <span className="m_l_8">{t("Add as a barrier point")}</span>
          </div>
        </>
      );
  };
  //////
  const showConnection = () => {
    dispatch(setConnectionParentFeature(feature));

    dispatch(setConnectionVisiblity(!isConnectionVisible));
  };

  const showAttachment = async () => {
    if (showAttachmentFeature === null)
      dispatch(setAttachmentParentFeature(feature));
    else if (
      getAttributeCaseInsensitive(feature.attributes, "objectid") ===
        getAttributeCaseInsensitive(
          showAttachmentFeature.attributes,
          "objectid"
        ) &&
      feature.layer.layerId === showAttachmentFeature.layer.layerId
    )
      dispatch(setAttachmentParentFeature(null));
    else dispatch(setAttachmentParentFeature(feature));
  };

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
    {
      template: menuConnection,
    },
    {
      template: menuContainment,
    },
    {
      template: menuAttachment,
    },
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
      <div className="object-header" onClick={() => handleZoomToFeature()}>
        <span>
          # {getAttributeCaseInsensitive(feature.attributes, "objectid")}
        </span>

        {renderListDetailsAttributesToJSX(
          feature,
          layer,
          mergeNetworkLayersWithNetworkLayersCache(
            networkService.networkLayers,
            networkLayersCache
          ),
          utilityNetwork
        )}
      </div>
      <div className="header-action">
        <img
          src={file}
          alt="properties"
          className="cursor-pointer"
          onClick={() => showProperties(objectId)}
        />
        <img
          src={dot}
          alt="menu"
          className="cursor-pointer"
          onClick={(event) => {
            setClickedOptions(objectId);
            menuFeature.current.toggle(event);
          }}
        />
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
          <button onClick={() => handleUnselectFeature(objectId)}>
            {t("Unselect")}
          </button>
          <button onClick={() => showProperties(objectId)}>
            {t("Properties")}
          </button>
          <button onClick={() => handleTraceStartPoint(objectId)}>
            {isStartingPoint(
              getAttributeCaseInsensitive(feature.attributes, "globalid")
            )
              ? t("Remove trace start point")
              : t("Add as a trace start point")}
          </button>
          <button onClick={() => handleBarrierPoint(objectId)}>
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
