import { React, useState } from "react";
import "./SearchResult.scss";
import FeatureItem from "../featureItem/FeatureItem";
import { useDispatch, useSelector } from "react-redux";
import {
  getAttributeCaseInsensitive,
  createFeatureLayer,
  getLayerOrTableName,
  getDomainValues,
} from "../../../../handlers/esriHandler";
import { setDisplaySearchResults } from "../../../../redux/widgets/find/findAction";

import close from "../../../../style/images/x-close.svg";
import arrowdown from "../../../../style/images/cheveron-down.svg";
import arrowup from "../../../../style/images/cheveron-up.svg";
import file from "../../../../style/images/document-text.svg";
import dot from "../../../../style/images/dots-vertical.svg";
import { useI18n } from "../../../../handlers/languageHandler";
import ShowProperties from "../../../commonComponents/showProperties/ShowProperties";

export default function SearchResult({
  features,
  layers,
  searchClicked,
  setShowSidebar,
  showSidebar,
  popupFeature,
  setPopupFeature,
}) {
  const { t, direction } = useI18n("Find");

  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );

  const utilityNetwork = useSelector(
    (state) => state.traceReducer.utilityNetworkIntial
  );

  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedTypes, setExpandedTypes] = useState({});
  const [expandedObjects, setExpandedObjects] = useState({});

  if (!(features && searchClicked && showSidebar)) return null;

  const getLayerTitle = (layerId) => {
    // if (selectedLayerId === -1) return "All Layers";
    return (
      layers.find((layer) => Number(layer.id.toString()) === layerId)?.title ||
      "Unknown Layer"
    );
  };

  const toggleGroup = (layerId) => {
    setExpandedGroups((prevState) => ({
      ...prevState,
      [layerId]: !prevState[layerId],
    }));
  };

  const toggleType = (assetGroup, assetType) => {
    setExpandedTypes({
      ...expandedTypes,
      [`${assetGroup}-${assetType}`]:
        !expandedTypes[`${assetGroup}-${assetType}`],
    });
  };

  const toggleObject = (assetGroup, assetType, objectId) => {
    setExpandedObjects({
      ...expandedObjects,
      [`${assetGroup}-${assetType}-${objectId}`]:
        !expandedObjects[`${assetGroup}-${assetType}-${objectId}`],
    });
  };

  return (
    <div className="search-result properties-sidebar flex-fill d-flex flex-column w-100 overflow-auto">
      <div className="search-header p_0">
        {/* <div className="result-header">
          <h4>{t("Search Results")}</h4>
        </div>
        <div className="result-header-action">
          <img
            src={close}
            alt="close"
            className="cursor-pointer"
            onClick={() => setShowSidebar(false)}
          />
        </div> */}
      </div>

      {features.length === 0 && (
        <div className="element-item-noData"> {t("No features found")}</div>
      )}
      {features.map((group, index) => (
        <div key={group.layer.title} className="feature-layers">
          {" "}
          <div
            className={`layer-header ${
              expandedGroups[group.layer.title] ? "expanded" : ""
            }`}
            onClick={() => toggleGroup(group.layer.title)}
          >
            <span>
              {group.layer.title} ({group.features.length})
            </span>
            <span>
              {expandedGroups[group.layer.title] ? (
                <img src={arrowup} alt="arrow up" />
              ) : (
                <img src={arrowdown} alt="arrow down" />
              )}
            </span>
          </div>
          {expandedGroups[group.layer.title] && (
            <div className="asset-groups">
              {Object.entries(
                group.features.reduce((acc, feature) => {
                  const featureWithDomainValues = {};

                  // Override the attributes with domain values
                  featureWithDomainValues.attributes = getDomainValues(
                    utilityNetwork,
                    feature.attributes,
                    group.layer,
                    Number(group.layer.layerId)
                  ).rawKeyValues;

                  const assetGroup =
                    getAttributeCaseInsensitive(
                      featureWithDomainValues.attributes,
                      "assetgroup"
                    ) || "Unknown";

                  const assetType =
                    getAttributeCaseInsensitive(
                      featureWithDomainValues.attributes,
                      "assettype"
                    ) || "Unknown";

                  if (!acc[assetGroup]) acc[assetGroup] = {};
                  if (!acc[assetGroup][assetType])
                    acc[assetGroup][assetType] = [];

                  acc[assetGroup][assetType].push(feature);

                  return acc;
                }, {})
              ).map(([assetGroup, assetTypes]) => {
                const assetGroupName = assetGroup; // Fallback to code if name not found
                return (
                  <div key={assetGroup} className="asset-group">
                    <div
                      className="group-header"
                      onClick={() => toggleType(assetGroup, assetTypes)}
                    >
                      <span>
                        {assetGroupName} (
                        {Object.values(assetTypes).flat().length})
                      </span>
                      <span>
                        {expandedTypes[`${assetGroup}-${assetTypes}`] ? (
                          <img src={arrowup} alt="arrow up" />
                        ) : (
                          <img src={arrowdown} alt="arrow down" />
                        )}
                      </span>
                    </div>
                    {expandedTypes[`${assetGroup}-${assetTypes}`] && (
                      <ul className="asset-types">
                        {Object.entries(assetTypes).map(
                          ([assetType, elements]) => {
                            const assetTypeName = assetType; // Fallback to code if name not found
                            return (
                              <li key={assetType} className="asset-type">
                                <div
                                  className="type-header"
                                  onClick={() =>
                                    toggleObject(
                                      assetGroup,
                                      assetType,
                                      getAttributeCaseInsensitive(
                                        elements[0].attributes,
                                        "objectid"
                                      )
                                    )
                                  }
                                >
                                  <span>
                                    {assetTypeName} (
                                    {
                                      Object.values(
                                        assetTypes[assetTypeName]
                                      ).flat().length
                                    }
                                    )
                                  </span>
                                  <span>
                                    {expandedObjects[
                                      `${assetGroup}-${assetType}-${getAttributeCaseInsensitive(
                                        elements[0].attributes,
                                        "objectid"
                                      )}`
                                    ] ? (
                                      <img src={arrowup} alt="arrow up" />
                                    ) : (
                                      <img src={arrowdown} alt="arrow down" />
                                    )}
                                  </span>
                                </div>
                                {expandedObjects[
                                  `${assetGroup}-${assetType}-${getAttributeCaseInsensitive(
                                    elements[0].attributes,
                                    "objectid"
                                  )}`
                                ] && (
                                  <ul className="elements-list">
                                    {elements.map((element, i) => (
                                      <li
                                        key={`${assetTypeName} - ${getAttributeCaseInsensitive(
                                          element.attributes,
                                          "objectid"
                                        )}`}
                                        className="element-item"
                                      >
                                        <FeatureItem
                                          feature={element}
                                          layerTitle={group.layer.title}
                                          layer={group.layer}
                                          popupFeature={popupFeature}
                                          setPopupFeature={setPopupFeature}
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            );
                          }
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* <ul className="feature-layers flex-fill">
        {features.length !== 0 ? (
          features.map((layerGroup) => (
            <li className="feture-layer" key={`layer-${layerGroup.layer.id}`}>
              <div
                className={`layer-header ${
                  expandedGroups[layerGroup.layer.id] ? "expanded" : "closed"
                }`} // Dynamic class based on state
                onClick={() => toggleGroup(layerGroup.layer.id)}
              >
                <span>
                  {layerGroup?.layer?.title} ({layerGroup.features.length})
                </span>
                <img
                  src={
                    expandedGroups[layerGroup.layer.id] ? arrowup : arrowdown
                  } // Toggle between arrowup and arrowdown
                  alt="toggle"
                  className={`toggle-icon ${
                    expandedGroups[layerGroup.layer.id] ? "expanded" : ""
                  }`}
                  height="16"
                />
              </div>
              {expandedGroups[layerGroup.layer.id] && (
                <>
                  {layerGroup.features.length > 0 ? (
                    layerGroup.features.map((feature) => (
                      <div
                        key={`${
                          layerGroup.layer.layerId
                        }-${getAttributeCaseInsensitive(
                          feature.attributes,
                          "objectid"
                        )}`}
                      >
                        <li
                          className="element-item"
                          key={getAttributeCaseInsensitive(
                            feature.attributes,
                            "objectid"
                          )}
                        >
                          <FeatureItem
                            feature={feature}
                            layerTitle={getLayerTitle(layerGroup.layer.layerId)}
                            popupFeature={popupFeature}
                            setPopupFeature={setPopupFeature}
                          />
                        </li>
                      </div>
                    ))
                  ) : (
                    <div className="element-item-noData">
                      {t("There are no features for this layer")}
                    </div>
                  )}
                </>
              )}
            </li>
          ))
        ) : (
          <div>{t("There are no features")}</div>
        )}
      </ul> */}

      {/* <button className="all-result flex-shrink-0">Show All Result</button> */}

      {popupFeature && (
        <ShowProperties
          feature={popupFeature}
          direction={direction}
          t={t}
          isLoading={false}
          onClose={() => setPopupFeature(null)}
        />
      )}
    </div>
  );
}
