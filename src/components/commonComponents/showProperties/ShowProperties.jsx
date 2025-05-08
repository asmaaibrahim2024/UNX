import React, { useEffect, useState } from "react";
import "./ShowProperties.scss";
import close from "../../../style/images/x-close.svg";
import select from "../../../style/images/select.svg";
import flag from "../../../style/images/flag.svg";
import barrier from "../../../style/images/barrier.svg";
import { useSelector } from "react-redux";
import {
  getAttributeCaseInsensitive,
  getDomainValues,
  getFilteredAttributesByFields,
} from "../../../handlers/esriHandler";

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

  const [featureWithDomainValues, setFeatureWithDomainValues] = useState({});

  const utilityNetwork = useSelector(
    (state) => state.mapViewReducer.utilityNetworkIntial
  );

  const networkService = useSelector(
    (state) => state.mapViewReducer.networkService
  );

  useEffect(() => {
    console.log(feature);
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
      console.log(featureWithDomainValues);
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
        <div className="feature_btn cursor-pointer d-flex flex-column justify-content-center align-items-center">
          <img src={select} alt="close" />
          <span>{t("Add to selection")}</span>
        </div>
        <div className="feature_btn cursor-pointer d-flex flex-column justify-content-center align-items-center">
          <img src={flag} alt="close" />
          <span>{t("As a start point")}</span>
        </div>
        <div className="feature_btn cursor-pointer d-flex flex-column justify-content-center align-items-center">
          <img src={barrier} alt="close" />
          <span>{t("As a barrier point")}</span>
        </div>
      </div>
    </div>
  );
};

export default ShowProperties;
