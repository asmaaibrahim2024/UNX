import { connect, useDispatch, useSelector } from "react-redux";
import "./FeaturePopup.scss";
import {
  addOrRemoveBarrierPoint,
  addOrRemoveFeatureFromSelection,
  addOrRemoveTraceStartPoint,
  getAttributeCaseInsensitive,
  getDomainValues,
  getFieldNameFromDbAndValueFromAttributes,
  getFilteredAttributesByFields,
  getSelectedFeaturesForLayer,
  isBarrierPoint,
  isFeatureAlreadySelected,
  isStartingPoint,
  mergeNetworkLayersWithNetworkLayersCache,
  ZoomToFeature,
} from "../../../handlers/esriHandler";
import { useEffect, useRef, useState } from "react";
import { setSelectedFeatures } from "../../../redux/widgets/selection/selectionAction";
import { setConnectionVisiblity } from "../../../redux/commonComponents/showConnection/showConnectionAction";
import { setAttachmentVisiblity } from "../../../redux/commonComponents/showAttachment/showAttachmentAction";

import store from "../../../redux/store";
import { useI18n } from "../../../handlers/languageHandler";

import { Menu } from "primereact/menu";

import dot from "../../../style/images/dots-vertical.svg";

import fileActive from "../../../style/images/document-text-active.svg";
import arrowRight from "../../../style/images/arrow-right.svg";
import arrowLeft from "../../../style/images/arrow-left.svg";
//menu
import file from "../../../style/images/document-text.svg";
import attachment from "../../../style/images/menu_attachment.svg";
import barrier from "../../../style/images/barrier.svg";
import connection from "../../../style/images/connection.svg";
import deselect from "../../../style/images/deselect.svg";
import select from "../../../style/images/select.svg";
import edit from "../../../style/images/edit.svg";
import flag from "../../../style/images/flag.svg";
import zoom from "../../../style/images/menu_zoom.svg";
//
import ShowProperties from "../../commonComponents/showProperties/ShowProperties";
import {
  addPointToTrace,
  getSelectedPointTerminalId,
} from "../../widgets/trace/traceHandler";
import { useTranslation } from "react-i18next";
import { SelectedTracePoint } from "../../widgets/trace/models";
import { removeTracePoint } from "../../../redux/widgets/trace/traceAction";
import { setShowPropertiesFeature } from "../../../redux/commonComponents/showProperties/showPropertiesAction";

const FeaturePopup = ({ feature, index, total, onPrev, onNext }) => {
  // const attributes = feature.attributes;
  // console.log(feature, index, total, onPrev, onNext, "Mariiiiiiiiiiiam");

  const [attributesForPopup, setAttributesForPopup] = useState({});

  const { t, direction } = useI18n("MapView");
  const { i18n } = useTranslation("MapView");
  const { t: tTrace, i18n: i18nTrace } = useTranslation("Trace");

  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const networkService = useSelector(
    (state) => state.mapSettingReducer.networkServiceConfig
  );
  const currentSelectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );
  const selectedPoints = useSelector(
    (state) => state.traceReducer.selectedPoints
  );
  const traceGraphicsLayer = useSelector(
    (state) => state.traceReducer.traceGraphicsLayer
  );
  const networkLayersCache = useSelector(
    (state) => state.mapSettingReducer.networkLayersCache
  );

  const view = useSelector((state) => state.mapViewReducer.intialView);

  const showPropertiesFeature = useSelector(
    (state) => state.showPropertiesReducer.showPropertiesFeature
  );

  const isConnectionVisible = useSelector(
    (state) => state.showConnectionReducer.isConnectionVisible
  );

  const isAttachmentVisible = useSelector(
    (state) => state.showAttachmentReducer.isAttachmentVisible
  );

  const dispatch = useDispatch();

  function getFilteredFeatureAttributes(feature, networkService) {
    const networkLayers = mergeNetworkLayersWithNetworkLayersCache(
      networkService.networkLayers,
      networkLayersCache
    );
    const SelectedNetworklayer = networkLayers.find(
      (nl) => nl.layerId === Number(feature.layer.layerId)
    );

    const identifiableFields =
      SelectedNetworklayer?.layerFields
        .filter((lf) => lf.isIdentifiable)
        .map((lf) => lf.dbFieldName.toLowerCase()) ?? [];
    console.log(identifiableFields);
    return getFilteredAttributesByFields(
      feature.attributes,
      identifiableFields
    );
  }

  function getFeatureWithDomainValues(attributes, layer, objectId) {
    const featureWithDomainValues = {};

    featureWithDomainValues.attributes = getDomainValues(
      utilityNetwork,
      attributes,
      layer,
      Number(layer.layerId)
    ).rawKeyValues;

    featureWithDomainValues.objectId = objectId;

    return featureWithDomainValues;
  }

  const getAttributesForPopup = () => {
    const filteredAttributes = getFilteredFeatureAttributes(
      feature,
      networkService
    );
    const filteredWithDomain = getFeatureWithDomainValues(
      filteredAttributes,
      feature.layer,
      getAttributeCaseInsensitive(filteredAttributes, "objectid")
    );

    const networkLayers = mergeNetworkLayersWithNetworkLayersCache(
      networkService.networkLayers,
      networkLayersCache
    );

    const currentLayerFields = networkLayers.find(
      (nl) => nl.layerId === feature.layer.layerId
    ).layerFields;

    const attributesWithSelectedLanguage =
      getFieldNameFromDbAndValueFromAttributes(
        currentLayerFields,
        filteredWithDomain.attributes,
        i18n
      );

    setAttributesForPopup(attributesWithSelectedLanguage);
  };

  // to load the attributes of the popup
  useEffect(() => {
    getAttributesForPopup();
  }, [feature, networkLayersCache]);

  // ✅ Attach the language listener once
  useEffect(() => {
    i18n.on("languageChanged", getAttributesForPopup);
    return () => {
      i18n.off("languageChanged", getAttributesForPopup);
    };
  }, [feature, networkLayersCache]);

  const handleZoomToFeature = async () => {
    const matchingFeature = feature;
    const objectId = getAttributeCaseInsensitive(
      matchingFeature.attributes,
      "objectid"
    );

    if (!objectId || !view) return;

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
    }
  };

  const handleselectFeature = async () => {
    const objectId = getAttributeCaseInsensitive(
      feature.attributes,
      "objectid"
    );

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

  const menuZoom = () => {
    const objectId = getAttributeCaseInsensitive(
      feature.attributes,
      "objectid"
    );
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
  };

  const menuProperties = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => showProperties()}
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
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => showConnection()}
        >
          <img src={connection} alt="connection" height="18" />
          <span className="m_l_8">{t("Connection")}</span>
        </div>
      </>
    );
  };
  const menuAttachment = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => {
            dispatch(setAttachmentVisiblity(!isAttachmentVisible));
          }}
        >
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
          onClick={() => handleselectFeature()}
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
  };

  const menuBarrierPoint = () => {
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
  };

  const showConnection = () => {
    dispatch(setConnectionVisiblity(!isConnectionVisible));
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

  if (!feature) return null;

  return (
    <div className="featurePopup_container">
      <div className="card h-100">
        <div className="card-header p_l_16 p_r_6 border-0 bg-transparent d-flex justify-content-between">
          <span>
            # {getAttributeCaseInsensitive(feature.attributes, "objectid")}
          </span>
          <span>{feature.layer.title}</span>
          <div className="d-flex align-items-center">
            {!showPropertiesFeature ? (
              <img
                src={file}
                alt="properties"
                className={`cursor-pointer btn_feature`}
                onClick={() => showProperties()}
              />
            ) : (
              <img
                src={fileActive}
                alt="properties"
                className={`cursor-pointer btn_feature active`}
                onClick={() => showProperties()}
              />
            )}
            <img
              src={dot}
              alt="folder"
              className="cursor-pointer btn_feature"
              onClick={(event) => {
                menuFeature.current.toggle(event);
              }}
            />
          </div>
        </div>
        <div className="card-body p_x_16 p_t_0 p_b_16">
          <Menu
            model={items}
            popup
            ref={menuFeature}
            popupAlignment="left"
            className="feature_menu"
          />
          <div>
            {Object.entries(attributesForPopup).map(([key, value]) => (
              <div className="data_row" key={key}>
                <span>{key}:</span>
                <span className="m_l_8">{value?.toString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-footer p_x_16 p_y_6">
          <div className="actions">
            <img
              src={arrowLeft}
              alt="right"
              className={`cursor-pointer ${index === 0 && "disabled"}`}
              onClick={onPrev}
              disabled={index === 0}
            />
            <span className="no">
              {index + 1} of {total}
            </span>
            <img
              src={arrowRight}
              alt="left"
              className={`cursor-pointer ${index === total - 1 && "disabled"}`}
              onClick={onNext}
              disabled={index === total - 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturePopup;
