import React, { useEffect, useState } from "react";
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
  t,
  isLoading,
  onClose,
}) => {
  // const attributes = feature?.attributes || {};

  const objectId = getAttributeCaseInsensitive(feature.attributes, "objectid");

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

  const [featureWithDomainValues, setFeatureWithDomainValues] = useState({});

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

  useEffect(() => {
    const matchingFeature = feature;

    if (matchingFeature) {
      const SelectedNetworklayer = networkService.networkLayers.find(
        (nl) => nl.layerId == Number(layer.layerId)
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
        layer,
        Number(layer.layerId)
      ).formattedAttributes;

      featureWithDomainValues.objectId = objectId;

      setFeatureWithDomainValues(featureWithDomainValues);
    }
  }, [feature, networkService, utilityNetwork]);

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
              {featureWithDomainValues.attributes &&
                Object.entries(featureWithDomainValues.attributes).map(
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
