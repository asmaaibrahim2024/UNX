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
import folder from "../../../../style/images/folder.svg";

export default function SearchResult({
  features,
  layers,
  searchClicked,
  showSidebar,
  setSelectedObjectIdsByFindGroupedByLayerTitle,
  selectedObjectIdsByFindGroupedByLayerTitle,
  startingPointsGlobalIds,
  setStartingPointsGlobalIds,
  barrierPointsGlobalIds,
  setBarrierPointsGlobalIds,
}) {
  const { t, direction } = useI18n("Find");

  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );

  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
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
              <img src={folder} alt="file" className="m_r_8" />
              {group.layer.title} ({group.features.length})
            </span>
            <span>
              {expandedGroups[group.layer.title] ? (
                <img src={arrowup} alt="arrow up" height="18" />
              ) : (
                <img src={arrowdown} alt="arrow down" height="18" />
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
                          <img src={arrowup} alt="arrow up" height="18" />
                        ) : (
                          <img src={arrowdown} alt="arrow down" height="18" />
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
                                      <img src={arrowup} alt="arrow up" height="18" />
                                    ) : (
                                      <img src={arrowdown} alt="arrow down" height="18" />
                                    )}
                                  </span>
                                </div>
                                {expandedObjects[
                                  `${assetGroup}-${assetType}-${getAttributeCaseInsensitive(
                                    elements[0].attributes,
                                    "objectid"
                                  )}`
                                ] && (
                                  <ul className="elements-list m_x_2">
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
                                          layer={group.layer}
                                          setSelectedObjectIdsByFindGroupedByLayerTitle={
                                            setSelectedObjectIdsByFindGroupedByLayerTitle
                                          }
                                          selectedObjectIdsByFindGroupedByLayerTitle={
                                            selectedObjectIdsByFindGroupedByLayerTitle
                                          }
                                          startingPointsGlobalIds={
                                            startingPointsGlobalIds
                                          }
                                          setStartingPointsGlobalIds={
                                            setStartingPointsGlobalIds
                                          }
                                          barrierPointsGlobalIds={
                                            barrierPointsGlobalIds
                                          }
                                          setBarrierPointsGlobalIds={
                                            setBarrierPointsGlobalIds
                                          }
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
    </div>
  );
}
