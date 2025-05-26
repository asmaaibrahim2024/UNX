import React, { useCallback, useEffect, useState } from "react";
import "./ShowProperties.scss";
import close from "../../../style/images/x-close.svg";
import select from "../../../style/images/select.svg";
import flag from "../../../style/images/flag.svg";
import barrier from "../../../style/images/barrier.svg";
import { useDispatch, useSelector } from "react-redux";
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
} from "../../../handlers/esriHandler";
import { removeTracePoint } from "../../../redux/widgets/trace/traceAction";
import {
  addPointToTrace,
  getSelectedPointTerminalId,
} from "../../widgets/trace/traceHandler";
import { SelectedTracePoint } from "../../widgets/trace/models/selectedTracePoint";
import { useTranslation } from "react-i18next";
import { setSelectedFeatures } from "../../../redux/widgets/selection/selectionAction";
import store from "../../../redux/store";
import { useI18n } from "../../../handlers/languageHandler";
import { setShowPropertiesFeature } from "../../../redux/commonComponents/showProperties/showPropertiesAction";

const ShowProperties = ({ feature }) => {
  const objectId = getAttributeCaseInsensitive(feature.attributes, "objectid");

  const { t, i18n } = useTranslation("ShowProperties");
  const { direction } = useI18n("ShowProperties");
  const { t: tTrace, i18n: i18nTrace } = useTranslation("Trace");

  const selectedPoints = useSelector(
    (state) => state.traceReducer.selectedPoints
  );
  const traceGraphicsLayer = useSelector(
    (state) => state.traceReducer.traceGraphicsLayer
  );

  const currentSelectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );

  const [attributesWithDomainValues, setAttributesWithDomainValues] = useState(
    {}
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

  const view = useSelector((state) => state.mapViewReducer.intialView);
  const zIndexPanel = useSelector((state) => state.uiReducer.zIndexPanel);

  // Set z-index: 100 if this component is active, else 1
  const zIndex = zIndexPanel === 'ShowProperties' ? 100 : 1;


  const dispatch = useDispatch();

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

  const handleselectFeature = async () => {
    const matchingFeature = feature;

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

  const runFeatureProcessing = useCallback(() => {
    if (!feature || !networkService || !utilityNetwork) return;

    const networkLayers = mergeNetworkLayersWithNetworkLayersCache(
      networkService.networkLayers,
      networkLayersCache
    );

    const selectedNetworklayer = networkLayers.find(
      (nl) => nl.layerId === Number(feature.layer.layerId)
    );
    if (!selectedNetworklayer) return;

    const showPropertiesFields = selectedNetworklayer.layerFields
      .filter((lf) => lf.isShowProperties)
      .map((lf) => lf.dbFieldName.toLowerCase());

    const filteredAttributes = getFilteredAttributesByFields(
      feature.attributes,
      showPropertiesFields
    );

    const rawKeyValues = getDomainValues(
      utilityNetwork,
      filteredAttributes,
      feature.layer,
      Number(feature.layer.layerId)
    ).rawKeyValues;

    const layerFields = selectedNetworklayer.layerFields;

    const attributesWithSelectedLanguage =
      getFieldNameFromDbAndValueFromAttributes(layerFields, rawKeyValues, i18n);

    setAttributesWithDomainValues(attributesWithSelectedLanguage);
  }, [
    feature,
    networkService,
    utilityNetwork,
    feature.layer,
    i18n.language,
    networkLayersCache,
  ]);

  // 🔁 Run once on language change or input change
  useEffect(() => {
    runFeatureProcessing();
  }, [runFeatureProcessing]);

  // ✅ Attach the language listener once
  useEffect(() => {
    i18n.on("languageChanged", runFeatureProcessing);
    return () => {
      i18n.off("languageChanged", runFeatureProcessing);
    };
  }, [runFeatureProcessing]);

  return (
    <div className={`feature-sidebar feature-sidebar-prop ${direction}`}
    style={{zIndex}}>
      <div className="feature-sidebar-header propertites flex-shrink-0 bg-transparent fw-normal">
        <span>
          {t("Feature Details")} ({feature.layer.title})
        </span>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={() => dispatch(setShowPropertiesFeature(null))}
        />
      </div>

      <div className="feature-sidebar-body flex-fill overflow-auto">
        {!feature ? (
          <></>
        ) : (
          <table>
            <tbody>
              {attributesWithDomainValues &&
                Object.entries(attributesWithDomainValues).map(
                  ([field, value], idx) => (
                    <tr key={field} className="bg-transparent">
                      <td className="key">{field}</td>
                      <td className="val">{value !== "" ? value : "—"}</td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        )}
      </div>

      {feature.geometry ? (
        <div className="feature-sidebar-footer">
          <div
            className="feature_btn cursor-pointer d-flex flex-column justify-content-center align-items-center"
            onClick={handleselectFeature}
          >
            <img src={select} alt="close" />
            <span>
              {isFeatureAlreadySelected(
                getSelectedFeaturesForLayer(currentSelectedFeatures, feature),
                feature
              )
                ? t("Deselect")
                : t("Select")}
            </span>
          </div>
          <div
            className="feature_btn cursor-pointer d-flex flex-column justify-content-center align-items-center"
            onClick={handleTraceStartPoint}
          >
            <img src={flag} alt="close" />
            <span>
              {" "}
              {isStartingPoint(
                getAttributeCaseInsensitive(feature.attributes, "globalid"),
                selectedPoints
              )
                ? t("Remove trace start point")
                : t("Add as a trace start point")}
            </span>
          </div>
          <div
            className="feature_btn cursor-pointer d-flex flex-column justify-content-center align-items-center"
            onClick={handleBarrierPoint}
          >
            <img src={barrier} alt="close" />
            <span>
              {" "}
              {isBarrierPoint(
                getAttributeCaseInsensitive(feature.attributes, "globalid"),
                selectedPoints
              )
                ? t("Remove barrier point")
                : t("Add as a barrier point")}
            </span>
          </div>
        </div>
      ) : (
        <div>this table doesn't have any actions</div>
      )}
    </div>
  );
};

export default ShowProperties;
