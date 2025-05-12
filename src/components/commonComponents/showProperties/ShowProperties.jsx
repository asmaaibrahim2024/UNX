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
  getFilteredAttributesByFields,
  getSelectedFeaturesForLayer,
  isBarrierPoint,
  isFeatureAlreadySelected,
  isStartingPoint,
} from "../../../handlers/esriHandler";
import { removeTracePoint } from "../../../redux/widgets/trace/traceAction";
import {
  addPointToTrace,
  getSelectedPointTerminalId,
} from "../../widgets/trace/traceHandler";
import { SelectedTracePoint } from "../../widgets/trace/models";
import { useTranslation } from "react-i18next";
import { setSelectedFeatures } from "../../../redux/widgets/selection/selectionAction";
import store from "../../../redux/store";

const ShowProperties = ({
  feature,
  layer,
  direction,
  // t,
  isLoading,
  onClose,
}) => {
  // const attributes = feature?.attributes || {};

  const objectId = getAttributeCaseInsensitive(feature.attributes, "objectid");

  const { t, i18n } = useTranslation("ShowProperties");
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

  const view = useSelector((state) => state.mapViewReducer.intialView);

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

    const selectedNetworklayer = networkService.networkLayers.find(
      (nl) => nl.layerId === Number(layer.layerId)
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
      layer,
      Number(layer.layerId)
    ).rawKeyValues;

    const layerFields = selectedNetworklayer.layerFields;

    const attributesWithSelectedLanguage = {};
    // loop to get the key from layerFields and the value from rawKeyValues
    for (const [dbFieldName, value] of Object.entries(rawKeyValues)) {
      const field = layerFields.find((lf) => lf.dbFieldName === dbFieldName);
      if (!field) continue;
      const key =
        i18n.language === "en" ? field.fieldNameEN : field.fieldNameAR;
      attributesWithSelectedLanguage[key] = value;
    }

    setAttributesWithDomainValues(attributesWithSelectedLanguage);
  }, [feature, networkService, utilityNetwork, layer, i18n.language]);

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
    <div className={`feature-sidebar feature-sidebar-prop ${direction}`}>
      <div className="feature-sidebar-header propertites flex-shrink-0 bg-transparent fw-normal">
        <span>{isLoading ? t("Loading...") : t("Feature Details")}</span>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={onClose}
        />
      </div>

      <div className="feature-sidebar-body flex-fill overflow-auto">
        {isLoading || !feature ? (
          <></>
        ) : (
          <table>
            {/* <thead>
              <tr>
                <th
                  style={{
                    textAlign: direction === "rtl" ? "right" : "left",
                  }}
                >
                  <strong>{t("Property")}</strong>
                </th>
                <th
                  style={{
                    textAlign: direction === "rtl" ? "right" : "left",
                  }}
                >
                  <strong>{t("Value")}</strong>
                </th>
              </tr>
            </thead> */}
            <tbody>
              {attributesWithDomainValues &&
                Object.entries(attributesWithDomainValues).map(
                  ([field, value], idx) => (
                    <tr
                      key={field}
                      className="bg-transparent"
                      // style={{
                      //   backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                      // }}
                    >
                      <td className="key">{field}</td>
                      <td className="val">{value !== "" ? value : "—"}</td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        )}
      </div>

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
              ? t("Unselect")
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
    </div>
  );
};

export default ShowProperties;
