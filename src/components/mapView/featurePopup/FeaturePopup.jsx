import { useDispatch, useSelector } from "react-redux";
import {
  addOrRemoveBarrierPoint,
  addOrRemoveFeatureFromSelection,
  addOrRemoveTraceStartPoint,
  getAttributeCaseInsensitive,
  getDomainValues,
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

import store from "../../../redux/store";
import { useI18n } from "../../../handlers/languageHandler";

import { Menu } from "primereact/menu";

import dot from "../../../style/images/dots-vertical.svg";

import file from "../../../style/images/document-text.svg";
import barrier from "../../../style/images/barrier.svg";
import deselect from "../../../style/images/deselect.svg";
import select from "../../../style/images/select.svg";
import flag from "../../../style/images/flag.svg";
import Zoom from "../../../style/images/menu_zoom.svg";
import ShowProperties from "../../commonComponents/showProperties/ShowProperties";
import {
  addPointToTrace,
  getSelectedPointTerminalId,
} from "../../widgets/trace/traceHandler";
import { useTranslation } from "react-i18next";
import { SelectedTracePoint } from "../../widgets/trace/models";
import { removeTracePoint } from "../../../redux/widgets/trace/traceAction";

const FeaturePopup = ({ feature, index, total, onPrev, onNext }) => {
  // const attributes = feature.attributes;

  const [attributesForPopup, setAttributesForPopup] = useState({});
  const [popupFeature, setPopupFeature] = useState(null);

  const { t, direction } = useI18n("MapView");
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
    ).formattedAttributes;

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

    setAttributesForPopup(filteredWithDomain.attributes);
  };

  // to load the attributes of the popup
  useEffect(() => {
    getAttributesForPopup();
  }, [feature, index]);

  const handleZoomToFeature = async () => {
    setPopupFeature(null);

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

  const handleselectFeature = async () => {
    setPopupFeature(null);

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
    setPopupFeature(null);

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
    setPopupFeature(null);

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
          <img src={Zoom} alt="zoom" height="18" />
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
              <img src={deselect} alt="Unselect" height="18" />
              <span className="m_l_8">{t("Unselect")}</span>
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

  if (!feature) return null;

  return (
    <div
      style={{
        background: "white",
        padding: "10px",
        borderRadius: "8px",
        maxWidth: "300px",
      }}
    >
      <b>
        # {getAttributeCaseInsensitive(feature.attributes, "objectid")} Feature
        Info
      </b>
      <img
        src={dot}
        alt="folder"
        className="cursor-pointer"
        onClick={(event) => {
          menuFeature.current.toggle(event);
        }}
      />
      <img
        src={file}
        alt="properties"
        className="cursor-pointer"
        onClick={() => showProperties()}
      />
      <Menu
        model={items}
        popup
        ref={menuFeature}
        popupAlignment="left"
        className="feature_menu"
      />
      <div style={{ margin: "10px 0" }}>
        {Object.entries(attributesForPopup).map(([key, value]) => (
          <div key={key}>
            <b>{key}:</b> {value?.toString()}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
        }}
      >
        <button onClick={onPrev} disabled={index === 0}>
          &larr; Prev
        </button>
        <span>
          {index + 1} of {total}
        </span>
        <button onClick={onNext} disabled={index === total - 1}>
          Next &rarr;
        </button>
      </div>
      {popupFeature && (
        <ShowProperties
          feature={popupFeature}
          layer={popupFeature.layer}
          direction={direction}
          t={t}
          isLoading={false}
          onClose={() => setPopupFeature(null)}
        />
      )}
    </div>
  );
};

export default FeaturePopup;
