import React, { useEffect, useState } from "react";
import "./ShowProperties.scss";
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
    <div className={`feature-sidebar ${direction}`}>
      <div className="feature-sidebar-header">
        <span>{isLoading ? t("Loading...") : t("Feature Details")}</span>
        <button onClick={onClose}>×</button>
      </div>

      <div className="feature-sidebar-body">
        {isLoading || !feature ? (
          <></>
        ) : (
          <table>
            <thead>
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
            </thead>
            <tbody>
              {featureWithDomainValues.attributes &&
                Object.entries(featureWithDomainValues.attributes).map(
                  ([field, value], idx) => (
                    <tr
                      key={field}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                      }}
                    >
                      <td>{field}</td>
                      <td>{value !== "" ? value : "—"}</td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ShowProperties;
